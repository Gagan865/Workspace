-- Richer, free-text quotation/invoice layout: item name + free-text qty/amount,
-- an invoice summary, subscription plans, and a payment-details block.
ALTER TABLE public.quote_items ADD COLUMN name text NOT NULL DEFAULT '';
ALTER TABLE public.quote_items ADD COLUMN qty_text text NOT NULL DEFAULT '';
ALTER TABLE public.quote_items ADD COLUMN amount_text text NOT NULL DEFAULT '';

ALTER TABLE public.quotes ADD COLUMN summary jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.quotes ADD COLUMN plans jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.quotes ADD COLUMN payment_details text NOT NULL DEFAULT '';
