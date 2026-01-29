-- Function to get all pending loans (for public visibility)
create or replace function get_public_loan_requests()
returns table (
  id uuid,
  member_name text,
  amount decimal,
  interest_amount decimal,
  total_amount decimal,
  purpose text,
  request_date timestamptz
) as $$
begin
  return query
  select 
    l.id,
    p.full_name as member_name,
    l.amount,
    l.interest_amount,
    l.total_amount,
    l.purpose,
    l.request_date
  from loans l
  join profiles p on l.member_id = p.id
  where l.status = 'pending'
  order by l.request_date desc;
end;
$$ language plpgsql security definer;
