-- Security Fixes Migration

-- 1. Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 2. Fix the critical role escalation vulnerability
-- Drop and recreate the profile update policy to prevent role modification
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND (
    -- Users can only change their role if they're already an admin
    role = OLD.role OR public.get_current_user_role() = 'admin'
  )
);

-- 3. Fix infinite recursion in admin RLS policies by using security definer function
-- Drop existing admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can insert questions" ON public.predefined_questions;
DROP POLICY IF EXISTS "Admins can update questions" ON public.predefined_questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON public.predefined_questions;
DROP POLICY IF EXISTS "Admins can insert KB articles" ON public.kb_articles;
DROP POLICY IF EXISTS "Admins can update KB articles" ON public.kb_articles;
DROP POLICY IF EXISTS "Admins can delete KB articles" ON public.kb_articles;

-- Recreate admin policies using security definer function
CREATE POLICY "Admins can insert questions" 
ON public.predefined_questions 
FOR INSERT 
TO authenticated
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update questions" 
ON public.predefined_questions 
FOR UPDATE 
TO authenticated
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete questions" 
ON public.predefined_questions 
FOR DELETE 
TO authenticated
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert KB articles" 
ON public.kb_articles 
FOR INSERT 
TO authenticated
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update KB articles" 
ON public.kb_articles 
FOR UPDATE 
TO authenticated
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete KB articles" 
ON public.kb_articles 
FOR DELETE 
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- 4. Fix existing database function security by adding search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Add RLS policy for customer queries admin access
CREATE POLICY "Admins can view all queries" 
ON public.customer_queries 
FOR SELECT 
TO authenticated
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update query responses" 
ON public.customer_queries 
FOR UPDATE 
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- 6. Add admin access to profiles for user management
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.get_current_user_role() = 'admin' OR auth.uid() = user_id);