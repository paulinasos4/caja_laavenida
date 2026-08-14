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
  let sep = ";";

  for (let i = 0; i < lineas.length; i++) {
    const sepLinea = detectarSeparador(lineas[i]);
    const campos = parsearLinea(lineas[i], sepLinea);
    const col = campos.findIndex((h) => NOMBRES_COLUMNA.includes(normalizar(h)));
    if (col !== -1) {
      indiceFila = i;
      indiceCol = col;
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

  // Extrae la columna "Producto" de cada fila DESPUÉS del header.
  const vistos = new Set<string>();
  const nombres: string[] = [];

  for (let i = indiceFila + 1; i < lineas.length; i++) {
    const campos = parsearLinea(lineas[i], sep);
    const valor = (campos[indiceCol] ?? "").trim();
    if (!valor) continue;

    // Descarta filas de "totales"/parámetros del pie del export:
    // suelen tener la celda de producto vacía o texto que no es un producto.
    const clave = valor.toLowerCase();
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    nombres.push(valor);
  }

  return { ok: true, nombres };
}
