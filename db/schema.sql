create table if not exists cierres (
  fecha text primary key,
  efectivo numeric not null default 0,
  debito numeric not null default 0,
  created_at timestamptz default now()
);

-- Facturas y gastos juntos, diferenciados por "tipo".
create table if not exists movimientos (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('factura', 'gasto')),
  proveedor text not null,
  monto numeric not null default 0,
  fecha text not null,
  created_at timestamptz default now()
);

-- Lista simple de productos (solo para saber qué tenemos).
create table if not exists productos (
  id bigint generated always as identity primary key,
  nombre text not null,
  created_at timestamptz default now()
);
