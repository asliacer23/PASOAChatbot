-- Enforce student_id format: 20######-A (example: 20230618-C)
-- NOT VALID so existing legacy rows are not blocked immediately.
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_student_id_format_check
CHECK (
  student_id IS NULL
  OR student_id ~ '^20[0-9]{6}-[A-Z]$'
) NOT VALID;
