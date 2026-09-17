-- Advance/deposit paid on a quotation, so the document can show balance due.
ALTER TABLE public.quotes ADD COLUMN deposit numeric NOT NULL DEFAULT 0;
