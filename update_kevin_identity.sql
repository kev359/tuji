-- 1. Combine identities: Make kevinmugo359@gmail.com correspond to the member profile for 'Kelvin Kinyua'
UPDATE public.profiles
SET full_name = 'Kelvin Kinyua',
    position = 'Super Admin',
    role = 'admin'
WHERE email = 'kevinmugo359@gmail.com';

-- 2. Ensure auth metadata matches so Navbar displays 'Kelvin Kinyua' correctly
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    coalesce(raw_user_meta_data, '{}'::jsonb),
    '{full_name}', 
    '"Kelvin Kinyua"'
)
WHERE email = 'kevinmugo359@gmail.com';

-- 3. Also update the role in metadata just in case
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    coalesce(raw_user_meta_data, '{}'::jsonb),
    '{job_title}', 
    '"Super Admin"'
)
WHERE email = 'kevinmugo359@gmail.com';
