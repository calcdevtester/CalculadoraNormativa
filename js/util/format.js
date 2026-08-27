// Utilidades de formato equivalentes a Text(valor, "#.00", "en-US") de Power Fx,
// y helpers pequeños de DOM/datos usados por todas las vistas.

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function fmt(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) return "—";
  return value.toFixed(decimals);
}

// Los "%" en los textos originales de Power Fx son literales (el valor ya
// viene pre-escalado 0-100 desde la formula), no un especificador Excel
// que multiplique de nuevo por 100 - se replica ese mismo comportamiento aqui.
export function fmtPercent(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) return "—";
  return `${value.toFixed(decimals)}%`;
}

const dataCache = new Map();
export async function loadData(name) {
  if (dataCache.has(name)) return dataCache.get(name);
  const base = window.__BASE_PATH__ || "";
  const res = await fetch(`${base}data/${name}.json`);
  if (!res.ok) throw new Error(`No se pudo cargar data/${name}.json`);
  const json = await res.json();
  dataCache.set(name, json);
  return json;
}

export function distinct(rows, key) {
  return [...new Set(rows.map((r) => r[key]).filter((v) => v !== null && v !== undefined && v !== ""))].sort(
    (a, b) => String(a).localeCompare(String(b), "es", { numeric: true })
  );
}
