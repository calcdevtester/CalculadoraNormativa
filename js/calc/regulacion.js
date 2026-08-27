// Caida de tension (regulacion) en una linea trifasica de distribucion,
// segun el metodo de la "constante de regulacion K" (K = (R + Xl*tan phi)
// / (10*V^2)). Transcripcion literal del OnSelect de BT_Calcular_1 en
// Regulacion.pa.yaml (screen "Regulacion" de Calculadora Normativa.msapp).
// Cada paso estaba envuelto en IfError(...,0) en el original -- se replica
// ese mismo comportamiento por paso.
//
// ImpedanciaEficaz se calcula en el original pero no se usa en ninguna
// formula posterior ni se muestra en el reporte -- es una variable muerta
// de la app original. Se conserva aqui solo como intermedio informativo.
//
// Potencia en kW, tension en kV, radio medio geometrico (RMG) en mm (igual
// que el campo de entrada original) -- se convierte a metros solo dentro
// de la formula de reactancia inductiva, tal como hacia el original
// (EN_RMG.Value/1000).

const safe = (fn) => {
  try {
    const v = fn();
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
};

/**
 * @param {object} p
 * @param {number} p.tensionKv - tension de linea (kV)
 * @param {number} p.potenciaKw - potencia activa (kW)
 * @param {number} p.factorPotencia - factor de potencia (cos phi)
 * @param {number} p.longitudKm - longitud de la linea (km)
 * @param {number} p.resistenciaOhmKm - resistencia AC del conductor a 75°C (Ohm/km)
 * @param {number} p.rmgMm - radio medio geometrico (mm)
 * @param {number} p.dabM - distancia entre fases A-B (m)
 * @param {number} p.dacM - distancia entre fases A-C (m)
 * @param {number} p.dbcM - distancia entre fases B-C (m)
 */
export function calcularRegulacion(p) {
  const corriente = safe(() => p.potenciaKw / (p.tensionKv * p.factorPotencia * Math.sqrt(3)));
  const potenciaS = safe(() => p.potenciaKw / p.factorPotencia);
  const potenciaQ = safe(() => Math.sqrt(potenciaS ** 2 - p.potenciaKw ** 2));

  const reactanciaInductiva = safe(
    () => 0.0754 * Math.log(Math.cbrt(p.dabM * p.dacM * p.dbcM) / (p.rmgMm / 1000))
  );
  const impedanciaEfectiva = safe(
    () => p.resistenciaOhmKm * p.factorPotencia + reactanciaInductiva * Math.sin(Math.acos(p.factorPotencia))
  );
  const factorDeRegulacion = safe(
    () => p.resistenciaOhmKm + reactanciaInductiva * Math.tan(Math.acos(p.factorPotencia))
  );
  const constanteRegulacion = safe(() => factorDeRegulacion / (10 * p.tensionKv ** 2));
  const caidaTensionPct = safe(() => (p.potenciaKw * p.longitudKm * factorDeRegulacion) / (10 * p.tensionKv ** 2));

  return {
    corriente,
    potenciaS,
    potenciaQ,
    caidaTensionPct,
    intermedios: { reactanciaInductiva, impedanciaEfectiva, factorDeRegulacion, constanteRegulacion },
  };
}
