import { NextRequest, NextResponse } from "next/server";
import {
  getMovimientos,
  saveMovimiento,
  deleteMovimiento,
  type TipoMovimiento,
} from "@/lib/db";

export async function GET() {
  try {
    const movimientos = await getMovimientos();
    return NextResponse.json(movimientos);
  } catch {
    return NextResponse.json({ error: "Error al cargar datos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo, proveedor, monto, fecha } = body;

    if (tipo !== "factura" && tipo !== "gasto") {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }
    if (!proveedor || !fecha || monto === undefined) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const movimiento = await saveMovimiento({
      tipo: tipo as TipoMovimiento,
      proveedor: String(proveedor),
      monto: Number(monto),
      fecha: String(fecha),
    });

    return NextResponse.json(movimiento);
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

    await deleteMovimiento(Number(id));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al borrar" }, { status: 500 });
  }
}
