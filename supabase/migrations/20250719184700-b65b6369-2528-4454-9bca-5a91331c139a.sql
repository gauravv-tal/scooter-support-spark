-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'customer');

-- Add role column to profiles table with default value 'customer'
ALTER TABLE public.profiles 
ADD COLUMN role public.user_role NOT NULL DEFAULT 'customer';

-- Update RLS policies to allow admins to manage predefined questions
CREATE POLICY "Admins can insert questions" 
ON public.predefined_questions 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update questions" 
ON public.predefined_questions 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete questions" 
ON public.predefined_questions 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);