import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= ELEMENTOS ================= */

const prefixEl = document.getElementById("boot-prefix");
const nameEl = document.getElementById("user-nickname");
const subtitleEl = document.getElementById("boot-subtitle");

/* ================= TYPEWRITER ================= */

function typeWriter(text, element, speed = 55, callback) {
  let i = 0;
  element.textContent = "";

  function step() {
    if (i < text.length) {
      element.textContent += text[i++];
      setTimeout(step, speed);
    } else callback?.();
  }

  step();
}

/* ================= GLOW USER ================= */

function startGlowLoop(el) {
  if (!el) return;

  let t = 0;

  function animate() {
    const intensity = 0.4 + Math.sin(t) * 0.25;

    el.style.textShadow = `
      0 0 5px rgba(255, 195, 66, ${intensity}),
      0 0 12px rgba(255, 195, 66, ${intensity * 0.7}),
      0 0 20px rgba(255, 195, 66, ${intensity * 0.4})
    `;

    t += 0.05;
    requestAnimationFrame(animate);
  }

  animate();
}

/* ================= BOOT ================= */

function startBoot(name) {
  const user = (name ?? "Anônimo");

  const prefix = "Olá,";
  const subtitle = "Bem-vindo ao centro de criação do The Club.";

  // reset
  prefixEl.textContent = "";
  nameEl.textContent = "";
  subtitleEl.textContent = "";

  /* 1 - prefixo */
  typeWriter(prefix, prefixEl, 50, () => {

    /* 2 - nome (AGORA DIGITADO LETRA POR LETRA) */
    typeWriter(user, nameEl, 70, () => {
      startGlowLoop(nameEl);

    });
  });

  /* subtítulo */
  setTimeout(() => {
    typeWriter(subtitle, subtitleEl, 25);
  }, 900);
}

/* ================= AUTH ================= */

onAuthStateChanged(auth, (user) => {
  const name = user?.displayName || "Anônimo";
  startBoot(name);
});
/* ================= TERMINAL MENU ================= */

const options = [...document.querySelectorAll(".terminal-option")];
const cursor = document.getElementById("terminal-cursor");

let index = 0;

/* move cursor corretamente */
function moveCursor() {
  const el = options[index];
  if (!el || !cursor) return;

  const rect = el.getBoundingClientRect();
  const parent = el.parentElement.getBoundingClientRect();

  const top = rect.top - parent.top + el.parentElement.scrollTop;

  cursor.style.top = `${top + rect.height / 2}px`;
  cursor.style.transform = "translateY(-50%)";
}

/* atualiza estado visual */
function updateMenu() {
  options.forEach((el, i) => {
    el.classList.toggle("active", i === index);
  });

  moveCursor();
}

/* ================= TECLADO ================= */

document.addEventListener("keydown", (e) => {
  if (!options.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    index = (index + 1) % options.length;
    updateMenu();
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    index = (index - 1 + options.length) % options.length;
    updateMenu();
  }

  if (e.key === "Enter") {
    e.preventDefault();
    options[index].click();
  }
});

/* ================= HOVER ================= */

options.forEach((el, i) => {
  el.addEventListener("mouseenter", () => {
    index = i;
    updateMenu();
  });
});

/* init cursor depois de render */
window.addEventListener("load", updateMenu);