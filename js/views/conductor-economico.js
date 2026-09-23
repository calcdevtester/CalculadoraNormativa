// Conductor economico de una linea nueva: compara de 2 a 5 opciones de
// conductor por su costo total actualizado (inversion inicial + valor
// presente del costo de las perdidas durante los anios de analisis). Sigue
// el mismo patron de Perdidas: una tarjeta "Datos de la linea", una de
// "Supuestos economicos" y una tarjeta por opcion (agregar/quitar, entre 2
// y 5). Los precios los escribe el usuario -- los catalogos de conductores
// de esta app no traen precios. La logica vive en ../calc/conductor-economico.js.

import { fmt, fmtPercent, loadData, distinct, escapeHtml } from "../util/format.js";
import { compararOpciones, sensibilidad } from "../calc/conductor-economico.js";
import { icon } from "../icons.js";
import { renderCriterios } from "../util/criterios-render.js";
import { conductorEconomico as CRITERIOS_CONDUCTOR_ECONOMICO } from "../data/criterios.js";

const MIN_OPCIONES = 2;
const MAX_OPCIONES = 5;

const MODOS = { potencia: "Potencia activa", aparente: "Potencia aparente", corriente: "Corriente" };

// Los numeros del resto de la app usan punto decimal (en-US); las cifras de
// dinero llevan coma de miles para leerse bien, igual que en el reporte.
const numMiles = (v, min = 0, max = 0) =>
  Number.isFinite(v) ? v.toLocaleString("en-US", { minimumFractionDigits: min, maximumFractionDigits: max }) : "—";
const fmtPesos = (v) => (Number.isFinite(v) ? `$ ${numMiles(v)}` : "—");
const fmtMillones = (v) => (Number.isFinite(v) ? numMiles(v / 1e6, 2, 2) : "—");

export async function render(container) {
  const aereos = await loadData("conductores-aereos");
  const subterraneos = await loadData("conductores-subterraneos");

  container.innerHTML = `
    <div class="breadcrumb"><a href="#/">Inicio</a> <span>/</span> <span>Conductor económico</span></div>
    <h1 class="page-title">Conductor económico</h1>
    <p class="page-subtitle">Compara opciones de conductor para una línea por su costo total (inversión inicial + valor presente del costo de las pérdidas).</p>

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
              <option value="potencia">${MODOS.potencia}</option>
              <option value="aparente">${MODOS.aparente}</option>
              <option value="corriente">${MODOS.corriente}</option>
            </select>
          </div>
        </div>

        <div class="field" id="wrap-potencia">
          <label for="f-potencia">Potencia activa (kW)</label>
          <input type="number" id="f-potencia" min="0" max="500000" step="1" value="19900" required>
          <span class="hint">Demanda del año 1 de operación.</span>
        </div>
        <div class="field" id="wrap-aparente" hidden>
          <label for="f-potencia-aparente">Potencia aparente (kVA)</label>
          <input type="number" id="f-potencia-aparente" min="0" max="500000" step="1" value="22110">
        </div>
        <div class="field" id="wrap-corriente" hidden>
          <label for="f-corriente">Corriente (A)</label>
          <input type="number" id="f-corriente" min="0" max="10000" step="0.1" value="370">
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="f-fp">Factor de potencia (FP)</label>
            <input type="number" id="f-fp" min="-1" max="1" step="0.01" value="0.9" required>
          </div>
          <div class="field">
            <label for="f-fc">Factor de carga (FC)</label>
            <input type="number" id="f-fc" min="0" max="1" step="0.0001" value="0.4" required>
            <span class="hint">Circuitos de uso FC=1, conexiones solares FC= 0.28 a 0.53</span>
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="f-longitud">Longitud de la línea (km)</label>
            <input type="number" id="f-longitud" min="0" max="500" step="0.01" value="10" required>
          </div>
          <div class="field">
            <label for="f-crecimiento">Crecimiento anual de la demanda (%)</label>
            <input type="number" id="f-crecimiento" min="0" max="100" step="any" value="0" required>
            <span class="hint">0% si la demanda no crece (ej. planta de generación ya dimensionada). Con demanda creciente, referencia orientativa: 2-5% anual.</span>
          </div>
        </div>
      </div>

      <div class="form-section card">
        <div class="form-section-title">${icon("coinFill")} Supuestos económicos</div>
        <div class="grid-2">
          <div class="field">
            <label for="f-anios">Años de análisis</label>
            <input type="number" id="f-anios" min="1" max="60" step="1" value="25" required>
            <span class="hint">Horizonte de tiempo o vida útil esperada del proyecto.</span>
          </div>
          <div class="field">
            <label for="f-tasa">Tasa de descuento (%)</label>
            <input type="number" id="f-tasa" min="0" max="100" step="any" value="10" required>
            <span class="hint">Costo de oportunidad del capital, para traer a valor presente el costo de las pérdidas. Referencia orientativa: 8-14% anual.</span>
          </div>
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="f-precio">Precio de la energía perdida ($/kWh)</label>
            <input type="number" id="f-precio" min="0" step="any" required>
            <span class="hint">Costo de la energía perdida en el año 1 (compra o costo reconocido, no la tarifa de venta).</span>
          </div>
          <div class="field">
            <label for="f-escalada">Aumento anual del precio (%)</label>
            <input type="number" id="f-escalada" min="0" max="100" step="any" value="2.5" required>
            <span class="hint">0% si el precio se mantiene igual. Referencia orientativa: 2-5% anual (cercano a la inflación esperada).</span>
          </div>
        </div>
      </div>

      <div id="opciones-container"></div>

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
  const fLongitud = container.querySelector("#f-longitud");
  const fCrecimiento = container.querySelector("#f-crecimiento");
  const fAnios = container.querySelector("#f-anios");
  const fTasa = container.querySelector("#f-tasa");
  const fPrecio = container.querySelector("#f-precio");
  const fEscalada = container.querySelector("#f-escalada");

  const campoPorModo = { potencia: fPotencia, aparente: fPotenciaAparente, corriente: fCorriente };

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

  // --- Opciones de conductor -------------------------------------------
  let nextOpcionId = 0;
  function nuevoEstadoOpcion() {
    return {
      red: "Aerea",
      material: null,
      calibre: null,
      manualResistencia: false,
      resistenciaOhmKm: null,
      numConductoresPorFase: 1,
      costoConductorKm: null,
      costoInstalacionKm: null,
    };
  }
  const opciones = [];
  for (let i = 0; i < MIN_OPCIONES; i++) opciones.push({ id: nextOpcionId++, state: nuevoEstadoOpcion() });

  function datasetPara(red) {
    return red === "Aerea" ? aereos : subterraneos;
  }
  function campoMaterialPara(red) {
    return red === "Aerea" ? "tipo" : "material_conductor";
  }

  // Cada opcion persiste su seleccion en o.state; al re-renderizar (por
  // agregar/quitar otra opcion) las tarjetas existentes recrean su DOM pero
  // restauran los valores ya elegidos, en vez de resetear a los defaults.
  function renderOpcionHtml(o, index) {
    const id = o.id;
    const num = index + 1;
    const esUltimo = index === opciones.length - 1;
    const quitarBtn =
      opciones.length > MIN_OPCIONES
        ? `<button type="button" class="btn btn-ghost btn-opcion-quitar" data-id="${id}" style="margin-left:auto; padding:2px 8px; font-size:0.72rem; text-transform:none; letter-spacing:normal;">${icon("close")} Quitar</button>`
        : "";
    const agregarBtn =
      esUltimo && opciones.length < MAX_OPCIONES
        ? `<div class="btn-row" style="margin-top: var(--space-4);">
            <button type="button" class="btn btn-agregar-tramo btn-agregar-opcion">${icon("plus")} Agregar opción</button>
          </div>`
        : "";
    return `
      <div class="form-section card tramo-block" data-id="${id}">
        <div class="form-section-title">${icon("calculatorFill")} Conductor — Opción ${num}${quitarBtn}</div>
        <div class="grid-2">
          <div class="field">
            <label for="f-red-${id}">Tipo de red</label>
            <select id="f-red-${id}" required>
              <option value="Aerea" ${o.state.red === "Aerea" ? "selected" : ""}>Aérea</option>
              <option value="Subterranea" ${o.state.red === "Subterranea" ? "selected" : ""}>Subterránea</option>
            </select>
          </div>
          <div class="field">
            <label for="f-material-${id}">Material del conductor</label>
            <select id="f-material-${id}" required></select>
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
              <label class="checkbox-row"><input type="checkbox" id="chk-resistencia-${id}" ${o.state.manualResistencia ? "checked" : ""}> Manual</label>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="f-nconductores-${id}">Número de conductores por fase</label>
            <input type="number" id="f-nconductores-${id}" min="1" max="8" step="1" value="${o.state.numConductoresPorFase}" required>
            <span class="hint">Conductores en paralelo (haz). La resistencia efectiva se divide entre este número.</span>
          </div>
          <div class="field">
            <label for="f-costo-cond-${id}">Costo del conductor ($/km)</label>
            <input type="number" id="f-costo-cond-${id}" min="0" step="any" value="${o.state.costoConductorKm ?? ""}" required>
            <span class="hint">Precio de UN conductor (un hilo) por km. Se multiplica internamente por las 3 fases y por el número de conductores por fase.</span>
          </div>
        </div>

        <div class="field">
          <label for="f-costo-inst-${id}">Costo de instalación ($/km)</label>
          <input type="number" id="f-costo-inst-${id}" min="0" step="any" value="${o.state.costoInstalacionKm ?? ""}">
          <span class="hint">Postes, aisladores, herrajes, mano de obra, transporte, etc. (sin el conductor). Vacío = solo se considera el costo del conductor.</span>
        </div>
        ${agregarBtn}
      </div>
    `;
  }

  function bindOpcionEvents() {
    opciones.forEach((o) => {
      const id = o.id;
      const selRed = container.querySelector(`#f-red-${id}`);
      const selMaterial = container.querySelector(`#f-material-${id}`);
      const selCalibre = container.querySelector(`#f-calibre-${id}`);
      const fResistencia = container.querySelector(`#f-resistencia-${id}`);
      const chkResistencia = container.querySelector(`#chk-resistencia-${id}`);
      const fN = container.querySelector(`#f-nconductores-${id}`);
      const fCostoCond = container.querySelector(`#f-costo-cond-${id}`);
      const fCostoInst = container.querySelector(`#f-costo-inst-${id}`);

      function poblarMaterial() {
        const opcionesMaterial = distinct(datasetPara(selRed.value), campoMaterialPara(selRed.value));
        selMaterial.innerHTML = opcionesMaterial.map((m) => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
        if (o.state.material && opcionesMaterial.includes(o.state.material)) selMaterial.value = o.state.material;
        else o.state.material = selMaterial.value || null;
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
        if (o.state.calibre && calibres.includes(o.state.calibre)) selCalibre.value = o.state.calibre;
        else o.state.calibre = null;
        o.filaSeleccionada = resolverFila();
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
        if (!chkResistencia.checked) fResistencia.value = o.filaSeleccionada ? o.filaSeleccionada.r_ac_75c_ohm_km : "";
      }

      selRed.addEventListener("change", () => {
        o.state.red = selRed.value;
        o.state.material = null;
        o.state.calibre = null;
        poblarMaterial();
      });
      selMaterial.addEventListener("change", () => {
        o.state.material = selMaterial.value;
        o.state.calibre = null;
        poblarCalibre();
      });
      selCalibre.addEventListener("change", () => {
        o.state.calibre = selCalibre.value;
        o.filaSeleccionada = resolverFila();
        syncDefaults();
      });
      chkResistencia.addEventListener("change", () => {
        fResistencia.disabled = !chkResistencia.checked;
        o.state.manualResistencia = chkResistencia.checked;
        if (!chkResistencia.checked) syncDefaults();
      });
      fResistencia.addEventListener("input", () => {
        if (chkResistencia.checked) o.state.resistenciaOhmKm = fResistencia.value;
      });
      fN.addEventListener("input", () => {
        o.state.numConductoresPorFase = fN.value;
      });
      fCostoCond.addEventListener("input", () => {
        o.state.costoConductorKm = fCostoCond.value;
      });
      fCostoInst.addEventListener("input", () => {
        o.state.costoInstalacionKm = fCostoInst.value;
      });

      fResistencia.disabled = !chkResistencia.checked;
      poblarMaterial();
      if (chkResistencia.checked && o.state.resistenciaOhmKm != null) {
        fResistencia.value = o.state.resistenciaOhmKm;
      }

      o.getEstado = () => ({
        red: selRed.value,
        material: selMaterial.value,
        calibre: selCalibre.value,
        resistenciaOhmKm: parseFloat(fResistencia.value),
        numConductoresPorFase: parseInt(fN.value, 10) || 1,
        costoConductorKm: parseFloat(fCostoCond.value),
        costoInstalacionKm: parseFloat(fCostoInst.value) || 0,
        instalacionIndicada: fCostoInst.value.trim() !== "",
        // Solo hay referencia de ampacidad en los aereos (corriente a 75°C del catalogo, por conductor).
        ampacidadA: selRed.value === "Aerea" && o.filaSeleccionada ? o.filaSeleccionada.corriente_75c_a ?? null : null,
      });
    });

    container.querySelectorAll(".btn-opcion-quitar").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id, 10);
        const idx = opciones.findIndex((o) => o.id === id);
        if (idx !== -1) opciones.splice(idx, 1);
        renderOpciones();
      });
    });

    const btnAgregar = container.querySelector(".btn-agregar-opcion");
    if (btnAgregar) {
      btnAgregar.addEventListener("click", () => {
        opciones.push({ id: nextOpcionId++, state: nuevoEstadoOpcion() });
        renderOpciones();
      });
    }
  }

  function renderOpciones() {
    const cont = container.querySelector("#opciones-container");
    cont.innerHTML = opciones.map((o, i) => renderOpcionHtml(o, i)).join("");
    bindOpcionEvents();
  }

  renderOpciones();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const base = {
      tensionKv: parseFloat(fTension.value),
      potenciaActivaKw: resolverPotenciaKw(),
      factorPotencia: parseFloat(fFp.value),
      factorCarga: parseFloat(fFc.value),
      longitudKm: parseFloat(fLongitud.value),
      crecimientoDemandaPct: parseFloat(fCrecimiento.value),
      anios: parseInt(fAnios.value, 10),
      tasaDescuentoPct: parseFloat(fTasa.value),
      precioKwh: parseFloat(fPrecio.value),
      escaladaEnergiaPct: parseFloat(fEscalada.value),
    };
    const estados = opciones.map((o) => o.getEstado());
    const r = compararOpciones(base, estados);
    const s = sensibilidad(base, estados);
    renderResultado(r, s, base, estados, { modo: modoEntrada, datoPartida: parseFloat(campoPorModo[modoEntrada].value) });
  });

  const nombreRed = (red) => (red === "Aerea" ? "Aérea" : "Subterránea");
  const conductorTexto = (e) => `${e.material} ${e.calibre}${e.numConductoresPorFase > 1 ? ` ×${e.numConductoresPorFase}` : ""}`;

  function avisosAmpacidad(r, estados, base) {
    const avisos = [];
    r.opciones.forEach((o, i) => {
      const e = estados[i];
      if (e.ampacidadA == null) return;
      const porConductor = o.corrienteUltimoAnio / e.numConductoresPorFase;
      if (porConductor > e.ampacidadA) {
        avisos.push(
          `Opción ${i + 1} (${conductorTexto(e)}): la corriente del año ${base.anios} (${fmt(porConductor, 1)} A por conductor) supera los ${fmt(e.ampacidadA, 0)} A que da el catálogo a 75°C.`
        );
      }
    });
    return avisos;
  }

  function matrizHtml(r, estados, base) {
    const cab = r.opciones
      .map((o, i) => `<th>Opción ${i + 1}${i === r.mejor ? ' <span class="badge badge-success">Menor costo</span>' : ""}</th>`)
      .join("");
    const fila = (etiqueta, valor, clase = "") =>
      `<tr class="${clase}"><td style="text-align:left; font-weight:600;">${etiqueta}</td>${r.opciones.map((o, i) => `<td>${valor(o, i)}</td>`).join("")}</tr>`;
    const equilibrio = (o, i) => {
      if (i === r.indiceBase) return "Base";
      if (o.inversion <= r.opciones[r.indiceBase].inversion) return "—";
      return o.puntoEquilibrio == null ? `No en ${base.anios} años` : `Año ${o.puntoEquilibrio}`;
    };
    return `
      <div class="result-subhead">Comparación de costos</div>
      <div class="table-scroll">
        <table class="criterios-table">
          <thead><tr><th></th>${cab}</tr></thead>
          <tbody>
            ${fila("Conductor", (o, i) => escapeHtml(conductorTexto(estados[i])))}
            ${fila("Conductores ($)", (o) => numMiles(o.costoConductores))}
            ${fila("Instalación ($)", (o) => numMiles(o.costoInstalacion))}
            ${fila("Inversión inicial ($)", (o) => numMiles(o.inversion))}
            ${fila("Pérdidas del año 1 (%)", (o) => fmtPercent(o.perdidasPctAnio1))}
            ${fila("Pérdidas del año 1 (MWh)", (o) => numMiles(o.energiaKwhAnio1 / 1000, 1, 1))}
            ${fila("Costo de las pérdidas, valor presente ($)", (o) => numMiles(o.costoPerdidasVp))}
            ${fila("Costo total actualizado ($)", (o) => numMiles(o.costoTotal), "current-row")}
            ${fila("Diferencia frente al menor costo ($)", (o) => (o.diferenciaVsMejor === 0 ? "—" : `+${numMiles(o.diferenciaVsMejor)}`))}
            ${fila("Compensa su mayor inversión", equilibrio)}
          </tbody>
        </table>
      </div>
      <p class="text-muted text-sm" style="margin: var(--space-2) 0 0;">«Compensa su mayor inversión» compara cada opción con la de menor inversión (Opción ${r.indiceBase + 1}): el año en que su costo acumulado, a valor presente, deja de ser mayor.</p>
    `;
  }

  function sensibilidadHtml(s, r) {
    const cab = r.opciones.map((o, i) => `<th>Opción ${i + 1}</th>`).join("");
    const filas = s.filas
      .map((f) => {
        const celdas = f.totales.map((t) => `<td>${fmtMillones(t)}</td>`).join("");
        return `<tr><td style="text-align:left; font-weight:600;">${escapeHtml(f.etiqueta)}</td>${celdas}<td>Opción ${f.ganador + 1}</td></tr>`;
      })
      .join("");
    const cambian = s.filas.filter((f) => f.ganador !== s.filas[0].ganador).length;
    const mensaje = s.cambia
      ? `La opción de menor costo cambia en ${cambian} de ${s.filas.length - 1} escenarios: conviene asegurar bien esos supuestos antes de decidir.`
      : `La opción de menor costo es la misma en todos los escenarios: la decisión es robusta frente a estos cambios.`;
    return `
      <div class="result-subhead">Sensibilidad (costo total actualizado, millones de $)</div>
      <p class="text-muted text-sm" style="margin: 0 0 var(--space-3);">${mensaje}</p>
      <div class="table-scroll">
        <table class="criterios-table">
          <thead><tr><th>Escenario</th>${cab}<th>Menor costo</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    `;
  }

  function reporteTexto(r, s, base, estados, { modo, datoPartida }) {
    const unidadDato = { potencia: "kW", aparente: "kVA", corriente: "A" }[modo];
    const potenciaActivaLinea = `Potencia activa (año 1): ${fmt(base.potenciaActivaKw, 0)} kW`;
    const parametrosOpciones = estados.map((e, i) =>
      [
        ``,
        `Opción ${i + 1}:`,
        `  Tipo de red: ${nombreRed(e.red)}`,
        `  Material del conductor: ${e.material}`,
        `  Calibre: ${e.calibre}`,
        `  Resistencia AC a 75°C (por conductor): ${fmt(e.resistenciaOhmKm)} Ω/km`,
        `  Conductores por fase: ${e.numConductoresPorFase}`,
        `  Costo del conductor: ${fmtPesos(e.costoConductorKm)}/km`,
        `  Costo de instalación: ${e.instalacionIndicada ? `${fmtPesos(e.costoInstalacionKm)}/km` : "no indicado (solo se considera el conductor)"}`,
      ].join("\n")
    );
    const resultadosOpciones = r.opciones.map((o, i) => {
      const eq =
        i === r.indiceBase
          ? "Base (menor inversión)"
          : o.inversion <= r.opciones[r.indiceBase].inversion
            ? "—"
            : o.puntoEquilibrio == null
              ? `no en ${base.anios} años`
              : `año ${o.puntoEquilibrio}`;
      return [
        ``,
        `Opción ${i + 1} — ${conductorTexto(estados[i])}:`,
        `  Resistencia efectiva (R/N): ${fmt(o.resistenciaEfectivaOhmKm)} Ω/km`,
        `  Inversión inicial: ${fmtPesos(o.inversion)} (conductores ${fmtPesos(o.costoConductores)} + instalación ${fmtPesos(o.costoInstalacion)})`,
        `  Pérdidas del año 1: ${fmtPercent(o.perdidasPctAnio1)} (${fmt(o.energiaKwhAnio1 / 1000, 1)} MWh)`,
        `  Costo de las pérdidas (valor presente): ${fmtPesos(o.costoPerdidasVp)}`,
        `  Costo total actualizado: ${fmtPesos(o.costoTotal)}`,
        `  Diferencia frente al menor costo: ${o.diferenciaVsMejor === 0 ? "—" : `+${fmtPesos(o.diferenciaVsMejor)}`}`,
        `  Compensa su mayor inversión: ${eq}`,
      ].join("\n");
    });
    const sens = s.filas.map((f) => `  ${f.etiqueta}: Opción ${f.ganador + 1}`);
    return [
      `CALCULADORA NORMATIVA 2026`,
      `Celsia Colombia S.A. E.S.P.`,
      `Conductor económico`,
      ``,
      `------------------------`,
      `PARÁMETROS DE ENTRADA:`,
      `Nivel de tensión de la línea: ${fmt(base.tensionKv)} kV`,
      `Dato de partida: ${MODOS[modo]} (${fmt(datoPartida)} ${unidadDato})`,
      ...(modo === "potencia" ? [potenciaActivaLinea] : []),
      `Factor de potencia: ${fmt(base.factorPotencia)}`,
      `Factor de carga (FC): ${fmt(base.factorCarga, 4)}`,
      `Longitud de la línea: ${fmt(base.longitudKm)} km`,
      `Crecimiento anual de la demanda: ${fmtPercent(base.crecimientoDemandaPct)}`,
      `Años de análisis: ${base.anios}`,
      `Tasa de descuento: ${fmtPercent(base.tasaDescuentoPct)}`,
      `Precio de la energía perdida (año 1): ${fmtPesos(base.precioKwh)}/kWh`,
      `Aumento anual del precio de la energía: ${fmtPercent(base.escaladaEnergiaPct)}`,
      ...parametrosOpciones,
      ``,
      `-------------------`,
      `RESULTADOS:`,
      ...(modo === "potencia" ? [] : [potenciaActivaLinea]),
      `Corriente (año 1): ${fmt(r.opciones[0].corrienteAnio1)} A`,
      ...resultadosOpciones,
      ``,
      `Opción de menor costo total: Opción ${r.mejor + 1} — ${conductorTexto(estados[r.mejor])} (${fmtPesos(r.opciones[r.mejor].costoTotal)})`,
      ``,
      `Sensibilidad (opción de menor costo en cada escenario):`,
      ...sens,
    ].join("\n");
  }

  function renderResultado(r, s, base, estados, dato) {
    const wrap = container.querySelector("#resultado-wrap");
    const calculable = r.opciones.every((o) => Number.isFinite(o.costoTotal));

    let resultadoHtml;
    if (!calculable) {
      resultadoHtml = `<div class="callout callout-danger">No se pudo calcular con estos datos: revisa que la tensión, el factor de potencia y las resistencias sean válidos.</div>`;
    } else {
      const metricas = r.opciones
        .map(
          (o, i) => `
              <div class="result-metric">
                <div class="value">${fmtMillones(o.costoTotal)}<span class="unit">M$</span></div>
                <div class="label">Opción ${i + 1} · ${escapeHtml(conductorTexto(estados[i]))}${i === r.mejor ? ' <span class="badge badge-success">Menor costo</span>' : ""}</div>
              </div>`
        )
        .join("");
      const mejor = r.opciones[r.mejor];
      const avisos = avisosAmpacidad(r, estados, base);
      resultadoHtml = `
        <div class="result-report">
          <div class="callout callout-success" style="margin: 0 0 var(--space-4);"><strong>Menor costo total en ${base.anios} años: Opción ${r.mejor + 1}</strong> (${escapeHtml(conductorTexto(estados[r.mejor]))}), con ${fmtPesos(mejor.costoTotal)}.</div>
          <div class="grid-2">${metricas}</div>
          <p class="text-muted text-sm" style="margin: var(--space-3) 0 0;">Costo total actualizado = inversión inicial + valor presente del costo de las pérdidas.</p>
          ${avisos.length ? `<div class="callout callout-warning" style="margin-top: var(--space-4);">${avisos.map(escapeHtml).join("<br>")}</div>` : ""}
          ${matrizHtml(r, estados, base)}
          ${sensibilidadHtml(s, r)}
        </div>
      `;
    }

    wrap.innerHTML = `
      <div class="card">
        <div class="tabs">
          <button type="button" class="tab-btn active" data-tab="resultado">Resultado</button>
          <button type="button" class="tab-btn" data-tab="reporte">Reporte</button>
          <button type="button" class="tab-btn" data-tab="criterios">Criterios</button>
        </div>
        <div class="tab-panel" data-panel="resultado">${resultadoHtml}</div>
        <div class="tab-panel" data-panel="reporte" hidden>
          <div class="report-block">${calculable ? escapeHtml(reporteTexto(r, s, base, estados, dato)) : "No hay reporte: los datos no permiten calcular."}</div>
        </div>
        <div class="tab-panel" data-panel="criterios" hidden>
          <div class="criterios-content">${renderCriterios(CRITERIOS_CONDUCTOR_ECONOMICO)}</div>
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
