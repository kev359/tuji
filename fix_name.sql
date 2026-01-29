-- 1. Fix the name correction
UPDATE public.profiles
SET full_name = 'Theopyster Wakesho'
WHERE full_name LIKE 'Theopyster%';

-- 2. Ensure email matches the simplified format (if not already done)
UPDATE auth.users
SET email = 'theopyster@tuj.com', updated_at = now()
WHERE email LIKE 'theopyster%';

UPDATE public.profiles
SET email = 'theopyster@tuj.com'
WHERE email LIKE 'theopyster%';
