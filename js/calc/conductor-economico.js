// Conductor economico de una linea NUEVA: compara de 2 a 5 opciones de
// conductor por su costo total actualizado (inversion inicial + valor
// presente del costo de las perdidas durante N anios). Gana la de menor
// costo total. Las perdidas salen del mismo motor de la calculadora de
// Perdidas (calc/perdidas.js), sin modificarlo, asi que usan el mismo
// factor de perdidas (Buller-Woodrow cuadratico) y las mismas formulas que
// esa pantalla.
//
// Convenciones (las mismas que se documentan en "Criterios de calculo"):
//  - La inversion se paga al inicio del proyecto. Las perdidas de cada anio
//    se pagan al final de ese anio (t = 1...N) y se descuentan con (1+r)^t.
//    Todo en pesos corrientes: la tasa de descuento es nominal y el precio
//    de la energia sube `escalada` % al anio.
//  - La demanda indicada es la del anio 1; crece `crecimiento` % cada anio.
//    La corriente crece igual y las perdidas, con su cuadrado.
//  - Las perdidas de potencia que da el motor de Perdidas (kW) ya incluyen
//    el factor de perdidas (Fp): energia anual = kW * 8760 h (kWh).
//  - No hay valor residual ni costos de operacion y mantenimiento (decision
//    de alcance de esta calculadora: no cambian cual opcion gana).

import { calcularPerdidas } from "./perdidas.js";

export const HORAS_ANIO = 8760;

/**
 * @param {object} base
 * @param {number} base.tensionKv
 * @param {number} base.potenciaActivaKw - demanda del anio 1 (kW)
 * @param {number} base.factorPotencia
 * @param {number} base.factorCarga
 * @param {number} base.longitudKm
 * @param {number} base.anios - anios de analisis (entero >= 1)
 * @param {number} base.tasaDescuentoPct - tasa de descuento nominal (%)
 * @param {number} base.precioKwh - precio de la energia perdida en el anio 1 ($/kWh)
 * @param {number} [base.escaladaEnergiaPct=0] - aumento anual del precio de la energia (%)
 * @param {number} [base.crecimientoDemandaPct=0] - aumento anual de la demanda (%)
 * @param {object} opcion
 * @param {number} opcion.resistenciaOhmKm - resistencia AC de UN conductor a 75°C (Ω/km)
 * @param {number} [opcion.numConductoresPorFase=1]
 * @param {number} opcion.costoConductorKm - precio de UN conductor por km ($/km)
 * @param {number} opcion.costoInstalacionKm - resto de la instalacion por km de linea ($/km)
 */
export function calcularOpcion(base, opcion) {
  const n = opcion.numConductoresPorFase ?? 1;
  const resistenciaEfectivaOhmKm = opcion.resistenciaOhmKm / n;
  const r = calcularPerdidas({
    tensionKv: base.tensionKv,
    potenciaKw: base.potenciaActivaKw,
    factorPotencia: base.factorPotencia,
    factorCarga: base.factorCarga,
    resistenciaOhmKm: resistenciaEfectivaOhmKm,
    longitudKm: base.longitudKm,
  });
  const perdidasKw1 = (r.perdidasPct / 100) * base.potenciaActivaKw;

  const g = 1 + (base.crecimientoDemandaPct ?? 0) / 100;
  const e = 1 + (base.escaladaEnergiaPct ?? 0) / 100;
  const d = 1 + base.tasaDescuentoPct / 100;

  const costoConductores = base.longitudKm * 3 * n * opcion.costoConductorKm;
  const costoInstalacion = base.longitudKm * opcion.costoInstalacionKm;
  const inversion = costoConductores + costoInstalacion;

  const anios = [];
  const acumulado = [inversion]; // valor presente acumulado (indice = anio; el 0 es la inversion)
  let costoPerdidasVp = 0;
  for (let t = 1; t <= base.anios; t++) {
    const crecimiento = g ** (t - 1);
    const perdidasKw = perdidasKw1 * crecimiento ** 2;
    const energiaKwh = perdidasKw * HORAS_ANIO;
    const precioKwh = base.precioKwh * e ** (t - 1);
    const costo = energiaKwh * precioKwh;
    const valorPresente = costo / d ** t;
    costoPerdidasVp += valorPresente;
    acumulado.push(inversion + costoPerdidasVp);
    anios.push({ anio: t, corrienteA: r.corriente * crecimiento, perdidasKw, energiaKwh, precioKwh, costo, valorPresente });
  }

  return {
    resistenciaEfectivaOhmKm,
    corrienteAnio1: r.corriente,
    corrienteUltimoAnio: r.corriente * g ** (base.anios - 1),
    perdidasPctAnio1: r.perdidasPct,
    perdidasKwAnio1: perdidasKw1,
    energiaKwhAnio1: perdidasKw1 * HORAS_ANIO,
    costoConductores,
    costoInstalacion,
    inversion,
    costoPerdidasVp,
    costoTotal: inversion + costoPerdidasVp,
    anios,
    acumulado,
  };
}

/**
 * Compara las opciones. `mejor` = indice de la de menor costo total (la
 * primera si empatan). `base` (de los puntos de equilibrio) = la de menor
 * inversion. Para las demas, `puntoEquilibrio` = primer anio en que su costo
 * acumulado (descontado) deja de superar al de la opcion de menor inversion,
 * o null si no lo alcanza dentro del horizonte (o si no invierte mas que ella).
 * @returns {{opciones:object[], mejor:number, indiceBase:number}}
 */
export function compararOpciones(base, opciones) {
  const res = opciones.map((o) => calcularOpcion(base, o));
  const menorIdx = (valor) => res.reduce((m, r, i) => (valor(r) < valor(res[m]) ? i : m), 0);
  const mejor = menorIdx((r) => r.costoTotal);
  const indiceBase = menorIdx((r) => r.inversion);
  const b = res[indiceBase];
  const lista = res.map((r, i) => {
    let puntoEquilibrio = null;
    if (i !== indiceBase && r.inversion > b.inversion) {
      for (let t = 1; t <= base.anios; t++) {
        if (r.acumulado[t] <= b.acumulado[t]) {
          puntoEquilibrio = t;
          break;
        }
      }
    }
    return { ...r, diferenciaVsMejor: r.costoTotal - res[mejor].costoTotal, puntoEquilibrio };
  });
  return { opciones: lista, mejor, indiceBase };
}

/** Variaciones de la tabla de sensibilidad: cada una cambia UN supuesto y el resto queda igual. */
export const ESCENARIOS_SENSIBILIDAD = [
  { clave: "energia+", etiqueta: "Precio de la energía +10 %", aplicar: (b) => ({ ...b, precioKwh: b.precioKwh * 1.1 }) },
  { clave: "energia-", etiqueta: "Precio de la energía −10 %", aplicar: (b) => ({ ...b, precioKwh: b.precioKwh * 0.9 }) },
  { clave: "demanda+", etiqueta: "Demanda +10 %", aplicar: (b) => ({ ...b, potenciaActivaKw: b.potenciaActivaKw * 1.1 }) },
  { clave: "demanda-", etiqueta: "Demanda −10 %", aplicar: (b) => ({ ...b, potenciaActivaKw: b.potenciaActivaKw * 0.9 }) },
  { clave: "tasa+", etiqueta: "Tasa de descuento +2 puntos", aplicar: (b) => ({ ...b, tasaDescuentoPct: b.tasaDescuentoPct + 2 }) },
  { clave: "tasa-", etiqueta: "Tasa de descuento −2 puntos", aplicar: (b) => ({ ...b, tasaDescuentoPct: b.tasaDescuentoPct - 2 }), valido: (b) => b.tasaDescuentoPct - 2 >= 0 },
];

/**
 * Repite el calculo cambiando un supuesto a la vez. Devuelve la fila «Base»
 * y una por escenario, con el costo total de cada opcion y cual gana;
 * `cambia` dice si en algun escenario gana una opcion distinta de la del
 * caso base.
 * @returns {{filas:{clave:string, etiqueta:string, totales:number[], ganador:number}[], cambia:boolean}}
 */
export function sensibilidad(base, opciones) {
  const correr = (clave, etiqueta, b) => {
    const totales = opciones.map((o) => calcularOpcion(b, o).costoTotal);
    return { clave, etiqueta, totales, ganador: totales.reduce((m, v, i) => (v < totales[m] ? i : m), 0) };
  };
  const filas = [correr("base", "Caso base", base)];
  for (const s of ESCENARIOS_SENSIBILIDAD) {
    if (s.valido && !s.valido(base)) continue;
    filas.push(correr(s.clave, s.etiqueta, s.aplicar(base)));
  }
  return { filas, cambia: filas.some((f) => f.ganador !== filas[0].ganador) };
}
