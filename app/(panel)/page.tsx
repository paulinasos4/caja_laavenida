"use client";

import Link from "next/link";
import { useState } from "react";
import { hoyISO, formatearFechaLarga, diaSemana } from "@/lib/format";
import styles from "./page.module.css";

const accesos = [
  {
    href: "/caja",
    label: "Cerrar caja",
    color: "#2d7a3a",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="12" rx="2" />
        <path d="M3 8l2-4h14l2 4M8 13h8" />
      </svg>
    ),
  },
  {
    href: "/facturas",
    label: "Cargar factura",
    color: "#2f6fb0",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h9l3 3v17l-3-2-3 2-3-2-3 2V2z" />
        <path d="M9 8h6M9 12h6" />
      </svg>
    ),
  },
  {
    href: "/facturas",
    label: "Registrar gasto",
    color: "#e07a2f",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" />
      </svg>
    ),
  },
  {
    href: "/productos",
    label: "Ver productos",
    color: "#7a4fb0",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 7v10l9 4 9-4V7" />
        <path d="M12 11v10" />
      </svg>
    ),
  },
];

export default function InicioPage() {
  const [fecha] = useState(hoyISO);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Inicio</h1>
      </header>

      <div className={styles.welcome}>
        <span className={styles.store}>🏪</span>
        <div>
          <p className={styles.welcomeTitle}>¡Bienvenido!</p>
          <p className={styles.welcomeText}>Todo listo para un gran día de trabajo.</p>
        </div>
      </div>

      <div className={styles.dateCard}>
        <span className={styles.dateIcon}>📅</span>
        <div>
          <p className={styles.dateLabel}>Hoy es</p>
          <p className={styles.dateValue}>{formatearFechaLarga(fecha)}</p>
          <p className={styles.dateDay}>{diaSemana(fecha)}</p>
        </div>
      </div>

      <div className={styles.grid}>
        {accesos.map((a) => (
          <Link key={a.label} href={a.href} className={styles.access}>
            <span className={styles.accessIcon} style={{ background: a.color }}>
              {a.icon}
            </span>
            <span className={styles.accessLabel}>{a.label}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
