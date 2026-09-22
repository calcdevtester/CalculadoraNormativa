// Iconos SVG minimalistas inline (trazo, sin dependencias externas) para
// que la PWA funcione 100% offline sin cargar fuentes de icono remotas.
// Trazado sobre grilla de 24x24 con proporciones consistentes (estilo
// Lucide/Feather) para un acabado nítido a tamaño pequeño; el tamaño real
// en pantalla lo define `.icon` y sus variantes en css/app.css, no atributos
// fijos aquí, para poder escalar cada contexto (barra, menú, tarjetas de
// módulo) sin perder nitidez.
const icons = {
  bolt: `<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14Z"/>`,
  calculator: `<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>`,
  ruler: `<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>`,
  home: `<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .71-1.53l7-5.99a2 2 0 0 1 2.58 0l7 5.99A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>`,
  menu: `<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>`,
  close: `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
  help: `<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>`,
  info: `<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>`,
  money: `<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01"/><path d="M18 12h.01"/>`,
  externalLink: `<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>`,
  sun: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>`,
  moon: `<path d="M20.99 12.49a9 9 0 1 1-9.47-9.47c.4-.02.62.46.4.8a6 6 0 0 0 8.27 8.27c.34-.21.82 0 .8.4Z"/>`,
  plus: `<path d="M12 5v14"/><path d="M5 12h14"/>`,
  thermometer: `<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>`,
  coin: `<circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M15 9.7c0-1.5-1.34-2.7-3-2.7s-3 1.2-3 2.7c0 3.3 6 1.6 6 4.9 0 1.5-1.34 2.7-3 2.7s-3-1.2-3-2.7"/>`,
  trendingDown: `<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>`,
  gauge: `<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>`,
  // Version "rellena" (estilo PowerApps: Outline vs Filled) de calculator,
  // para probar en las barras de titulo de Conductor economico. A diferencia
  // del resto (trazo, hereda currentColor via stroke), esta define su propio
  // fill por elemento para verse bien sin depender de fill/stroke del <svg>.
  // Las "teclas" usan var(--bg-elevated) -- el mismo color de fondo de la
  // tarjeta -- para simular un recorte que se adapta solo a tema claro/oscuro,
  // en vez de un blanco fijo que no funciona en tema claro.
  calculatorFill: `<rect x="4" y="2" width="16" height="20" rx="3" fill="currentColor" stroke="none"/><rect x="7" y="5" width="10" height="4" rx="1" fill="var(--bg-elevated)" stroke="none"/><circle cx="8.5" cy="13" r="1.3" fill="var(--bg-elevated)" stroke="none"/><circle cx="12" cy="13" r="1.3" fill="var(--bg-elevated)" stroke="none"/><circle cx="15.5" cy="13" r="1.3" fill="var(--bg-elevated)" stroke="none"/><circle cx="8.5" cy="17" r="1.3" fill="var(--bg-elevated)" stroke="none"/><circle cx="12" cy="17" r="1.3" fill="var(--bg-elevated)" stroke="none"/><circle cx="15.5" cy="17" r="1.3" fill="var(--bg-elevated)" stroke="none"/>`,
  // Mismo criterio de calculatorFill (fill por elemento, "teclas"/detalles
  // recortados con var(--bg-elevated)) para el resto de iconos usados en
  // barras de titulo de tarjeta, con la version "rellena" del set.
  boltFill: `<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14Z" fill="currentColor" stroke="none"/>`,
  thermometerFill: `<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" fill="currentColor" stroke="none"/>`,
  coinFill: `<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="M12 7v10" fill="none" stroke="var(--bg-elevated)" stroke-width="1.6" stroke-linecap="round"/><path d="M15 9.7c0-1.5-1.34-2.7-3-2.7s-3 1.2-3 2.7c0 3.3 6 1.6 6 4.9 0 1.5-1.34 2.7-3 2.7s-3-1.2-3-2.7" fill="none" stroke="var(--bg-elevated)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  rulerFill: `<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z" fill="currentColor" stroke="none"/><path d="m14.5 12.5 2-2" fill="none" stroke="var(--bg-elevated)" stroke-width="1.6" stroke-linecap="round"/><path d="m11.5 9.5 2-2" fill="none" stroke="var(--bg-elevated)" stroke-width="1.6" stroke-linecap="round"/><path d="m8.5 6.5 2-2" fill="none" stroke="var(--bg-elevated)" stroke-width="1.6" stroke-linecap="round"/><path d="m17.5 15.5 2-2" fill="none" stroke="var(--bg-elevated)" stroke-width="1.6" stroke-linecap="round"/>`,
};

export function icon(name, cls = "") {
  const inner = icons[name] || icons.help;
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
