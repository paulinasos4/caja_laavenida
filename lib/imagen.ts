/**
 * Achica y comprime una foto en el navegador antes de subirla, así una foto
 * de celular (que puede pesar varios MB) queda en unos pocos cientos de KB.
 * Devuelve la imagen como data URL para guardarla en la base.
 */
export async function comprimirImagen(
  file: File,
  ladoMaximo = 1200,
  calidad = 0.7
): Promise<string> {
  const imagen = await cargarImagen(file);

  const anchoOriginal = "naturalWidth" in imagen ? imagen.naturalWidth : imagen.width;
  const altoOriginal = "naturalHeight" in imagen ? imagen.naturalHeight : imagen.height;

  const escala = Math.min(1, ladoMaximo / Math.max(anchoOriginal, altoOriginal));
  const ancho = Math.max(1, Math.round(anchoOriginal * escala));
  const alto = Math.max(1, Math.round(altoOriginal * escala));

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");

  ctx.drawImage(imagen, 0, 0, ancho, alto);

  return canvas.toDataURL("image/jpeg", calidad);
}

async function cargarImagen(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap respeta la orientación con la que se sacó la foto.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Navegadores viejos: seguimos con el <img> de abajo.
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };

    img.src = url;
  });
}
