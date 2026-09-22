// Perdidas de potencia por efecto Joule en una linea trifasica, ajustadas
// por factor de carga. Transcripcion literal del OnSelect de BT_Calcular_2
// en Perdidas.pa.yaml (screen "Perdidas" de Calculadora Normativa.msapp),
// con el factor de perdidas actualizado a la forma cuadratica clasica de
// Buller-Woodrow (0.7*Fc^2 + 0.3*Fc), documentada en el panel de "Criterios
// de calculo" de esa misma pantalla.
//
// Todas las magnitudes de potencia se manejan en kW y la tension en kV,
// igual que en los campos de entrada originales (no hay conversion de
// unidades: P(kW)/V(kV) da el mismo cociente que P(W)/V(V)).

/**
 * @param {object} p
 * @param {number} p.tensionKv - tension de linea (kV)
 * @param {number} p.potenciaKw - potencia activa (kW)
 * @param {number} p.factorPotencia - factor de potencia (cos phi)
 * @param {number} p.resistenciaOhmKm - resistencia AC del conductor a 75°C (Ohm/km)
 * @param {number} p.longitudKm - longitud de la linea (km)
 * @param {number} p.factorCarga - factor de carga Fc
 */
export function calcularPerdidas(p) {
  const corriente = p.potenciaKw / (p.tensionKv * p.factorPotencia * Math.sqrt(3));
  const potenciaS = p.potenciaKw / p.factorPotencia;
  const potenciaQ = Math.sqrt(potenciaS ** 2 - p.potenciaKw ** 2);
  const factorPerdidas = 0.7 * p.factorCarga ** 2 + 0.3 * p.factorCarga;
  const perdidasPct =
    (Math.sqrt(3) * p.resistenciaOhmKm * p.longitudKm * corriente * factorPerdidas) / (10 * p.tensionKv * p.factorPotencia);

  return { corriente, potenciaS, potenciaQ, perdidasPct, intermedios: { factorPerdidas } };
}
