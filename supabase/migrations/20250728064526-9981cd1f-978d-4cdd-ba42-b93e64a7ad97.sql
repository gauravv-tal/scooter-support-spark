-- Insert profiles for existing users
INSERT INTO public.profiles (
    user_id, 
    phone_number, 
    role, 
    display_name
) VALUES 
    (
        '5a19298f-4737-4335-b7a9-57f36fed3f53'::uuid, 
        '+918888855555', 
        'admin', 
        'Mock Admin User'
    ),
    (
        'd66413b6-b6c1-413a-9000-abb5520a8f17'::uuid, 
        '+918888844444', 
        'customer', 
        'Mock Customer User'
    )
ON CONFLICT (user_id) DO UPDATE SET
    phone_number = EXCLUDED.phone_number,
    role = EXCLUDED.role,
    display_name = EXCLUDED.display_name;