import { NextRequest, NextResponse } from "next/server";
import { getCierres, saveCierre } from "@/lib/db";

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
    const { fecha, efectivo, debito } = body;

    if (!fecha || efectivo === undefined || debito === undefined) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const cierre = await saveCierre({
      fecha,
      efectivo: Number(efectivo),
      debito: Number(debito),
    });

    return NextResponse.json(cierre);
  } catch {
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
