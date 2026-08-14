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
