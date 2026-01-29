-- 1. Add payment_method enum type
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'mpesa', 'paybill');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add payment tracking columns to contributions table
ALTER TABLE public.contributions 
ADD COLUMN IF NOT EXISTS payment_method payment_method DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS reference_code text,
ADD COLUMN IF NOT EXISTS notes text;

-- 3. Add comments for clarity
COMMENT ON COLUMN contributions.payment_method IS 'How the member paid: cash, mpesa (to treasurer), or paybill (I&M Bank)';
COMMENT ON COLUMN contributions.reference_code IS 'M-Pesa or Paybill transaction reference code';
COMMENT ON COLUMN contributions.notes IS 'Additional notes from treasurer';
