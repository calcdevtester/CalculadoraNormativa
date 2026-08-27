// Configuracion de navegacion: equivalente a NavStructure en App.pa.yaml.
// "Ampacidad" y "Salir" existen en el original pero estaban deshabilitado
// (Ampacidad, comentado/oculto) o sin equivalente en una PWA (Salir cierra
// la app nativa) -- no se incluyen aqui, ver README.

export const sidebarLinks = [
  { key: "", title: "Inicio", icon: "home", hash: "#/" },
  { key: "perdidas", title: "Pérdidas", icon: "money", hash: "#/perdidas" },
  { key: "regulacion", title: "Regulación", icon: "calculator", hash: "#/regulacion" },
  { key: "cortocircuito", title: "Cortocircuito", icon: "bolt", hash: "#/cortocircuito" },
];
