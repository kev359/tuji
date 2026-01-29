-- 1. Ensure 'admin' role exists in the enum
-- This is necessary because previously it seemed missing
DO $$
BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
EXCEPTION
    WHEN duplicate_object THEN null; -- ignore if it already exists
END $$;

-- 2. Update Theopyster to Treasurer
UPDATE public.profiles
SET role = 'treasurer', position = 'Treasurer'
WHERE email = 'theopyster@tuj.com';

-- Sync auth metadata for Theopyster
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    coalesce(raw_user_meta_data, '{}'::jsonb),
    '{job_title}', 
    '"Treasurer"'
)
WHERE email = 'theopyster@tuj.com';


-- 3. Update Kevin to Super Admin
UPDATE public.profiles
SET role = 'admin', position = 'Super Admin'
WHERE email = 'kevinmugo359@gmail.com';

-- Sync auth metadata for Kevin
UPDATE auth.users
SET role = 'service_role', -- giving service_role usually grants bypass, but for app logic we use 'admin' in profiles
    raw_user_meta_data = jsonb_set(
        coalesce(raw_user_meta_data, '{}'::jsonb),
        '{job_title}', 
        '"Super Admin"'
    )
WHERE email = 'kevinmugo359@gmail.com';
