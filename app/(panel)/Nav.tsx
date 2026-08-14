"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Nav.module.css";

type Item = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const items: Item[] = [
  {
    href: "/",
    label: "Inicio",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5 12 3l9 6.5" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    href: "/facturas",
    label: "Facturas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h9l3 3v17l-3-2-3 2-3-2-3 2V2z" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </svg>
    ),
  },
  {
    href: "/productos",
    label: "Productos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 7v10l9 4 9-4V7" />
        <path d="M12 11v10" />
      </svg>
    ),
  },
];

export default function Nav() {
  const pathname = usePathname();

  function activo(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>🛒</span>
        <span className={styles.brandName}>Control Super</span>
      </div>

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`${styles.link} ${activo(item.href) ? styles.active : ""}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
