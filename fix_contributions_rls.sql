-- ==================================================
-- FIX: Allow Treasurers/Admins to Record Contributions
-- ==================================================

-- 1. Promote current user to treasurer (Prevent lock-out)
-- (This ensures YOU have permission to run the operations below)
UPDATE profiles 
SET role = 'treasurer' 
WHERE id = auth.uid();

-- 2. Reset Policies
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contributions" ON contributions;
DROP POLICY IF EXISTS "Treasurers can manage contributions" ON contributions;
DROP POLICY IF EXISTS "Treasurers can manage all contributions" ON contributions;

-- 3. Allow Members to View Own
CREATE POLICY "Users can view own contributions" 
ON contributions FOR SELECT 
USING (auth.uid() = member_id);

-- 4. Allow Treasurers/Admins to Manage ALL
-- (This fixes the INSERT error you saw)
CREATE POLICY "Treasurers can manage all contributions" 
ON contributions FOR ALL 
USING (
    exists (
        select 1 from profiles
        where id = auth.uid() 
        and role in ('treasurer', 'admin')
    )
);

-- 5. Also fix LOANS table just in case
DROP POLICY IF EXISTS "Treasurers can manage all loans" ON loans;
CREATE POLICY "Treasurers can manage all loans" 
ON loans FOR ALL 
USING (
    exists (
        select 1 from profiles
        where id = auth.uid() 
        and role in ('treasurer', 'admin')
    )
);
