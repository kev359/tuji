-- Function to check for defaulters and create auto-loans
-- Deadline is 8th. Treasurer works this button after the 8th.

create or replace function process_monthly_defaults(p_month text, p_year int)
returns table (member_name text, result text)
language plpgsql
security definer
as $$
declare
    r record;
    loan_exists boolean;
    contrib_exists boolean;
begin
    -- Iterate over all users (profiles)
    for r in select id, full_name from profiles
    loop
        -- 1. Check if they have a CONFIRMED contribution for Table Banking >= 1000
        -- We assume 'Table Banking' is the mandatory part that becomes a loan if missed.
        select exists (
            select 1 from contributions 
            where member_id = r.id 
            and month = p_month 
            and year = p_year 
            and status = 'confirmed'
            and table_banking_amount >= 1000
        ) into contrib_exists;

        -- 2. If NOT contributed, check if we already penalized them
        if not contrib_exists then
            select exists (
                select 1 from loans 
                where member_id = r.id 
                and purpose = 'Defaulted Contribution: ' || p_month || ' ' || p_year
            ) into loan_exists;

            -- 3. If no loan exists, CREATE ONE
            if not loan_exists then
                insert into loans (
                    member_id, 
                    amount, 
                    interest_amount, 
                    total_amount, 
                    balance, 
                    purpose, 
                    status, 
                    processed_at
                )
                values (
                    r.id, 
                    1000, 
                    100, -- 10% Interest
                    1100, -- Total Owed
                    1100, -- Starting Balance
                    'Defaulted Contribution: ' || p_month || ' ' || p_year, 
                    'active', -- Immediately Active
                    now()
                );
                return query select r.full_name, 'Defaulted - Loan Created'::text;
            else
                return query select r.full_name, 'Already Penalized'::text;
            end if;
        else
             return query select r.full_name, 'Paid'::text;
        end if;
    end loop;
end;
$$;
