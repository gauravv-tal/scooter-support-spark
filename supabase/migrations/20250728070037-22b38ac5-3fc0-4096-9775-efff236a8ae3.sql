-- Create mock users in auth.users table for testing
INSERT INTO auth.users 
  (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, phone, phone_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone_change, phone_change_token, phone_change_sent_at)
VALUES 
  -- Mock Admin User
  (
    '5a19298f-4737-4335-b7a9-57f36fed3f53'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'admin@test.com',
    crypt('mockpassword123', gen_salt('bf')),
    NOW(),
    '+918888855555',
    NOW(),
    '',
    '',
    '',
    '',
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "admin", "display_name": "Mock Admin User"}',
    false,
    NOW(),
    NOW(),
    '',
    '',
    NULL
  ),
  -- Mock Customer User  
  (
    'd66413b6-b6c1-413a-9000-abb5520a8f17'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 
    'authenticated',
    'customer@test.com',
    crypt('mockpassword123', gen_salt('bf')),
    NOW(),
    '+918888844444',
    NOW(),
    '',
    '',
    '',
    '',
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "customer", "display_name": "Mock Customer User"}',
    false,
    NOW(),
    NOW(),
    '',
    '',
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  phone = EXCLUDED.phone,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = NOW();

-- Ensure profiles exist for these users
INSERT INTO public.profiles (user_id, phone_number, role, display_name, created_at, updated_at)
VALUES 
  ('5a19298f-4737-4335-b7a9-57f36fed3f53'::uuid, '+918888855555', 'admin', 'Mock Admin User', NOW(), NOW()),
  ('d66413b6-b6c1-413a-9000-abb5520a8f17'::uuid, '+918888844444', 'customer', 'Mock Customer User', NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
  phone_number = EXCLUDED.phone_number,
  role = EXCLUDED.role,
  display_name = EXCLUDED.display_name,
  updated_at = NOW();