// Calculadora de caida de tension (regulacion) en una linea trifasica.

import { fmt, fmtPercent, loadData, distinct, escapeHtml } from "../util/format.js";
import { calcularRegulacion } from "../calc/regulacion.js";
import { icon } from "../icons.js";
import { renderCriterios } from "../util/criterios-render.js";
import { regulacion as CRITERIOS_REGULACION } from "../data/criterios.js";

const FORMULAS_HTML = `
Corriente: I = P / (V·cos φ·√3)         [A]
Potencia aparente: S = P / cos φ        [kVA]
Potencia reactiva: Q = √(S² − P²)       [kVAR]
Radio medio geométrico: RMG             [m]

Reactancia inductiva: Xl = 0.0754·ln( ∛(Dab·Dac·Dbc) / RMG )     [Ω/km]
Factor de regulación: Fr = R + Xl·tan φ
Constante de regulación: K  = Fr / (10·V²)

% Caída de tensión = (P·L·Fr) / (10·V²)
`;

export async function render(container) {
  const aereos = await loadData("conductores-aereos");
  const subterraneos = await loadData("conductores-subterraneos");

  container.innerHTML = `
    <div class="breadcrumb"><a href="#/">Inicio</a> <span>/</span> <span>Regulación</span></div>
    <div class="hero-banner">
      <h1 class="page-title">Cálculo de regulación</h1>
      <p class="page-subtitle">Caída de tensión y reactancia inductiva de un conductor en una línea trifásica de distribución.</p>
    </div>

    <form class="card" id="form-calc" novalidate>
      <div class="grid-2">
        <div class="field">
          <label for="f-tension">Nivel de tensión (kV)</label>
          <input type="number" id="f-tension" min="0" max="1000" step="0.1" value="34.5" required>
        </div>
        <div class="field">
          <label for="f-potencia">Potencia activa (kW)</label>
          <input type="number" id="f-potencia" min="0" max="500000" step="1000" value="10000" required>
          <span class="hint">Si solo conoce la potencia aparente, ingrésela aquí y utilice FP = 1.</span>
        </div>
      </div>

      <div class="field">
        <label for="f-fp">Factor de potencia (FP)</label>
        <input type="number" id="f-fp" min="-1" max="1" step="0.05" value="0.95" required>
      </div>

      <div class="field">
        <label for="f-longitud">Longitud de la línea (km)</label>
        <input type="number" id="f-longitud" min="0" max="500" step="0.1" value="5" required>
      </div>

      <div class="grid-2">
        <div class="field">
          <label for="f-red">Tipo de red</label>
          <select id="f-red" required>
            <option value="Aerea">Aérea</option>
            <option value="Subterranea">Subterránea</option>
          </select>
        </div>
        <div class="field">
          <label for="f-material">Material del conductor</label>
          <select id="f-material" required></select>
        </div>
      </div>

      <div class="field">
        <label for="f-calibre">Calibre del conductor</label>
        <select id="f-calibre" required disabled>
          <option value="">Seleccione un material primero</option>
        </select>
      </div>

      <div class="field">
        <label for="f-resistencia">R Conductor a 75° (Ω/km)</label>
        <div class="input-with-toggle">
          <input type="number" id="f-resistencia" min="0" max="1000" step="0.001" required disabled>
          <label class="checkbox-row"><input type="checkbox" id="chk-resistencia"> Manual</label>
        </div>
      </div>

      <div class="field">
        <label for="f-rmg">Radio medio geométrico (mm)</label>
        <div class="input-with-toggle">
          <input type="number" id="f-rmg" min="0" max="1000" step="0.01" required disabled>
          <label class="checkbox-row"><input type="checkbox" id="chk-rmg"> Manual</label>
        </div>
      </div>

      <div class="grid-3">
        <div class="field">
          <label for="f-dab">Distancia entre fases A-B (m)</label>
          <input type="number" id="f-dab" min="0" max="100" step="0.1" value="1.6" required>
        </div>
        <div class="field">
          <label for="f-dac">Distancia entre fases A-C (m)</label>
          <input type="number" id="f-dac" min="0" max="100" step="0.1" value="2.7" required>
        </div>
        <div class="field">
          <label for="f-dbc">Distancia entre fases B-C (m)</label>
          <input type="number" id="f-dbc" min="0" max="100" step="0.1" value="1.1" required>
        </div>
      </div>

      <div class="btn-row">
        <button type="submit" class="btn btn-primary">${icon("calculator")} Calcular</button>
        <button type="button" class="btn" id="btn-criterios">${icon("info")} Criterios de cálculo</button>
      </div>
    </form>

    <div id="resultado-wrap"></div>

    <div class="card" id="panel-criterios" hidden style="margin-top: var(--space-4);">
      <div class="criterios-content">${renderCriterios(CRITERIOS_REGULACION)}</div>
    </div>
  `;

  const btnCriterios = container.querySelector("#btn-criterios");
  const panelCriterios = container.querySelector("#panel-criterios");
  btnCriterios.addEventListener("click", () => {
    panelCriterios.hidden = !panelCriterios.hidden;
    if (!panelCriterios.hidden) {
      panelCriterios.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  const form = container.querySelector("#form-calc");
  const fTension = container.querySelector("#f-tension");
  const fPotencia = container.querySelector("#f-potencia");
  const fFp = container.querySelector("#f-fp");
  const fLongitud = container.querySelector("#f-longitud");
  const selRed = container.querySelector("#f-red");
  const selMaterial = container.querySelector("#f-material");
  const selCalibre = container.querySelector("#f-calibre");
  const fResistencia = container.querySelector("#f-resistencia");
  const fRmg = container.querySelector("#f-rmg");
  const chkResistencia = container.querySelector("#chk-resistencia");
  const chkRmg = container.querySelector("#chk-rmg");
  const fDab = container.querySelector("#f-dab");
  const fDac = container.querySelector("#f-dac");
  const fDbc = container.querySelector("#f-dbc");

  let filaSeleccionada = null;

  function datasetActivo() {
    return selRed.value === "Aerea" ? aereos : subterraneos;
  }
  function campoMaterial() {
    return selRed.value === "Aerea" ? "tipo" : "material_conductor";
  }

  function poblarMaterial() {
    const opciones = distinct(datasetActivo(), campoMaterial());
    selMaterial.innerHTML = opciones.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("");
    poblarCalibre();
  }

  function poblarCalibre() {
    const campo = campoMaterial();
    const material = selMaterial.value;
    const calibres = distinct(
      datasetActivo().filter((c) => c[campo] === material),
      "calibre_awg_kcmil"
    );
    selCalibre.innerHTML = calibres.length
      ? `<option value="">Seleccione…</option>` + calibres.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")
      : `<option value="">Sin calibres disponibles</option>`;
    selCalibre.disabled = !calibres.length;
    filaSeleccionada = null;
    syncDefaults();
  }

  function resolverFila() {
    const campo = campoMaterial();
    const material = selMaterial.value;
    const calibre = selCalibre.value;
    if (!calibre) return null;
    return datasetActivo().find((c) => c[campo] === material && c.calibre_awg_kcmil === calibre) || null;
  }

  function syncDefaults() {
    if (!chkResistencia.checked) fResistencia.value = filaSeleccionada ? filaSeleccionada.r_ac_75c_ohm_km : "";
    if (!chkRmg.checked) fRmg.value = filaSeleccionada ? filaSeleccionada.radio_medio_geometrico_mm : "";
  }

  selRed.addEventListener("change", poblarMaterial);
  selMaterial.addEventListener("change", poblarCalibre);
  selCalibre.addEventListener("change", () => {
    filaSeleccionada = resolverFila();
    syncDefaults();
  });
  chkResistencia.addEventListener("change", () => {
    fResistencia.disabled = !chkResistencia.checked;
    if (!chkResistencia.checked) syncDefaults();
  });
  chkRmg.addEventListener("change", () => {
    fRmg.disabled = !chkRmg.checked;
    if (!chkRmg.checked) syncDefaults();
  });

  poblarMaterial();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const p = {
      tensionKv: parseFloat(fTension.value),
      potenciaKw: parseFloat(fPotencia.value),
      factorPotencia: parseFloat(fFp.value),
      longitudKm: parseFloat(fLongitud.value),
      resistenciaOhmKm: parseFloat(fResistencia.value),
      rmgMm: parseFloat(fRmg.value),
      dabM: parseFloat(fDab.value),
      dacM: parseFloat(fDac.value),
      dbcM: parseFloat(fDbc.value),
    };

    const data = calcularRegulacion(p);
    renderResultado(data, p, { red: selRed.value, material: selMaterial.value, calibre: selCalibre.value });
  });

  function renderResultado(data, p, ctx) {
    const wrap = container.querySelector("#resultado-wrap");

    const reporte = [
      `CALCULADORA NORMATIVA 2026`,
      `Celsia Colombia S.A. E.S.P.`,
      `Cálculo de regulación`,
      ``,
      `------------------------`,
      `PARÁMETROS DE ENTRADA:`,
      `Nivel de tensión de la línea: ${fmt(p.tensionKv)} kV`,
      `Potencia activa: ${fmt(p.potenciaKw, 0)} kW`,
      `Factor de potencia: ${fmt(p.factorPotencia)}`,
      `Longitud de la línea: ${fmt(p.longitudKm)} km`,
      `Tipo de red: ${ctx.red === "Aerea" ? "Aérea" : "Subterránea"}`,
      `Material del conductor: ${ctx.material}`,
      `Calibre del conductor: ${ctx.calibre} (AWG/kcmil)`,
      `Resistencia del conductor a 75°C: ${fmt(p.resistenciaOhmKm)} Ω/km`,
      `Radio medio geométrico del conductor: ${fmt(p.rmgMm)} mm`,
      `Distancia entre fases: AB: ${fmt(p.dabM)} m  AC: ${fmt(p.dacM)} m  BC: ${fmt(p.dbcM)} m`,
      ``,
      `-------------------`,
      `RESULTADOS:`,
      `Corriente: ${fmt(data.corriente)} A`,
      `Potencia aparente: ${fmt(data.potenciaS)} kVA`,
      `Potencia reactiva: ${fmt(data.potenciaQ)} kVAR`,
      `Constante de regulación: ${fmt(data.intermedios.constanteRegulacion, 7)}`,
      `Caída de tensión: ${fmt(data.caidaTensionPct)} %`,
    ].join("\n");

    wrap.innerHTML = `
      <div class="card">
        <div class="tabs">
          <button type="button" class="tab-btn active" data-tab="resultado">Resultado</button>
          <button type="button" class="tab-btn" data-tab="reporte">Reporte</button>
          <button type="button" class="tab-btn" data-tab="formulas">Fórmulas</button>
        </div>
        <div class="tab-panel" data-panel="resultado">
          <div class="result-panel">
            <div class="grid-2">
              <div class="result-metric">
                <div class="value">${fmt(data.corriente)}<span class="unit">A</span></div>
                <div class="label">Corriente</div>
              </div>
              <div class="result-metric">
                <div class="value">${fmtPercent(data.caidaTensionPct)}</div>
                <div class="label">Caída de tensión</div>
              </div>
              <div class="result-metric">
                <div class="value">${fmt(data.potenciaS)}<span class="unit">kVA</span></div>
                <div class="label">Potencia aparente</div>
              </div>
              <div class="result-metric">
                <div class="value">${fmt(data.potenciaQ)}<span class="unit">kVAR</span></div>
                <div class="label">Potencia reactiva</div>
              </div>
              <div class="result-metric">
                <div class="value">${fmt(data.intermedios.constanteRegulacion, 7)}</div>
                <div class="label">Constante de regulación</div>
              </div>
            </div>
          </div>
        </div>
        <div class="tab-panel" data-panel="reporte" hidden>
          <div class="report-block">${escapeHtml(reporte)}</div>
        </div>
        <div class="tab-panel" data-panel="formulas" hidden>
          <div class="formula-block">${escapeHtml(FORMULAS_HTML)}</div>
        </div>
      </div>
    `;

    wrap.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        wrap.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b === btn));
        wrap.querySelectorAll(".tab-panel").forEach((panel) => {
          panel.hidden = panel.dataset.panel !== btn.dataset.tab;
        });
      });
    });

    wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}
