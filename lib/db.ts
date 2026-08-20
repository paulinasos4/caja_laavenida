import { neon } from "@neondatabase/serverless";

export type Salida = {
  id: number;
  fecha: string;
  motivo: string;
  monto: number;
};

export type NuevaSalida = {
  motivo: string;
  monto: number;
};

export type Cierre = {
  fecha: string;
  efectivo: number;
  debito: number;
  salidas: Salida[];
};

export type NuevoCierre = {
  fecha: string;
  efectivo: number;
  debito: number;
  /** Si viene, reemplaza las salidas del día. Si no, quedan como estaban. */
  salidas?: NuevaSalida[];
};

function getSql() {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error("Falta POSTGRES_URL");
  return neon(url);
}

// La tabla de salidas se crea sola la primera vez para no depender de
// correr el schema a mano en la base.
let salidasListas: Promise<void> | null = null;

function ensureSalidas(): Promise<void> {
  if (!salidasListas) {
    const sql = getSql();
    salidasListas = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS salidas (
          id bigint generated always as identity primary key,
          fecha text not null,
          motivo text not null,
          monto numeric not null default 0,
          created_at timestamptz default now()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS salidas_fecha_idx ON salidas (fecha)`;
    })().catch((e) => {
      salidasListas = null;
      throw e;
    });
  }
  return salidasListas;
}

function toSalida(row: Record<string, unknown>): Salida {
  return {
    id: Number(row.id),
    fecha: String(row.fecha),
    motivo: String(row.motivo),
    monto: Number(row.monto),
  };
}

export async function getCierres(): Promise<Cierre[]> {
  await ensureSalidas();
  const sql = getSql();

  const [cierres, salidas] = await Promise.all([
    sql`
      SELECT fecha, efectivo, debito
      FROM cierres
      ORDER BY fecha DESC
    `,
    sql`
      SELECT id, fecha, motivo, monto
      FROM salidas
      ORDER BY id ASC
    `,
  ]);

  const porFecha = new Map<string, Salida[]>();
  for (const row of salidas) {
    const salida = toSalida(row);
    const lista = porFecha.get(salida.fecha) ?? [];
    lista.push(salida);
    porFecha.set(salida.fecha, lista);
  }

  return cierres.map((c) => {
    const fecha = String(c.fecha);
    return {
      fecha,
      efectivo: Number(c.efectivo),
      debito: Number(c.debito),
      salidas: porFecha.get(fecha) ?? [],
    };
  });
}

export async function getSalidas(fecha: string): Promise<Salida[]> {
  await ensureSalidas();
  const sql = getSql();
  const rows = await sql`
    SELECT id, fecha, motivo, monto
    FROM salidas
    WHERE fecha = ${fecha}
    ORDER BY id ASC
  `;

  return rows.map(toSalida);
}

/** Deja en la base exactamente las salidas recibidas para ese día. */
export async function replaceSalidas(
  fecha: string,
  salidas: NuevaSalida[]
): Promise<void> {
  await ensureSalidas();
  const sql = getSql();

  const limpias = salidas
    .map((s) => ({
      motivo: String(s.motivo ?? "").trim() || "Sin detalle",
      monto: Number(s.monto) || 0,
    }))
    .filter((s) => s.monto > 0);

  await sql`DELETE FROM salidas WHERE fecha = ${fecha}`;

  if (limpias.length === 0) return;

  await sql`
    INSERT INTO salidas (fecha, motivo, monto)
    SELECT ${fecha}, motivo, monto
    FROM unnest(
      ${limpias.map((s) => s.motivo)}::text[],
      ${limpias.map((s) => s.monto)}::numeric[]
    ) AS t(motivo, monto)
  `;
}

export async function saveCierre(cierre: NuevoCierre): Promise<Cierre> {
  await ensureSalidas();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO cierres (fecha, efectivo, debito)
    VALUES (${cierre.fecha}, ${cierre.efectivo}, ${cierre.debito})
    ON CONFLICT (fecha) DO UPDATE SET
      efectivo = EXCLUDED.efectivo,
      debito = EXCLUDED.debito
    RETURNING fecha, efectivo, debito
  `;

  const row = rows[0];
  const fecha = String(row.fecha);

  if (cierre.salidas) {
    await replaceSalidas(fecha, cierre.salidas);
  }

  return {
    fecha,
    efectivo: Number(row.efectivo),
    debito: Number(row.debito),
    salidas: await getSalidas(fecha),
  };
}

export async function deleteCierre(fecha: string): Promise<void> {
  await ensureSalidas();
  const sql = getSql();
  await sql`DELETE FROM salidas WHERE fecha = ${fecha}`;
  await sql`DELETE FROM cierres WHERE fecha = ${fecha}`;
}

// ---------- Movimientos (facturas y gastos) ----------

export type TipoMovimiento = "factura" | "gasto";

export type Movimiento = {
  id: number;
  tipo: TipoMovimiento;
  proveedor: string;
  monto: number;
  fecha: string;
};

export type NuevoMovimiento = Omit<Movimiento, "id">;

export async function getMovimientos(): Promise<Movimiento[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, tipo, proveedor, monto, fecha
    FROM movimientos
    ORDER BY fecha DESC, id DESC
  `;

  return rows.map((m) => ({
    id: Number(m.id),
    tipo: String(m.tipo) as TipoMovimiento,
    proveedor: String(m.proveedor),
    monto: Number(m.monto),
    fecha: String(m.fecha),
  }));
}

export async function saveMovimiento(mov: NuevoMovimiento): Promise<Movimiento> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO movimientos (tipo, proveedor, monto, fecha)
    VALUES (${mov.tipo}, ${mov.proveedor}, ${mov.monto}, ${mov.fecha})
    RETURNING id, tipo, proveedor, monto, fecha
  `;

  const row = rows[0];
  return {
    id: Number(row.id),
    tipo: String(row.tipo) as TipoMovimiento,
    proveedor: String(row.proveedor),
    monto: Number(row.monto),
    fecha: String(row.fecha),
  };
}

export async function deleteMovimiento(id: number): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM movimientos WHERE id = ${id}`;
}

// ---------- Productos ----------

export type Producto = {
  id: number;
  nombre: string;
  /** null si no se conoce el precio. */
  precio: number | null;
};

export type ProductoEntrada = {
  nombre: string;
  precio: number | null;
};

// La columna precio y el índice único por nombre se crean solos la primera
// vez, para no depender de correr migraciones a mano en la base
// (la tabla productos puede existir en prod sin la columna).
let productosListos: Promise<void> | null = null;

function ensureProductos(): Promise<void> {
  if (!productosListos) {
    const sql = getSql();
    productosListos = (async () => {
      await sql`ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio numeric`;
      // Índice único por nombre (ignorando mayúsculas) para poder hacer
      // upsert: si el producto ya existe, se actualiza el precio.
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS productos_nombre_key
        ON productos (lower(nombre))
      `;
    })().catch((e) => {
      productosListos = null;
      throw e;
    });
  }
  return productosListos;
}

function toProducto(row: Record<string, unknown>): Producto {
  return {
    id: Number(row.id),
    nombre: String(row.nombre),
    precio: row.precio === null || row.precio === undefined ? null : Number(row.precio),
  };
}

export async function getProductos(): Promise<Producto[]> {
  await ensureProductos();
  const sql = getSql();
  const rows = await sql`
    SELECT id, nombre, precio
    FROM productos
    ORDER BY nombre ASC
  `;

  return rows.map(toProducto);
}

// Alta/actualización individual. Si el nombre ya existe (ignorando
// mayúsculas), actualiza el precio en vez de duplicar.
export async function saveProducto(entrada: ProductoEntrada): Promise<Producto> {
  await ensureProductos();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO productos (nombre, precio)
    VALUES (${entrada.nombre}, ${entrada.precio})
    ON CONFLICT (lower(nombre)) DO UPDATE SET
      precio = EXCLUDED.precio
    RETURNING id, nombre, precio
  `;

  return toProducto(rows[0]);
}

// Inserta/actualiza varios productos de una (para la carga por CSV).
// Los que ya existen (por nombre) actualizan su precio. Devuelve la
// cantidad total de filas procesadas.
export async function saveProductosBulk(
  entradas: ProductoEntrada[]
): Promise<number> {
  const limpios = entradas
    .map((e) => ({ nombre: e.nombre.trim(), precio: e.precio }))
    .filter((e) => e.nombre.length > 0);

  if (limpios.length === 0) return 0;

  await ensureProductos();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO productos (nombre, precio)
    SELECT nombre, precio
    FROM unnest(
      ${limpios.map((e) => e.nombre)}::text[],
      ${limpios.map((e) => e.precio)}::numeric[]
    ) AS t(nombre, precio)
    ON CONFLICT (lower(nombre)) DO UPDATE SET
      precio = EXCLUDED.precio
    RETURNING id
  `;

  return rows.length;
}

export async function deleteProducto(id: number): Promise<void> {
  await ensureProductos();
  const sql = getSql();
  await sql`DELETE FROM productos WHERE id = ${id}`;
}
