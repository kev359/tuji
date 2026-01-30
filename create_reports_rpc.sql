-- 1. Monthly Contributions Report
CREATE OR REPLACE FUNCTION get_monthly_contributions_report(p_month text, p_year int)
RETURNS TABLE (
  member_name text,
  table_banking decimal,
  bank_savings decimal,
  total_paid decimal,
  payment_method text,
  status text,
  paid_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.full_name,
    c.table_banking_amount,
    c.bank_savings_amount,
    (c.table_banking_amount + c.bank_savings_amount) as total_paid,
    c.payment_method::text,
    c.status::text,
    c.created_at
  FROM contributions c
  JOIN profiles p ON c.member_id = p.id
  WHERE c.month = p_month 
  AND c.year = p_year
  ORDER BY c.created_at DESC;
END;
$$;

-- 2. Loan Risk Report (Active & Defaulted Loans)
CREATE OR REPLACE FUNCTION get_loan_risk_report()
RETURNS TABLE (
  member_name text,
  amount_borrowed decimal,
  total_repayable decimal,
  amount_paid decimal,
  balance decimal,
  status text,
  loan_date timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.full_name,
    l.amount,
    l.total_amount,
    l.amount_paid,
    l.balance,
    l.status::text,
    l.created_at
  FROM loans l
  JOIN profiles p ON l.member_id = p.id
  WHERE l.status IN ('active', 'pending') -- Focus on open risk
  ORDER BY l.balance DESC;
END;
$$;

-- 3. Member Financial Summary (Shares & Net Worth)
CREATE OR REPLACE FUNCTION get_member_financial_summary()
RETURNS TABLE (
  member_name text,
  total_shares decimal, -- Total Table Banking
  total_savings decimal, -- Total Bank Savings
  active_loan_balance decimal
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.full_name,
    COALESCE(SUM(c.table_banking_amount) FILTER (WHERE c.status = 'confirmed'), 0) as total_shares,
    COALESCE(SUM(c.bank_savings_amount) FILTER (WHERE c.status = 'confirmed'), 0) as total_savings,
    (
        SELECT COALESCE(SUM(l.balance), 0)
        FROM loans l 
        WHERE l.member_id = p.id AND l.status = 'active'
    ) as active_loan_balance
  FROM profiles p
  LEFT JOIN contributions c ON p.id = c.member_id
  GROUP BY p.id, p.full_name
  ORDER BY total_shares DESC;
END;
$$;
