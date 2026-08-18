"use client";

import Link from "next/link";
import { useState } from "react";
import { hoyISO, formatearFechaLarga } from "@/lib/format";
import styles from "./page.module.css";

// En la landing la fecha se muestra sin el año, ej. "24 de mayo".
function formatearFecha(fecha: string) {
  return formatearFechaLarga(fecha).replace(/ de \d{4}$/, "");
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
      <div className={styles.contenido}>
        <h1 className={styles.titulo}>La Avenida</h1>

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

        <Link href="/" className={styles.panelLink}>
          ← Volver al panel
        </Link>
        </div>
      </div>
    </main>
  );
}
