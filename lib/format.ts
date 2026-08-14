const TZ = "America/Argentina/Buenos_Aires";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const MESES_CORTOS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const DIAS = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];

/** Fecha de hoy en formato ISO (YYYY-MM-DD), zona horaria de Argentina. */
export function hoyISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Formatea un número como pesos argentinos, sin decimales. */
export function formatearPesos(n: number): string {
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

/** "2024-05-24" -> "24/05/2024" */
export function formatearFechaCorta(fecha: string): string {
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

/** "2024-05-24" -> "24 de mayo de 2024" */
export function formatearFechaLarga(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${y}`;
}

/** "2024-05" (o "2024-05-01") -> "May 2024" */
export function mesLabel(fecha: string): string {
  const [y, m] = fecha.split("-");
  return `${MESES_CORTOS[Number(m) - 1]} ${y}`;
}

/** Día de la semana en español a partir de una fecha ISO. */
export function diaSemana(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  // Mediodía UTC para evitar corrimientos por zona horaria.
  const dow = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
  const nombre = DIAS[dow];
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}
