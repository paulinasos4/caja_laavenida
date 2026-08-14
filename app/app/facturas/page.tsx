"use client";

import { useEffect, useState } from "react";
import { formatearPesos, formatearFechaCorta, hoyISO } from "@/lib/format";
import styles from "./page.module.css";

type Tipo = "factura" | "gasto";

type Movimiento = {
  id: number;
  tipo: Tipo;
  proveedor: string;
  monto: number;
  fecha: string;
};

type Filtro = "todas" | "factura" | "gasto";

export default function FacturasPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [form, setForm] = useState(false);

  // Campos del formulario de nuevo movimiento
  const [tipo, setTipo] = useState<Tipo>("factura");
  const [proveedor, setProveedor] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(hoyISO);

  async function cargar() {
    setCargando(true);
    setError(false);
    try {
      const r = await fetch("/api/movimientos");
      const data = await r.json();
      if (Array.isArray(data)) {
        setMovimientos(data);
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

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!proveedor.trim()) return;
    setOcupado(true);
    try {
      const res = await fetch("/api/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          proveedor: proveedor.trim(),
          monto: Number(monto) || 0,
          fecha,
        }),
      });
      if (res.ok) {
        setProveedor("");
        setMonto("");
        setFecha(hoyISO());
        setForm(false);
        await cargar();
      }
    } finally {
      setOcupado(false);
    }
  }

  async function borrar(id: number) {
    if (!confirm("¿Borrar este movimiento?")) return;
    setOcupado(true);
    try {
      const res = await fetch(`/api/movimientos?id=${id}`, { method: "DELETE" });
      if (res.ok) await cargar();
    } finally {
      setOcupado(false);
    }
  }

  const filtrados = movimientos.filter((m) =>
    filtro === "todas" ? true : m.tipo === filtro
  );

  const tabs: { key: Filtro; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "factura", label: "Facturas" },
    { key: "gasto", label: "Gastos" },
  ];

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Facturas y gastos</h1>
      </header>

      <button className={styles.nueva} onClick={() => setForm((v) => !v)}>
        {form ? "Cancelar" : "+ Nueva factura o gasto"}
      </button>

      {form && (
        <form onSubmit={guardar} className={styles.form}>
          <div className={styles.tipoToggle}>
            <button
              type="button"
              className={`${styles.tipoBtn} ${tipo === "factura" ? styles.tipoActivoF : ""}`}
              onClick={() => setTipo("factura")}
            >
              Factura
            </button>
            <button
              type="button"
              className={`${styles.tipoBtn} ${tipo === "gasto" ? styles.tipoActivoG : ""}`}
              onClick={() => setTipo("gasto")}
            >
              Gasto
            </button>
          </div>

          <label className={styles.label}>
            Proveedor / Descripción
            <input
              type="text"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              className={styles.input}
              placeholder={tipo === "factura" ? "Ej: Dispropan S.A." : "Ej: Transporte"}
              autoComplete="off"
            />
          </label>

          <div className={styles.formRow}>
            <label className={styles.label}>
              Monto
              <input
                type="number"
                inputMode="decimal"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className={styles.input}
                placeholder="0"
                autoComplete="off"
              />
            </label>
            <label className={styles.label}>
              Fecha
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={styles.input}
              />
            </label>
          </div>

          <button type="submit" className={styles.guardar} disabled={ocupado || !proveedor.trim()}>
            {ocupado ? "Guardando…" : "Guardar"}
          </button>
        </form>
      )}

      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${filtro === t.key ? styles.tabActivo : ""}`}
            onClick={() => setFiltro(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className={styles.estado}>Cargando…</p>
      ) : error ? (
        <div>
          <p className={styles.estado}>
            No se pudieron cargar los datos. Revisá la conexión a la base de datos.
          </p>
          <button className={styles.guardar} onClick={cargar}>
            Reintentar
          </button>
        </div>
      ) : filtrados.length === 0 ? (
        <p className={styles.estado}>No hay movimientos para mostrar.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((m) => (
                <tr key={m.id}>
                  <td>{m.proveedor}</td>
                  <td>{formatearPesos(m.monto)}</td>
                  <td>{formatearFechaCorta(m.fecha)}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        m.tipo === "factura" ? styles.badgeFactura : styles.badgeGasto
                      }`}
                    >
                      {m.tipo === "factura" ? "Factura" : "Gasto"}
                    </span>
                  </td>
                  <td>
                    <button
                      className={styles.borrar}
                      onClick={() => borrar(m.id)}
                      disabled={ocupado}
                      aria-label="Borrar"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
