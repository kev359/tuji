-- ==================================================
-- FIX: Monthly Comprehensive Report (Fix Missing Column)
-- ==================================================

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
    -- Determine date range for the month
    start_date := to_date(p_month || ' ' || p_year, 'Month YYYY');
    end_date := (start_date + interval '1 month') - interval '1 second'; 

    return query
    with 
    -- 1. Contributions
    contribs as (
        select member_id, 
               sum(table_banking_amount) as tb, 
               sum(bank_savings_amount) as sv
        from contributions 
        where month = p_month and year = p_year and status = 'confirmed'
        group by member_id
    ),
    -- 2. Loans Taken
    new_loans as (
        select member_id, 
               sum(amount) as borrowed
        from loans
        where created_at >= start_date and created_at <= end_date
        and status in ('active', 'completed')
        group by member_id
    ),
    -- 3. Repayments (FIXED: Join Loans to get member_id)
    repay as (
        select l.member_id,
               sum(lp.amount) as paid
        from loan_payments lp
        join loans l on lp.loan_id = l.id -- <--- The Fix!
        where lp.payment_date >= start_date and lp.payment_date <= end_date
        group by l.member_id
    )
    select 
        p.full_name,
        coalesce(c.tb, 0),
        coalesce(c.sv, 0),
        (coalesce(c.tb, 0) + coalesce(c.sv, 0)),
        coalesce(nl.borrowed, 0),
        coalesce(r.paid, 0),
        ( (coalesce(c.tb, 0) + coalesce(c.sv, 0) + coalesce(r.paid, 0)) - coalesce(nl.borrowed, 0) )
    from profiles p
    left join contribs c on p.id = c.member_id
    left join new_loans nl on p.id = nl.member_id
    left join repay r on p.id = r.member_id
    order by p.full_name;
end;
$$;
