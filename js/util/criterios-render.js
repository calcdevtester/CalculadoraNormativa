// Renderiza a HTML los bloques de contenido definidos en js/data/criterios.js.
// Las formulas se renderizan con KaTeX (cargado como script global "katex"
// en index.html, sin dependencias externas para poder trabajar offline).

function renderInline(text) {
  return text
    .replace(/\$([^$]+)\$/g, (_, tex) => katex.renderToString(tex, { throwOnError: false }))
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function renderListItem(item) {
  if (typeof item === "string") return `<li>${renderInline(item)}</li>`;
  const sub = item.items ? `<ul>${item.items.map(renderListItem).join("")}</ul>` : "";
  return `<li>${renderInline(item.text)}${sub}</li>`;
}

export function renderCriterios(blocks) {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "heading":
          return `<h3 class="criterios-heading">${renderInline(b.text)}</h3>`;
        case "paragraph":
          return `<p>${renderInline(b.text)}</p>`;
        case "formula":
          return `<div class="formula-katex">${katex.renderToString(b.tex, { displayMode: true, throwOnError: false })}</div>`;
        case "list":
          return `<ul>${b.items.map(renderListItem).join("")}</ul>`;
        case "table":
          return `<div class="table-scroll"><table class="criterios-table"><thead><tr>${b.headers
            .map((h) => `<th>${renderInline(h)}</th>`)
            .join("")}</tr></thead><tbody>${b.rows
            .map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`)
            .join("")}</tbody></table></div>`;
        case "hr":
          return `<hr class="criterios-hr">`;
        default:
          return "";
      }
    })
    .join("");
}
