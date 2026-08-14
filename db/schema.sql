create table if not exists cierres (
  fecha text primary key,
  efectivo numeric not null default 0,
  debito numeric not null default 0,
  created_at timestamptz default now()
);
