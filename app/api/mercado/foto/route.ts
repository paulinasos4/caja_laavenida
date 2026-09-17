import { NextRequest, NextResponse } from "next/server";
import { getFotoGastoMercado } from "@/lib/db";

/** Devuelve la foto del remito de una compra, para mostrarla en un <img>. */
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Falta el id" }, { status: 400 });
    }

    const foto = await getFotoGastoMercado(Number(id));

    if (!foto) {
      return NextResponse.json({ error: "Esa compra no tiene foto" }, { status: 404 });
    }

    // La foto se guarda como data URL: "data:image/jpeg;base64,<contenido>".
    const coma = foto.indexOf(",");
    const encabezado = coma === -1 ? "" : foto.slice(0, coma);

    if (!encabezado.startsWith("data:image/") || !encabezado.endsWith(";base64")) {
      return NextResponse.json({ error: "Foto inválida" }, { status: 500 });
    }

    const tipo = encabezado.slice("data:".length, encabezado.length - ";base64".length);
    const bytes = Uint8Array.from(Buffer.from(foto.slice(coma + 1), "base64"));

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": tipo,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Error al cargar la foto" }, { status: 500 });
  }
}
