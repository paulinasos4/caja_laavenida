create table if not exists cierres (
  fecha text primary key,
  efectivo numeric not null default 0,
  debito numeric not null default 0,
  comestibles numeric not null default 0,
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

-- Compras de frutas y verduras en el mercado (lunes y jueves).
-- Va aparte de facturas y gastos porque es una sección propia.
-- Sólo se cargan monto, fecha y (opcional) la foto del remito, guardada
-- como data URL en "foto". Las columnas lugar y detalle quedaron sin uso:
-- se conservan por las compras viejas que sí las tenían cargadas.
create table if not exists gastos_mercado (
  id bigint generated always as identity primary key,
  fecha text not null,
  lugar text not null default '',
  detalle text not null default '',
  monto numeric not null default 0,
  foto text,
  created_at timestamptz default now()
);

create index if not exists gastos_mercado_fecha_idx on gastos_mercado (fecha);

-- Facturas y gastos juntos, diferenciados por "tipo".
create table if not exists movimientos (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('factura', 'gasto')),
  proveedor text not null,
  monto numeric not null default 0,
  fecha text not null,
  created_at timestamptz default now()
);

-- Lista simple de productos (solo para saber qué tenemos), con su precio.
create table if not exists productos (
  id bigint generated always as identity primary key,
  nombre text not null,
  precio numeric,
  created_at timestamptz default now()
);

-- Nombre único (ignorando mayúsculas) para poder actualizar el precio
-- de un producto ya existente en vez de duplicarlo.
create unique index if not exists productos_nombre_key on productos (lower(nombre));
