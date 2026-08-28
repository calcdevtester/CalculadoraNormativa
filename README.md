# Calculadora Normativa (PWA)

Migración de la app de Power Apps **Calculadora Normativa.msapp** (Celsia) a una PWA
vanilla (HTML/CSS/JS, sin build step), siguiendo el mismo patrón de
[`Herramientas_HTML`](../Herramientas_HTML) y [`VocabuLAB_HTML`](../VocabuLAB_HTML).

## Módulos

- **Pérdidas** — pérdidas de potencia por efecto Joule en una línea trifásica.
- **Regulación** — caída de tensión (método de la constante de regulación K).
- **Cortocircuito** — capacidad de corriente de cortocircuito admisible de un conductor.
- **Ampacidad** — existía como tarjeta deshabilitada ("Próximo") en la app original
  (`Visible: false`, sin lógica de cálculo implementada). Por decisión explícita
  del usuario no se incluye ni siquiera como tarjeta deshabilitada en Inicio. Si
  se necesita más adelante, `Herramientas_HTML` ya tiene calculadoras de ampacidad
  aérea (IEEE 738) y subterránea (IEC 60287-1-1) que se podrían adaptar.

## Arquitectura

Igual que `Herramientas_HTML`: `index.html` + `manifest.webmanifest` + `sw.js`
(shell PWA instalable, offline cache-first) + `css/tokens.css` (tema claro/oscuro)
+ `css/app.css` (componentes) + router SPA por hash (`js/router.js`, un módulo
por pantalla en `js/views/`) + lógica de cálculo separada en `js/calc/` + datos
estáticos en `data/*.json`.

Los datos de conductores (`data/conductores-aereos.json`,
`data/conductores-subterraneos.json`) son copia directa de
`Herramientas_HTML/data/conductores-desnudos.json` y `conductores-xlpe.json`:
son la misma base de datos embebida en el `.msapp` (`BD_Conductores_Aer` /
`BD_Conductores_Subt`, 342 y 195 filas respectivamente), ya normalizada a JSON
en esa migración previa — se reutiliza en vez de re-extraer del `.msapp`.

Las fórmulas de `js/calc/*.js` son transcripción literal del `OnSelect` de los
botones "Calcular" en `APP_PowerApps/_extracted/Src/{Perdidas,Regulacion,Cortocircuito}.pa.yaml`,
verificadas cruzando con la transcripción equivalente ya hecha en
`Herramientas_HTML/js/calc/{perdidas,regulacion,cortocircuito}.js`. A diferencia
de esa migración (que usa MW), aquí se mantiene **kW** para la potencia y **mm**
para el radio medio geométrico, igual que los campos de entrada de la app original.

## Decisiones de fidelidad

- **Pérdidas**: el % de pérdidas usa el factor lineal `0.7·Fc + 0.3`, no la forma
  cuadrática de Buller-Woodrow documentada en el panel de "Criterios de cálculo"
  de la propia app original — se replica el comportamiento real en producción.
- **Regulación**: `ImpedanciaEficaz` se calcula en el original pero no se usa en
  ninguna fórmula final ni se muestra — variable muerta de la app original,
  conservada como intermedio informativo sin mostrar, igual que el original.
- **Cortocircuito**: el desplegable "Material del conductor" para conductores
  aéreos en realidad lista tipos de construcción (ACSR, AAAC, ACAR, AAC, ACSS),
  nunca literalmente "Cobre" — por eso el valor por defecto de la constante del
  material (`341`/`224`) y de la temperatura de resistencia cero (`234`/`228`)
  siempre cae en el lado "Aluminio" para red aérea, igual que en el original
  (se replicó la condición literal `Material = "Cobre"`, no una regla nueva).
  El tooltip de la constante del material en el `.msapp` original tenía un typo
  ("Para cobre 241") pese a que el valor por defecto correcto era 341; se corrigió
  el texto del tooltip aquí, el número correcto ya era el que se usaba.
- Todos los campos "Manual" (toggle) del original que permiten sobreescribir un
  valor por defecto (resistencia, RMG, área, constante, temperaturas) se
  conservan igual.

## Colores y tema

La paleta de `css/tokens.css` no sigue la de `Herramientas_HTML` (azul) sino que
se extrajo por muestreo de píxeles de capturas reales de apps corporativas de
Celsia en `APP_PowerApps/Referentes_visuales/` (LegalGastos, ForYou, Analítica
Celsia, Yo Elijo Observar, Registrar Proyecto):

- **Tema claro**: naranja de marca `#fd7930` (promedio de varias muestras de
  topbars/botones/logos reales, ~rgb(253,121,48)), fondo gris muy claro
  `#f4f5f7`, tarjetas blancas, texto pizarra `#2b3440`.
- **Tema oscuro**: no hay una captura oscura oficial completa, pero
  `Referentes_visuales/3.png` (Analítica Celsia) sí tiene un sidebar oscuro
  real (`rgb(30,38,45)` ≈ `#1e262d`) — se tomó como base y se construyó el
  resto de la escala de grises carbón/azulados a partir de ahí, con el mismo
  naranja de marca aclarado (`#ff9c56`) para mantener contraste AA sobre fondo
  oscuro.
- Botón de tema claro/oscuro en la barra superior (`#theme-toggle` en
  `js/app.js`): alterna explícitamente y persiste la elección en
  `localStorage`; si el usuario nunca lo toca, se sigue la preferencia del
  sistema operativo (`prefers-color-scheme`).

## Icono de la app

`icons/icon-source.png` es la imagen de calculadora que aportó el usuario
como referencia, guardada tal cual dentro del repo — recortada justo hasta
donde termina el borde negro (sin el margen blanco/gris que traía la
primera versión que subió; el usuario pidió explícitamente ese recorte).
Todos los demás archivos de icono son esa misma imagen sin redibujar:
`icons/icon.svg` la envuelve tal cual (sin margen añadido, para que el
favicon quede igual de ajustado), mientras que `icons/icon-192.png`,
`icons/icon-512.png` y `icons/icon-maskable-512.png` la centran sobre un
lienzo cuadrado blanco (obligatorio para esos formatos; con más margen en
la variante maskable, por el safe-zone que exigen los iconos adaptativos
de Android/PWA). El mismo ícono se usa también como marca en la barra
superior (`js/app.js`, `#brand-mark`).

Un primer intento redibujó el ícono a mano (con Pillow) en vez de partir de
la imagen real — el usuario lo rechazó explícitamente ("horrible ese icono
creado") y pidió conservar el original tal cual. La versión actual respeta
eso: nunca reinterpretar/redibujar un asset de marca que el usuario
proporciona, usar el archivo real.

## Criterios de cálculo

El panel "Criterios de cálculo" de cada módulo (antes imágenes en
`assets/criterios/*.jpg`) se transcribió a texto real en
`js/data/criterios.js`, con las fórmulas renderizadas como LaTeX mediante
[KaTeX](https://katex.org) (alojado localmente en `vendor/katex/`, sin CDN,
para que la PWA siga funcionando 100% offline). `js/util/criterios-render.js`
convierte esos bloques a HTML. Para editar el contenido de cualquier módulo
(texto, fórmulas o tablas) solo hace falta tocar `js/data/criterios.js` — el
archivo trae un comentario al inicio con la sintaxis de cada tipo de bloque
y un recordatorio sobre el escape de backslashes en LaTeX dentro de strings
de JS.

## Herramientas

- `tools/generate_icons.py` — regenera los cuatro archivos de icono de
  arriba a partir de `icons/icon-source.png` con Pillow (ya presente en
  este entorno). Si el usuario aporta una imagen de referencia distinta,
  basta con reemplazar `icon-source.png` y volver a correr este script.

## Sin probar en navegador

Este entorno no tiene Node/npm ni un navegador headless disponible (ver
notas de sesiones previas de migración) — la verificación fue lectura
cuidadosa del código y validación de JSON/assets. Falta probar manualmente:
`python -m http.server` en esta carpeta y abrir `http://localhost:8000/`.
