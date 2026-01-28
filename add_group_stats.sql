-- Create a function to get group stats securely (bypassing RLS)
create or replace function get_group_stats()
returns json as $$
declare
  total_interest decimal;
  total_savings decimal;
  total_table_banking decimal;
begin
  -- Calculate total interest from loans (Active + Completed)
  -- Interest = Total Repayable - Principal Amount
  select coalesce(sum(total_repayable - amount), 0)
  into total_interest
  from loans
  where status in ('active', 'completed');

  -- Calculate total Bank Savings (MMF/I&M)
  select coalesce(sum(bank_savings_amount), 0)
  into total_savings
  from contributions
  where status = 'confirmed';

  -- Calculate total Table Banking Pool
  select coalesce(sum(table_banking_amount), 0)
  into total_table_banking
  from contributions
  where status = 'confirmed';

  return json_build_object(
    'total_interest', total_interest,
    'total_savings', total_savings,
    'total_table_banking', total_table_banking
  );
end;
$$ language plpgsql security definer;
