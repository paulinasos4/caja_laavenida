import { neon } from "@neondatabase/serverless";

export type Cierre = {
  fecha: string;
  efectivo: number;
  debito: number;
};

function getSql() {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error("Falta POSTGRES_URL");
  return neon(url);
}

export async function getCierres(): Promise<Cierre[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT fecha, efectivo, debito
    FROM cierres
    ORDER BY fecha DESC
  `;

  return rows.map((c) => ({
    fecha: String(c.fecha),
    efectivo: Number(c.efectivo),
    debito: Number(c.debito),
  }));
}

export async function saveCierre(cierre: Cierre): Promise<Cierre> {
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
  return {
    fecha: String(row.fecha),
    efectivo: Number(row.efectivo),
    debito: Number(row.debito),
  };
}

export async function deleteCierre(fecha: string): Promise<void> {
  const sql = getSql();
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
};

export async function getProductos(): Promise<Producto[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, nombre
    FROM productos
    ORDER BY nombre ASC
  `;

  return rows.map((p) => ({
    id: Number(p.id),
    nombre: String(p.nombre),
  }));
}

export async function saveProducto(nombre: string): Promise<Producto> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO productos (nombre)
    VALUES (${nombre})
    RETURNING id, nombre
  `;

  const row = rows[0];
  return {
    id: Number(row.id),
    nombre: String(row.nombre),
  };
}

// Inserta varios productos de una (para la carga por CSV).
// Devuelve la cantidad insertada.
export async function saveProductosBulk(nombres: string[]): Promise<number> {
  const limpios = nombres
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  if (limpios.length === 0) return 0;

  const sql = getSql();
  const rows = await sql`
    INSERT INTO productos (nombre)
    SELECT unnest(${limpios}::text[])
    RETURNING id
  `;

  return rows.length;
}

export async function deleteProducto(id: number): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM productos WHERE id = ${id}`;
}
