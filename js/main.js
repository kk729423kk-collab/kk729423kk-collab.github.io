const root = document.documentElement;
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navPanel = document.querySelector(".nav-panel");
const themeToggle = document.querySelector(".theme-toggle");
const backToTop = document.querySelector(".back-to-top");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function setTheme(theme) {
  root.dataset.theme = theme;
  const dark = theme === "dark";
  themeToggle.querySelector("span").textContent = dark ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  document.querySelector('meta[name="theme-color"]').setAttribute("content", dark ? "#101417" : "#f7f8fa");
}

const storedTheme = localStorage.getItem("theme");
setTheme(storedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

themeToggle.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", nextTheme);
  setTheme(nextTheme);
});

function closeNavigation() {
  navPanel.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation");
  navToggle.querySelector("span").textContent = "☰";
  document.body.classList.remove("nav-open");
}

navToggle.addEventListener("click", () => {
  const open = !navPanel.classList.contains("open");
  navPanel.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  navToggle.querySelector("span").textContent = open ? "×" : "☰";
  document.body.classList.toggle("nav-open", open);
});

document.querySelectorAll(".nav-panel a").forEach((link) => link.addEventListener("click", closeNavigation));

window.addEventListener("resize", () => {
  if (window.innerWidth > 960) closeNavigation();
});

function updateScrollState() {
  const scrolled = window.scrollY > 12;
  header.classList.toggle("scrolled", scrolled);
  backToTop.classList.toggle("visible", window.scrollY > 640);
}

window.addEventListener("scroll", updateScrollState, { passive: true });
updateScrollState();

backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" }));

const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".nav-panel a")];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`));
  },
  { rootMargin: "-25% 0px -60%", threshold: [0.05, 0.2, 0.5] },
);

sections.forEach((section) => sectionObserver.observe(section));

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((element) => {
  if (reduceMotion.matches) element.classList.add("visible");
  else revealObserver.observe(element);
});

document.querySelector("#current-year").textContent = new Date().getFullYear();

const canvas = document.querySelector("#signal-canvas");
const context = canvas.getContext("2d");
let width = 0;
let height = 0;
let animationFrame = 0;

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function traceSignal(baseY, amplitude, frequency, phase, color) {
  context.beginPath();
  context.strokeStyle = color;
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += 3) {
    const envelope = 0.45 + 0.55 * Math.sin(x * 0.004 + phase * 0.35) ** 2;
    const carrier = Math.sin(x * frequency + phase) + 0.28 * Math.sin(x * frequency * 2.7 - phase * 0.6);
    const spike = Math.exp(-(((x % 280) - 140) ** 2) / 120) * Math.sin(x * 0.19 + phase) * 2.6;
    const y = baseY + amplitude * envelope * (carrier + spike * 0.22);
    if (x === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();
}

function drawSignal(time = 0) {
  context.clearRect(0, 0, width, height);
  const style = getComputedStyle(root);
  const muted = style.getPropertyValue("--line-strong").trim();
  const blue = style.getPropertyValue("--blue").trim();
  const teal = style.getPropertyValue("--teal").trim();

  context.globalAlpha = 0.17;
  for (let x = 0; x < width; x += 64) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.strokeStyle = muted;
    context.lineWidth = 1;
    context.stroke();
  }

  context.globalAlpha = 0.22;
  traceSignal(height * 0.31, 10, 0.025, time * 0.00024, blue);
  context.globalAlpha = 0.17;
  traceSignal(height * 0.56, 13, 0.02, time * 0.00018 + 2, teal);
  context.globalAlpha = 0.12;
  traceSignal(height * 0.79, 8, 0.031, time * 0.0002 + 4, muted);
  context.globalAlpha = 1;

  if (!reduceMotion.matches) animationFrame = requestAnimationFrame(drawSignal);
}

resizeCanvas();
drawSignal();
window.addEventListener("resize", resizeCanvas);

reduceMotion.addEventListener("change", () => {
  cancelAnimationFrame(animationFrame);
  drawSignal();
});
