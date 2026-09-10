"use client";

import { useEffect, useState } from "react";
import {
  formatearPesos,
  formatearFechaCorta,
  hoyISO,
  diaSemana,
  mesLabel,
} from "@/lib/format";
import styles from "./page.module.css";

type GastoMercado = {
  id: number;
  fecha: string;
  lugar: string;
  detalle: string;
  monto: number;
};

export default function MercadoPage() {
  const [gastos, setGastos] = useState<GastoMercado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [form, setForm] = useState(false);

  const [fecha, setFecha] = useState(hoyISO);
  const [lugar, setLugar] = useState("");
  const [detalle, setDetalle] = useState("");
  const [monto, setMonto] = useState("");

  async function cargar() {
    setCargando(true);
    setError(false);
    try {
      const r = await fetch("/api/mercado");
      const data = await r.json();
      if (Array.isArray(data)) {
        setGastos(data);
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
    if (!lugar.trim()) return;
    setOcupado(true);
    try {
      const res = await fetch("/api/mercado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha,
          lugar: lugar.trim(),
          detalle: detalle.trim(),
          monto: Number(monto) || 0,
        }),
      });
      if (res.ok) {
        setLugar("");
        setDetalle("");
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
    if (!confirm("¿Borrar esta compra?")) return;
    setOcupado(true);
    try {
      const res = await fetch(`/api/mercado?id=${id}`, { method: "DELETE" });
      if (res.ok) await cargar();
    } finally {
      setOcupado(false);
    }
  }

  // Agrupado por mes para ver cuánto se gastó en cada uno.
  const porMes = new Map<string, GastoMercado[]>();
  for (const g of gastos) {
    const mes = g.fecha.slice(0, 7);
    porMes.set(mes, [...(porMes.get(mes) ?? []), g]);
  }
  const meses = [...porMes.keys()].sort((a, b) => b.localeCompare(a));

  function total(lista: GastoMercado[]) {
    return lista.reduce((acc, g) => acc + g.monto, 0);
  }

  const mesActual = hoyISO().slice(0, 7);
  const gastosDelMes = porMes.get(mesActual) ?? [];

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gastos mercado</h1>
        <p className={styles.subtitle}>
          Compras de frutas y verduras (lunes y jueves)
        </p>
      </header>

      <div className={styles.resumen}>
        <div>
          <p className={styles.resumenLabel}>Este mes</p>
          <p className={styles.resumenValor}>{formatearPesos(total(gastosDelMes))}</p>
        </div>
        <div>
          <p className={styles.resumenLabel}>Compras</p>
          <p className={styles.resumenValor}>{gastosDelMes.length}</p>
        </div>
      </div>

      <button className={styles.nueva} onClick={() => setForm((v) => !v)}>
        {form ? "Cancelar" : "+ Nueva compra"}
      </button>

      {form && (
        <form onSubmit={guardar} className={styles.form}>
          <label className={styles.label}>
            Dónde compró
            <input
              type="text"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              className={styles.input}
              placeholder="Ej: Mercado Central"
              autoComplete="off"
            />
          </label>

          <label className={styles.label}>
            Qué compró <span className={styles.opcional}>(opcional)</span>
            <input
              type="text"
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              className={styles.input}
              placeholder="Ej: tomate, lechuga, banana"
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

          <button
            type="submit"
            className={styles.guardar}
            disabled={ocupado || !lugar.trim()}
          >
            {ocupado ? "Guardando…" : "Guardar"}
          </button>
        </form>
      )}

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
      ) : gastos.length === 0 ? (
        <p className={styles.estado}>
          Todavía no hay compras cargadas. Agregá la primera con “+ Nueva compra”.
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Dónde</th>
                <th>Qué</th>
                <th>Monto</th>
                <th></th>
              </tr>
            </thead>
            {meses.map((mes) => {
              const lista = porMes.get(mes) ?? [];
              return (
                <tbody key={mes}>
                  <tr className={styles.grupo}>
                    <td colSpan={5}>
                      {mesLabel(mes + "-01")} · {formatearPesos(total(lista))}
                    </td>
                  </tr>
                  {lista.map((g) => (
                    <tr key={g.id}>
                      <td>
                        {formatearFechaCorta(g.fecha)}
                        <span className={styles.dia}>{diaSemana(g.fecha)}</span>
                      </td>
                      <td>{g.lugar}</td>
                      <td className={styles.detalle}>{g.detalle || "—"}</td>
                      <td className={styles.monto}>{formatearPesos(g.monto)}</td>
                      <td>
                        <button
                          className={styles.borrar}
                          onClick={() => borrar(g.id)}
                          disabled={ocupado}
                          aria-label="Borrar"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              );
            })}
          </table>
        </div>
      )}
    </main>
  );
}
