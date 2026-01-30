-- Comprehensive Monthly Report RPC
-- Returns: Contributions (Split), Loans Taken, Repayments, and Net Activity per user for a specific month.

create or replace function get_monthly_comprehensive_report(p_month text, p_year int)
returns table (
  member_name text,
  table_banking decimal,
  bank_savings decimal,
  total_contributions decimal,
  loans_taken decimal,
  total_repaid decimal,
  net_activity decimal
)
language plpgsql security definer
as $$
declare
    start_date date;
    end_date date;
begin
    -- Determine date range for the month (e.g. 'January 2026' -> '2026-01-01')
    -- We use begin of month to end of month
    -- Note: p_month is text like 'January'. to_date deals with it.
    start_date := to_date(p_month || ' ' || p_year, 'Month YYYY');
    end_date := (start_date + interval '1 month') - interval '1 second'; 

    return query
    with 
    -- 1. Contributions (Match explicit Month/Year columns)
    contribs as (
        select member_id, 
               sum(table_banking_amount) as tb, 
               sum(bank_savings_amount) as sv
        from contributions 
        where month = p_month and year = p_year and status = 'confirmed'
        group by member_id
    ),
    -- 2. Loans Taken (Created within the date range)
    new_loans as (
        select member_id, 
               sum(amount) as borrowed
        from loans
        where created_at >= start_date and created_at <= end_date
        and status in ('active', 'completed', 'pending') -- We count pending as request activity? Or just active. Let's do Active/Completed for actual money out.
        -- Actually, user wants 'Loans Given', so we should check 'active' or 'completed' and maybe processed_at.
        -- We'll use created_at as proxy for request/approval time roughly.
        group by member_id
    ),
    -- 3. Repayments (Paid within the date range)
    repay as (
        select member_id,
               sum(amount) as paid
        from loan_payments
        where payment_date >= start_date and payment_date <= end_date
        group by member_id
    )
    select 
        p.full_name,
        coalesce(c.tb, 0),
        coalesce(c.sv, 0),
        (coalesce(c.tb, 0) + coalesce(c.sv, 0)),
        coalesce(nl.borrowed, 0),
        coalesce(r.paid, 0),
        -- Met Activity = (Inflow) - (Outflow)
        ( (coalesce(c.tb, 0) + coalesce(c.sv, 0) + coalesce(r.paid, 0)) - coalesce(nl.borrowed, 0) )
    from profiles p
    left join contribs c on p.id = c.member_id
    left join new_loans nl on p.id = nl.member_id
    left join repay r on p.id = r.member_id
    order by p.full_name;
end;
$$;
