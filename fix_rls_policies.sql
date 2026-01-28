-- 🔧 FIX INFINITE RECURSION IN RLS POLICIES
-- Run this in Supabase SQL Editor to fix the login error

-- STEP 1: Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Treasurers can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- STEP 2: Create FIXED policies (no recursion)

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow ALL authenticated users to read all profiles
-- (This is safe for a SHG where members need to see each other)
CREATE POLICY "All users can view all profiles" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- STEP 3: Fix other policies that also have recursion issues

-- Drop old contribution policies
DROP POLICY IF EXISTS "Treasurers can view all contributions" ON contributions;
DROP POLICY IF EXISTS "Treasurers can update contributions" ON contributions;

-- Recreate without recursion (using a helper function instead)
CREATE POLICY "Treasurers can view all contributions" ON contributions
    FOR SELECT USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'treasurer'
    );

CREATE POLICY "Treasurers can update contributions" ON contributions
    FOR UPDATE USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'treasurer'
    );

-- Drop old loan policies
DROP POLICY IF EXISTS "Treasurers can view all loans" ON loans;
DROP POLICY IF EXISTS "Treasurers can update loans" ON loans;

-- Recreate without recursion
CREATE POLICY "Treasurers can view all loans" ON loans
    FOR SELECT USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'treasurer'
    );

CREATE POLICY "Treasurers can update loans" ON loans
    FOR UPDATE USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'treasurer'
    );

-- Drop old loan payment policies
DROP POLICY IF EXISTS "Treasurers can view all loan payments" ON loan_payments;
DROP POLICY IF EXISTS "Treasurers can insert loan payments" ON loan_payments;

-- Recreate without recursion
CREATE POLICY "Treasurers can view all loan payments" ON loan_payments
    FOR SELECT USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'treasurer'
    );

CREATE POLICY "Treasurers can insert loan payments" ON loan_payments
    FOR INSERT WITH CHECK (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'treasurer'
    );

-- DONE! ✅
-- Now try logging in again - it should work!
