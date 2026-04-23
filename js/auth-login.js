import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= ELEMENTOS ================= */

const log = document.getElementById("log");
const inputSpan = document.getElementById("input");
const mobileInput = document.getElementById("mobile-input");
const terminal = document.querySelector(".terminal");

/* ================= DEVICE ================= */

function isMobile() {
  return window.__DEVICE__?.isMobile?.() ?? false;
}

/* 🔥 clique abre teclado */
terminal.addEventListener("click", () => {
  if (isMobile()) mobileInput.focus();
});

/* ================= CURSOR ================= */

const cursor = document.querySelector(".cursor");

/* ================= STATE ================= */

let mode = "menu";
let buffer = "";
let email = "";

/* ================= SCROLL ================= */

function scrollDown() {
  requestAnimationFrame(() => {
    log.scrollTop = log.scrollHeight;
  });
}

/* ================= RESET ================= */

function resetFlow() {
  mode = "menu";
  buffer = "";
  email = "";
  log.innerHTML = "";
  inputSpan.textContent = "";
  mobileInput.value = "";
  startMenu();
}

/* ================= TYPEWRITER ================= */

function typeLine(text, speed = 18) {
  return new Promise((resolve) => {
    const line = document.createElement("div");
    log.appendChild(line);

    let i = 0;

    function step() {
      if (i < text.length) {
        line.textContent += text[i++];
        scrollDown();
        setTimeout(step, speed);
      } else resolve();
    }

    step();
  });
}

/* ================= INPUT ================= */

function renderInput() {
  inputSpan.textContent = buffer;
  inputSpan.appendChild(cursor);
  scrollDown();
}

/* ================= MENU ================= */

async function startMenu() {
  await typeLine("> Fazer login.");
  await typeLine("> Digite 1 para entrar com e-mail e senha.");
  await typeLine("> Digite 2 para entrar com o Google.");
  await typeLine("> Digite 3 para cadastrar.");

  menuInput();
}

function menuInput() {
  mode = "menu";
  buffer = "";
  renderInput();

  if (isMobile()) mobileInput.focus();
}

/* ================= EMAIL ================= */

async function emailFlow() {
  mode = "email";

  await typeLine("> Insira seu endereço de e-mail.");
  buffer = "";
  renderInput();
}

/* ================= PASSWORD ================= */

async function passwordFlow() {
  mode = "password";

  await typeLine("> Insira sua senha.");
  buffer = "";
  renderInput();
}

/* ================= GOOGLE ================= */

async function googleLogin() {
  await typeLine("> Conectando ao Google...");

  const provider = new GoogleAuthProvider();

  try {
    await signInWithPopup(auth, provider);

    await typeLine("> Login realizado com sucesso.");
    window.location.href = "./index.html";

  } catch {
    await typeLine("> Falha no login com Google.");
    resetFlow();
  }
}

/* ================= INPUT HANDLER ================= */

async function handleEnter() {
  const val = buffer.trim();

  if (mode === "menu") {
    if (!["1", "2", "3"].includes(val)) {
      await typeLine("> Entrada inválida.");
      buffer = "";
      return renderInput();
    }

    if (val === "1") return emailFlow();
    if (val === "2") return googleLogin();
    if (val === "3") {
      window.location.href = "./signup.html";
    }
  }

  if (mode === "email") {
    email = val;
    return passwordFlow();
  }

  if (mode === "password") {
    try {
      await signInWithEmailAndPassword(auth, email, val);
      await typeLine("> Login realizado com sucesso.");
      window.location.href = "./index.html";
    } catch {
      await typeLine("> E-mail ou senha incorretos.");
      resetFlow();
    }
  }

  buffer = "";
}

/* ================= DESKTOP INPUT ================= */

document.addEventListener("keydown", async (e) => {

  // 🔥 ESSENCIAL: bloqueia no mobile
  if (isMobile()) return;

  if (e.key === "Enter") return handleEnter();

  if (e.key === "Backspace") buffer = buffer.slice(0, -1);
  else if (e.key.length === 1) buffer += e.key;

  mobileInput.value = buffer;
  renderInput();
});

/* ================= MOBILE INPUT (CORRETO DE VERDADE) ================= */

let isComposing = false;

/* detecta composição (teclado inteligente / autocorrect) */
mobileInput.addEventListener("compositionstart", () => {
  isComposing = true;
});

mobileInput.addEventListener("compositionend", () => {
  isComposing = false;
  buffer = mobileInput.value;
  renderInput();
});

/* captura input REAL */
mobileInput.addEventListener("beforeinput", (e) => {

  // 🔥 ignora enquanto está compondo (corrige texto invertido)
  if (isComposing) return;

  // 🔥 delete
  if (e.inputType === "deleteContentBackward") {
    buffer = buffer.slice(0, -1);
  }

  // 🔥 texto normal
  else if (e.data) {
    buffer += e.data;
  }

  renderInput();

  // 🔥 impede o navegador de bagunçar o valor
  e.preventDefault();
});

/* ENTER separado */
mobileInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleEnter();
    mobileInput.value = "";
    buffer = "";
  }
});

/* ================= START ================= */

startMenu();

/* ================= SCROLL LOCK ================= */

document.body.addEventListener("touchmove", (e) => {
  if (!e.target.closest("#log")) {
    e.preventDefault();
  }
}, { passive: false });

/* ================= VIEWPORT FIX ================= */

function fixViewportOnKeyboard() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', () => {
  fixViewportOnKeyboard();
  handleViewportResize();
});

fixViewportOnKeyboard();

/* ================= KEYBOARD DETECT ================= */

mobileInput.addEventListener("focus", () => {
  window.scrollTo(0, 0);
});

let lastHeight = window.innerHeight;

function handleViewportResize() {
  const currentHeight = window.innerHeight;

  const keyboardOpen = currentHeight < lastHeight - 100;

  if (keyboardOpen) {
    document.body.classList.add("keyboard-open");
  } else {
    document.body.classList.remove("keyboard-open");
  }

  lastHeight = currentHeight;
}