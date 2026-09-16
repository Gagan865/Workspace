CREATE OR REPLACE FUNCTION public.generate_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Money collection: payment due today, and again once a day while overdue.
  INSERT INTO public.reminders (owner_id, kind, title, body, due_at, task_id, milestone_id, dedupe_key)
  SELECT m.owner_id,
         CASE WHEN m.due_date < current_date THEN 'payment_overdue' ELSE 'payment_due' END,
         m.label,
         'Payment of ' || m.currency || ' ' || m.amount::text || ' is ' ||
           CASE WHEN m.due_date < current_date THEN 'overdue.' ELSE 'due today.' END,
         date_trunc('day', now()) + interval '10 hours',
         NULL,
         m.id,
         'pay-' || m.id::text || '-' || to_char(current_date, 'YYYY-MM-DD')
  FROM public.payment_milestones m
  JOIN public.reminder_settings s ON s.user_id = m.owner_id AND s.payment_enabled
  WHERE NOT m.paid AND m.due_date IS NOT NULL AND m.due_date <= current_date
  ON CONFLICT (owner_id, dedupe_key) DO NOTHING;

  -- Daily task update nudge for the person who created the task card.
  INSERT INTO public.reminders (owner_id, kind, title, body, due_at, task_id, milestone_id, dedupe_key)
  SELECT t.owner_id,
         'task_update',
         t.title,
         'This task has not been updated today.',
         date_trunc('day', now()) + (split_part(s.daily_time, ':', 1) || ' hours')::interval,
         t.id,
         NULL,
         'task-' || t.id::text || '-' || to_char(current_date, 'YYYY-MM-DD')
  FROM public.tasks t
  JOIN public.reminder_settings s ON s.user_id = t.owner_id AND s.daily_enabled
  WHERE t.last_update_at < now() - interval '1 day'
    AND to_char(now(), 'HH24') = lpad(split_part(s.daily_time, ':', 1), 2, '0')
  ON CONFLICT (owner_id, dedupe_key) DO NOTHING;

  UPDATE public.job_state SET last_run_at = now() WHERE name = 'reminders';
END;
$$;
