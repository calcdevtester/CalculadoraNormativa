// Contenido de los paneles "Criterios de cálculo" de cada módulo, transcrito
// de las imágenes originales (antes en assets/criterios/*.jpg) a texto
// estructurado. Se renderiza con js/util/criterios-render.js, que usa KaTeX
// para las fórmulas.
//
// Cómo editar este archivo:
// - Cada bloque es un objeto { type: ... }. Tipos disponibles:
//     heading   { type: "heading", text }              -- título de sección
//     paragraph { type: "paragraph", text }             -- párrafo de texto
//     list      { type: "list", items }                 -- viñetas; cada item
//                 puede ser un string, o un objeto { text, items } para
//                 crear sub-viñetas anidadas (ver ejemplo en `cortocircuito`)
//     table     { type: "table", headers, rows }         -- tabla simple
//     formula   { type: "formula", tex }                 -- fórmula en bloque
//     hr        { type: "hr" }                           -- línea divisoria
// - Dentro de "text" (heading/paragraph/list) se puede usar:
//     **negrita**        -> se muestra en negrita
//     $expresión LaTeX$  -> se renderiza como fórmula en línea con KaTeX
// - El campo "tex" de una fórmula es LaTeX igual que en Overleaf/MathJax,
//   con una sola diferencia: cada barra invertida se escribe DOBLE porque
//   así lo exige JavaScript dentro de un string. Ejemplos:
//     LaTeX real:        \sqrt{3} \cdot R \cdot L
//     Como se escribe acá: "\\sqrt{3} \\cdot R \\cdot L"
//   Si copias una fórmula desde otra fuente, reemplaza cada "\" por "\\".

export const perdidas = [
  { type: "heading", text: "Pérdidas de potencia" },
  {
    type: "paragraph",
    text: "Las pérdidas de potencia en una **línea trifásica**, originadas por el efecto Joule, vienen dadas por la siguiente expresión:",
  },
  { type: "formula", tex: "P_p = 3 \\cdot R \\cdot L \\cdot I^2 \\cdot 10^{-3}" },
  { type: "paragraph", text: "Con:" },
  { type: "formula", tex: "P = \\sqrt{3} \\cdot U \\cdot I \\cdot \\cos\\varphi" },
  { type: "formula", tex: "I = \\dfrac{P}{\\sqrt{3} \\cdot U \\cdot \\cos\\varphi}" },
  {
    type: "paragraph",
    text: "A partir de la potencia activa y el factor de potencia se obtienen también la potencia aparente y la potencia reactiva de la carga:",
  },
  { type: "formula", tex: "S = \\dfrac{P}{\\cos\\varphi}" },
  { type: "formula", tex: "Q = \\sqrt{S^{2} - P^{2}}" },
  { type: "paragraph", text: "Donde:" },
  {
    type: "list",
    items: [
      "$P_p$: Pérdidas de potencia (kW)",
      "$R$: Resistencia del conductor (Ω/km)",
      "$L$: Longitud de la línea (km)",
      "$I$: Corriente de la línea (A)",
      "$P$: Potencia trifásica activa transportada (kW)",
      "$S$: Potencia aparente (kVA)",
      "$Q$: Potencia reactiva (kVAR)",
      "$U$: Tensión compuesta (fase-fase) (kV)",
      "$\\cos\\varphi$: Factor de potencia de la carga (FP)",
    ],
  },
  {
    type: "paragraph",
    text: "El porcentaje de pérdidas de potencia corresponde a la relación entre las pérdidas por efecto Joule y la potencia transportada:",
  },
  {
    type: "formula",
    tex: "\\Delta P\\,(\\%) = \\dfrac{P_p}{P} \\cdot 100 = \\dfrac{3 \\cdot R \\cdot L \\cdot I^2 \\cdot 10^{-3}}{\\sqrt{3} \\cdot U \\cdot I \\cdot \\cos\\varphi} \\cdot 100",
  },
  { type: "paragraph", text: "Simplificando las expresiones:" },
  { type: "formula", tex: "\\Delta P\\,(\\%) = \\dfrac{\\sqrt{3} \\cdot R \\cdot L \\cdot I}{10 \\cdot U \\cdot FP}" },
  {
    type: "paragraph",
    text: "Cuando la carga del circuito varía durante el período de análisis, el porcentaje de pérdidas puede ajustarse mediante el factor de pérdidas (Fp). Una de las aproximaciones más utilizadas es la expresión propuesta por Buller y Woodrow:",
  },
  { type: "formula", tex: "F_p = 0.7F_c^{2} + 0.3F_c" },
  { type: "paragraph", text: "El factor de carga se define como:" },
  {
    type: "formula",
    tex: "F_c = \\dfrac{\\text{Potencia promedio (kVA)}}{\\text{Potencia máxima (kVA)}}",
  },
  { type: "paragraph", text: "Donde:" },
  { type: "list", items: ["$F_p$: Factor de pérdidas", "$F_c$: Factor de carga"] },
  {
    type: "paragraph",
    text: "En consecuencia, el porcentaje de pérdidas ajustado se obtiene mediante:",
  },
  {
    type: "formula",
    tex: "\\Delta P\\,(\\%) = \\dfrac{\\sqrt{3} \\cdot R \\cdot L \\cdot I \\cdot F_p}{10 \\cdot U \\cdot FP}",
  },
  {
    type: "paragraph",
    text: "Sustituyendo la expresión del factor de pérdidas, el porcentaje de pérdidas final se obtiene a partir de:",
  },
  {
    type: "formula",
    tex: "\\Delta P\\,(\\%) = \\dfrac{\\sqrt{3} \\cdot R \\cdot L \\cdot I \\cdot (0.7F_c^{2} + 0.3F_c)}{10 \\cdot U \\cdot FP}",
  },
  { type: "paragraph", text: "**Observación:**" },
  {
    type: "paragraph",
    text: "Cuando la potencia promedio es igual a la potencia máxima, el factor de carga es igual a 1 (Fc=1), por lo que el factor de pérdidas también resulta igual a 1 (Fp=1). En este caso se obtiene la condición más crítica de operación del circuito y la expresión anterior se reduce a la ecuación original del porcentaje de pérdidas.",
  },
  {
    type: "paragraph",
    text: "Cuando el circuito tiene **varios tramos** (distinto conductor, resistencia o longitud en cada uno), el porcentaje de pérdidas total corresponde a la suma del porcentaje de cada tramo, siempre que la corriente sea la misma a lo largo de todo el circuito, es decir, sin cargas intermedias entre tramos.",
  },
];

export const regulacion = [
  { type: "heading", text: "Regulación de tensión" },
  {
    type: "paragraph",
    text: "Para calcular la caída de tensión en una **línea trifásica** se hace uso de la siguiente expresión:",
  },
  { type: "formula", tex: "\\Delta U = \\sqrt{3} \\cdot I \\cdot Z \\cdot L \\cdot 10^{-3}" },
  { type: "paragraph", text: "Con:" },
  { type: "formula", tex: "I = \\dfrac{P}{\\sqrt{3} \\cdot U \\cdot \\cos\\varphi}" },
  { type: "formula", tex: "Z = R \\cdot \\cos\\varphi + X \\cdot \\text{sen}\\,\\varphi" },
  { type: "paragraph", text: "Reemplazando:" },
  {
    type: "formula",
    tex: "\\Delta U = \\dfrac{P \\cdot Z \\cdot L}{1000 \\cdot U \\cdot \\cos\\varphi} = \\dfrac{P \\cdot (R \\cdot \\cos\\varphi + X \\cdot \\text{sen}\\,\\varphi) \\cdot L}{1000 \\cdot U \\cdot \\cos\\varphi}",
  },
  { type: "paragraph", text: "Donde:" },
  {
    type: "list",
    items: [
      "$\\Delta U$: Caída de tensión (kV)",
      "$Z$: Impedancia por fase (Ω/km)",
      "$L$: Longitud de la línea (km)",
      "$I$: Corriente de la línea (A)",
      "$P$: Potencia trifásica transportada (kW)",
      "$U$: Tensión compuesta (fase-fase) (kV)",
      "$\\varphi$: Angulo del factor de potencia del circuito",
      "$R$: Resistencia del conductor (Ω/km)",
      "$X$: Reactancia del conductor (Ω/km)",
    ],
  },
  { type: "paragraph", text: "Con el fin de simplificar la expresión, se define la siguiente variable:" },
  { type: "formula", tex: "\\Psi = R + X \\cdot \\text{tg}\\,\\varphi" },
  { type: "paragraph", text: "Por lo tanto la expresión resultante será la siguiente:" },
  { type: "formula", tex: "\\Delta U = \\dfrac{P \\cdot \\Psi \\cdot L}{1000 \\cdot U}" },
  {
    type: "paragraph",
    text: "Para calcular el porcentaje de caída de tensión se hace uso de la relación entre la caída de tensión y la tensión del sistema:",
  },
  {
    type: "formula",
    tex: "\\%\\Delta V = \\dfrac{\\Delta U}{U} \\cdot 100 = \\dfrac{P \\cdot L \\cdot \\Psi}{1000 \\cdot U \\cdot U} \\cdot 100",
  },
  { type: "paragraph", text: "Simplificando la expresión se obtiene:" },
  { type: "formula", tex: "\\%\\Delta V = \\dfrac{P \\cdot L \\cdot \\Psi}{10 \\cdot U^{2}}" },
  { type: "paragraph", text: "Para simplificar la expresión anterior, se define la constante de regulación como:" },
  { type: "formula", tex: "K_v = \\dfrac{\\Psi}{10 \\cdot U^{2}}" },
  { type: "paragraph", text: "Finalmente para calcular el porcentaje de caída de tensión se usa la siguiente expresión:" },
  { type: "formula", tex: "\\%\\Delta V = P \\cdot L \\cdot K_v" },
  { type: "hr" },
  { type: "heading", text: "Apéndice A, cálculo de reactancia del conductor" },
  { type: "paragraph", text: "Para el cálculo de la reactancia partimos de la siguiente expresión:" },
  { type: "formula", tex: "X = X_L - X_C" },
  { type: "paragraph", text: "Donde:" },
  { type: "list", items: ["$X_L$: Reactancia inductiva", "$X_C$: Reactancia capacitiva"] },
  {
    type: "paragraph",
    text: "En líneas de distribución de media y baja tensión, debido a las reducidas longitudes de los circuitos, se pueden despreciar los efectos capacitivos. Por esta razón, para efectos del presente cálculo únicamente se considera la reactancia inductiva del conductor.",
  },
  { type: "paragraph", text: "Para calcular la reactancia inductiva usamos la expresión:" },
  { type: "formula", tex: "X_L = 2 \\cdot \\pi \\cdot f \\cdot L" },
  { type: "paragraph", text: "Con:" },
  { type: "formula", tex: "L = \\left(K + 4.605 \\cdot \\log\\dfrac{Dm}{RMG}\\right) \\cdot 10^{-4}" },
  { type: "paragraph", text: "Donde:" },
  {
    type: "list",
    items: [
      "$X_L$: Reactancia inductiva (Ω/km)",
      "$f$: Frecuencia de la red (60 Hz)",
      "$L$: Coeficiente de inducción mutua (H/km)",
      "$K$: Constante, para conductores macizos 0,5 para conductores cableados ver tabla B1.3",
      "$Dm$: Distancia media geométrica entre conductores (mm)",
      "$RMG$: Radio medio geométrico del conductor (mm)",
    ],
  },
  { type: "paragraph", text: "Tabla B1.3:" },
  {
    type: "table",
    headers: ["# Alambres", "7", "19", "33"],
    rows: [["K", "0.64", "0.55", "0.53"]],
  },
  {
    type: "paragraph",
    text: "El valor para la distancia media geométrica entre conductores dependerá de la configuración geométrica de la línea y será:",
  },
  { type: "formula", tex: "D_m = \\sqrt[3]{D_{ab} \\cdot D_{ac} \\cdot D_{bc}}" },
  { type: "paragraph", text: "Donde:" },
  {
    type: "list",
    items: [
      "$D_m$: Distancia media geométrica (mm)",
      "$D_{ab}$: Distancia entre fases A y B (mm)",
      "$D_{ac}$: Distancia entre fases A y C (mm)",
      "$D_{bc}$: Distancia entre fases B y C (mm)",
    ],
  },
  {
    type: "paragraph",
    text: "El planteamiento anterior corresponde al desarrollo teórico basado en el coeficiente de inducción mutua. De forma equivalente, la reactancia inductiva también puede obtenerse mediante la siguiente expresión simplificada, ampliamente utilizada en el diseño de líneas aéreas cuando se conoce la distancia media geométrica entre fases y el radio medio geométrico del conductor:",
  },
  {
    type: "formula",
    tex: "X_L = 0.0754 \\cdot \\ln\\!\\left(\\dfrac{\\sqrt[3]{D_{ab} \\cdot D_{ac} \\cdot D_{bc}}}{RMG}\\right)",
  },
];

export const cortocircuito = [
  { type: "heading", text: "Capacidad de cortocircuito de conductores" },
  {
    type: "paragraph",
    text: "La capacidad de cortocircuito de un conductor se define con la siguiente expresión:",
  },
  {
    type: "formula",
    tex: "I_{CC} = A \\cdot k_1 \\cdot \\sqrt{\\dfrac{\\log\\left(\\dfrac{T_2+\\lambda}{T_1+\\lambda}\\right)}{t}}",
  },
  { type: "paragraph", text: "Donde:" },
  {
    type: "list",
    items: [
      "$I_{CC}$: Máxima capacidad de corriente de cortocircuito (A)",
      "$A$: Área del conductor (mm²)",
      "$k_1$: Constante, para cobre 341, para aluminio 224",
      "$T_1$: Temperatura de operación del conductor (°C)",
      "$T_2$: Temperatura máxima permisible en estado de falla (°C)",
      "$t$: Tiempo de duración/despeje de la falla (seg)",
      {
        text: "$\\lambda$: Temperatura de resistencia 0:",
        items: ["Para cobre 234 °C", "Para aluminio 228 °C"],
      },
    ],
  },
  {
    type: "paragraph",
    text: "Si bien la expresión anterior representa la formulación completa del cálculo, en el dimensionamiento por cortocircuito se emplea con mayor frecuencia su forma simplificada mediante el parámetro k, debido a que permite un dimensionamiento más ágil del conductor frente a esfuerzos térmicos por cortocircuito. Para su aplicación, basta con seleccionar el valor de k correspondiente al material del conductor y su aislamiento:",
  },
  { type: "formula", tex: "I_{CC} = A \\cdot k \\cdot \\sqrt{\\dfrac{1}{t}}" },
  { type: "paragraph", text: "Donde:" },
  {
    type: "list",
    items: [
      "$I_{CC}$: Máxima capacidad de corriente de cortocircuito (A)",
      "$A$: Área del conductor (mm²)",
      "$k$: Parámetro, ver tabla B1.4",
      "$t$: Tiempo de duración/despeje de la falla (seg)",
    ],
  },
  { type: "paragraph", text: "Tabla B1.4:" },
  {
    type: "table",
    headers: ["Material", "Aislamiento", "k"],
    rows: [
      ["Aluminio", "XLPE", "94"],
      ["Aluminio", "PVC", "76"],
      ["Aluminio", "Desnudo", "93"],
      ["Cobre", "XLPE", "143"],
      ["Cobre", "PVC", "115"],
      ["Cobre", "Desnudo", "143"],
    ],
  },
];
