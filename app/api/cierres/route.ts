import { NextRequest, NextResponse } from "next/server";
import { getCierres, saveCierre, deleteCierre, type NuevaSalida } from "@/lib/db";

function parseSalidas(valor: unknown): NuevaSalida[] | undefined {
  if (!Array.isArray(valor)) return undefined;

  return valor.map((s) => ({
    motivo: String((s as NuevaSalida)?.motivo ?? ""),
    monto: Number((s as NuevaSalida)?.monto) || 0,
  }));
}

export async function GET() {
  try {
    const cierres = await getCierres();
    return NextResponse.json(cierres);
  } catch {
    return NextResponse.json({ error: "Error al cargar datos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fecha, efectivo, debito, salidas } = body;

    if (!fecha || efectivo === undefined || debito === undefined) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const cierre = await saveCierre({
      fecha,
      efectivo: Number(efectivo),
      debito: Number(debito),
      salidas: parseSalidas(salidas),
    });

    return NextResponse.json(cierre);
  } catch {
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const fecha = request.nextUrl.searchParams.get("fecha");

    if (!fecha) {
      return NextResponse.json({ error: "Falta la fecha" }, { status: 400 });
    }

    await deleteCierre(fecha);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al borrar" }, { status: 500 });
  }
}
