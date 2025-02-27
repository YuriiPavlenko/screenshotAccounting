-- Create tables
CREATE TABLE public.whitelisted_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  balance DECIMAL NOT NULL DEFAULT 0,
  last_four TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  category TEXT NOT NULL,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create function to update card balance
CREATE OR REPLACE FUNCTION public.update_card_balance(p_card_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.cards
  SET balance = balance + p_amount
  WHERE id = p_card_id;
END;
$$ LANGUAGE plpgsql;

-- Set up RLS (Row Level Security)
ALTER TABLE public.whitelisted_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Whitelisted emails can be read by authenticated users
CREATE POLICY "Authenticated users can read whitelisted emails" 
ON public.whitelisted_emails FOR SELECT 
TO authenticated 
USING (true);

-- Cards can be read, inserted, updated, and deleted by their owners
CREATE POLICY "Users can CRUD their own cards" 
ON public.cards FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Transactions can be read, inserted, updated, and deleted by their owners
CREATE POLICY "Users can CRUD their own transactions" 
ON public.transactions FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Set up storage
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'Receipts', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Users can view their own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'receipts');

