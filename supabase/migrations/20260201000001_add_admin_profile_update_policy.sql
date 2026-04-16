-- Add RLS policy for admins to manage user profiles
CREATE POLICY "Admins can update user profiles" ON public.profiles 
FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'super_admin') OR
  auth.uid() = id
);
