import { NextRequest, NextResponse } from "next/server";
import {
  getGastosMercado,
  saveGastoMercado,
  deleteGastoMercado,
} from "@/lib/db";

// Tope de la foto ya comprimida por el navegador (~4 MB en base64).
const MAX_FOTO = 4 * 1024 * 1024;

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
    const { fecha, monto, foto } = body;

    if (!fecha || monto === undefined) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    let imagen: string | null = null;
    if (typeof foto === "string" && foto.startsWith("data:image/")) {
      if (foto.length > MAX_FOTO) {
        return NextResponse.json({ error: "La foto es muy grande" }, { status: 413 });
      }
      imagen = foto;
    }

    const gasto = await saveGastoMercado({
      fecha: String(fecha),
      monto: Number(monto) || 0,
      foto: imagen,
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
