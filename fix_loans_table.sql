-- Fix missing column in loans table
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS processed_at timestamptz DEFAULT now();

-- Re-run the function just to be sure
create or replace function process_monthly_defaults(p_month text, p_year int)
returns table (member_name text, result text)
language plpgsql security definer
as $$
declare
    r record;
    loan_exists boolean;
    contrib_exists boolean;
begin
    for r in select id, full_name from profiles
    loop
        -- 1. Check if they have a CONFIRMED contribution for Table Banking >= 1000
        select exists (
            select 1 from contributions 
            where member_id = r.id and month = p_month and year = p_year and status = 'confirmed' and table_banking_amount >= 1000
        ) into contrib_exists;

        if not contrib_exists then
            select exists (
                select 1 from loans where member_id = r.id and purpose = 'Defaulted Contribution: ' || p_month || ' ' || p_year
            ) into loan_exists;

            if not loan_exists then
                insert into loans (member_id, amount, interest_amount, total_amount, balance, purpose, status, processed_at)
                values (r.id, 1000, 100, 1100, 1100, 'Defaulted Contribution: ' || p_month || ' ' || p_year, 'active', now());
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
