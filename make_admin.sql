-- ⚡ Run this in Supabase SQL Editor to become Admin

-- 1. Updates your role to 'treasurer' (which gives Admin access)
-- 2. Ensures your name is set correctly
UPDATE profiles 
SET 
  role = 'treasurer',
  full_name = 'Kelvin Kinyua'
WHERE email = 'kevinmugo359@gmail.com';  -- Your email

-- 3. Verify it worked
SELECT * FROM profiles WHERE email = 'kevinmugo359@gmail.com';
