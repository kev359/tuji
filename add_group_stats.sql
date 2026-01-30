CREATE OR REPLACE FUNCTION get_group_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_interest decimal;
    total_table_banking decimal;
    total_bank_savings decimal;
    total_loans_given decimal;
    total_interest_expected decimal;
BEGIN
    -- 1. Calculate Total Interest Earned (Completed Loans)
    SELECT COALESCE(SUM(interest_amount), 0)
    INTO total_interest
    FROM loans
    WHERE status = 'completed';

    -- 2. Calculate Total Interest Expected (Active + Pending Loans)
    -- We include active because we expect to get it.
    SELECT COALESCE(SUM(interest_amount), 0)
    INTO total_interest_expected
    FROM loans
    WHERE status IN ('active', 'completed');

    -- 3. Calculate Total Loans Given (Principal of all approved loans)
    SELECT COALESCE(SUM(amount), 0)
    INTO total_loans_given
    FROM loans
    WHERE status IN ('active', 'completed');

    -- 4. Calculate Total Table Banking Pool (Confirmed Contributions)
    SELECT COALESCE(SUM(table_banking_amount), 0)
    INTO total_table_banking
    FROM contributions
    WHERE status = 'confirmed';

    -- 5. Calculate Total Bank Savings (MMF/I&M)
    SELECT COALESCE(SUM(bank_savings_amount), 0)
    INTO total_bank_savings
    FROM contributions
    WHERE status = 'confirmed';

    RETURN json_build_object(
        'total_interest', total_interest,
        'total_interest_expected', total_interest_expected,
        'total_loans_given', total_loans_given,
        'total_table_banking', total_table_banking,
        'total_bank_savings', total_bank_savings
    );
END;
$$;
