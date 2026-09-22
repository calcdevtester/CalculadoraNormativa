// Calculadora de capacidad de corriente de cortocircuito admisible.

import { fmt, loadData, distinct, escapeHtml } from "../util/format.js";
import { calcularCortocircuito } from "../calc/cortocircuito.js";
import { icon } from "../icons.js";
import { renderCriterios } from "../util/criterios-render.js";
import { cortocircuito as CRITERIOS_CORTOCIRCUITO } from "../data/criterios.js";

export async function render(container) {
  const aereos = await loadData("conductores-aereos");
  const subterraneos = await loadData("conductores-subterraneos");

  container.innerHTML = `
    <div class="breadcrumb"><a href="#/">Inicio</a> <span>/</span> <span>Cortocircuito</span></div>
    <h1 class="page-title">Cálculo de capacidad de cortocircuito</h1>
    <p class="page-subtitle">Corriente de cortocircuito admisible de un conductor según el límite térmico durante el tiempo de despeje de la falla.</p>

    <form id="form-calc" novalidate>
      <div class="form-section card">
        <div class="form-section-title">${icon("calculatorFill")} Conductor</div>
        <div class="grid-2">
          <div class="field">
            <label for="f-red">Tipo de conductor</label>
            <select id="f-red" required>
              <option value="Aereo">Aéreo</option>
              <option value="Subterraneo">Subterráneo</option>
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
          <label for="f-area">Área del conductor (mm²)</label>
          <div class="input-with-toggle">
            <input type="number" id="f-area" min="0" max="10000" step="0.01" required disabled>
            <label class="checkbox-row"><input type="checkbox" id="chk-area"> Manual</label>
          </div>
        </div>

        <div class="field">
          <label for="f-constante">Constante del material</label>
          <div class="input-with-toggle">
            <input type="number" id="f-constante" min="0" max="500" step="1" required disabled>
            <label class="checkbox-row"><input type="checkbox" id="chk-constante"> Manual</label>
          </div>
          <span class="hint">Para cobre 341, para aluminio 224</span>
        </div>
      </div>

      <div class="form-section card">
        <div class="form-section-title">${icon("boltFill")} Condiciones de falla</div>
        <div class="grid-2">
          <div class="field">
            <label for="f-top">Temperatura de operación (°C)</label>
            <div class="input-with-toggle">
              <input type="number" id="f-top" min="0" max="500" step="0.1" required disabled>
              <label class="checkbox-row"><input type="checkbox" id="chk-top"> Manual</label>
            </div>
            <span class="hint">Típicos: aéreos desnudos 75°C, cubiertos y subterráneos MT: 90°C</span>
          </div>
          <div class="field">
            <label for="f-tfalla">Temperatura máxima en falla (°C)</label>
            <div class="input-with-toggle">
              <input type="number" id="f-tfalla" min="0" max="500" step="0.1" value="250" required disabled>
              <label class="checkbox-row"><input type="checkbox" id="chk-tfalla"> Manual</label>
            </div>
            <span class="hint">Sugerencia: revisar en ficha técnica del conductor</span>
          </div>
        </div>

        <div class="field">
          <label for="f-temp0">Temperatura de resistencia 0 (°C)</label>
          <div class="input-with-toggle">
            <input type="number" id="f-temp0" min="0" max="500" step="0.1" required disabled>
            <label class="checkbox-row"><input type="checkbox" id="chk-temp0"> Manual</label>
          </div>
          <span class="hint">Para cobre 234 °C, para aluminio 228 °C</span>
        </div>

        <div class="field">
          <label for="f-tiempo">Tiempo de duración de la falla (s)</label>
          <input type="number" id="f-tiempo" min="0" max="10" step="0.1" value="1" required>
        </div>
      </div>

      <div class="form-section card">
        <div class="form-section-title">${icon("rulerFill")} Sugerencia de calibre</div>
        <p class="text-muted text-sm" style="margin: 0 0 var(--space-3);">
          Indique la corriente de cortocircuito (ICC) que debe soportar el conductor y se sugiere el calibre más económico (menor sección) del mismo tipo de conductor y material seleccionados arriba que la cumple.
        </p>
        <div class="grid-2">
          <div class="field">
            <label for="f-objetivo-icc">ICC requerida (kA)</label>
            <input type="number" id="f-objetivo-icc" min="0" max="500" step="0.1" value="10">
          </div>
        </div>
        <div class="btn-row" style="margin-top: 0;">
          <button type="button" class="btn" id="btn-sugerir-calibre">${icon("ruler")} Sugerir calibre</button>
        </div>
        <div class="search-result" id="sugerencia-resultado"></div>
      </div>

      <div class="btn-row">
        <button type="submit" class="btn btn-primary">${icon("calculator")} Calcular</button>
      </div>
    </form>

    <div id="resultado-wrap"></div>

  `;

  const form = container.querySelector("#form-calc");
  const selRed = container.querySelector("#f-red");
  const selMaterial = container.querySelector("#f-material");
  const selCalibre = container.querySelector("#f-calibre");
  const fArea = container.querySelector("#f-area");
  const fConstante = container.querySelector("#f-constante");
  const fTop = container.querySelector("#f-top");
  const fTfalla = container.querySelector("#f-tfalla");
  const fTemp0 = container.querySelector("#f-temp0");
  const fTiempo = container.querySelector("#f-tiempo");
  const chkArea = container.querySelector("#chk-area");
  const chkConstante = container.querySelector("#chk-constante");
  const chkTop = container.querySelector("#chk-top");
  const chkTfalla = container.querySelector("#chk-tfalla");
  const chkTemp0 = container.querySelector("#chk-temp0");
  const fObjetivoIcc = container.querySelector("#f-objetivo-icc");
  const btnSugerirCalibre = container.querySelector("#btn-sugerir-calibre");

  let filaSeleccionada = null;

  function datasetActivo() {
    return selRed.value === "Aereo" ? aereos : subterraneos;
  }
  function campoMaterial() {
    return selRed.value === "Aereo" ? "tipo" : "material_conductor";
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

  function defaultArea() {
    if (!filaSeleccionada) return "";
    return selRed.value === "Aereo" ? filaSeleccionada.area_seccion_aluminio_mm2 : filaSeleccionada.area_conductor_mm2;
  }
  function esCobre() {
    return selMaterial.value === "Cobre";
  }
  function defaultConstante() {
    return esCobre() ? 341 : 224;
  }
  function defaultTop() {
    return selRed.value === "Subterraneo" ? 90 : 75;
  }
  function defaultTemp0() {
    return esCobre() ? 234 : 228;
  }

  function syncDefaults() {
    if (!chkArea.checked) fArea.value = defaultArea();
    if (!chkConstante.checked) fConstante.value = defaultConstante();
    if (!chkTop.checked) fTop.value = defaultTop();
    if (!chkTemp0.checked) fTemp0.value = defaultTemp0();
  }

  selRed.addEventListener("change", poblarMaterial);
  selMaterial.addEventListener("change", poblarCalibre);
  selCalibre.addEventListener("change", () => {
    filaSeleccionada = resolverFila();
    syncDefaults();
  });
  chkArea.addEventListener("change", () => {
    fArea.disabled = !chkArea.checked;
    if (!chkArea.checked) fArea.value = defaultArea();
  });
  chkConstante.addEventListener("change", () => {
    fConstante.disabled = !chkConstante.checked;
    if (!chkConstante.checked) fConstante.value = defaultConstante();
  });
  chkTop.addEventListener("change", () => {
    fTop.disabled = !chkTop.checked;
    if (!chkTop.checked) fTop.value = defaultTop();
  });
  chkTfalla.addEventListener("change", () => {
    fTfalla.disabled = !chkTfalla.checked;
    if (!chkTfalla.checked) fTfalla.value = 250;
  });
  chkTemp0.addEventListener("change", () => {
    fTemp0.disabled = !chkTemp0.checked;
    if (!chkTemp0.checked) fTemp0.value = defaultTemp0();
  });

  poblarMaterial();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const p = {
      areaMm2: parseFloat(fArea.value),
      constanteK1: parseFloat(fConstante.value),
      tempOperacionC: parseFloat(fTop.value),
      tempFallaC: parseFloat(fTfalla.value),
      tempResistencia0C: parseFloat(fTemp0.value),
      tiempoS: parseFloat(fTiempo.value),
    };

    const data = calcularCortocircuito(p);
    renderResultado(data, p, { red: selRed.value, material: selMaterial.value, calibre: selCalibre.value });
  });

  btnSugerirCalibre.addEventListener("click", () => {
    const objetivoKa = parseFloat(fObjetivoIcc.value);
    if (!Number.isFinite(objetivoKa)) return;
    renderSugerenciaCalibre(objetivoKa);
  });

  function renderSugerenciaCalibre(objetivoKa) {
    const wrap = container.querySelector("#sugerencia-resultado");
    const campo = campoMaterial();
    const material = selMaterial.value;
    const areaField = selRed.value === "Aereo" ? "area_seccion_aluminio_mm2" : "area_conductor_mm2";

    const constanteK1 = parseFloat(fConstante.value);
    const tempOperacionC = parseFloat(fTop.value);
    const tempFallaC = parseFloat(fTfalla.value);
    const tempResistencia0C = parseFloat(fTemp0.value);
    const tiempoS = parseFloat(fTiempo.value);
    const logaritmo = Math.log10((tempFallaC + tempResistencia0C) / (tempOperacionC + tempResistencia0C));
    const areaRequeridaMm2 = (objetivoKa * 1000) / (constanteK1 * Math.sqrt(logaritmo / tiempoS));

    if (!Number.isFinite(areaRequeridaMm2) || areaRequeridaMm2 <= 0) {
      wrap.innerHTML = `<div class="callout callout-warning">No se pudo calcular el área requerida con los datos actuales de temperatura y tiempo de falla.</div>`;
      wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    const candidatos = datasetActivo()
      .filter((row) => row[campo] === material && row.calibre_awg_kcmil && row[areaField] != null)
      .map((row) => ({ calibre: row.calibre_awg_kcmil, area: row[areaField] }))
      .sort((a, b) => a.area - b.area);

    if (!candidatos.length) {
      wrap.innerHTML = `<div class="callout callout-warning">No hay conductores del tipo de conductor/material seleccionados para comparar.</div>`;
      wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    const recomendado = candidatos.find((c) => c.area >= areaRequeridaMm2) || null;
    const mejor = recomendado || candidatos.reduce((max, c) => (c.area > max.area ? c : max), candidatos[0]);

    const mensaje = recomendado
      ? `<div class="callout callout-success">Calibre sugerido: <strong>${escapeHtml(recomendado.calibre)}</strong> (${fmt(recomendado.area)} mm²) — cumple el área mínima requerida de ${fmt(areaRequeridaMm2)} mm² para ${fmt(objetivoKa)} kA.</div>`
      : `<div class="callout callout-danger">Ningún calibre disponible alcanza el área mínima requerida de ${fmt(areaRequeridaMm2)} mm² para ${fmt(objetivoKa)} kA. El de mayor sección disponible es <strong>${escapeHtml(mejor.calibre)}</strong> (${fmt(mejor.area)} mm²).</div>`;

    const filas = candidatos.slice(0, 8);
    const tabla = `
      <div class="table-scroll">
        <table class="criterios-table">
          <thead><tr><th>Calibre</th><th>Área (mm²)</th></tr></thead>
          <tbody>
            ${filas
              .map(
                (c) => `
              <tr class="${mejor.calibre === c.calibre ? "match-row" : ""}">
                <td>${escapeHtml(c.calibre)}</td>
                <td>${fmt(c.area)}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    wrap.innerHTML = mensaje + tabla;
    wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderResultado(data, p, ctx) {
    const wrap = container.querySelector("#resultado-wrap");

    const reporte = [
      `CALCULADORA NORMATIVA 2026`,
      `Celsia Colombia S.A. E.S.P.`,
      `Cálculo de capacidad de cortocircuito`,
      ``,
      `------------------------`,
      `PARÁMETROS DE ENTRADA:`,
      `Tipo de conductor: ${ctx.red === "Aereo" ? "Aéreo" : "Subterráneo"}`,
      `Material del conductor: ${ctx.material}`,
      `Calibre del conductor: ${ctx.calibre} (AWG/kcmil)`,
      `Área del conductor: ${fmt(p.areaMm2)} mm²`,
      `Constante del material del conductor: ${fmt(p.constanteK1, 0)}`,
      `Temperatura de operación: ${fmt(p.tempOperacionC)} °C`,
      `Temperatura máxima permitida en falla: ${fmt(p.tempFallaC)} °C`,
      `Temperatura de resistencia cero: ${fmt(p.tempResistencia0C)} °C`,
      `Tiempo de duración/despeje de la falla: ${fmt(p.tiempoS, 1)} s`,
      ``,
      `-------------------`,
      `RESULTADOS:`,
      `Capacidad de cortocircuito: ${fmt(data.capacidadCcKa)} kA`,
    ].join("\n");

    const scaleMax = Math.max(p.tempFallaC * 1.15, p.tempFallaC + 20);
    const topPct = (p.tempOperacionC / scaleMax) * 100;
    const tfallaPct = (p.tempFallaC / scaleMax) * 100;

    wrap.innerHTML = `
      <div class="card">
        <div class="tabs">
          <button type="button" class="tab-btn active" data-tab="resultado">Resultado</button>
          <button type="button" class="tab-btn" data-tab="reporte">Reporte</button>
          <button type="button" class="tab-btn" data-tab="criterios">Criterios de cálculo</button>
        </div>
        <div class="tab-panel" data-panel="resultado">
          <div class="result-report">
            <div class="result-stat-hero">
              <div class="value">${fmt(data.capacidadCcKa)}<span class="unit">kA</span></div>
              <div class="label">Capacidad de corriente de cortocircuito</div>
            </div>
            <div class="result-thermal">
              <div class="result-thermal-title">Margen térmico durante la falla</div>
              <div class="result-thermal-track">
                <div class="result-thermal-range" style="left:${topPct}%; width:${tfallaPct - topPct}%"></div>
                <div class="result-thermal-marker" style="left:${topPct}%"></div>
                <div class="result-thermal-marker end" style="left:${tfallaPct}%"></div>
              </div>
              <div class="result-thermal-labels">
                <span>Operación: ${fmt(p.tempOperacionC, 0)}°C</span>
                <span>Máxima en falla: ${fmt(p.tempFallaC, 0)}°C</span>
              </div>
            </div>
          </div>
        </div>
        <div class="tab-panel" data-panel="reporte" hidden>
          <div class="report-block">${escapeHtml(reporte)}</div>
        </div>
        <div class="tab-panel" data-panel="criterios" hidden>
          <div class="criterios-content">${renderCriterios(CRITERIOS_CORTOCIRCUITO)}</div>
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
