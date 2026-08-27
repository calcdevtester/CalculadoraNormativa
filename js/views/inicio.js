import { icon } from "../icons.js";

const MODULOS = [
  {
    title: "Pérdidas",
    desc: "Pérdidas de potencia en líneas trifásicas por efecto Joule.",
    iconName: "money",
    hash: "#/perdidas",
  },
  {
    title: "Regulación",
    desc: "Cálculo de regulación de tensión en alimentadores.",
    iconName: "calculator",
    hash: "#/regulacion",
  },
  {
    title: "Cortocircuito",
    desc: "Capacidad de cortocircuito en conductores.",
    iconName: "bolt",
    hash: "#/cortocircuito",
  },
];

export async function render(container) {
  container.innerHTML = `
    <div class="view-inicio">
      <h1 class="page-title">Calculadora normativa</h1>
      <p class="page-subtitle">Herramienta de cálculo y verificación conforme a la Norma Técnica de Celsia. Versión 2026.08</p>

      <h2 class="section-title">Módulos</h2>
      <div class="menu-grid">
        ${MODULOS.map(
          (m) => `
          <a class="menu-tile" href="${m.hash}">
            <div class="tile-icon">${icon(m.iconName)}</div>
            <div class="tile-title">${m.title}</div>
            <div class="tile-desc">${m.desc}</div>
          </a>`
        ).join("")}
      </div>

      <p class="text-muted text-sm view-inicio-footer">
        Los resultados de esta herramienta son un apoyo técnico, no sustituyen el desarrollo de un cálculo detallado.
      </p>
    </div>
  `;
}
