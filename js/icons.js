// Iconos SVG minimalistas inline (trazo, sin dependencias externas) para
// que la PWA funcione 100% offline sin cargar fuentes de icono remotas.
const paths = {
  bolt: "M13 2 4 14h6l-1 8 9-12h-6l1-8Z",
  calculator: "M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm2 3v4h10V6H7Zm0 6.5v2h2v-2H7Zm4 0v2h2v-2h-2Zm4 0v2h2v-2h-2ZM7 16v2h2v-2H7Zm4 0v2h2v-2h-2Zm4 0v5h2v-5h-2Z",
  ruler: "m3 16 5-5 3 3 8-8m0 0h-4m4 0v4M4 20h16",
  home: "m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M18 6 6 18",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-6.2v-.3c0-1 .6-1.6 1.4-2.2.9-.7 1.5-1.3 1.5-2.4 0-1.5-1.2-2.4-2.8-2.4-1.4 0-2.5.7-2.9 2m2.8 7.7h.01",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-13v5m0 4h.01",
  money: "M4 6h16v12H4V6Zm8 2.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM6 6a2 2 0 0 1-2 2M18 6a2 2 0 0 0 2 2M6 18a2 2 0 0 0-2-2m16 2a2 2 0 0 1-2-2",
  externalLink: "M14 4h6v6m0-6L10 14M6 6H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1",
  sun: "M12 2v2.5m0 15V22m10-10h-2.5M4.5 12H2m15.36-6.36-1.77 1.77M8.41 15.59l-1.77 1.77m11.72 0-1.77-1.77M8.41 8.41 6.64 6.64M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z",
  moon: "M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z",
};

export function icon(name, cls = "") {
  const d = paths[name] || paths.help;
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
}
