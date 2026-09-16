-- Store each private day as a single JSON blob (priorities, to-dos, contacts,
-- schedule, notes, water, expenses, rating). One row per user per day.
DROP TABLE IF EXISTS public.planner_items;

ALTER TABLE public.planner_days DROP COLUMN IF EXISTS notes;
ALTER TABLE public.planner_days DROP COLUMN IF EXISTS water;
ALTER TABLE public.planner_days DROP COLUMN IF EXISTS rating;
ALTER TABLE public.planner_days DROP COLUMN IF EXISTS schedule;
ALTER TABLE public.planner_days ADD COLUMN content jsonb NOT NULL DEFAULT '{}'::jsonb;
