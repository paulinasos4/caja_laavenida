/**
 * Parser de CSV para la lista de productos.
 *
 * El archivo tiene varias columnas con encabezado. Buscamos la columna
 * llamada "Producto" (sin distinguir mayúsculas, acentos ni espacios) y
 * devolvemos solo esos nombres, limpios y sin duplicados.
 *
 * Si no existe una columna "Producto", NO se importa nada: se devuelve
 * un resultado con `columnas` (las que sí encontró) para poder avisar.
 */

export type ResultadoCSV =
  | { ok: true; nombres: string[] }
  | { ok: false; motivo: "sin-columna" | "vacio"; columnas: string[] };

// Nombres de encabezado que aceptamos para la columna de productos.
const NOMBRES_COLUMNA = ["producto", "productos"];

/** Normaliza texto para comparar encabezados: minúsculas, sin acentos ni espacios extra. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos (diacríticos combinantes)
    .trim()
    .toLowerCase();
}

/**
 * Parte una línea CSV en campos, respetando comillas dobles.
 * Soporta comas dentro de comillas y comillas escapadas ("").
 * Detecta coma o punto y coma como separador (el que aparezca primero fuera de comillas).
 */
function parsearLinea(linea: string, sep: string): string[] {
  const campos: string[] = [];
  let actual = "";
  let entreComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];

    if (entreComillas) {
      if (c === '"') {
        if (linea[i + 1] === '"') {
          actual += '"'; // comilla escapada
          i++;
        } else {
          entreComillas = false;
        }
      } else {
        actual += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === sep) {
      campos.push(actual.trim());
      actual = "";
    } else {
      actual += c;
    }
  }
  campos.push(actual.trim());
  return campos;
}

/** Detecta si la línea de encabezado usa "," o ";" como separador. */
function detectarSeparador(headerLine: string): string {
  // Contamos fuera de comillas de forma simple: el que más aparezca gana.
  const comas = (headerLine.match(/,/g) || []).length;
  const puntoYComa = (headerLine.match(/;/g) || []).length;
  return puntoYComa > comas ? ";" : ",";
}

export function parseProductosCSV(texto: string): ResultadoCSV {
  const lineas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lineas.length === 0) {
    return { ok: false, motivo: "vacio", columnas: [] };
  }

  const sep = detectarSeparador(lineas[0]);
  const encabezados = parsearLinea(lineas[0], sep);

  // Busca el índice de la columna "Producto".
  const indice = encabezados.findIndex((h) =>
    NOMBRES_COLUMNA.includes(normalizar(h))
  );

  if (indice === -1) {
    return { ok: false, motivo: "sin-columna", columnas: encabezados };
  }

  // Extrae esa columna de cada fila de datos (saltando el header).
  const vistos = new Set<string>();
  const nombres: string[] = [];

  for (let i = 1; i < lineas.length; i++) {
    const campos = parsearLinea(lineas[i], sep);
    const valor = (campos[indice] ?? "").trim();
    if (!valor) continue;

    const clave = valor.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    nombres.push(valor);
  }

  return { ok: true, nombres };
}
