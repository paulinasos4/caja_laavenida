"use client";

import { useEffect, useRef, useState } from "react";
import { parseProductosCSV, leerArchivoTexto } from "@/lib/csv";
import { formatearPesos } from "@/lib/format";
import styles from "./page.module.css";

type Producto = {
  id: number;
  nombre: string;
  precio: number | null;
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [nuevo, setNuevo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  async function cargar() {
    setCargando(true);
    setError(false);
    try {
      const r = await fetch("/api/productos");
      const data = await r.json();
      if (Array.isArray(data)) {
        setProductos(data);
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

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    const nombre = nuevo.trim();
    if (!nombre) return;
    setOcupado(true);
    try {
      const res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      });
      if (res.ok) {
        setNuevo("");
        await cargar();
      }
    } finally {
      setOcupado(false);
    }
  }

  async function importarCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Permite volver a elegir el mismo archivo después.
    e.target.value = "";
    if (!file) return;

    setAviso(null);
    setOcupado(true);
    try {
      const texto = await leerArchivoTexto(file);
      const resultado = parseProductosCSV(texto);

      // No se pudo extraer la columna "Producto": avisamos y NO importamos nada.
      if (!resultado.ok) {
        if (resultado.motivo === "vacio") {
          setAviso("El archivo está vacío.");
        } else {
          const cols = resultado.columnas.length
            ? ` Columnas encontradas: ${resultado.columnas.join(", ")}.`
            : "";
          setAviso(`No encontré una columna llamada "Producto" en el CSV.${cols}`);
        }
        return;
      }

      if (resultado.productos.length === 0) {
        setAviso('La columna "Producto" no tiene ningún valor.');
        return;
      }

      const res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productos: resultado.productos }),
      });

      if (res.ok) {
        const data = await res.json();
        setAviso(`✓ Se importaron ${data.insertados} productos.`);
        await cargar();
      } else {
        setAviso("Hubo un error al importar el archivo.");
      }
    } catch {
      setAviso("No se pudo leer el archivo.");
    } finally {
      setOcupado(false);
    }
  }

  const filtrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Productos</h1>
        <span className={styles.count}>{productos.length}</span>
      </header>

      <div className={styles.search}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="search"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <form onSubmit={agregar} className={styles.addRow}>
        <input
          type="text"
          placeholder="Nombre del producto"
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          className={styles.addInput}
          autoComplete="off"
        />
        <button type="submit" className={styles.btn} disabled={ocupado || !nuevo.trim()}>
          + Agregar
        </button>
      </form>

      <div className={styles.csvRow}>
        <button
          type="button"
          className={styles.btnSec}
          onClick={() => fileRef.current?.click()}
          disabled={ocupado}
        >
          ⬆ Importar CSV
        </button>
        <span className={styles.csvHint}>Debe tener una columna "Producto"</span>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={importarCSV}
          hidden
        />
      </div>

      {aviso && (
        <p className={`${styles.aviso} ${aviso.startsWith("✓") ? "" : styles.avisoError}`}>
          {aviso}
        </p>
      )}

      {cargando ? (
        <p className={styles.estado}>Cargando…</p>
      ) : error ? (
        <div>
          <p className={styles.estado}>
            No se pudieron cargar los datos. Revisá la conexión a la base de datos.
          </p>
          <button className={styles.btn} onClick={cargar}>
            Reintentar
          </button>
        </div>
      ) : filtrados.length === 0 ? (
        <p className={styles.estado}>
          {productos.length === 0
            ? "Todavía no hay productos. Agregá uno o importá un CSV."
            : "No hay productos que coincidan con la búsqueda."}
        </p>
      ) : (
        <ul className={styles.lista}>
          {filtrados.map((p) => (
            <li key={p.id} className={styles.item}>
              <span className={styles.itemIcon}>📦</span>
              <span className={styles.itemName}>{p.nombre}</span>
              <span className={styles.itemPrecio}>
                {p.precio !== null ? formatearPesos(p.precio) : "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
