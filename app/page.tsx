"use client";

import { useState } from "react";
import styles from "./page.module.css";

function hoyISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

function formatearFecha(fecha: string) {
  const [, m, d] = fecha.split("-").map(Number);
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${d} de ${meses[m - 1]}`;
}

export default function CargarPage() {
  const [fecha] = useState(hoyISO);
  const [efectivo, setEfectivo] = useState("");
  const [debito, setDebito] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setGuardado(false);

    try {
      const res = await fetch("/api/cierres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha,
          efectivo: Number(efectivo) || 0,
          debito: Number(debito) || 0,
        }),
      });

      if (res.ok) {
        setGuardado(true);
        setEfectivo("");
        setDebito("");
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <p className={styles.fecha}>{formatearFecha(fecha)}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Efectivo
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={efectivo}
              onChange={(e) => setEfectivo(e.target.value)}
              className={styles.input}
              autoComplete="off"
            />
          </label>

          <label className={styles.label}>
            Débito
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={debito}
              onChange={(e) => setDebito(e.target.value)}
              className={styles.input}
              autoComplete="off"
            />
          </label>

          <button type="submit" disabled={guardando} className={styles.button}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </form>

        {guardado && <p className={styles.ok}>✓ Guardado</p>}
      </div>
    </main>
  );
}
