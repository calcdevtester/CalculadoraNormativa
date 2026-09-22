// Configuracion de navegacion: equivalente a NavStructure en App.pa.yaml.
// "Salir" existe en el original pero no tiene equivalente en una PWA (cierra
// la app nativa) -- no se incluye aqui. Ampacidad si existia deshabilitada en
// el original; aqui se implementa como modulo propio (ver README).

export const sidebarLinks = [
  { key: "", title: "Inicio", icon: "home", hash: "#/" },
  { key: "perdidas", title: "Pérdidas", icon: "trendingDown", hash: "#/perdidas" },
  { key: "regulacion", title: "Regulación", icon: "gauge", hash: "#/regulacion" },
  { key: "cortocircuito", title: "Cortocircuito", icon: "bolt", hash: "#/cortocircuito" },
  { key: "ampacidad", title: "Ampacidad", icon: "thermometer", hash: "#/ampacidad" },
  { key: "conductor-economico", title: "Conductor económico", icon: "money", hash: "#/conductor-economico" },
];
