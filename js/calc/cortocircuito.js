// Capacidad de corriente de cortocircuito admisible de un conductor, segun
// el limite termico durante el tiempo de despeje de la falla. Transcripcion
// literal del OnSelect de BT_Calcular_3 en Cortocircuito.pa.yaml.
// Formula: I_CC = A * k1 * sqrt(log10((T2+lambda)/(T1+lambda)) / t) / 1000

/**
 * @param {object} p
 * @param {number} p.areaMm2 - area del conductor (mm2)
 * @param {number} p.constanteK1 - constante del material (341 Cobre / 224 Aluminio, editable)
 * @param {number} p.tempOperacionC - temperatura de operacion (°C)
 * @param {number} p.tempFallaC - temperatura maxima admisible en falla (°C)
 * @param {number} p.tempResistencia0C - temperatura de resistencia cero, lambda (234 Cobre / 228 Aluminio, editable)
 * @param {number} p.tiempoS - tiempo de despeje de la falla (s)
 */
export function calcularCortocircuito(p) {
  const logaritmo = Math.log10((p.tempFallaC + p.tempResistencia0C) / (p.tempOperacionC + p.tempResistencia0C));
  const capacidadCcKa = (p.areaMm2 * p.constanteK1 * Math.sqrt(logaritmo / p.tiempoS)) / 1000;
  return { capacidadCcKa, intermedios: { logaritmo } };
}
