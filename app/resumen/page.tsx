"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Cierre = {
  fecha: string;
  efectivo: number;
  debito: number;
};

function formatearFecha(fecha: string) {
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

function formatearPesos(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function mesLabel(fecha: string) {
  const [y, m] = fecha.split("-");
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${meses[Number(m) - 1]} ${y}`;
}

export default function ResumenPage() {
  const [cierres, setCierres] = useState<Cierre[]>([]);

  useEffect(() => {
    fetch("/api/cierres")
      .then((r) => r.json())
      .then(setCierres);
  }, []);

  const porMes = cierres.reduce<Record<string, { efectivo: number; debito: number; dias: number }>>(
    (acc, c) => {
      const mes = c.fecha.slice(0, 7);
      if (!acc[mes]) acc[mes] = { efectivo: 0, debito: 0, dias: 0 };
      acc[mes].efectivo += c.efectivo;
      acc[mes].debito += c.debito;
      acc[mes].dias += 1;
      return acc;
    },
    {}
  );

  const mesesOrdenados = Object.keys(porMes).sort((a, b) => b.localeCompare(a));

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Resumen</h1>

      <section className={styles.section}>
        <h2>Por mes</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mes</th>
                <th>Efectivo</th>
                <th>Débito</th>
                <th>Total</th>
                <th>Días</th>
              </tr>
            </thead>
            <tbody>
              {mesesOrdenados.map((mes) => {
                const d = porMes[mes];
                const total = d.efectivo + d.debito;
                return (
                  <tr key={mes}>
                    <td>{mesLabel(mes + "-01")}</td>
                    <td>{formatearPesos(d.efectivo)}</td>
                    <td>{formatearPesos(d.debito)}</td>
                    <td className={styles.total}>{formatearPesos(total)}</td>
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
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {cierres.map((c) => (
                <tr key={c.fecha}>
                  <td>{formatearFecha(c.fecha)}</td>
                  <td>{formatearPesos(c.efectivo)}</td>
                  <td>{formatearPesos(c.debito)}</td>
                  <td className={styles.total}>{formatearPesos(c.efectivo + c.debito)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
