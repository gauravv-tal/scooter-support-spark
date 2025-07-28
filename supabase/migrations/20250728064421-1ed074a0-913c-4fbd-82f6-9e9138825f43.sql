-- Insert profiles for existing mock users
INSERT INTO public.profiles (
    id, 
    user_id, 
    phone_number, 
    role, 
    display_name
) VALUES 
    (
        '00000000-0000-0000-0000-000000000001'::uuid, 
        '00000000-0000-0000-0000-000000000001'::uuid, 
        '+918888855555', 
        'admin', 
        'Mock Admin User'
    ),
    (
        '00000000-0000-0000-0000-000000000002'::uuid, 
        '00000000-0000-0000-0000-000000000002'::uuid, 
        '+918888844444', 
        'customer', 
        'Mock Customer User'
    )
ON CONFLICT (user_id) DO UPDATE SET
    phone_number = EXCLUDED.phone_number,
    role = EXCLUDED.role,
    display_name = EXCLUDED.display_name;