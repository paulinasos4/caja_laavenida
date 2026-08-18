create table if not exists cierres (
  fecha text primary key,
  efectivo numeric not null default 0,
  debito numeric not null default 0,
  created_at timestamptz default now()
);

-- Plata que salió de la caja durante el día (pagos a empleados, proveedores, etc.).
create table if not exists salidas (
  id bigint generated always as identity primary key,
  fecha text not null,
  motivo text not null,
  monto numeric not null default 0,
  created_at timestamptz default now()
);

create index if not exists salidas_fecha_idx on salidas (fecha);

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
