"use client";

import { useEffect, useState } from "react";
import { formatearPesos, formatearFechaCorta as formatearFecha, mesLabel } from "@/lib/format";
import styles from "./page.module.css";

type Salida = {
  id: number;
  fecha: string;
  motivo: string;
  monto: number;
};

type Cierre = {
  fecha: string;
  efectivo: number;
  debito: number;
  salidas?: Salida[];
};

function totalSalidas(c: Cierre) {
  return (c.salidas ?? []).reduce((acc, s) => acc + s.monto, 0);
}

/** Lo vendido incluye la plata que salió de la caja durante el día. */
function venta(c: Cierre) {
  return c.efectivo + c.debito + totalSalidas(c);
}

function detalleSalidas(c: Cierre) {
  return (c.salidas ?? []).map((s) => s.motivo).join(", ");
}

export default function ResumenPage() {
  const [cierres, setCierres] = useState<Cierre[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  // Fila en edición (fecha) y valores del formulario inline.
  const [editando, setEditando] = useState<string | null>(null);
  const [editEfectivo, setEditEfectivo] = useState("");
  const [editDebito, setEditDebito] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function cargar() {
    setCargando(true);
    setError(false);
    try {
      const r = await fetch("/api/cierres");
      const data = await r.json();
      // La API devuelve un array cuando anda; ante un error devuelve { error }.
      // Guardamos solo si es array para no romper el .reduce/.map de abajo.
      if (Array.isArray(data)) {
        setCierres(data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function empezarEdicion(c: Cierre) {
    setEditando(c.fecha);
    setEditEfectivo(String(c.efectivo));
    setEditDebito(String(c.debito));
  }

  function cancelarEdicion() {
    setEditando(null);
  }

  async function guardarEdicion(fecha: string) {
    setOcupado(true);
    try {
      const res = await fetch("/api/cierres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha,
          efectivo: Number(editEfectivo) || 0,
          debito: Number(editDebito) || 0,
        }),
      });
      if (res.ok) {
        setEditando(null);
        await cargar();
      }
    } finally {
      setOcupado(false);
    }
  }

  async function borrar(fecha: string) {
    if (!confirm(`¿Borrar el cierre del ${formatearFecha(fecha)}?`)) return;
    setOcupado(true);
    try {
      const res = await fetch(`/api/cierres?fecha=${encodeURIComponent(fecha)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await cargar();
      }
    } finally {
      setOcupado(false);
    }
  }

  const porMes = cierres.reduce<
    Record<string, { efectivo: number; debito: number; salidas: number; dias: number }>
  >((acc, c) => {
    const mes = c.fecha.slice(0, 7);
    if (!acc[mes]) acc[mes] = { efectivo: 0, debito: 0, salidas: 0, dias: 0 };
    acc[mes].efectivo += c.efectivo;
    acc[mes].debito += c.debito;
    acc[mes].salidas += totalSalidas(c);
    acc[mes].dias += 1;
    return acc;
  }, {});

  const mesesOrdenados = Object.keys(porMes).sort((a, b) => b.localeCompare(a));

  if (cargando) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title}>Resumen</h1>
        <p className={styles.estado}>Cargando…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title}>Resumen</h1>
        <p className={styles.estado}>
          No se pudieron cargar los datos. Revisá la conexión a la base de datos.
        </p>
        <button className={styles.btn} onClick={cargar}>
          Reintentar
        </button>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Resumen</h1>

      <section className={styles.section}>
        <h2>Por mes</h2>
        <p className={styles.nota}>
          Venta = efectivo + débito + salidas de caja.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mes</th>
                <th>Efectivo</th>
                <th>Débito</th>
                <th>Salidas</th>
                <th>Venta</th>
                <th>Días</th>
              </tr>
            </thead>
            <tbody>
              {mesesOrdenados.map((mes) => {
                const d = porMes[mes];
                return (
                  <tr key={mes}>
                    <td>{mesLabel(mes + "-01")}</td>
                    <td>{formatearPesos(d.efectivo)}</td>
                    <td>{formatearPesos(d.debito)}</td>
                    <td className={styles.salida}>{formatearPesos(d.salidas)}</td>
                    <td className={styles.total}>
                      {formatearPesos(d.efectivo + d.debito + d.salidas)}
                    </td>
                    <td>{d.dias}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Por día</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Efectivo</th>
                <th>Débito</th>
                <th>Salidas</th>
                <th>Venta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cierres.map((c) =>
                editando === c.fecha ? (
                  <tr key={c.fecha}>
                    <td>{formatearFecha(c.fecha)}</td>
                    <td>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={editEfectivo}
                        onChange={(e) => setEditEfectivo(e.target.value)}
                        className={styles.editInput}
                        autoComplete="off"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={editDebito}
                        onChange={(e) => setEditDebito(e.target.value)}
                        className={styles.editInput}
                        autoComplete="off"
                      />
                    </td>
                    <td className={styles.salida} title={detalleSalidas(c)}>
                      {formatearPesos(totalSalidas(c))}
                    </td>
                    <td className={styles.total}>
                      {formatearPesos(
                        (Number(editEfectivo) || 0) +
                          (Number(editDebito) || 0) +
                          totalSalidas(c)
                      )}
                    </td>
                    <td>
                      <div className={styles.acciones}>
                        <button
                          className={styles.btn}
                          onClick={() => guardarEdicion(c.fecha)}
                          disabled={ocupado}
                        >
                          Guardar
                        </button>
                        <button
                          className={styles.btnSec}
                          onClick={cancelarEdicion}
                          disabled={ocupado}
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.fecha}>
                    <td>{formatearFecha(c.fecha)}</td>
                    <td>{formatearPesos(c.efectivo)}</td>
                    <td>{formatearPesos(c.debito)}</td>
                    <td className={styles.salida} title={detalleSalidas(c)}>
                      {formatearPesos(totalSalidas(c))}
                      {(c.salidas ?? []).length > 0 && (
                        <span className={styles.motivos}>{detalleSalidas(c)}</span>
                      )}
                    </td>
                    <td className={styles.total}>{formatearPesos(venta(c))}</td>
                    <td>
                      <div className={styles.acciones}>
                        <button
                          className={styles.btnSec}
                          onClick={() => empezarEdicion(c)}
                          disabled={ocupado}
                        >
                          Editar
                        </button>
                        <button
                          className={styles.btnDanger}
                          onClick={() => borrar(c.fecha)}
                          disabled={ocupado}
                        >
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
