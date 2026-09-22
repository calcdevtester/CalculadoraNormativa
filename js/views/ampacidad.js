// Calculadora de ampacidad (capacidad de corriente admisible en regimen
// permanente) de un conductor, aereo (IEEE Std 738) o subterraneo en banco
// de ductos (IEC 60287-1-1). Un unico modulo con un selector de tipo de
// instalacion al inicio, en vez de dos pantallas separadas.

import { fmt, loadData, distinct, escapeHtml } from "../util/format.js";
import { calcularAmpacidadAerea } from "../calc/ampacidad-aerea.js";
import { calcularAmpacidadSubterranea } from "../calc/ampacidad-subterranea.js";
import { icon } from "../icons.js";
import { renderCriterios } from "../util/criterios-render.js";
import { ampacidad as CRITERIOS_AMPACIDAD } from "../data/criterios.js";

const ORDEN_CALIBRES = ["1/0 AWG", "2/0 AWG", "3/0 AWG", "4/0 AWG", "250 kcmil", "350 kcmil", "500 kcmil", "750 kcmil", "1000 kcmil"];

const HINTS = {
  puestaTierra: "Unipuntual: en un extremo del cable.",
  tempTerreno: "Valores típicos: 15-20°C en clima frío, 25-30°C en clima cálido/tropical.",
  rhoSuelo:
    "Tipos de suelo: Saturado / muy húmedo: 0.5-0.7; Arena o arcilla húmeda: 0.7-1.0; Tierra común compactada: 1.0-1.2; Arena seca: 2.0-3.0; Roca/suelo muy seco: 2.5-3.5",
  uDucto: "Típicos: PVC ≈ 0.3 - 0.4 K·m/W; Fibra de vidrio: 0.2 - 0.3; Metálico: 0.05 - 0.1; Cualquier ducto embebido en concreto: 0.1 - 0.2",
  separacionFases: "Valores típicos entre 0.04 y 0.10 m entre fases.",
  separacionDuctos: "Depende de la norma; valores típicos entre 0.15 y 0.30 m",
};

export async function render(container) {
  const aereos = await loadData("conductores-aereos");
  const cables = await loadData("construccion-cable-subterraneo");

  const tiposAereo = distinct(aereos, "tipo");
  const materialesSub = distinct(cables, "material");
  const calibresSub = ORDEN_CALIBRES.filter((c) => cables.some((row) => row.calibre_awg_kcmil === c));
  const tiposPantallaSub = distinct(cables, "tipo_pantalla");
  const nivelesKvSub = distinct(cables, "nivel_aislamiento_kv");

  container.innerHTML = `
    <div class="breadcrumb"><a href="#/">Inicio</a> <span>/</span> <span>Ampacidad</span></div>
    <h1 class="page-title">Ampacidad de conductores</h1>
    <p class="page-subtitle">Corriente admisible en régimen permanente de un conductor, aéreo (IEEE Std 738) o subterráneo en banco de ductos (IEC 60287-1-1).</p>

    <form id="form-calc" novalidate>
      <div class="form-section card">
        <div class="form-section-title">${icon("thermometerFill")} Tipo de instalación</div>
        <div class="field" style="margin-bottom: 0;">
          <label for="f-tipo-instalacion">Tipo de instalación</label>
          <select id="f-tipo-instalacion">
            <option value="aerea">Aérea</option>
            <option value="subterranea">Subterránea</option>
          </select>
        </div>
      </div>

      <div id="bloque-aerea">
        <div class="form-section card">
          <div class="form-section-title">${icon("calculatorFill")} Conductor</div>
          <div class="grid-2">
            <div class="field">
              <label for="fa-tipo">Tipo</label>
              <select id="fa-tipo" required>
                <option value="">Seleccione…</option>
                ${tiposAereo.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="fa-calibre">Calibre</label>
              <select id="fa-calibre" required disabled>
                <option value="">Seleccione un tipo primero</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label for="fa-referencia">Referencia</label>
            <select id="fa-referencia" required disabled>
              <option value="">Seleccione un calibre primero</option>
            </select>
          </div>

          <div class="grid-3">
            <div class="field">
              <label for="fa-diametro">Diámetro del cable (mm)</label>
              <input type="number" id="fa-diametro" min="0" max="1000" step="0.01" required disabled>
              <label class="checkbox-row"><input type="checkbox" id="fa-chk-diametro"> Manual</label>
            </div>
            <div class="field">
              <label for="fa-rbajo">Resistencia AC a 25°C (Ω/km)</label>
              <input type="number" id="fa-rbajo" min="0" max="1000" step="0.01" required disabled>
              <label class="checkbox-row"><input type="checkbox" id="fa-chk-rbajo"> Manual</label>
            </div>
            <div class="field">
              <label for="fa-ralto">Resistencia AC a 75°C (Ω/km)</label>
              <input type="number" id="fa-ralto" min="0" max="1000" step="0.01" required disabled>
              <label class="checkbox-row"><input type="checkbox" id="fa-chk-ralto"> Manual</label>
            </div>
          </div>
        </div>

        <div class="form-section card">
          <div class="form-section-title">${icon("thermometerFill")} Condiciones ambientales</div>
          <div class="grid-2">
            <div class="field">
              <label for="fa-epsilon">Emisividad (ε)</label>
              <input type="number" id="fa-epsilon" min="0.23" max="0.91" step="0.01" value="0.5" required>
            </div>
            <div class="field">
              <label for="fa-alfa">Absortividad (α)</label>
              <input type="number" id="fa-alfa" min="0.23" max="0.91" step="0.01" value="0.5" required>
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <label for="fa-ta">Temperatura ambiente (°C)</label>
              <input type="number" id="fa-ta" min="-100" max="1000" step="0.1" value="25" required>
            </div>
            <div class="field">
              <label for="fa-tc">Temperatura máxima del conductor (°C)</label>
              <input type="number" id="fa-tc" min="0" max="1000" step="0.1" value="75" required>
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <label for="fa-vw">Velocidad del viento (m/s)</label>
              <input type="number" id="fa-vw" min="0" max="100" step="0.01" value="0.61" required>
            </div>
            <div class="field">
              <label for="fa-angulo">Ángulo viento-conductor (°)</label>
              <input type="number" id="fa-angulo" min="0" max="360" step="1" value="90" required>
            </div>
          </div>

          <div class="field">
            <label for="fa-elevacion">Elevación sobre el nivel del mar (m)</label>
            <input type="number" id="fa-elevacion" min="0" max="10000" step="1" value="0" required>
          </div>

          <div class="grid-2">
            <div class="field">
              <label for="fa-qse">Radiación solar total Qse (W/m²)</label>
              <input type="number" id="fa-qse" min="0" max="3000" step="1" value="1000" required disabled>
              <label class="checkbox-row"><input type="checkbox" id="fa-chk-qse"> Modificar manualmente</label>
            </div>
            <div class="field">
              <label for="fa-theta">Ángulo efectivo de incidencia solar θ (°)</label>
              <input type="number" id="fa-theta" min="0" max="1000" step="1" value="90" required disabled>
              <label class="checkbox-row"><input type="checkbox" id="fa-chk-theta"> Modificar manualmente</label>
            </div>
          </div>
        </div>
      </div>

      <div id="bloque-subterranea" hidden>
        <div class="form-section card">
          <div class="form-section-title">${icon("calculatorFill")} Cable</div>
          <div class="grid-2">
            <div class="field">
              <label for="fs-tipocable">Tipo de cable</label>
              <select id="fs-tipocable" required>
                <option value="Monopolar">Monopolar</option>
                <option value="Tripolar">Tripolar</option>
              </select>
            </div>
            <div class="field">
              <label for="fs-material">Material</label>
              <select id="fs-material" required>
                ${materialesSub.map((m) => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <label for="fs-calibre">Calibre</label>
              <select id="fs-calibre" required>
                ${calibresSub.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="fs-pantalla">Tipo de pantalla</label>
              <select id="fs-pantalla" required>
                ${tiposPantallaSub.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <label for="fs-nivelkv">Nivel de aislamiento (kV)</label>
              <select id="fs-nivelkv" required>
                ${nivelesKvSub.map((k) => `<option value="${k}">${k}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="fs-nivelpct">% de aislamiento</label>
              <select id="fs-nivelpct" required></select>
            </div>
          </div>

          <div class="field">
            <label for="fs-tierra">Puesta a tierra de pantallas</label>
            <select id="fs-tierra" required>
              <option value="Unipuntual">Unipuntual</option>
              <option value="Ambos Extremos">Ambos Extremos</option>
              <option value="Cross-bonding">Cross-bonding</option>
            </select>
            <span class="hint">${HINTS.puestaTierra}</span>
          </div>
        </div>

        <div class="form-section card">
          <div class="form-section-title">${icon("thermometerFill")} Condiciones de instalación</div>
          <div class="grid-2">
            <div class="field">
              <label for="fs-tension">Tensión del sistema (kV, línea-línea)</label>
              <input type="number" id="fs-tension" min="0" max="46" step="0.1" value="34.5" required>
            </div>
            <div class="field">
              <label for="fs-frecuencia">Frecuencia (Hz)</label>
              <input type="number" id="fs-frecuencia" min="0" max="300" step="1" value="60" required>
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <label for="fs-tempmax">Temperatura máxima del conductor (°C)</label>
              <input type="number" id="fs-tempmax" min="0" max="300" step="0.1" value="90" required>
            </div>
            <div class="field">
              <label for="fs-tempterreno">Temperatura del terreno (°C)</label>
              <input type="number" id="fs-tempterreno" min="-100" max="100" step="0.1" value="25" required>
              <span class="hint">${HINTS.tempTerreno}</span>
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <label for="fs-rhosuelo">Resistividad térmica del suelo (K·m/W)</label>
              <input type="number" id="fs-rhosuelo" min="-100" max="1000" step="0.01" value="1" required>
              <span class="hint">${HINTS.rhoSuelo}</span>
            </div>
            <div class="field">
              <label for="fs-uducto">Resistencia térmica del ducto (K·m/W)</label>
              <input type="number" id="fs-uducto" min="0" max="5" step="0.01" value="0.3" required>
              <span class="hint">${HINTS.uDucto}</span>
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <label for="fs-sepfases">Separación entre fases (m)</label>
              <input type="number" id="fs-sepfases" min="0" max="1" step="0.01" value="0.04" required>
              <span class="hint">${HINTS.separacionFases}</span>
            </div>
            <div class="field">
              <label for="fs-ncircuitos">Número de circuitos en el banco</label>
              <input type="number" id="fs-ncircuitos" min="0" max="6" step="1" value="1" required>
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <label for="fs-profundidad">Profundidad de enterramiento del banco (m)</label>
              <input type="number" id="fs-profundidad" min="0" max="10" step="0.01" value="1" required>
            </div>
            <div class="field">
              <label for="fs-sepductos">Separación entre ductos (m)</label>
              <input type="number" id="fs-sepductos" min="0.05" max="1" step="0.01" value="0.2" required disabled>
              <span class="hint">${HINTS.separacionDuctos}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="btn-row">
        <button type="submit" class="btn btn-primary">${icon("calculator")} Calcular</button>
      </div>
    </form>

    <div id="resultado-wrap"></div>
  `;

  const form = container.querySelector("#form-calc");
  const selTipoInstalacion = container.querySelector("#f-tipo-instalacion");
  const bloqueAerea = container.querySelector("#bloque-aerea");
  const bloqueSubterranea = container.querySelector("#bloque-subterranea");

  // No basta con ocultar el bloque inactivo: un campo required e invalido
  // dentro de el (ej. faTipo sin seleccionar, en el primer render) puede
  // bloquear reportValidity() en silencio si el navegador no lo excluye de
  // la validacion de forma confiable. Se alterna required explicitamente.
  function actualizarModoInstalacion() {
    const modo = selTipoInstalacion.value;
    bloqueAerea.hidden = modo !== "aerea";
    bloqueSubterranea.hidden = modo !== "subterranea";
    bloqueAerea.querySelectorAll('input:not([type="checkbox"]), select').forEach((el) => {
      el.required = modo === "aerea";
    });
    bloqueSubterranea.querySelectorAll('input:not([type="checkbox"]), select').forEach((el) => {
      el.required = modo === "subterranea";
    });
  }
  selTipoInstalacion.addEventListener("change", actualizarModoInstalacion);
  actualizarModoInstalacion();

  // ---------------------------------------------------------------- aerea
  const faTipo = container.querySelector("#fa-tipo");
  const faCalibre = container.querySelector("#fa-calibre");
  const faReferencia = container.querySelector("#fa-referencia");
  const faDiametro = container.querySelector("#fa-diametro");
  const faRbajo = container.querySelector("#fa-rbajo");
  const faRalto = container.querySelector("#fa-ralto");
  const faEpsilon = container.querySelector("#fa-epsilon");
  const faAlfa = container.querySelector("#fa-alfa");
  const faTa = container.querySelector("#fa-ta");
  const faTc = container.querySelector("#fa-tc");
  const faVw = container.querySelector("#fa-vw");
  const faAngulo = container.querySelector("#fa-angulo");
  const faElevacion = container.querySelector("#fa-elevacion");
  const faQse = container.querySelector("#fa-qse");
  const faTheta = container.querySelector("#fa-theta");
  const faChkDiametro = container.querySelector("#fa-chk-diametro");
  const faChkRbajo = container.querySelector("#fa-chk-rbajo");
  const faChkRalto = container.querySelector("#fa-chk-ralto");
  const faChkQse = container.querySelector("#fa-chk-qse");
  const faChkTheta = container.querySelector("#fa-chk-theta");

  let conductorAereoSeleccionado = null;

  function syncDefaultsAerea() {
    if (!faChkDiametro.checked) faDiametro.value = conductorAereoSeleccionado ? conductorAereoSeleccionado.diametro_cable_mm : "";
    if (!faChkRbajo.checked) faRbajo.value = conductorAereoSeleccionado ? conductorAereoSeleccionado.r_ac_25c_ohm_km : "";
    if (!faChkRalto.checked) faRalto.value = conductorAereoSeleccionado ? conductorAereoSeleccionado.r_ac_75c_ohm_km : "";
  }
  faChkDiametro.addEventListener("change", () => {
    faDiametro.disabled = !faChkDiametro.checked;
    if (!faChkDiametro.checked) syncDefaultsAerea();
  });
  faChkRbajo.addEventListener("change", () => {
    faRbajo.disabled = !faChkRbajo.checked;
    if (!faChkRbajo.checked) syncDefaultsAerea();
  });
  faChkRalto.addEventListener("change", () => {
    faRalto.disabled = !faChkRalto.checked;
    if (!faChkRalto.checked) syncDefaultsAerea();
  });
  faChkQse.addEventListener("change", () => {
    faQse.disabled = !faChkQse.checked;
    if (!faChkQse.checked) faQse.value = 1000;
  });
  faChkTheta.addEventListener("change", () => {
    faTheta.disabled = !faChkTheta.checked;
    if (!faChkTheta.checked) faTheta.value = 90;
  });

  faTipo.addEventListener("change", () => {
    const tipo = faTipo.value;
    const calibres = tipo ? distinct(aereos.filter((c) => c.tipo === tipo), "calibre_awg_kcmil") : [];
    faCalibre.innerHTML = calibres.length
      ? `<option value="">Seleccione…</option>` + calibres.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")
      : `<option value="">Seleccione un tipo primero</option>`;
    faCalibre.disabled = !calibres.length;
    faReferencia.innerHTML = `<option value="">Seleccione un calibre primero</option>`;
    faReferencia.disabled = true;
    conductorAereoSeleccionado = null;
    syncDefaultsAerea();
  });
  faCalibre.addEventListener("change", () => {
    const tipo = faTipo.value;
    const calibre = faCalibre.value;
    const refs = calibre ? aereos.filter((c) => c.tipo === tipo && c.calibre_awg_kcmil === calibre) : [];
    faReferencia.innerHTML = refs.length
      ? `<option value="">Seleccione…</option>` + refs.map((c) => `<option value="${escapeHtml(c.nombre_clave)}">${escapeHtml(c.nombre_clave)}</option>`).join("")
      : `<option value="">Seleccione un calibre primero</option>`;
    faReferencia.disabled = !refs.length;
    conductorAereoSeleccionado = null;
    syncDefaultsAerea();
  });
  faReferencia.addEventListener("change", () => {
    const tipo = faTipo.value;
    const calibre = faCalibre.value;
    const nombre = faReferencia.value;
    conductorAereoSeleccionado = aereos.find((c) => c.tipo === tipo && c.calibre_awg_kcmil === calibre && c.nombre_clave === nombre) || null;
    syncDefaultsAerea();
  });

  // ---------------------------------------------------------- subterranea
  const fsTipoCable = container.querySelector("#fs-tipocable");
  const fsMaterial = container.querySelector("#fs-material");
  const fsCalibre = container.querySelector("#fs-calibre");
  const fsPantalla = container.querySelector("#fs-pantalla");
  const fsNivelKv = container.querySelector("#fs-nivelkv");
  const fsNivelPct = container.querySelector("#fs-nivelpct");
  const fsTierra = container.querySelector("#fs-tierra");
  const fsTension = container.querySelector("#fs-tension");
  const fsFrecuencia = container.querySelector("#fs-frecuencia");
  const fsTempMax = container.querySelector("#fs-tempmax");
  const fsTempTerreno = container.querySelector("#fs-tempterreno");
  const fsRhoSuelo = container.querySelector("#fs-rhosuelo");
  const fsUDucto = container.querySelector("#fs-uducto");
  const fsSepFases = container.querySelector("#fs-sepfases");
  const fsNCircuitos = container.querySelector("#fs-ncircuitos");
  const fsProfundidad = container.querySelector("#fs-profundidad");
  const fsSepDuctos = container.querySelector("#fs-sepductos");

  function actualizarNivelPct() {
    const kv = parseFloat(fsNivelKv.value);
    const opciones = kv === 46 ? [100] : [100, 133];
    fsNivelPct.innerHTML = opciones.map((p) => `<option value="${p}">${p}</option>`).join("");
  }
  function actualizarDisponibilidadSub() {
    const esTripolar = fsTipoCable.value === "Tripolar";
    fsTierra.disabled = esTripolar;
    fsSepFases.disabled = esTripolar;
    const numCircuitos = parseInt(fsNCircuitos.value, 10);
    fsSepDuctos.disabled = !(numCircuitos > 1);
  }
  fsNivelKv.addEventListener("change", actualizarNivelPct);
  fsTipoCable.addEventListener("change", actualizarDisponibilidadSub);
  fsNCircuitos.addEventListener("input", actualizarDisponibilidadSub);
  actualizarNivelPct();
  actualizarDisponibilidadSub();

  // -------------------------------------------------------------- submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    if (selTipoInstalacion.value === "aerea") {
      const p = {
        diametroMm: parseFloat(faDiametro.value),
        rBajoOhmKm: parseFloat(faRbajo.value),
        rAltoOhmKm: parseFloat(faRalto.value),
        epsilon: parseFloat(faEpsilon.value),
        alfa: parseFloat(faAlfa.value),
        taC: parseFloat(faTa.value),
        tcC: parseFloat(faTc.value),
        vwMs: parseFloat(faVw.value),
        anguloVientoDeg: parseFloat(faAngulo.value),
        elevacionM: parseFloat(faElevacion.value),
        qseWm2: parseFloat(faQse.value),
        thetaDeg: parseFloat(faTheta.value),
      };
      const data = calcularAmpacidadAerea(p);
      renderResultadoAerea(data, p, { tipo: faTipo.value, calibre: faCalibre.value, referencia: faReferencia.value });
      return;
    }

    const tipoCable = fsTipoCable.value;
    const material = fsMaterial.value;
    const calibre = fsCalibre.value;
    const tipoPantalla = fsPantalla.value;
    const nivelAislamientoKv = parseFloat(fsNivelKv.value);
    const nivelAislamientoPct = parseFloat(fsNivelPct.value);

    const cable = cables.find(
      (row) =>
        row.calibre_awg_kcmil === calibre &&
        row.material === material &&
        row.tipo_pantalla === tipoPantalla &&
        row.nivel_aislamiento_kv === nivelAislamientoKv &&
        row.nivel_aislamiento_pct === nivelAislamientoPct
    );

    if (!cable) {
      renderError("No existe una construcción de cable para esa combinación.");
      return;
    }

    const p = {
      tipoCable,
      cable,
      tipoPantalla,
      nivelAislamientoKv,
      puestaTierra: fsTierra.value,
      tensionSistemaKv: parseFloat(fsTension.value),
      frecuenciaHz: parseFloat(fsFrecuencia.value),
      tempMaxC: parseFloat(fsTempMax.value),
      tempTerrenoC: parseFloat(fsTempTerreno.value),
      rhoSueloKmW: parseFloat(fsRhoSuelo.value),
      uDuctoKmW: parseFloat(fsUDucto.value),
      separacionFasesM: parseFloat(fsSepFases.value),
      numCircuitos: parseInt(fsNCircuitos.value, 10),
      profundidadBancoM: parseFloat(fsProfundidad.value),
      separacionDuctosM: parseFloat(fsSepDuctos.value),
    };

    try {
      const data = calcularAmpacidadSubterranea(p);
      renderResultadoSubterranea(data, p, { material, calibre, tipoPantalla, nivelAislamientoKv, nivelAislamientoPct });
    } catch (err) {
      renderError(err.message);
    }
  });

  function renderError(msg) {
    const wrap = container.querySelector("#resultado-wrap");
    wrap.innerHTML = `<div class="callout callout-danger">${escapeHtml(msg)}</div>`;
    wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function montarResultado(reporte) {
    const wrap = container.querySelector("#resultado-wrap");
    wrap.innerHTML = `
      <div class="card">
        <div class="tabs">
          <button type="button" class="tab-btn active" data-tab="resultado">Resultado</button>
          <button type="button" class="tab-btn" data-tab="reporte">Reporte</button>
          <button type="button" class="tab-btn" data-tab="criterios">Criterios de cálculo</button>
        </div>
        ${reporte}
        <div class="tab-panel" data-panel="criterios" hidden>
          <div class="criterios-content">${renderCriterios(CRITERIOS_AMPACIDAD)}</div>
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

  function renderResultadoAerea(data, p, ctx) {
    const i = data.intermedios;
    const reporteTexto = [
      `CALCULADORA NORMATIVA 2026`,
      `Celsia Colombia S.A. E.S.P.`,
      `Ampacidad de conductor aéreo (IEEE Std 738)`,
      ``,
      `------------------------`,
      `PARÁMETROS DE ENTRADA:`,
      `Tipo: ${ctx.tipo}`,
      `Calibre: ${ctx.calibre}`,
      `Referencia: ${ctx.referencia}`,
      `Diámetro: ${fmt(p.diametroMm)} mm`,
      `Resistencia AC 25°C: ${fmt(p.rBajoOhmKm)} Ω/km`,
      `Resistencia AC 75°C: ${fmt(p.rAltoOhmKm)} Ω/km`,
      `Emisividad (ε): ${fmt(p.epsilon)}`,
      `Absortividad (α): ${fmt(p.alfa)}`,
      `Temperatura ambiente: ${fmt(p.taC)} °C`,
      `Temperatura máxima del conductor: ${fmt(p.tcC)} °C`,
      `Velocidad del viento: ${fmt(p.vwMs)} m/s`,
      `Ángulo viento-conductor: ${fmt(p.anguloVientoDeg)} °`,
      `Elevación sobre el nivel del mar: ${fmt(p.elevacionM)} m`,
      `Radiación solar total (Qse): ${fmt(p.qseWm2)} W/m²`,
      `Ángulo efectivo de incidencia solar (θ): ${fmt(p.thetaDeg)} °`,
      ``,
      `-------------------`,
      `RESULTADOS:`,
      `Qc (convección): ${fmt(i.qc)} W/m`,
      `Qr (radiación emitida): ${fmt(i.qr)} W/m`,
      `Qs (radiación solar absorbida): ${fmt(i.qs)} W/m`,
      `R (resistencia efectiva): ${fmt(i.r * 1000, 4)} Ω/km`,
      `Ampacidad: ${fmt(data.ampacidad)} A`,
    ].join("\n");

    const reporteHtml = `
      <div class="tab-panel" data-panel="resultado">
        <div class="result-report">
          <div class="result-stat-hero">
            <div class="value">${fmt(data.ampacidad)}<span class="unit">A</span></div>
            <div class="label">Ampacidad admisible — conductor aéreo</div>
          </div>
        </div>
      </div>
      <div class="tab-panel" data-panel="reporte" hidden>
        <div class="report-block">${escapeHtml(reporteTexto)}</div>
      </div>
    `;

    montarResultado(reporteHtml);
  }

  function renderResultadoSubterranea(data, p, ctx) {
    const i = data.intermedios;
    const reporteTexto = [
      `CALCULADORA NORMATIVA 2026`,
      `Celsia Colombia S.A. E.S.P.`,
      `Ampacidad de cable subterráneo (IEC 60287-1-1)`,
      ``,
      `------------------------`,
      `PARÁMETROS DE ENTRADA:`,
      `Tipo de cable: ${p.tipoCable}`,
      `Material: ${ctx.material}`,
      `Calibre: ${ctx.calibre}`,
      `Tipo de pantalla: ${ctx.tipoPantalla}`,
      `Nivel de aislamiento: ${fmt(ctx.nivelAislamientoKv, 0)} kV — ${fmt(ctx.nivelAislamientoPct, 0)}%`,
      `Puesta a tierra de pantallas: ${p.tipoCable === "Tripolar" ? "N/A (tripolar)" : p.puestaTierra}`,
      `Tensión del sistema: ${fmt(p.tensionSistemaKv)} kV`,
      `Frecuencia: ${fmt(p.frecuenciaHz, 0)} Hz`,
      `Temperatura máxima del conductor: ${fmt(p.tempMaxC)} °C`,
      `Temperatura del terreno: ${fmt(p.tempTerrenoC)} °C`,
      `Resistividad térmica del suelo: ${fmt(p.rhoSueloKmW)} K·m/W`,
      `Resistencia térmica del ducto: ${fmt(p.uDuctoKmW)} K·m/W`,
      `Separación entre fases: ${p.tipoCable === "Tripolar" ? "N/A (tripolar)" : fmt(p.separacionFasesM)} m`,
      `Número de circuitos en el banco: ${fmt(p.numCircuitos, 0)}`,
      `Profundidad de enterramiento del banco: ${fmt(p.profundidadBancoM)} m`,
      `Separación entre ductos: ${p.numCircuitos > 1 ? fmt(p.separacionDuctosM) + " m" : "N/A (1 circuito)"}`,
      ``,
      `-------------------`,
      `RESULTADOS:`,
      `R (resistencia AC efectiva): ${fmt(i.varR, 8)} Ω/m`,
      `Wd (pérdida dieléctrica): ${fmt(i.varWd, 6)} W/m`,
      `λ1 (factor de pérdidas en pantalla): ${fmt(i.lambda1, 4)}`,
      `T1 (resistencia térmica del aislamiento): ${fmt(i.T1, 4)} K·m/W`,
      `T2 (resistencia térmica del relleno): ${fmt(i.T2, 4)} K·m/W`,
      `T3 (resistencia térmica de la chaqueta): ${fmt(i.T3, 4)} K·m/W`,
      `T4 (resistencia térmica externa): ${fmt(i.T4, 4)} K·m/W`,
      `Δθ (salto térmico admisible): ${fmt(i.deltaTheta)} °C`,
      `Ampacidad: ${fmt(data.ampacidad)} A`,
      i.corrientePantallaA != null ? `Corriente circulante en la pantalla: ${fmt(i.corrientePantallaA)} A` : null,
      i.tensionInducidaVKm != null ? `Tensión inducida en la pantalla (circuito abierto): ${fmt(i.tensionInducidaVKm)} V/km` : null,
    ]
      .filter((line) => line !== null)
      .join("\n");

    let pantallaHtml = "";
    if (i.corrientePantallaA != null) {
      pantallaHtml = `
        <div class="result-extra-stat">
          <span class="label">Corriente circulante en la pantalla</span>
          <span class="value">${fmt(i.corrientePantallaA)} A</span>
        </div>`;
    } else if (i.tensionInducidaVKm != null) {
      pantallaHtml = `
        <div class="result-extra-stat">
          <span class="label">Tensión inducida en la pantalla (circuito abierto)</span>
          <span class="value">${fmt(i.tensionInducidaVKm)} V/km</span>
        </div>`;
    }

    const reporteHtml = `
      <div class="tab-panel" data-panel="resultado">
        <div class="result-report">
          <div class="result-stat-hero">
            <div class="value">${fmt(data.ampacidad)}<span class="unit">A</span></div>
            <div class="label">Ampacidad admisible — cable subterráneo</div>
          </div>
          ${pantallaHtml}
        </div>
      </div>
      <div class="tab-panel" data-panel="reporte" hidden>
        <div class="report-block">${escapeHtml(reporteTexto)}</div>
      </div>
    `;

    montarResultado(reporteHtml);
  }
}
