import { NextRequest, NextResponse } from "next/server";
import {
  getProductos,
  saveProducto,
  saveProductosBulk,
  deleteProducto,
} from "@/lib/db";

export async function GET() {
  try {
    const productos = await getProductos();
    return NextResponse.json(productos);
  } catch {
    return NextResponse.json({ error: "Error al cargar datos" }, { status: 500 });
  }
}

// Convierte cualquier valor a number | null (precio desconocido).
function aPrecio(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Carga masiva desde CSV: { productos: [{ nombre, precio }] }
    if (Array.isArray(body?.productos)) {
      const entradas = body.productos.map((p: { nombre: unknown; precio: unknown }) => ({
        nombre: String(p?.nombre ?? ""),
        precio: aPrecio(p?.precio),
      }));
      const insertados = await saveProductosBulk(entradas);
      return NextResponse.json({ insertados });
    }

    // Alta individual: { nombre: string, precio?: number }
    const nombre = String(body?.nombre ?? "").trim();
    if (!nombre) {
      return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
    }

    const producto = await saveProducto({ nombre, precio: aPrecio(body?.precio) });
    return NextResponse.json(producto);
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

    await deleteProducto(Number(id));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al borrar" }, { status: 500 });
  }
}
