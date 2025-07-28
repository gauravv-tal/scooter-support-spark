-- Create mock users in auth.users table using admin functions
-- Note: This requires admin privileges

-- Create mock admin user
DO $$
DECLARE
    admin_user_id uuid := '00000000-0000-0000-0000-000000000001';
    customer_user_id uuid := '00000000-0000-0000-0000-000000000002';
BEGIN
    -- Insert mock admin user into auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        phone,
        phone_confirmed_at,
        email_confirmed_at,
        confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        raw_app_meta_data
    ) VALUES (
        admin_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'admin@test.com',
        '+918888855555',
        now(),
        now(),
        now(),
        now(),
        now(),
        '{"role": "admin", "display_name": "Mock Admin User"}'::jsonb,
        '{"provider": "phone", "providers": ["phone"]}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;

    -- Insert mock customer user into auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        phone,
        phone_confirmed_at,
        email_confirmed_at,
        confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        raw_app_meta_data
    ) VALUES (
        customer_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'customer@test.com',
        '+918888844444',
        now(),
        now(),
        now(),
        now(),
        now(),
        '{"role": "customer", "display_name": "Mock Customer User"}'::jsonb,
        '{"provider": "phone", "providers": ["phone"]}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;

    -- Now insert corresponding profiles
    INSERT INTO public.profiles (id, user_id, phone_number, role, display_name) VALUES 
        (admin_user_id, admin_user_id, '+918888855555', 'admin', 'Mock Admin User'),
        (customer_user_id, customer_user_id, '+918888844444', 'customer', 'Mock Customer User')
    ON CONFLICT (user_id) DO UPDATE SET
        phone_number = EXCLUDED.phone_number,
        role = EXCLUDED.role,
        display_name = EXCLUDED.display_name;
END $$;