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
      "$\\Delta U$: Caída de tensión (kV)",
      "$Z$: Impedancia por fase (Ω/km)",
      "$L$: Longitud de la línea (km)",
      "$I$: Corriente de la línea (A)",
      "$P$: Potencia trifásica activa transportada (kW)",
      "$S$: Potencia aparente (kVA)",
      "$Q$: Potencia reactiva (kVAR)",
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
  {
    type: "paragraph",
    text: "Cuando el circuito tiene **varios tramos** (distinto conductor, geometría de fases o longitud en cada uno), el porcentaje de caída de tensión total corresponde a la suma del porcentaje de cada tramo, siempre que la corriente sea la misma a lo largo de todo el circuito, es decir, sin cargas intermedias entre tramos.",
  },
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
  {
    type: "paragraph",
    text: "En esta calculadora, la capacidad de cortocircuito se expresa en **kA**: el resultado de $I_{CC}$ obtenido con cualquiera de las dos expresiones anteriores (en A) se divide entre 1000.",
  },
];

export const ampacidad = [
  { type: "heading", text: "Ampacidad de conductores aéreos (IEEE Std 738)" },
  {
    type: "paragraph",
    text: "La ampacidad de un conductor aéreo en régimen permanente se obtiene del **balance térmico** del conductor: la corriente máxima admisible es aquella para la cual el calor disipado por convección y radiación, más el calor ganado por radiación solar, se equilibra con el calentamiento resistivo del conductor.",
  },
  { type: "formula", tex: "Q_c + Q_r = Q_s + I^{2} \\cdot R" },
  { type: "paragraph", text: "Despejando la corriente se obtiene la ampacidad:" },
  { type: "formula", tex: "I = \\sqrt{\\dfrac{Q_c + Q_r - Q_s}{R}}" },
  { type: "paragraph", text: "Con:" },
  {
    type: "formula",
    tex: "Q_c = \\max(Q_{cn},\\, Q_{c1},\\, Q_{c2})",
  },
  {
    type: "formula",
    tex: "Q_r = 17.8 \\cdot D \\cdot \\varepsilon \\cdot \\left[\\left(\\dfrac{T_c+273}{100}\\right)^{4} - \\left(\\dfrac{T_a+273}{100}\\right)^{4}\\right]",
  },
  { type: "formula", tex: "Q_s = \\alpha \\cdot Q_{se} \\cdot \\text{sen}\\,\\theta \\cdot D" },
  {
    type: "paragraph",
    text: "$Q_c$ es el calor perdido por convección: $Q_{cn}$ corresponde a convección natural y $Q_{c1}$, $Q_{c2}$ a dos correlaciones de convección forzada (bajo y alto régimen de viento); se toma la de mayor valor. $Q_r$ es el calor perdido por radiación y $Q_s$ el calor ganado por radiación solar absorbida.",
  },
  {
    type: "paragraph",
    text: "La resistencia AC del conductor se evalúa a la temperatura máxima admisible $T_c$, interpolando linealmente entre los valores conocidos a 25°C y 75°C:",
  },
  { type: "formula", tex: "R = R_{25} + \\dfrac{R_{75} - R_{25}}{75 - 25} \\cdot (T_c - 25)" },
  { type: "paragraph", text: "Donde:" },
  {
    type: "list",
    items: [
      "$I$: Ampacidad — corriente admisible en régimen permanente (A)",
      "$D$: Diámetro del conductor (m)",
      "$R$: Resistencia AC del conductor a $T_c$ (Ω/m)",
      "$\\varepsilon$: Emisividad del conductor",
      "$\\alpha$: Absortividad del conductor",
      "$T_a$: Temperatura ambiente (°C)",
      "$T_c$: Temperatura máxima admisible del conductor (°C)",
      "$Q_{se}$: Radiación solar total incidente (W/m²)",
      "$\\theta$: Ángulo efectivo de incidencia solar",
    ],
  },
  {
    type: "paragraph",
    text: "**Nota:** en esta calculadora, $Q_{se}$ y $\\theta$ se ingresan de forma manual (o se usan valores por defecto); el cálculo de posición solar del estándar completo, a partir de fecha, hora y latitud, no está implementado.",
  },
  { type: "hr" },
  { type: "heading", text: "Ampacidad de cables subterráneos (IEC 60287-1-1)" },
  {
    type: "paragraph",
    text: "Para cables subterráneos en banco de ductos, en régimen permanente, la ampacidad se obtiene del balance térmico entre el conductor y el terreno, considerando la resistencia AC del conductor, la pérdida dieléctrica del aislamiento, el factor de pérdidas por corrientes inducidas en la pantalla, y las resistencias térmicas de cada capa del cable más la del terreno:",
  },
  {
    type: "formula",
    tex: "I = \\sqrt{\\dfrac{\\Delta\\theta - W_d\\left(0.5\\,T_1 + n\\,(T_2+T_3+T_4)\\right)}{n \\cdot R\\left[\\dfrac{T_1}{n} + (1+\\lambda_1)(T_2+T_3+T_4)\\right]}}",
  },
  {
    type: "paragraph",
    text: "La resistencia térmica externa $T_4$, entre el ducto del conductor activo y el terreno, se calcula con el **método de imágenes de Kennelly**, sumando el acoplamiento térmico propio del ducto y el aporte mutuo de los demás ductos del banco.",
  },
  { type: "paragraph", text: "Donde:" },
  {
    type: "list",
    items: [
      "$I$: Ampacidad — corriente admisible en régimen permanente (A)",
      "$R$: Resistencia AC efectiva del conductor, incluyendo efecto piel y de proximidad (Ω/m)",
      "$W_d$: Pérdida dieléctrica del aislamiento (W/m)",
      "$\\lambda_1$: Factor de pérdidas por corrientes inducidas/circulantes en la pantalla",
      "$T_1$: Resistencia térmica del aislamiento (K·m/W)",
      "$T_2$: Resistencia térmica de la cubierta/relleno (K·m/W)",
      "$T_3$: Resistencia térmica de la chaqueta exterior (K·m/W)",
      "$T_4$: Resistencia térmica externa, suelo más ducto (K·m/W)",
      "$\\Delta\\theta$: Salto térmico admisible entre el conductor y el terreno (°C)",
      "$n$: Número de conductores cargados dentro de la cubierta (1 para cable tripolar, 3 para un circuito de cables monopolares)",
    ],
  },
  {
    type: "paragraph",
    text: "**Limitaciones conocidas de esta implementación:** no distingue formación en trébol de formación plana — usa la misma fórmula de proximidad para ambas — y únicamente calcula régimen permanente (no transitorio ni secado del suelo).",
  },
];
export const conductorEconomico = [
  { type: "heading", text: "Conductor económico" },
  {
    type: "paragraph",
    text: "Esta calculadora compara varias opciones de conductor para una **línea nueva** según su **costo total actualizado**: la inversión inicial más el valor presente del costo de las pérdidas de potencia durante los años de análisis. Gana la opción de menor costo total.",
  },
  {
    type: "paragraph",
    text: "La corriente y el porcentaje de pérdidas del año 1 se calculan con las mismas expresiones de la calculadora de **Pérdidas**, incluido el factor de pérdidas cuadrático de Buller-Woodrow:",
  },
  { type: "formula", tex: "I_1 = \\dfrac{P_1}{\\sqrt{3} \\cdot V \\cdot \\cos\\varphi}" },
  { type: "formula", tex: "F_p = 0.3\\,F_c + 0.7\\,F_c^{2}" },
  { type: "formula", tex: "R_{ef} = \\dfrac{R_{75}}{N}" },
  { type: "formula", tex: "\\%P_1 = \\dfrac{\\sqrt{3} \\cdot R_{ef} \\cdot L \\cdot I_1 \\cdot F_p}{10 \\cdot V \\cdot \\cos\\varphi}" },
  { type: "formula", tex: "P_{perd,1} = P_1 \\cdot \\dfrac{\\%P_1}{100}" },
  { type: "paragraph", text: "A partir del año 1, la demanda, la corriente y las pérdidas evolucionan año a año ($t = 1 \\ldots n$):" },
  { type: "formula", tex: "I_t = I_1 \\cdot (1+g)^{t-1}" },
  { type: "formula", tex: "P_{perd,t} = P_{perd,1} \\cdot (1+g)^{2(t-1)}" },
  { type: "formula", tex: "E_t = P_{perd,t} \\cdot 8760" },
  { type: "formula", tex: "p_t = p_1 \\cdot (1+e)^{t-1}" },
  { type: "paragraph", text: "Con estos valores se obtiene la inversión inicial, el valor presente del costo de las pérdidas, y el costo total actualizado de cada opción:" },
  { type: "formula", tex: "C_0 = L \\cdot (3 \\cdot N \\cdot c_{cond} + c_{inst})" },
  { type: "formula", tex: "VP_{perd} = \\sum_{t=1}^{n} \\dfrac{E_t \\cdot p_t}{(1+r)^{t}}" },
  { type: "formula", tex: "C_{total} = C_0 + VP_{perd}" },
  { type: "paragraph", text: "Donde:" },
  {
    type: "list",
    items: [
      "$P_1$: Demanda (potencia activa) del año 1 (kW)",
      "$V$: Tensión de línea (kV)",
      "$\\cos\\varphi$: Factor de potencia",
      "$F_c$: Factor de carga",
      "$F_p$: Factor de pérdidas",
      "$R_{75}$: Resistencia AC de un conductor a 75°C (Ω/km)",
      "$N$: Conductores por fase",
      "$L$: Longitud de la línea (km)",
      "$g$: Crecimiento anual de la demanda (en fracción, 2% = 0.02)",
      "$e$: Aumento anual del precio de la energía (en fracción)",
      "$r$: Tasa de descuento nominal (en fracción)",
      "$n$: Años de análisis",
      "$I_t$: Corriente del año $t$ (A)",
      "$P_{perd,t}$: Potencia media perdida en el año $t$ (kW), ya incluye $F_p$",
      "$E_t$: Energía perdida en el año $t$ (kWh)",
      "$p_t$: Precio de la energía perdida en el año $t$ ($/kWh)",
      "$c_{cond}$: Precio de un conductor por km ($/km)",
      "$c_{inst}$: Costo de instalación por km de línea ($/km)",
      "$C_0$: Inversión inicial, al inicio del proyecto ($)",
      "$VP_{perd}$: Valor presente del costo de las pérdidas ($)",
      "$C_{total}$: Costo total actualizado ($)",
    ],
  },
  {
    type: "paragraph",
    text: "Gana la opción de **menor costo total actualizado**. Para comparar, cada opción se mide frente a la de menor inversión inicial mediante la diferencia de costo total y el año en que su costo acumulado (descontado) deja de superar al de esa opción base:",
  },
  { type: "formula", tex: "\\Delta_i = C_{total,i} - \\min_j C_{total,j}" },
  {
    type: "formula",
    tex: "t_{eq} = \\min\\left\\{\\, t : C_{acum,i}(t) \\le C_{acum,base}(t) \\,\\right\\}, \\qquad C_{acum}(t) = C_0 + \\sum_{k=1}^{t} \\dfrac{E_k \\cdot p_k}{(1+r)^{k}}",
  },
  { type: "paragraph", text: "Donde:" },
  {
    type: "list",
    items: [
      "$\\Delta_i$: Diferencia de la opción $i$ frente a la de menor costo total ($)",
      "$t_{eq}$: Año en que la opción compensa su mayor inversión frente a la de menor inversión",
    ],
  },
  {
    type: "paragraph",
    text: "**Convenciones de esta calculadora:** la inversión se paga al inicio del proyecto; las pérdidas de cada año se pagan al final de ese año y se traen a valor de hoy con la tasa de descuento. Todo va en pesos corrientes: la tasa es nominal y el precio de la energía sube el porcentaje indicado cada año.",
  },
  {
    type: "paragraph",
    text: "La demanda indicada es la del año 1. Si crece, la corriente crece igual y las pérdidas crecen con su cuadrado. No se incluyen valor residual, costos de operación y mantenimiento, impuestos ni otras condiciones técnicas (regulación, cortocircuito): son decisiones de alcance de esta calculadora.",
  },
  {
    type: "paragraph",
    text: "La **tabla de sensibilidad** repite el cálculo cambiando un supuesto a la vez (precio de la energía ±10%, demanda ±10%, tasa de descuento ±2 puntos) y muestra si la opción ganadora cambia frente al caso base, para saber qué tan robusta es la decisión.",
  },
  {
    type: "paragraph",
    text: "**Sobre el factor de carga en granjas solares:** el valor que determina bien las pérdidas varía mucho según la tecnología (fijo, seguidor de uno o dos ejes) y la zona (nubosidad, ubicación geográfica); se sugiere un rango de 0.28 a 0.53 (más alto = más conservador) y no un valor fijo. Si la decisión es importante, se recomienda calcular el $F_c$ con la curva real de generación a 24 h del proyecto. Para circuitos que no son de generación solar, el caso más riguroso y conservador es $F_c=1$: asume que la potencia se transporta siempre a carga plena.",
  },
];
