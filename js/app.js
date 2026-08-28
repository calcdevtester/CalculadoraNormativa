import { icon } from "./icons.js";
import { sidebarLinks } from "./nav.js";
import { initRouter } from "./router.js";

const shell = document.getElementById("app-shell");
const sidebar = document.getElementById("sidebar");
const navList = document.getElementById("nav-list");
const navToggle = document.getElementById("nav-toggle");
const backdrop = document.getElementById("sidebar-backdrop");
const mount = document.getElementById("app");

document.getElementById("brand-mark").innerHTML = `<img src="icons/icon.svg" alt="" width="30" height="34">`;
navToggle.innerHTML = icon("menu");

// --- tema claro/oscuro (persistido; por defecto sigue las preferencias del SO) ---
const THEME_KEY = "calculadora-normativa:theme";
const themeToggle = document.getElementById("theme-toggle");

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme) {
  if (theme) {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  const isDark = theme ? theme === "dark" : systemPrefersDark();
  themeToggle.innerHTML = icon(isDark ? "sun" : "moon");
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute("aria-label", isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
}

let storedTheme = null;
try {
  storedTheme = localStorage.getItem(THEME_KEY);
} catch {
  // localStorage no disponible (modo privado, etc.) -- se sigue la preferencia del SO sin persistir.
}
applyTheme(storedTheme);

themeToggle.addEventListener("click", () => {
  const next = (document.documentElement.getAttribute("data-theme") ? document.documentElement.getAttribute("data-theme") === "dark" : systemPrefersDark())
    ? "light"
    : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // sin persistencia disponible; el tema elegido sigue activo para esta sesion.
  }
});

navList.innerHTML = sidebarLinks
  .map(
    (link) => `
    <li>
      <a class="nav-link" data-key="${link.key}" href="${link.hash}">
        <span class="nav-icon">${icon(link.icon)}</span>
        <span>${link.title}</span>
      </a>
    </li>`
  )
  .join("");

function setActiveLink(path) {
  const section = path.split("/").filter(Boolean)[0] || "";
  navList.querySelectorAll(".nav-link").forEach((a) => {
    a.classList.toggle("active", a.dataset.key === section);
  });
}

function closeMobileNav() {
  shell.classList.remove("nav-open");
  navToggle.setAttribute("aria-expanded", "false");
}

navToggle.addEventListener("click", () => {
  const open = shell.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(open));
});
backdrop.addEventListener("click", closeMobileNav);
navList.addEventListener("click", (e) => {
  if (e.target.closest("a")) closeMobileNav();
});

initRouter({
  mount,
  onNavigate: (path) => {
    setActiveLink(path);
    closeMobileNav();
  },
});

// --- Service worker (offline / instalable) ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => console.warn("SW no registrado:", err));
  });
}
