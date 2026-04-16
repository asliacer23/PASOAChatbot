-- Clean up duplicate typing_status records before adding constraint
DELETE FROM public.typing_status 
WHERE id NOT IN (
  SELECT MIN(id::text)::uuid 
  FROM public.typing_status 
  GROUP BY conversation_id, user_id
);

-- Add unique constraint to typing_status for upsert
ALTER TABLE public.typing_status ADD CONSTRAINT typing_status_conversation_user_unique UNIQUE (conversation_id, user_id);