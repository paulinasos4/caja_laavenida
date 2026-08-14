import { getSupabase } from "./supabase";

export type Cierre = {
  fecha: string;
  efectivo: number;
  debito: number;
};

export async function getCierres(): Promise<Cierre[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("cierres")
    .select("fecha, efectivo, debito")
    .order("fecha", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((c) => ({
    fecha: c.fecha,
    efectivo: Number(c.efectivo),
    debito: Number(c.debito),
  }));
}

export async function saveCierre(cierre: Cierre): Promise<Cierre> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("cierres")
    .upsert(
      {
        fecha: cierre.fecha,
        efectivo: cierre.efectivo,
        debito: cierre.debito,
      },
      { onConflict: "fecha" }
    )
    .select("fecha, efectivo, debito")
    .single();

  if (error) throw error;

  return {
    fecha: data.fecha,
    efectivo: Number(data.efectivo),
    debito: Number(data.debito),
  };
}
