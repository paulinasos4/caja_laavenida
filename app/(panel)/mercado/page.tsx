"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatearPesos,
  formatearFechaCorta,
  hoyISO,
  diaSemana,
  mesLabel,
} from "@/lib/format";
import { comprimirImagen } from "@/lib/imagen";
import styles from "./page.module.css";

type GastoMercado = {
  id: number;
  fecha: string;
  monto: number;
  tieneFoto: boolean;
};

export default function MercadoPage() {
  const [gastos, setGastos] = useState<GastoMercado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [form, setForm] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const [fecha, setFecha] = useState(hoyISO);
  const [monto, setMonto] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [procesandoFoto, setProcesandoFoto] = useState(false);

  // Foto que se está mirando en grande (id de la compra).
  const [fotoAbierta, setFotoAbierta] = useState<number | null>(null);

  const camaraRef = useRef<HTMLInputElement>(null);
  const archivoRef = useRef<HTMLInputElement>(null);

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

  async function elegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Permite volver a elegir el mismo archivo después.
    e.target.value = "";
    if (!file) return;

    setAviso(null);

    if (!file.type.startsWith("image/")) {
      setAviso("Ese archivo no es una imagen. Elegí una foto o captura de pantalla.");
      return;
    }

    setProcesandoFoto(true);
    try {
      setFoto(await comprimirImagen(file));
    } catch {
      setAviso("No se pudo procesar la foto. Probá de nuevo.");
    } finally {
      setProcesandoFoto(false);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!(Number(monto) > 0)) return;

    setOcupado(true);
    setAviso(null);
    try {
      const res = await fetch("/api/mercado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, monto: Number(monto), foto }),
      });

      if (res.ok) {
        setMonto("");
        setFoto(null);
        setFecha(hoyISO());
        setForm(false);
        await cargar();
      } else if (res.status === 413) {
        setAviso("La foto es muy grande. Probá sacarla de nuevo.");
      } else {
        setAviso("No se pudo guardar la compra.");
      }
    } catch {
      setAviso("No se pudo guardar la compra.");
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

          <div className={styles.fotoCampo}>
            <span className={styles.fotoLabel}>
              Foto del comprobante <span className={styles.opcional}>(opcional)</span>
            </span>
            <span className={styles.fotoAyuda}>
              Sirve la que te mandaron por WhatsApp: elegila de la galería.
            </span>

            {foto ? (
              <div className={styles.fotoPreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto} alt="Foto del comprobante" className={styles.fotoMini} />
                <button
                  type="button"
                  onClick={() => setFoto(null)}
                  className={styles.quitarFoto}
                >
                  Quitar foto
                </button>
              </div>
            ) : (
              <div className={styles.fotoBotones}>
                <button
                  type="button"
                  className={styles.fotoBtn}
                  onClick={() => archivoRef.current?.click()}
                  disabled={procesandoFoto}
                >
                  🖼 Elegir foto
                </button>
                <button
                  type="button"
                  className={styles.fotoBtnSec}
                  onClick={() => camaraRef.current?.click()}
                  disabled={procesandoFoto}
                >
                  📷 Sacar foto
                </button>
              </div>
            )}

            {procesandoFoto && <p className={styles.fotoEstado}>Preparando la foto…</p>}

            {/* Sin "capture": en el celular deja elegir de la galería o sacarla. */}
            <input
              ref={archivoRef}
              type="file"
              accept="image/*"
              onChange={elegirFoto}
              hidden
            />
            {/* Atajo para ir directo a la cámara. */}
            <input
              ref={camaraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={elegirFoto}
              hidden
            />
          </div>

          <button
            type="submit"
            className={styles.guardar}
            disabled={ocupado || procesandoFoto || !(Number(monto) > 0)}
          >
            {ocupado ? "Guardando…" : "Guardar"}
          </button>
        </form>
      )}

      {aviso && <p className={styles.aviso}>{aviso}</p>}

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
                <th>Monto</th>
                <th>Foto</th>
                <th></th>
              </tr>
            </thead>
            {meses.map((mes) => {
              const lista = porMes.get(mes) ?? [];
              return (
                <tbody key={mes}>
                  <tr className={styles.grupo}>
                    <td colSpan={4}>
                      {mesLabel(mes + "-01")} · {formatearPesos(total(lista))}
                    </td>
                  </tr>
                  {lista.map((g) => (
                    <tr key={g.id}>
                      <td>
                        {formatearFechaCorta(g.fecha)}
                        <span className={styles.dia}>{diaSemana(g.fecha)}</span>
                      </td>
                      <td className={styles.monto}>{formatearPesos(g.monto)}</td>
                      <td>
                        {g.tieneFoto ? (
                          <button
                            className={styles.verFoto}
                            onClick={() => setFotoAbierta(g.id)}
                          >
                            📷 Ver
                          </button>
                        ) : (
                          <span className={styles.sinFoto}>—</span>
                        )}
                      </td>
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

      {fotoAbierta !== null && (
        <div className={styles.modal} onClick={() => setFotoAbierta(null)}>
          <div className={styles.modalCaja} onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/mercado/foto?id=${fotoAbierta}`}
              alt="Foto del remito"
              className={styles.modalImg}
            />
            <button className={styles.modalCerrar} onClick={() => setFotoAbierta(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
