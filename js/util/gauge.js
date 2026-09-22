// Velocimetro semicircular reutilizable para metricas porcentuales acotadas
// por un umbral normativo (verde/amarillo/rojo). Cada vista define su propio
// GAUGE_MAX y breakpoints [b1, b2] segun el criterio que le aplique.

export function estadoGauge(value, breakpoints, labels = ["Óptimo", "Aceptable", "Elevado"]) {
  const [b1, b2] = breakpoints;
  if (value <= b1) return { label: labels[0], cls: "badge-success" };
  if (value <= b2) return { label: labels[1], cls: "badge-warning" };
  return { label: labels[2], cls: "badge-danger" };
}

export function buildGaugeSvg(value, { max, breakpoints }) {
  const [b1, b2] = breakpoints;
  const cx = 70, cy = 70, r = 60;
  const angleFor = (v) => 180 - (Math.min(Math.max(v, 0), max) / max) * 180;
  const toXY = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  };
  const p0 = toXY(180);
  const p1 = toXY(angleFor(b1));
  const p2 = toXY(angleFor(b2));
  const p3 = toXY(0);
  const arc = (a, b) => `M${a.x.toFixed(2)},${a.y.toFixed(2)} A${r},${r} 0 0,1 ${b.x.toFixed(2)},${b.y.toFixed(2)}`;

  const needleAngle = angleFor(value);
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleR = 52;
  const nx = cx + needleR * Math.cos(needleRad);
  const ny = cy - needleR * Math.sin(needleRad);

  return `
    <svg viewBox="0 0 140 80" class="result-gauge-svg">
      <path d="${arc(p0, p1)}" fill="none" stroke="var(--success)" stroke-width="12" stroke-linecap="round"></path>
      <path d="${arc(p1, p2)}" fill="none" stroke="var(--warning)" stroke-width="12" stroke-linecap="round"></path>
      <path d="${arc(p2, p3)}" fill="none" stroke="var(--danger)" stroke-width="12" stroke-linecap="round"></path>
      <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(2)}" y2="${ny.toFixed(2)}" stroke="var(--text)" stroke-width="3" stroke-linecap="round"></line>
      <circle cx="${cx}" cy="${cy}" r="6" fill="var(--text)"></circle>
    </svg>
  `;
}
