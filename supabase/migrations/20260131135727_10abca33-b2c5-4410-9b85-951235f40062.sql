-- Fix missing reactions table + make typing indicators scalable + add event notifications

-- 1) Message reactions (one reaction per user per message)
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicates (each user can have at most one reaction per message)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'message_reactions_message_user_key'
      AND conrelid = 'public.message_reactions'::regclass
  ) THEN
    ALTER TABLE public.message_reactions
      ADD CONSTRAINT message_reactions_message_user_key UNIQUE (message_id, user_id);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Reactions: visible to anyone who can see the underlying conversation (student+admins)
DROP POLICY IF EXISTS "Users can view reactions in accessible conversations" ON public.message_reactions;
CREATE POLICY "Users can view reactions in accessible conversations"
ON public.message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    WHERE m.id = message_reactions.message_id
      AND (
        c.user_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'super_admin'::app_role)
      )
  )
);

DROP POLICY IF EXISTS "Users can react in accessible conversations" ON public.message_reactions;
CREATE POLICY "Users can react in accessible conversations"
ON public.message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    WHERE m.id = message_reactions.message_id
      AND (
        c.user_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'super_admin'::app_role)
      )
  )
);

DROP POLICY IF EXISTS "Users can delete own reactions" ON public.message_reactions;
CREATE POLICY "Users can delete own reactions"
ON public.message_reactions
FOR DELETE
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- 2) Typing indicators: keep 1 row per (conversation_id, user_id)
-- Deduplicate any existing rows (keep the newest by updated_at/id)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY conversation_id, user_id
           ORDER BY updated_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.typing_status
)
DELETE FROM public.typing_status t
USING ranked r
WHERE t.id = r.id
  AND r.rn > 1;

-- Ensure updated_at is always set
UPDATE public.typing_status
SET updated_at = now()
WHERE updated_at IS NULL;

ALTER TABLE public.typing_status
  ALTER COLUMN updated_at SET DEFAULT now();

-- Add unique constraint for scalable upserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'typing_status_conversation_user_key'
      AND conrelid = 'public.typing_status'::regclass
  ) THEN
    ALTER TABLE public.typing_status
      ADD CONSTRAINT typing_status_conversation_user_key UNIQUE (conversation_id, user_id);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_typing_status_conversation_id ON public.typing_status(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_conversation_typing ON public.typing_status(conversation_id, is_typing);

-- 3) Event notifications: notify everyone when an event is published
CREATE OR REPLACE FUNCTION public.notify_on_event_published()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_published = true AND (OLD IS NULL OR COALESCE(OLD.is_published,false) = false) THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT 
      p.id,
      'event',
      'New Event: ' || NEW.title,
      COALESCE(LEFT(NEW.description, 100), 'A new campus event is now available.')
        || CASE WHEN NEW.description IS NOT NULL AND LENGTH(NEW.description) > 100 THEN '...' ELSE '' END,
      '/events'
    FROM public.profiles p;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_event_published ON public.events;
CREATE TRIGGER notify_event_published
AFTER INSERT OR UPDATE OF is_published ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_event_published();

-- (Optional but important) Hook up existing announcement notification function
-- so announcements actually create notifications when published.
DROP TRIGGER IF EXISTS notify_announcement_published ON public.announcements;
CREATE TRIGGER notify_announcement_published
AFTER INSERT OR UPDATE OF is_published ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_announcement();
