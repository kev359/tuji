-- Tujiimarishe SHG - Members Role Management
-- Run these queries in your Supabase SQL Editor as needed

-- ============================================
-- IMPORTANT: Users must be created in Supabase Auth first!
-- This script only updates roles in the profiles table.
-- ============================================

-- 1. SET KELVIN KINYUA AS ADMIN/TREASURER
-- Replace 'kelvin.kinyua@example.com' with your actual email
UPDATE profiles 
SET role = 'treasurer',
    full_name = 'Kelvin Kinyua',
    phone_number = '+254XXXXXXXXX'  -- Add your phone
WHERE email = 'kelvin.kinyua@example.com';

-- 2. LATER: SET THEOPYSTER WAJESHI AS TREASURER (when ready)
-- Uncomment when you want to give treasurer role
/*
UPDATE profiles 
SET role = 'treasurer',
    full_name = 'Theopyster Wajeshi',
    phone_number = '+254XXXXXXXXX'
WHERE email = 'theopyster.wajeshi@example.com';
*/

-- ============================================
-- VERIFY YOUR SETUP
-- ============================================

-- Check all members and their roles
SELECT 
    full_name,
    email,
    phone_number,
    role,
    created_at
FROM profiles
ORDER BY 
    CASE role 
        WHEN 'treasurer' THEN 1 
        ELSE 2 
    END,
    full_name;

-- Count members by role
SELECT 
    role,
    COUNT(*) as count
FROM profiles
GROUP BY role;

-- ============================================
-- USEFUL QUERIES FOR ADMIN
-- ============================================

-- Find all treasurers
SELECT * FROM profiles WHERE role = 'treasurer';

-- Find all members
SELECT * FROM profiles WHERE role = 'member';

-- Update a member's phone number
-- UPDATE profiles SET phone_number = '+254XXXXXXXXX' WHERE email = 'member@example.com';

-- Update a member's name
-- UPDATE profiles SET full_name = 'Full Name Here' WHERE email = 'member@example.com';

-- Promote a member to treasurer
-- UPDATE profiles SET role = 'treasurer' WHERE email = 'member@example.com';

-- Demote a treasurer to member
-- UPDATE profiles SET role = 'member' WHERE email = 'treasurer@example.com';

-- ============================================
-- MEMBER STATISTICS
-- ============================================

-- View all members with their contribution totals
SELECT 
    p.full_name,
    p.email,
    p.role,
    COUNT(DISTINCT c.id) as total_contributions,
    SUM(c.table_banking_amount + c.bank_savings_amount) FILTER (WHERE c.status = 'confirmed') as total_confirmed,
    COUNT(DISTINCT l.id) as total_loan_requests
FROM profiles p
LEFT JOIN contributions c ON p.id = c.member_id
LEFT JOIN loans l ON p.id = l.member_id
GROUP BY p.id, p.full_name, p.email, p.role
ORDER BY p.full_name;

-- ============================================
-- LEADERSHIP TEAM
-- ============================================

-- List of leadership positions (for reference)
-- These are stored in full_name or you can add a 'position' column if needed
/*
Victor Wandera - Chairman
Regina Gachara - Vice Chairperson
Theopyster Wajeshi - Treasurer
Peter Mureithi - Secretary
Paul Peace - Organizing Secretary
Kelvin Kinyua - Admin/Treasurer
*/

-- ============================================
-- BACKUP BEFORE MAKING CHANGES!
-- ============================================

-- To backup all profiles data:
-- SELECT * FROM profiles;
-- Copy the results and save them somewhere safe

-- ============================================
-- EMERGENCY: RESET ALL TO MEMBERS
-- ============================================
-- Use this ONLY if you need to reset everyone (except yourself)
-- Uncomment with caution!
/*
UPDATE profiles 
SET role = 'member' 
WHERE email != 'kelvin.kinyua@example.com';  -- Replace with your email
*/
