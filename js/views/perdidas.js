// Calculadora de perdidas de potencia por efecto Joule en una linea trifasica.
// Soporta circuitos con varios tramos (aereos y/o subterraneos): cada tramo
// tiene su propio tipo de red/material/calibre/longitud, y las perdidas de
// cada tramo se suman para dar el resultado total del circuito. Corriente,
// potencia aparente y potencia reactiva son las mismas para todos los tramos
// (dependen solo de P, V y FP -- no cambian con R ni L), asumiendo que la
// corriente es la misma a lo largo de todo el circuito (sin cargas
// intermedias entre tramos).

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
Porcentaje de Pérdidas (por tramo) = (√3·R·L·I·Fp) / (10·V·cos φ)     [%]

Para circuitos de varios tramos, el % de pérdidas total es la suma del % de
cada tramo (válido cuando la corriente es la misma en todo el circuito, es
decir, sin cargas intermedias entre tramos).

Nota: se usa la forma lineal del factor de pérdidas (0.7·Fc + 0.3), no la forma cuadrática clásica de Buller-Woodrow (0.7·Fc² + 0.3·Fc) que aparece documentada en el panel de "Criterios de cálculo".`;

// Velocímetro de % de pérdidas: 0-1% óptimo, 1-3% aceptable, 3%+ fuera de norma.
// GAUGE_MAX define el 100% de la escala visual; valores por encima se recortan
// en la aguja pero el numero mostrado siempre es el real.
const GAUGE_MAX = 5;
const GAUGE_BREAKPOINTS = [1, 3];

const TRAMO_COLORS = ["var(--accent)", "var(--tertiary-blue)", "var(--tertiary-green)", "var(--warning)", "var(--danger)"];

export async function render(container) {
  const aereos = await loadData("conductores-aereos");
  const subterraneos = await loadData("conductores-subterraneos");

  container.innerHTML = `
    <div class="breadcrumb"><a href="#/">Inicio</a> <span>/</span> <span>Pérdidas</span></div>
    <h1 class="page-title">Cálculo de pérdidas</h1>
    <p class="page-subtitle">Corriente, potencia y porcentaje de pérdidas de una línea trifásica, ajustado por factor de carga. Soporta circuitos de varios tramos.</p>

    <form id="form-calc" novalidate>
      <div class="form-section card">
        <div class="form-section-title">${icon("bolt")} Datos de la línea</div>
        <div class="grid-2">
          <div class="field">
            <label for="f-tension">Nivel de tensión (kV)</label>
            <input type="number" id="f-tension" min="0" max="1000" step="0.1" value="34.5" required>
          </div>
          <div class="field">
            <label for="f-modo-entrada">Dato de partida</label>
            <select id="f-modo-entrada">
              <option value="potencia">Potencia activa</option>
              <option value="aparente">Potencia aparente</option>
              <option value="corriente">Corriente</option>
            </select>
          </div>
        </div>

        <div class="field" id="wrap-potencia">
          <label for="f-potencia">Potencia activa (kW)</label>
          <input type="number" id="f-potencia" min="0" max="500000" step="1" value="10000" required>
        </div>
        <div class="field" id="wrap-aparente" hidden>
          <label for="f-potencia-aparente">Potencia aparente (kVA)</label>
          <input type="number" id="f-potencia-aparente" min="0" max="500000" step="1" value="10526">
        </div>
        <div class="field" id="wrap-corriente" hidden>
          <label for="f-corriente">Corriente (A)</label>
          <input type="number" id="f-corriente" min="0" max="10000" step="0.1" value="176">
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="f-fp">Factor de potencia (FP)</label>
            <input type="number" id="f-fp" min="-1" max="1" step="0.05" value="0.95" required>
          </div>
          <div class="field">
            <label for="f-fc">Factor de carga (FC)</label>
            <input type="number" id="f-fc" min="0" max="1" step="0.01" value="1" required>
            <span class="hint">Circuitos de uso FC=1, conexiones solares FC= 0.28 a 0.53</span>
          </div>
        </div>
      </div>

      <div id="tramos-container"></div>

      <div class="btn-row">
        <button type="submit" class="btn btn-primary">${icon("calculator")} Calcular</button>
      </div>
    </form>

    <div id="resultado-wrap"></div>

  `;

  const form = container.querySelector("#form-calc");
  const fTension = container.querySelector("#f-tension");
  const fPotencia = container.querySelector("#f-potencia");
  const fPotenciaAparente = container.querySelector("#f-potencia-aparente");
  const fCorriente = container.querySelector("#f-corriente");
  const wrapPotencia = container.querySelector("#wrap-potencia");
  const wrapAparente = container.querySelector("#wrap-aparente");
  const wrapCorriente = container.querySelector("#wrap-corriente");
  const selModoEntrada = container.querySelector("#f-modo-entrada");
  const fFp = container.querySelector("#f-fp");
  const fFc = container.querySelector("#f-fc");

  let modoEntrada = "potencia";

  function setModoEntrada(modo) {
    modoEntrada = modo;
    wrapPotencia.hidden = modo !== "potencia";
    wrapAparente.hidden = modo !== "aparente";
    wrapCorriente.hidden = modo !== "corriente";
    fPotencia.required = modo === "potencia";
    fPotenciaAparente.required = modo === "aparente";
    fCorriente.required = modo === "corriente";
  }
  selModoEntrada.addEventListener("change", () => setModoEntrada(selModoEntrada.value));
  setModoEntrada("potencia");

  function resolverPotenciaKw() {
    if (modoEntrada === "aparente") return parseFloat(fPotenciaAparente.value) * parseFloat(fFp.value);
    if (modoEntrada === "corriente") {
      const corrienteA = parseFloat(fCorriente.value);
      return corrienteA * parseFloat(fTension.value) * parseFloat(fFp.value) * Math.sqrt(3);
    }
    return parseFloat(fPotencia.value);
  }

  // --- Tramos del conductor -------------------------------------------
  let nextTramoId = 1;
  function nuevoEstadoTramo() {
    return {
      red: "Aerea",
      material: null,
      calibre: null,
      longitudKm: 5,
      manualResistencia: false,
      resistenciaOhmKm: null,
      numConductoresPorFase: 1,
    };
  }
  const tramos = [{ id: 0, state: nuevoEstadoTramo() }];

  function datasetPara(red) {
    return red === "Aerea" ? aereos : subterraneos;
  }
  function campoMaterialPara(red) {
    return red === "Aerea" ? "tipo" : "material_conductor";
  }

  // Cada tramo persiste su seleccion en t.state; al re-renderizar (por
  // agregar/quitar otro tramo) las tarjetas existentes recrean su DOM pero
  // restauran los valores ya elegidos, en vez de resetear a los defaults.
  function renderTramoHtml(t, index) {
    const id = t.id;
    const num = index + 1;
    const esUltimo = index === tramos.length - 1;
    const quitarBtn =
      tramos.length > 1
        ? `<button type="button" class="btn btn-ghost btn-tramo-quitar" data-id="${id}" style="margin-left:auto; padding:2px 8px; font-size:0.72rem; text-transform:none; letter-spacing:normal;">${icon("close")} Quitar</button>`
        : "";
    const agregarBtn = esUltimo
      ? `<div class="btn-row" style="margin-top: var(--space-4);">
          <button type="button" class="btn btn-agregar-tramo">${icon("plus")} Agregar tramo</button>
        </div>`
      : "";
    return `
      <div class="form-section card tramo-block" data-id="${id}">
        <div class="form-section-title">${icon("calculator")} Conductor — Tramo ${num}${quitarBtn}</div>
        <div class="grid-2">
          <div class="field">
            <label for="f-red-${id}">Tipo de red</label>
            <select id="f-red-${id}" required>
              <option value="Aerea" ${t.state.red === "Aerea" ? "selected" : ""}>Aérea</option>
              <option value="Subterranea" ${t.state.red === "Subterranea" ? "selected" : ""}>Subterránea</option>
            </select>
          </div>
          <div class="field">
            <label for="f-material-${id}">Material del conductor</label>
            <select id="f-material-${id}" required></select>
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="f-longitud-${id}">Longitud del tramo (km)</label>
            <input type="number" id="f-longitud-${id}" min="0" max="500" step="0.1" value="${t.state.longitudKm}" required>
          </div>
          <div class="field">
            <label for="f-nconductores-${id}">Número de conductores por fase</label>
            <input type="number" id="f-nconductores-${id}" min="1" max="8" step="1" value="${t.state.numConductoresPorFase}" required>
            <span class="hint">Conductores en paralelo (haz). La resistencia efectiva se divide entre este número.</span>
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="f-calibre-${id}">Calibre del conductor</label>
            <select id="f-calibre-${id}" required disabled>
              <option value="">Seleccione un material primero</option>
            </select>
          </div>
          <div class="field">
            <label for="f-resistencia-${id}">R Conductor a 75° (Ω/km)</label>
            <div class="input-with-toggle">
              <input type="number" id="f-resistencia-${id}" min="0" max="1000" step="0.001" required disabled>
              <label class="checkbox-row"><input type="checkbox" id="chk-resistencia-${id}" ${t.state.manualResistencia ? "checked" : ""}> Manual</label>
            </div>
          </div>
        </div>
        ${agregarBtn}
      </div>
    `;
  }

  function bindTramoEvents() {
    tramos.forEach((t) => {
      const id = t.id;
      const selRed = container.querySelector(`#f-red-${id}`);
      const selMaterial = container.querySelector(`#f-material-${id}`);
      const selCalibre = container.querySelector(`#f-calibre-${id}`);
      const fLongitud = container.querySelector(`#f-longitud-${id}`);
      const fNConductores = container.querySelector(`#f-nconductores-${id}`);
      const fResistencia = container.querySelector(`#f-resistencia-${id}`);
      const chkResistencia = container.querySelector(`#chk-resistencia-${id}`);

      function poblarMaterial() {
        const opciones = distinct(datasetPara(selRed.value), campoMaterialPara(selRed.value));
        selMaterial.innerHTML = opciones.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("");
        if (t.state.material && opciones.includes(t.state.material)) selMaterial.value = t.state.material;
        else t.state.material = selMaterial.value || null;
        poblarCalibre();
      }
      function poblarCalibre() {
        const campo = campoMaterialPara(selRed.value);
        const material = selMaterial.value;
        const calibres = distinct(
          datasetPara(selRed.value).filter((c) => c[campo] === material),
          "calibre_awg_kcmil"
        );
        selCalibre.innerHTML = calibres.length
          ? `<option value="">Seleccione…</option>` + calibres.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")
          : `<option value="">Sin calibres disponibles</option>`;
        selCalibre.disabled = !calibres.length;
        if (t.state.calibre && calibres.includes(t.state.calibre)) selCalibre.value = t.state.calibre;
        else t.state.calibre = null;
        t.filaSeleccionada = resolverFila();
        syncDefaults();
      }
      function resolverFila() {
        const campo = campoMaterialPara(selRed.value);
        const material = selMaterial.value;
        const calibre = selCalibre.value;
        if (!calibre) return null;
        return datasetPara(selRed.value).find((c) => c[campo] === material && c.calibre_awg_kcmil === calibre) || null;
      }
      function syncDefaults() {
        if (!chkResistencia.checked) fResistencia.value = t.filaSeleccionada ? t.filaSeleccionada.r_ac_75c_ohm_km : "";
      }

      selRed.addEventListener("change", () => {
        t.state.red = selRed.value;
        t.state.material = null;
        t.state.calibre = null;
        poblarMaterial();
      });
      selMaterial.addEventListener("change", () => {
        t.state.material = selMaterial.value;
        t.state.calibre = null;
        poblarCalibre();
      });
      selCalibre.addEventListener("change", () => {
        t.state.calibre = selCalibre.value;
        t.filaSeleccionada = resolverFila();
        syncDefaults();
      });
      fLongitud.addEventListener("input", () => {
        t.state.longitudKm = fLongitud.value;
      });
      fNConductores.addEventListener("input", () => {
        t.state.numConductoresPorFase = fNConductores.value;
      });
      chkResistencia.addEventListener("change", () => {
        fResistencia.disabled = !chkResistencia.checked;
        t.state.manualResistencia = chkResistencia.checked;
        if (!chkResistencia.checked) syncDefaults();
      });
      fResistencia.addEventListener("input", () => {
        if (chkResistencia.checked) t.state.resistenciaOhmKm = fResistencia.value;
      });

      fResistencia.disabled = !chkResistencia.checked;
      poblarMaterial();
      if (chkResistencia.checked && t.state.resistenciaOhmKm != null) {
        fResistencia.value = t.state.resistenciaOhmKm;
      }

      t.getEstado = () => ({
        red: selRed.value,
        material: selMaterial.value,
        calibre: selCalibre.value,
        longitudKm: parseFloat(fLongitud.value),
        resistenciaOhmKm: parseFloat(fResistencia.value),
        numConductoresPorFase: parseInt(fNConductores.value, 10) || 1,
      });
    });

    container.querySelectorAll(".btn-tramo-quitar").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id, 10);
        const idx = tramos.findIndex((t) => t.id === id);
        if (idx !== -1) tramos.splice(idx, 1);
        renderTramos();
      });
    });

    const btnAgregar = container.querySelector(".btn-agregar-tramo");
    if (btnAgregar) {
      btnAgregar.addEventListener("click", () => {
        tramos.push({ id: nextTramoId++, state: nuevoEstadoTramo() });
        renderTramos();
      });
    }
  }

  function renderTramos() {
    const cont = container.querySelector("#tramos-container");
    cont.innerHTML = tramos.map((t, i) => renderTramoHtml(t, i)).join("");
    bindTramoEvents();
  }

  renderTramos();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const base = {
      tensionKv: parseFloat(fTension.value),
      potenciaKw: resolverPotenciaKw(),
      factorPotencia: parseFloat(fFp.value),
      factorCarga: parseFloat(fFc.value),
    };

    const resultadosTramos = tramos.map((t, i) => {
      const estado = t.getEstado();
      const resistenciaEfectiva = estado.resistenciaOhmKm / estado.numConductoresPorFase;
      const data = calcularPerdidas({ ...base, resistenciaOhmKm: resistenciaEfectiva, longitudKm: estado.longitudKm });
      return { numero: i + 1, ...estado, resistenciaEfectiva, data };
    });

    renderResultado(resultadosTramos, base);
  });

  // --- Sugerencia de calibre (solo tiene sentido con un unico tramo) ---
  function calcularCandidatosCalibre(base, ctx) {
    const campo = campoMaterialPara(ctx.red);
    const areaField = ctx.red === "Aerea" ? "area_seccion_aluminio_mm2" : "area_conductor_mm2";
    return datasetPara(ctx.red)
      .filter((row) => row[campo] === ctx.material && row.calibre_awg_kcmil && row.r_ac_75c_ohm_km != null && row[areaField] != null)
      .map((row) => {
        const resistenciaEfectiva = row.r_ac_75c_ohm_km / ctx.numConductoresPorFase;
        const data = calcularPerdidas({ ...base, resistenciaOhmKm: resistenciaEfectiva, longitudKm: ctx.longitudKm });
        return { calibre: row.calibre_awg_kcmil, area: row[areaField], perdidasPct: data.perdidasPct };
      })
      .sort((a, b) => a.area - b.area);
  }

  function buildComparacionCalibresHtml(base, ctx) {
    const candidatos = calcularCandidatosCalibre(base, ctx);
    if (!candidatos.length) return "";

    const objetivoPct = GAUGE_BREAKPOINTS[1];
    let idxCumple = candidatos.findIndex((c) => c.perdidasPct <= objetivoPct);
    if (idxCumple === -1) idxCumple = candidatos.length;
    const desde = Math.max(0, idxCumple - 3);
    const hasta = Math.min(candidatos.length, idxCumple + 3);
    const ventana = candidatos.slice(desde, hasta);
    const sugerido = idxCumple < candidatos.length ? candidatos[idxCumple] : null;

    const mensaje = sugerido
      ? `Calibre sugerido para no superar ${fmtPercent(objetivoPct)} de pérdidas: <strong>${escapeHtml(sugerido.calibre)}</strong> (${fmt(sugerido.area)} mm²).`
      : `Ningún calibre del catálogo baja de ${fmtPercent(objetivoPct)} de pérdidas con estos datos; el de menor pérdida es <strong>${escapeHtml(candidatos[candidatos.length - 1].calibre)}</strong>.`;

    const filas = ventana
      .map((c) => {
        const clases = [c.calibre === sugerido?.calibre ? "match-row" : "", c.calibre === ctx.calibre ? "current-row" : ""]
          .filter(Boolean)
          .join(" ");
        const etiqueta = c.calibre === ctx.calibre ? ' <span class="badge">Actual</span>' : "";
        return `
          <tr class="${clases}">
            <td>${escapeHtml(c.calibre)}${etiqueta}</td>
            <td>${fmt(c.area)}</td>
            <td>${fmtPercent(c.perdidasPct)}</td>
          </tr>`;
      })
      .join("");

    return `
      <div class="result-subhead">Comparación con otros calibres</div>
      <p class="text-muted text-sm" style="margin: 0 0 var(--space-3);">${mensaje}</p>
      <div class="table-scroll">
        <table class="criterios-table">
          <thead><tr><th>Calibre</th><th>Área (mm²)</th><th>% pérdidas</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    `;
  }

  function buildResumenTramosHtml(resultadosTramos) {
    const maxKw = Math.max(...resultadosTramos.map((r) => r.perdidasKw)) || 1;
    const filas = resultadosTramos
      .map((r, i) => {
        const color = TRAMO_COLORS[i % TRAMO_COLORS.length];
        const ancho = (r.perdidasKw / maxKw) * 100;
        return `
          <div class="result-compare-row">
            <span class="result-compare-label">Tramo ${r.numero}</span>
            <div class="result-compare-track"><div class="result-compare-fill" style="width:${ancho}%; background:${color};"></div></div>
            <span class="result-compare-value">${fmtPercent(r.data.perdidasPct)} · ${fmt(r.perdidasKw)} kW</span>
          </div>`;
      })
      .join("");

    return `
      <div class="result-subhead">Pérdidas por tramo</div>
      <div class="result-compare">${filas}</div>
    `;
  }

  function renderResultado(resultadosTramos, base) {
    const wrap = container.querySelector("#resultado-wrap");

    const conDatos = resultadosTramos.map((r) => ({ ...r, perdidasKw: (r.data.perdidasPct / 100) * base.potenciaKw }));
    const primero = conDatos[0].data;
    const perdidasPctTotal = conDatos.reduce((sum, r) => sum + r.data.perdidasPct, 0);
    const perdidasKwTotal = conDatos.reduce((sum, r) => sum + r.perdidasKw, 0);

    const reporteTramos = conDatos
      .map(
        (r) => `
TRAMO ${r.numero}:
  Tipo de red: ${r.red === "Aerea" ? "Aérea" : "Subterránea"}
  Material del conductor: ${r.material}
  Calibre del conductor: ${r.calibre} (AWG/kcmil)
  Longitud del tramo: ${fmt(r.longitudKm)} km
  Número de conductores por fase: ${fmt(r.numConductoresPorFase, 0)}
  Resistencia del conductor a 75°C (por subconductor): ${fmt(r.resistenciaOhmKm)} Ω/km
  Resistencia efectiva del haz (R/N): ${fmt(r.resistenciaEfectiva)} Ω/km
  Porcentaje de pérdidas del tramo: ${fmt(r.data.perdidasPct)} %
  Pérdidas estimadas del tramo: ${fmt(r.perdidasKw)} kW`
      )
      .join("\n");

    const reporte = [
      `CALCULADORA NORMATIVA 2026`,
      `Celsia Colombia S.A. E.S.P.`,
      `Cálculo de pérdidas`,
      ``,
      `------------------------`,
      `PARÁMETROS DE ENTRADA:`,
      `Nivel de tensión de la línea: ${fmt(base.tensionKv)} kV`,
      `Potencia activa: ${fmt(base.potenciaKw, 0)} kW`,
      `Factor de potencia: ${fmt(base.factorPotencia)}`,
      `Factor de carga: ${fmt(base.factorCarga)}`,
      reporteTramos,
      ``,
      `-------------------`,
      `RESULTADOS TOTALES:`,
      `Potencia aparente: ${fmt(primero.potenciaS)} kVA`,
      `Potencia reactiva: ${fmt(primero.potenciaQ)} kVAR`,
      `Corriente: ${fmt(primero.corriente)} A`,
      `Porcentaje de pérdidas total: ${fmt(perdidasPctTotal)} %`,
      `Pérdidas totales estimadas: ${fmt(perdidasKwTotal)} kW`,
    ].join("\n");

    const estado = estadoGauge(perdidasPctTotal, GAUGE_BREAKPOINTS);
    const maxPotencia = Math.max(base.potenciaKw, primero.potenciaS, primero.potenciaQ) || 1;
    const wActiva = (base.potenciaKw / maxPotencia) * 100;
    const wAparente = (primero.potenciaS / maxPotencia) * 100;
    const wReactiva = (primero.potenciaQ / maxPotencia) * 100;

    const bloqueComparacionCalibres =
      conDatos.length === 1 ? buildComparacionCalibresHtml(base, conDatos[0]) : "";
    const bloqueResumenTramos = conDatos.length > 1 ? buildResumenTramosHtml(conDatos) : "";

    wrap.innerHTML = `
      <div class="card">
        <div class="tabs">
          <button type="button" class="tab-btn active" data-tab="resultado">Resultado</button>
          <button type="button" class="tab-btn" data-tab="reporte">Reporte</button>
          <button type="button" class="tab-btn" data-tab="formulas">Fórmulas</button>
          <button type="button" class="tab-btn" data-tab="criterios">Criterios de cálculo</button>
        </div>
        <div class="tab-panel" data-panel="resultado">
          <div class="result-report">
            <div class="result-compare">
              <div class="result-compare-row">
                <span class="result-compare-label">Potencia activa</span>
                <div class="result-compare-track"><div class="result-compare-fill activa" style="width:${wActiva}%"></div></div>
                <span class="result-compare-value">${fmt(base.potenciaKw, 0)} kW</span>
              </div>
              <div class="result-compare-row">
                <span class="result-compare-label">Potencia aparente</span>
                <div class="result-compare-track"><div class="result-compare-fill aparente" style="width:${wAparente}%"></div></div>
                <span class="result-compare-value">${fmt(primero.potenciaS)} kVA</span>
              </div>
              <div class="result-compare-row">
                <span class="result-compare-label">Potencia reactiva</span>
                <div class="result-compare-track"><div class="result-compare-fill reactiva" style="width:${wReactiva}%"></div></div>
                <span class="result-compare-value">${fmt(primero.potenciaQ)} kVAR</span>
              </div>
            </div>
            <div class="result-gauge-row">
              <div class="result-gauge">
                ${buildGaugeSvg(perdidasPctTotal, { max: GAUGE_MAX, breakpoints: GAUGE_BREAKPOINTS })}
                <div class="result-gauge-value">${fmtPercent(perdidasPctTotal)}</div>
              </div>
              <div class="result-gauge-info">
                <div class="result-gauge-title">Porcentaje de pérdidas total <span class="badge ${estado.cls}">${estado.label}</span></div>
                <div class="result-gauge-desc">Óptimo hasta 1% · Aceptable hasta 3% · Elevado sobre 3%</div>
                <div class="result-gauge-current">${fmt(primero.corriente)}<span class="unit">A · Corriente</span></div>
              </div>
            </div>
            <div class="result-extra-stat">
              <span class="label">Pérdidas totales estimadas</span>
              <span class="value">${fmt(perdidasKwTotal)} kW</span>
            </div>
            ${bloqueResumenTramos}
            ${bloqueComparacionCalibres}
          </div>
        </div>
        <div class="tab-panel" data-panel="reporte" hidden>
          <div class="report-block">${escapeHtml(reporte)}</div>
        </div>
        <div class="tab-panel" data-panel="formulas" hidden>
          <div class="formula-block">${escapeHtml(FORMULAS_HTML)}</div>
        </div>
        <div class="tab-panel" data-panel="criterios" hidden>
          <div class="criterios-content">${renderCriterios(CRITERIOS_PERDIDAS)}</div>
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
