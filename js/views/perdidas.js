// Calculadora de perdidas de potencia por efecto Joule en una linea trifasica.

import { fmt, fmtPercent, loadData, distinct, escapeHtml } from "../util/format.js";
import { calcularPerdidas } from "../calc/perdidas.js";
import { icon } from "../icons.js";
import { renderCriterios } from "../util/criterios-render.js";
import { perdidas as CRITERIOS_PERDIDAS } from "../data/criterios.js";
import { estadoGauge, buildGaugeSvg } from "../util/gauge.js";

const FORMULAS_HTML = `
Corriente: I = P / (V·cos φ·√3)         [A]
Potencia aparente: S = P / cos φ        [kVA]
Potencia reactiva: Q = √(S² − P²)       [kVAR]

Factor de pérdidas: Fp = 0.7·Fc + 0.3 (forma lineal)
Porcentaje de Pérdidas = (√3·R·L·I·Fp) / (10·V·cos φ)     [%]

Nota: se usa la forma lineal del factor de pérdidas (0.7·Fc + 0.3), no la forma cuadrática clásica de Buller-Woodrow (0.7·Fc² + 0.3·Fc) que aparece documentada en el panel de "Criterios de cálculo".`;

// Velocímetro de % de pérdidas: 0-1% óptimo, 1-3% aceptable, 3%+ fuera de norma.
// GAUGE_MAX define el 100% de la escala visual; valores por encima se recortan
// en la aguja pero el numero mostrado siempre es el real.
const GAUGE_MAX = 5;
const GAUGE_BREAKPOINTS = [1, 3];

export async function render(container) {
  const aereos = await loadData("conductores-aereos");
  const subterraneos = await loadData("conductores-subterraneos");

  container.innerHTML = `
    <div class="breadcrumb"><a href="#/">Inicio</a> <span>/</span> <span>Pérdidas</span></div>
    <h1 class="page-title">Cálculo de pérdidas</h1>
    <p class="page-subtitle">Corriente, potencia y porcentaje de pérdidas de una línea trifásica, ajustado por factor de carga.</p>

    <form id="form-calc" novalidate>
      <div class="form-section card">
        <div class="form-section-title">${icon("bolt")} Datos de la línea</div>
        <div class="grid-2">
          <div class="field">
            <label for="f-tension">Nivel de tensión (kV)</label>
            <input type="number" id="f-tension" min="0" max="1000" step="0.1" value="34.5" required>
          </div>
          <div class="field">
            <label for="f-potencia">Potencia activa (kW)</label>
            <input type="number" id="f-potencia" min="0" max="500000" step="1" value="10000" required>
            <span class="hint">Si solo conoce la potencia aparente, ingrésela aquí y utilice FP = 1.</span>
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="f-fp">Factor de potencia (FP)</label>
            <input type="number" id="f-fp" min="-1" max="1" step="0.05" value="0.95" required>
          </div>
          <div class="field">
            <label for="f-fc">Factor de carga (FC)</label>
            <input type="number" id="f-fc" min="0" max="1" step="0.01" value="1" required>
            <span class="hint">Circuitos de uso FC=1, conexiones solares FC=0.564</span>
          </div>
        </div>

        <div class="field">
          <label for="f-longitud">Longitud de la línea (km)</label>
          <input type="number" id="f-longitud" min="0" max="500" step="0.1" value="5" required>
        </div>
      </div>

      <div class="form-section card">
        <div class="form-section-title">${icon("calculator")} Conductor</div>
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
      </div>

      <div class="btn-row">
        <button type="submit" class="btn btn-primary">${icon("calculator")} Calcular</button>
        <button type="button" class="btn" id="btn-criterios">${icon("info")} Criterios de cálculo</button>
      </div>
    </form>

    <div id="resultado-wrap"></div>

    <div class="card" id="panel-criterios" hidden style="margin-top: var(--space-4);">
      <div class="criterios-content">${renderCriterios(CRITERIOS_PERDIDAS)}</div>
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
  const fFc = container.querySelector("#f-fc");
  const fLongitud = container.querySelector("#f-longitud");
  const selRed = container.querySelector("#f-red");
  const selMaterial = container.querySelector("#f-material");
  const selCalibre = container.querySelector("#f-calibre");
  const fResistencia = container.querySelector("#f-resistencia");
  const chkResistencia = container.querySelector("#chk-resistencia");

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

  poblarMaterial();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const p = {
      tensionKv: parseFloat(fTension.value),
      potenciaKw: parseFloat(fPotencia.value),
      factorPotencia: parseFloat(fFp.value),
      resistenciaOhmKm: parseFloat(fResistencia.value),
      longitudKm: parseFloat(fLongitud.value),
      factorCarga: parseFloat(fFc.value),
    };

    const data = calcularPerdidas(p);
    renderResultado(data, p, { red: selRed.value, material: selMaterial.value, calibre: selCalibre.value });
  });

  function renderResultado(data, p, ctx) {
    const wrap = container.querySelector("#resultado-wrap");

    const reporte = [
      `CALCULADORA NORMATIVA 2026`,
      `Celsia Colombia S.A. E.S.P.`,
      `Cálculo de pérdidas`,
      ``,
      `------------------------`,
      `PARÁMETROS DE ENTRADA:`,
      `Nivel de tensión de la línea: ${fmt(p.tensionKv)} kV`,
      `Longitud de la línea: ${fmt(p.longitudKm)} km`,
      `Potencia activa: ${fmt(p.potenciaKw, 0)} kW`,
      `Factor de potencia: ${fmt(p.factorPotencia)}`,
      `Factor de carga: ${fmt(p.factorCarga)}`,
      `Tipo de red: ${ctx.red === "Aerea" ? "Aérea" : "Subterránea"}`,
      `Material del conductor: ${ctx.material}`,
      `Calibre del conductor: ${ctx.calibre} (AWG/kcmil)`,
      `Resistencia del conductor a 75°C: ${fmt(p.resistenciaOhmKm)} Ω/km`,
      ``,
      `-------------------`,
      `RESULTADOS:`,
      `Potencia aparente: ${fmt(data.potenciaS)} kVA`,
      `Potencia reactiva: ${fmt(data.potenciaQ)} kVAR`,
      `Corriente: ${fmt(data.corriente)} A`,
      `Porcentaje de pérdidas: ${fmt(data.perdidasPct)} %`,
    ].join("\n");

    const estado = estadoGauge(data.perdidasPct, GAUGE_BREAKPOINTS);
    const maxPotencia = Math.max(p.potenciaKw, data.potenciaS, data.potenciaQ) || 1;
    const wActiva = (p.potenciaKw / maxPotencia) * 100;
    const wAparente = (data.potenciaS / maxPotencia) * 100;
    const wReactiva = (data.potenciaQ / maxPotencia) * 100;

    wrap.innerHTML = `
      <div class="card">
        <div class="tabs">
          <button type="button" class="tab-btn active" data-tab="resultado">Resultado</button>
          <button type="button" class="tab-btn" data-tab="reporte">Reporte</button>
          <button type="button" class="tab-btn" data-tab="formulas">Fórmulas</button>
        </div>
        <div class="tab-panel" data-panel="resultado">
          <div class="result-report">
            <div class="result-compare">
              <div class="result-compare-row">
                <span class="result-compare-label">Activa</span>
                <div class="result-compare-track"><div class="result-compare-fill activa" style="width:${wActiva}%"></div></div>
                <span class="result-compare-value">${fmt(p.potenciaKw, 0)} kW</span>
              </div>
              <div class="result-compare-row">
                <span class="result-compare-label">Aparente</span>
                <div class="result-compare-track"><div class="result-compare-fill aparente" style="width:${wAparente}%"></div></div>
                <span class="result-compare-value">${fmt(data.potenciaS)} kVA</span>
              </div>
              <div class="result-compare-row">
                <span class="result-compare-label">Reactiva</span>
                <div class="result-compare-track"><div class="result-compare-fill reactiva" style="width:${wReactiva}%"></div></div>
                <span class="result-compare-value">${fmt(data.potenciaQ)} kVAR</span>
              </div>
            </div>
            <div class="result-gauge-row">
              <div class="result-gauge">
                ${buildGaugeSvg(data.perdidasPct, { max: GAUGE_MAX, breakpoints: GAUGE_BREAKPOINTS })}
                <div class="result-gauge-value">${fmtPercent(data.perdidasPct)}</div>
              </div>
              <div class="result-gauge-info">
                <div class="result-gauge-title">Porcentaje de pérdidas <span class="badge ${estado.cls}">${estado.label}</span></div>
                <div class="result-gauge-desc">Óptimo hasta 1% · Aceptable hasta 3% · Fuera de norma sobre 3%</div>
                <div class="result-gauge-current">${fmt(data.corriente)}<span class="unit">A · Corriente</span></div>
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
