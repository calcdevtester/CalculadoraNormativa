// Calculadora de caida de tension (regulacion) en una linea trifasica.
// Soporta circuitos con varios tramos (aereos y/o subterraneos): cada tramo
// tiene su propio conductor (tipo de red/material/calibre/longitud/RMG) y su
// propia geometria de fases, y la caida de tension de cada tramo se suma
// para dar el resultado total del circuito. Corriente, potencia aparente y
// potencia reactiva son las mismas para todos los tramos (dependen solo de
// P, V y FP), asumiendo que la corriente es la misma a lo largo de todo el
// circuito (sin cargas intermedias entre tramos).

import { fmt, fmtPercent, loadData, distinct, escapeHtml } from "../util/format.js";
import { calcularRegulacion } from "../calc/regulacion.js";
import { icon } from "../icons.js";
import { renderCriterios } from "../util/criterios-render.js";
import { regulacion as CRITERIOS_REGULACION } from "../data/criterios.js";
import { estadoGauge, buildGaugeSvg } from "../util/gauge.js";

// Velocímetro de % de caída de tensión: 0-5% óptimo, 5-10% aceptable, 10%+ fuera de norma.
const GAUGE_MAX = 15;
const GAUGE_BREAKPOINTS = [5, 10];

const TRAMO_COLORS = ["var(--accent)", "var(--tertiary-blue)", "var(--tertiary-green)", "var(--warning)", "var(--danger)"];

// RMG equivalente de un haz de N subconductores identicos, equiespaciados
// en un arreglo circular (poligono regular) con separacion `separacionM`
// entre subconductores adyacentes. Se reduce exactamente a las formulas de
// texto (sqrt(Ds*d), cbrt(Ds*d^2), 1.091*(Ds*d^3)^(1/4)) para N=2,3,4, y se
// generaliza a cualquier N.
function calcularRmgHaz(rmgMm, n, separacionM) {
  if (n <= 1) return rmgMm;
  const separacionMm = separacionM * 1000;
  const radioMm = separacionMm / (2 * Math.sin(Math.PI / n));
  return Math.pow(rmgMm * n * Math.pow(radioMm, n - 1), 1 / n);
}

export async function render(container) {
  const aereos = await loadData("conductores-aereos");
  const subterraneos = await loadData("conductores-subterraneos");

  container.innerHTML = `
    <div class="breadcrumb"><a href="#/">Inicio</a> <span>/</span> <span>Regulación</span></div>
    <h1 class="page-title">Cálculo de regulación</h1>
    <p class="page-subtitle">Caída de tensión y reactancia inductiva de un conductor en una línea trifásica de distribución. Soporta circuitos de varios tramos.</p>

    <form id="form-calc" novalidate>
      <div class="form-section card">
        <div class="form-section-title">${icon("boltFill")} Datos de la línea</div>
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

        <div class="grid-2">
          <div>
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
          </div>
          <div class="field">
            <label for="f-fp">Factor de potencia (FP)</label>
            <input type="number" id="f-fp" min="-1" max="1" step="0.05" value="0.95" required>
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
      manualRmg: false,
      rmgMm: null,
      numConductoresPorFase: 1,
      separacionHazM: 0.4,
      dabM: 1.6,
      dacM: 2.7,
      dbcM: 1.1,
    };
  }
  const tramos = [{ id: 0, state: nuevoEstadoTramo() }];

  function datasetPara(red) {
    return red === "Aerea" ? aereos : subterraneos;
  }
  function campoMaterialPara(red) {
    return red === "Aerea" ? "tipo" : "material_conductor";
  }

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
        <div class="form-section-title">${icon("calculatorFill")} Conductor — Tramo ${num}${quitarBtn}</div>
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

        <div class="grid-2">
          <div class="field">
            <label for="f-sephaz-${id}">Separación entre subconductores del haz (m)</label>
            <input type="number" id="f-sephaz-${id}" min="0.01" max="5" step="0.01" value="${t.state.separacionHazM}" ${t.state.numConductoresPorFase > 1 ? "required" : "disabled"}>
            <span class="hint">Solo aplica si hay más de un conductor por fase.</span>
          </div>
          <div class="field">
            <label for="f-rmg-${id}">Radio medio geométrico del conductor (mm)</label>
            <div class="input-with-toggle">
              <input type="number" id="f-rmg-${id}" min="0" max="1000" step="0.01" required disabled>
              <label class="checkbox-row"><input type="checkbox" id="chk-rmg-${id}" ${t.state.manualRmg ? "checked" : ""}> Manual</label>
            </div>
          </div>
        </div>

        <div class="grid-3">
          <div class="field">
            <label for="f-dab-${id}">Distancia entre fases A-B (m)</label>
            <input type="number" id="f-dab-${id}" min="0" max="100" step="0.1" value="${t.state.dabM}" required>
          </div>
          <div class="field">
            <label for="f-dac-${id}">Distancia entre fases A-C (m)</label>
            <input type="number" id="f-dac-${id}" min="0" max="100" step="0.1" value="${t.state.dacM}" required>
          </div>
          <div class="field">
            <label for="f-dbc-${id}">Distancia entre fases B-C (m)</label>
            <input type="number" id="f-dbc-${id}" min="0" max="100" step="0.1" value="${t.state.dbcM}" required>
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
      const fSepHaz = container.querySelector(`#f-sephaz-${id}`);
      const fResistencia = container.querySelector(`#f-resistencia-${id}`);
      const chkResistencia = container.querySelector(`#chk-resistencia-${id}`);
      const fRmg = container.querySelector(`#f-rmg-${id}`);
      const chkRmg = container.querySelector(`#chk-rmg-${id}`);
      const fDab = container.querySelector(`#f-dab-${id}`);
      const fDac = container.querySelector(`#f-dac-${id}`);
      const fDbc = container.querySelector(`#f-dbc-${id}`);

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
        if (!chkRmg.checked) fRmg.value = t.filaSeleccionada ? t.filaSeleccionada.radio_medio_geometrico_mm : "";
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
        const n = parseInt(fNConductores.value, 10) || 1;
        t.state.numConductoresPorFase = n;
        fSepHaz.disabled = n <= 1;
        fSepHaz.required = n > 1;
      });
      fSepHaz.addEventListener("input", () => {
        t.state.separacionHazM = fSepHaz.value;
      });
      chkResistencia.addEventListener("change", () => {
        fResistencia.disabled = !chkResistencia.checked;
        t.state.manualResistencia = chkResistencia.checked;
        if (!chkResistencia.checked) syncDefaults();
      });
      fResistencia.addEventListener("input", () => {
        if (chkResistencia.checked) t.state.resistenciaOhmKm = fResistencia.value;
      });
      chkRmg.addEventListener("change", () => {
        fRmg.disabled = !chkRmg.checked;
        t.state.manualRmg = chkRmg.checked;
        if (!chkRmg.checked) syncDefaults();
      });
      fRmg.addEventListener("input", () => {
        if (chkRmg.checked) t.state.rmgMm = fRmg.value;
      });
      fDab.addEventListener("input", () => {
        t.state.dabM = fDab.value;
      });
      fDac.addEventListener("input", () => {
        t.state.dacM = fDac.value;
      });
      fDbc.addEventListener("input", () => {
        t.state.dbcM = fDbc.value;
      });

      fResistencia.disabled = !chkResistencia.checked;
      fRmg.disabled = !chkRmg.checked;
      poblarMaterial();
      if (chkResistencia.checked && t.state.resistenciaOhmKm != null) fResistencia.value = t.state.resistenciaOhmKm;
      if (chkRmg.checked && t.state.rmgMm != null) fRmg.value = t.state.rmgMm;

      t.getEstado = () => ({
        red: selRed.value,
        material: selMaterial.value,
        calibre: selCalibre.value,
        longitudKm: parseFloat(fLongitud.value),
        resistenciaOhmKm: parseFloat(fResistencia.value),
        rmgMm: parseFloat(fRmg.value),
        numConductoresPorFase: parseInt(fNConductores.value, 10) || 1,
        separacionHazM: parseFloat(fSepHaz.value) || 0,
        dabM: parseFloat(fDab.value),
        dacM: parseFloat(fDac.value),
        dbcM: parseFloat(fDbc.value),
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
    };

    const resultadosTramos = tramos.map((t, i) => {
      const estado = t.getEstado();
      const resistenciaEfectiva = estado.resistenciaOhmKm / estado.numConductoresPorFase;
      const rmgEfectivo = calcularRmgHaz(estado.rmgMm, estado.numConductoresPorFase, estado.separacionHazM);
      const data = calcularRegulacion({
        ...base,
        longitudKm: estado.longitudKm,
        resistenciaOhmKm: resistenciaEfectiva,
        rmgMm: rmgEfectivo,
        dabM: estado.dabM,
        dacM: estado.dacM,
        dbcM: estado.dbcM,
      });
      return { numero: i + 1, ...estado, resistenciaEfectiva, rmgEfectivo, data };
    });

    renderResultado(resultadosTramos, base);
  });

  // --- Sugerencia de calibre (solo tiene sentido con un unico tramo) ---
  function calcularCandidatosCalibre(base, ctx) {
    const campo = campoMaterialPara(ctx.red);
    const areaField = ctx.red === "Aerea" ? "area_seccion_aluminio_mm2" : "area_conductor_mm2";
    return datasetPara(ctx.red)
      .filter(
        (row) =>
          row[campo] === ctx.material &&
          row.calibre_awg_kcmil &&
          row.r_ac_75c_ohm_km != null &&
          row.radio_medio_geometrico_mm != null &&
          row[areaField] != null
      )
      .map((row) => {
        const resistenciaEfectiva = row.r_ac_75c_ohm_km / ctx.numConductoresPorFase;
        const rmgEfectivo = calcularRmgHaz(row.radio_medio_geometrico_mm, ctx.numConductoresPorFase, ctx.separacionHazM);
        const data = calcularRegulacion({
          ...base,
          longitudKm: ctx.longitudKm,
          resistenciaOhmKm: resistenciaEfectiva,
          rmgMm: rmgEfectivo,
          dabM: ctx.dabM,
          dacM: ctx.dacM,
          dbcM: ctx.dbcM,
        });
        return { calibre: row.calibre_awg_kcmil, area: row[areaField], caidaTensionPct: data.caidaTensionPct };
      })
      .sort((a, b) => a.area - b.area);
  }

  function buildComparacionCalibresHtml(base, ctx) {
    const candidatos = calcularCandidatosCalibre(base, ctx);
    if (!candidatos.length) return "";

    const objetivoPct = GAUGE_BREAKPOINTS[1];
    let idxCumple = candidatos.findIndex((c) => c.caidaTensionPct <= objetivoPct);
    if (idxCumple === -1) idxCumple = candidatos.length;
    const desde = Math.max(0, idxCumple - 3);
    const hasta = Math.min(candidatos.length, idxCumple + 3);
    const ventana = candidatos.slice(desde, hasta);
    const sugerido = idxCumple < candidatos.length ? candidatos[idxCumple] : null;

    const mensaje = sugerido
      ? `Calibre sugerido para no superar ${fmtPercent(objetivoPct)} de caída de tensión: <strong>${escapeHtml(sugerido.calibre)}</strong> (${fmt(sugerido.area)} mm²).`
      : `Ningún calibre del catálogo baja de ${fmtPercent(objetivoPct)} de caída de tensión con estos datos; el de menor caída es <strong>${escapeHtml(candidatos[candidatos.length - 1].calibre)}</strong>.`;

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
            <td>${fmtPercent(c.caidaTensionPct)}</td>
          </tr>`;
      })
      .join("");

    return `
      <div class="result-subhead">Comparación con otros calibres</div>
      <p class="text-muted text-sm" style="margin: 0 0 var(--space-3);">${mensaje}</p>
      <div class="table-scroll">
        <table class="criterios-table">
          <thead><tr><th>Calibre</th><th>Área (mm²)</th><th>% caída de tensión</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    `;
  }

  function buildResumenTramosHtml(resultadosTramos) {
    const maxPct = Math.max(...resultadosTramos.map((r) => r.data.caidaTensionPct)) || 1;
    const filas = resultadosTramos
      .map((r, i) => {
        const color = TRAMO_COLORS[i % TRAMO_COLORS.length];
        const ancho = (r.data.caidaTensionPct / maxPct) * 100;
        return `
          <div class="result-compare-row">
            <span class="result-compare-label">Tramo ${r.numero}</span>
            <div class="result-compare-track"><div class="result-compare-fill" style="width:${ancho}%; background:${color};"></div></div>
            <span class="result-compare-value">${fmtPercent(r.data.caidaTensionPct)}</span>
          </div>`;
      })
      .join("");

    return `
      <div class="result-subhead">Caída de tensión por tramo</div>
      <div class="result-compare">${filas}</div>
    `;
  }

  function renderResultado(resultadosTramos, base) {
    const wrap = container.querySelector("#resultado-wrap");

    const primero = resultadosTramos[0].data;
    const caidaTensionPctTotal = resultadosTramos.reduce((sum, r) => sum + r.data.caidaTensionPct, 0);

    const reporteTramos = resultadosTramos
      .map(
        (r) => `
TRAMO ${r.numero}:
  Tipo de red: ${r.red === "Aerea" ? "Aérea" : "Subterránea"}
  Material del conductor: ${r.material}
  Calibre del conductor: ${r.calibre} (AWG/kcmil)
  Longitud del tramo: ${fmt(r.longitudKm)} km
  Número de conductores por fase: ${fmt(r.numConductoresPorFase, 0)}
  Separación entre subconductores del haz: ${r.numConductoresPorFase > 1 ? fmt(r.separacionHazM) + " m" : "N/A (1 conductor)"}
  Resistencia del conductor a 75°C (por subconductor): ${fmt(r.resistenciaOhmKm)} Ω/km
  Resistencia efectiva del haz (R/N): ${fmt(r.resistenciaEfectiva)} Ω/km
  Radio medio geométrico del conductor (por subconductor): ${fmt(r.rmgMm)} mm
  RMG equivalente del haz: ${fmt(r.rmgEfectivo)} mm
  Distancia entre fases: AB: ${fmt(r.dabM)} m  AC: ${fmt(r.dacM)} m  BC: ${fmt(r.dbcM)} m
  Constante de regulación del tramo: ${fmt(r.data.intermedios.constanteRegulacion, 7)}
  Caída de tensión del tramo: ${fmt(r.data.caidaTensionPct)} %`
      )
      .join("\n");

    const reporte = [
      `CALCULADORA NORMATIVA 2026`,
      `Celsia Colombia S.A. E.S.P.`,
      `Cálculo de regulación`,
      ``,
      `------------------------`,
      `PARÁMETROS DE ENTRADA:`,
      `Nivel de tensión de la línea: ${fmt(base.tensionKv)} kV`,
      `Potencia activa: ${fmt(base.potenciaKw, 0)} kW`,
      `Factor de potencia: ${fmt(base.factorPotencia)}`,
      reporteTramos,
      ``,
      `-------------------`,
      `RESULTADOS TOTALES:`,
      `Corriente: ${fmt(primero.corriente)} A`,
      `Potencia aparente: ${fmt(primero.potenciaS)} kVA`,
      `Potencia reactiva: ${fmt(primero.potenciaQ)} kVAR`,
      `Caída de tensión total: ${fmt(caidaTensionPctTotal)} %`,
    ].join("\n");

    const estado = estadoGauge(caidaTensionPctTotal, GAUGE_BREAKPOINTS);
    const maxPotencia = Math.max(base.potenciaKw, primero.potenciaS, primero.potenciaQ) || 1;
    const wActiva = (base.potenciaKw / maxPotencia) * 100;
    const wAparente = (primero.potenciaS / maxPotencia) * 100;
    const wReactiva = (primero.potenciaQ / maxPotencia) * 100;

    const bloqueExtra =
      resultadosTramos.length === 1
        ? `
          <div class="result-extra-stat">
            <span class="label">Constante de regulación</span>
            <span class="value">${fmt(resultadosTramos[0].data.intermedios.constanteRegulacion, 7)}</span>
          </div>
          ${buildComparacionCalibresHtml(base, resultadosTramos[0])}
        `
        : buildResumenTramosHtml(resultadosTramos);

    wrap.innerHTML = `
      <div class="card">
        <div class="tabs">
          <button type="button" class="tab-btn active" data-tab="resultado">Resultado</button>
          <button type="button" class="tab-btn" data-tab="reporte">Reporte</button>
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
                ${buildGaugeSvg(caidaTensionPctTotal, { max: GAUGE_MAX, breakpoints: GAUGE_BREAKPOINTS })}
                <div class="result-gauge-value">${fmtPercent(caidaTensionPctTotal)}</div>
              </div>
              <div class="result-gauge-info">
                <div class="result-gauge-title">Caída de tensión total <span class="badge ${estado.cls}">${estado.label}</span></div>
                <div class="result-gauge-desc">Óptimo hasta 5% · Aceptable hasta 10% · Elevado sobre 10%</div>
                <div class="result-gauge-current">${fmt(primero.corriente)}<span class="unit">A · Corriente</span></div>
              </div>
            </div>
            ${bloqueExtra}
          </div>
        </div>
        <div class="tab-panel" data-panel="reporte" hidden>
          <div class="report-block">${escapeHtml(reporte)}</div>
        </div>
        <div class="tab-panel" data-panel="criterios" hidden>
          <div class="criterios-content">${renderCriterios(CRITERIOS_REGULACION)}</div>
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
