import { NextRequest, NextResponse } from "next/server";
import {
  getGastosMercado,
  saveGastoMercado,
  deleteGastoMercado,
} from "@/lib/db";

export async function GET() {
  try {
    const gastos = await getGastosMercado();
    return NextResponse.json(gastos);
  } catch {
    return NextResponse.json({ error: "Error al cargar datos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fecha, lugar, detalle, monto } = body;

    if (!fecha || !lugar || monto === undefined) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const gasto = await saveGastoMercado({
      fecha: String(fecha),
      lugar: String(lugar),
      detalle: String(detalle ?? ""),
      monto: Number(monto) || 0,
    });

    return NextResponse.json(gasto);
  } catch {
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Falta el id" }, { status: 400 });
    }

    await deleteGastoMercado(Number(id));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al borrar" }, { status: 500 });
  }
}
