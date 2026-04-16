-- Create storage bucket for content uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-uploads',
  'content-uploads',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies for content uploads
CREATE POLICY "Anyone can view uploaded content"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-uploads');

CREATE POLICY "Admins can upload content"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-uploads' 
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) 
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
);

CREATE POLICY "Admins can update content"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'content-uploads' 
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) 
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
);

CREATE POLICY "Admins can delete content"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-uploads' 
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) 
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
);

-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Storage policies for chat images
CREATE POLICY "Anyone can view chat images"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-images');

CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-images' AND auth.uid() IS NOT NULL);

-- Add typing_status to track who is typing
CREATE TABLE IF NOT EXISTS public.typing_status (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_typing boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS for typing status
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view typing status in their conversations"
ON public.typing_status FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = typing_status.conversation_id
    AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
  )
);

CREATE POLICY "Users can update their typing status"
ON public.typing_status FOR ALL
USING (auth.uid() = user_id);

-- Add image_url column to messages for chat image uploads
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url text;

-- Create content_files table for content management
CREATE TABLE IF NOT EXISTS public.content_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  category text NOT NULL DEFAULT 'Documents',
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.content_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view content files"
ON public.content_files FOR SELECT
USING (true);

CREATE POLICY "Admins can manage content files"
ON public.content_files FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_typing_status_conversation ON public.typing_status(conversation_id);
CREATE INDEX IF NOT EXISTS idx_content_files_category ON public.content_files(category);

-- Add notification insert policy for admins
CREATE POLICY "Admins can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- Add trigger to auto-create notifications on new announcements
CREATE OR REPLACE FUNCTION public.notify_on_announcement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if announcement is published
  IF NEW.is_published = true AND (OLD IS NULL OR OLD.is_published = false) THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    SELECT 
      p.id,
      'announcement',
      'New Announcement: ' || NEW.title,
      LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
      '/announcements'
    FROM profiles p;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_announcement ON public.announcements;
CREATE TRIGGER trigger_notify_on_announcement
  AFTER INSERT OR UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_announcement();