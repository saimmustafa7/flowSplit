alter table public.transactions
add column if not exists split_mode text not null default 'equal'
  check (split_mode in ('equal', 'exact', 'shares', 'percentage', 'mine'));
