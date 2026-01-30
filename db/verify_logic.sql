-- ==========================================
-- TUJIIMARISHE SYSTEM TEST SIMULATION
-- Run this in Supabase SQL Editor to verify flow
-- ==========================================

DO $$
DECLARE
    test_member_id uuid;
    test_email text := 'test.simulation@example.com';
    report_json json;
BEGIN
    RAISE NOTICE 'Starting System Test...';

    -- 1. Create/Get Dummy Member (Simulating Auth)
    -- We can't create auth.users here easily without extensions, 
    -- so we will just create a profile entry directly for simulation purposes.
    -- (In real app, trigger handles this).
    
    -- Check if exists, if not create a UUID
    SELECT id INTO test_member_id FROM profiles WHERE email = test_email;
    
    IF test_member_id IS NULL THEN
        test_member_id := gen_random_uuid();
        INSERT INTO profiles (id, email, full_name, role)
        VALUES (test_member_id, test_email, 'Test Simulation User', 'member');
        RAISE NOTICE 'Created Test User: %', test_member_id;
    ELSE
        RAISE NOTICE 'Using Existing Test User: %', test_member_id;
    END IF;

    -- 2. Scenario A: Record Payment (Contribution)
    -- User pays 1000 Table Banking + 500 Savings for "March 2026"
    INSERT INTO contributions (member_id, month, year, table_banking_amount, bank_savings_amount, payment_method, status)
    VALUES (test_member_id, 'March', 2026, 1000, 500, 'mpesa', 'confirmed')
    ON CONFLICT DO NOTHING; -- Avoid constraint errors if re-running
    RAISE NOTICE 'Recorded Contribution for March 2026';

    -- 3. Scenario B: Issue Loan
    -- User requests 2000 KES loan for "Emergency"
    INSERT INTO loans (member_id, amount, purpose, status, interest_amount, total_amount, balance)
    VALUES (test_member_id, 2000, 'Test Emergency Loan', 'active', 200, 2200, 2200);
    RAISE NOTICE 'Issued Active Loan of 2000 KES (Total 2200)';

    -- 4. Scenario C: Compliance Check (Default)
    -- Ensure "January 2026" is NOT paid.
    DELETE FROM contributions WHERE member_id = test_member_id AND month = 'January' AND year = 2026;
    
    -- Run the default checker function
    PERFORM process_monthly_defaults('January', 2026);
    RAISE NOTICE 'Ran Compliance Check for January 2026';

END $$;

-- ==========================================
-- VERIFICATION QUERIES (Results)
-- ==========================================

-- 1. Check Contributions
SELECT 'Contribution Record' as check_type, month, year, table_banking_amount, bank_savings_amount, status 
FROM contributions 
WHERE email = 'test.simulation@example.com' OR member_id IN (SELECT id FROM profiles WHERE email = 'test.simulation@example.com');

-- 2. Check Loans (Should have 1 Manual Loan + 1 Default Loan)
SELECT 'Loan Record' as check_type, purpose, amount, total_amount, status, created_at 
FROM loans 
WHERE member_id IN (SELECT id FROM profiles WHERE email = 'test.simulation@example.com');

-- 3. Check Reports Function
SELECT * FROM get_monthly_comprehensive_report('March', 2026) 
WHERE member_name = 'Test Simulation User';
