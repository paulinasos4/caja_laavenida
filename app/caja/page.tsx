"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { hoyISO, formatearFechaLarga, formatearPesos } from "@/lib/format";
import styles from "./page.module.css";

type SalidaForm = { motivo: string; monto: string };

// En la landing la fecha se muestra sin el año, ej. "24 de mayo".
function formatearFecha(fecha: string) {
  return formatearFechaLarga(fecha).replace(/ de \d{4}$/, "");
}

export default function CargarPage() {
  const [fecha] = useState(hoyISO);
  const [efectivo, setEfectivo] = useState("");
  const [debito, setDebito] = useState("");
  const [salidas, setSalidas] = useState<SalidaForm[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // Si ya cargaron algo hoy, lo mostramos para que puedan corregir o agregar
  // sin perder lo anterior. No sobreescribe lo que ya estén tipeando.
  useEffect(() => {
    let vigente = true;

    fetch("/api/cierres")
      .then((r) => r.json())
      .then((data) => {
        if (!vigente || !Array.isArray(data)) return;

        const hoy = data.find((c) => c.fecha === fecha);
        if (!hoy) return;

        setEfectivo((v) => (v === "" ? String(hoy.efectivo) : v));
        setDebito((v) => (v === "" ? String(hoy.debito) : v));
        setSalidas((v) =>
          v.length > 0
            ? v
            : (hoy.salidas ?? []).map((s: { motivo: string; monto: number }) => ({
                motivo: s.motivo,
                monto: String(s.monto),
              }))
        );
      })
      .catch(() => {});

    return () => {
      vigente = false;
    };
  }, [fecha]);

  function agregarSalida() {
    setGuardado(false);
    setSalidas((s) => [...s, { motivo: "", monto: "" }]);
  }

  function quitarSalida(indice: number) {
    setGuardado(false);
    setSalidas((s) => s.filter((_, i) => i !== indice));
  }

  function editarSalida(indice: number, campo: keyof SalidaForm, valor: string) {
    setGuardado(false);
    setSalidas((s) =>
      s.map((salida, i) => (i === indice ? { ...salida, [campo]: valor } : salida))
    );
  }

  const totalSalidas = salidas.reduce((acc, s) => acc + (Number(s.monto) || 0), 0);

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
          salidas: salidas
            .map((s) => ({ motivo: s.motivo, monto: Number(s.monto) || 0 }))
            .filter((s) => s.monto > 0),
        }),
      });

      if (res.ok) {
        setGuardado(true);
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
                onChange={(e) => {
                  setGuardado(false);
                  setEfectivo(e.target.value);
                }}
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
                onChange={(e) => {
                  setGuardado(false);
                  setDebito(e.target.value);
                }}
                className={styles.input}
                autoComplete="off"
              />
            </label>

            <div className={styles.salidas}>
              <p className={styles.salidasTitulo}>Salidas</p>
              <p className={styles.salidasAyuda}>
                Plata que salió de la caja (empleados, proveedores, etc.)
              </p>

              {salidas.map((salida, i) => (
                <div key={i} className={styles.salidaFila}>
                  <input
                    type="text"
                    placeholder="¿Qué se pagó?"
                    value={salida.motivo}
                    onChange={(e) => editarSalida(i, "motivo", e.target.value)}
                    className={styles.salidaMotivo}
                    autoComplete="off"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={salida.monto}
                    onChange={(e) => editarSalida(i, "monto", e.target.value)}
                    className={styles.salidaMonto}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => quitarSalida(i)}
                    className={styles.salidaQuitar}
                    aria-label="Quitar salida"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button type="button" onClick={agregarSalida} className={styles.agregar}>
                + Agregar salida
              </button>

              {totalSalidas > 0 && (
                <p className={styles.salidasTotal}>
                  Total salidas: {formatearPesos(totalSalidas)}
                </p>
              )}
            </div>

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
