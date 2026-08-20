/**
 * Parser de CSV para la lista de productos.
 *
 * El archivo tiene varias columnas con encabezado. Buscamos la columna
 * llamada "Producto" (obligatoria) y, si existe, la de "Precio unitario",
 * y devolvemos los productos con su precio, sin duplicados (por nombre,
 * ignorando mayúsculas: si el nombre se repite gana la última fila).
 *
 * Si no existe una columna "Producto", NO se importa nada: se devuelve
 * un resultado con `columnas` (las que sí encontró) para poder avisar.
 */

export type ProductoCSV = {
  nombre: string;
  /** null si no hay precio o no es un número válido. */
  precio: number | null;
};

export type ResultadoCSV =
  | { ok: true; productos: ProductoCSV[] }
  | { ok: false; motivo: "sin-columna" | "vacio"; columnas: string[] };

/**
 * Lee un archivo de texto detectando el encoding.
 *
 * Los exports de sistemas de venta / Excel suelen venir en Latin-1
 * (ISO-8859-1), no en UTF-8. Si se leen como UTF-8 los acentos se rompen
 * (ej. "más" -> "mÃ¡s"). Probamos UTF-8 y, si aparecen señales de mojibake,
 * reintentamos como Latin-1 (windows-1252).
 */
export async function leerArchivoTexto(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();

  const utf8 = new TextDecoder("utf-8").decode(buffer);
  // Señales de que en realidad era Latin-1: el carácter de reemplazo (�)
  // o las secuencias típicas "Ã", "Â" que deja Latin-1 leído como UTF-8.
  const pareceRoto = utf8.includes("�") || /Ã.|Â./.test(utf8);

  if (pareceRoto) {
    return new TextDecoder("windows-1252").decode(buffer);
  }
  return utf8;
}

// Nombres de encabezado que aceptamos para la columna de productos.
const NOMBRES_COLUMNA = ["producto", "productos"];
// Nombres de encabezado que aceptamos para la columna de precio.
const NOMBRES_PRECIO = ["precio unitario", "precio", "precio unit"];

/**
 * Convierte el texto de una celda de precio a número.
 * Tolera decimales con coma ("128,33"), separadores de miles ("1.200")
 * y devuelve null ante valores inválidos ("#DIV/0!", vacío, etc.).
 */
function parsearPrecio(texto: string): number | null {
  const t = (texto ?? "").trim();
  if (!t) return null;

  // Si tiene letras u otros símbolos raros (ej. "#DIV/0!"), no es un precio.
  // Solo aceptamos dígitos, separadores, signo y espacios/símbolo de moneda.
  if (/[^\d,.\-\s$]/.test(t)) return null;

  // Deja solo dígitos, coma, punto y signo negativo.
  let limpio = t.replace(/[^\d,.\-]/g, "");
  if (!limpio) return null;

  // Si tiene coma y punto, asumimos punto = miles y coma = decimal ("1.234,56").
  if (limpio.includes(",") && limpio.includes(".")) {
    limpio = limpio.replace(/\./g, "").replace(",", ".");
  } else if (limpio.includes(",")) {
    // Solo coma: es el separador decimal ("128,33").
    limpio = limpio.replace(",", ".");
  }

  const n = Number(limpio);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

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
  // Quita el BOM inicial (aparece en exports de Excel/sistemas) que si no
  // se pega a la primera celda y rompe la comparación de encabezados.
  const limpio = texto.replace(/^﻿/, "");

  const lineas = limpio
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lineas.length === 0) {
    return { ok: false, motivo: "vacio", columnas: [] };
  }

  // El header puede NO estar en la primera línea: muchos exports traen
  // un título y filas en blanco arriba. Buscamos la primera fila que
  // tenga una columna "Producto".
  let indiceFila = -1;
  let indiceCol = -1;
  let indicePrecio = -1;
  let sep = ";";

  for (let i = 0; i < lineas.length; i++) {
    const sepLinea = detectarSeparador(lineas[i]);
    const campos = parsearLinea(lineas[i], sepLinea);
    const col = campos.findIndex((h) => NOMBRES_COLUMNA.includes(normalizar(h)));
    if (col !== -1) {
      indiceFila = i;
      indiceCol = col;
      indicePrecio = campos.findIndex((h) => NOMBRES_PRECIO.includes(normalizar(h)));
      sep = sepLinea;
      break;
    }
  }

  if (indiceFila === -1) {
    // No hay header con "Producto". Devolvemos las columnas de la primera
    // línea con contenido para poder mostrar un aviso útil.
    const columnas = parsearLinea(lineas[0], detectarSeparador(lineas[0]));
    return { ok: false, motivo: "sin-columna", columnas };
  }

  // Extrae producto (+ precio) de cada fila DESPUÉS del header.
  // Deduplica por nombre ignorando mayúsculas; si se repite, gana la última fila.
  const indicePorClave = new Map<string, number>();
  const productos: ProductoCSV[] = [];

  for (let i = indiceFila + 1; i < lineas.length; i++) {
    const campos = parsearLinea(lineas[i], sep);
    const nombre = (campos[indiceCol] ?? "").trim();
    if (!nombre) continue; // salta filas vacías / totales del pie

    const precio =
      indicePrecio !== -1 ? parsearPrecio(campos[indicePrecio] ?? "") : null;

    const clave = nombre.toLowerCase();
    const existente = indicePorClave.get(clave);
    if (existente !== undefined) {
      // Repetido: la última fila gana (actualiza el precio).
      productos[existente] = { nombre, precio };
    } else {
      indicePorClave.set(clave, productos.length);
      productos.push({ nombre, precio });
    }
  }

  return { ok: true, productos };
}
