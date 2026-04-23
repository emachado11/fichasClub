import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
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
let password = "";

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
  password = "";

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
  await typeLine("> Criar conta.");
  await typeLine("> Digite 1 para criar conta com e-mail e senha.");
  await typeLine("> Digite 2 para criar conta com Google.");
  await typeLine("> Digite 3 para entrar.");

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

  await typeLine("> Insira um e-mail válido.");
  buffer = "";
  renderInput();
}

/* ================= PASSWORD ================= */

async function passwordFlow() {
  mode = "password";

  await typeLine("> Insira uma senha de 6 a 15 caracteres.");
  buffer = "";
  renderInput();
}

/* ================= GOOGLE ================= */

async function googleSignup() {
  await typeLine("> Conectando ao Google...");

  const provider = new GoogleAuthProvider();

  try {
    await signInWithPopup(auth, provider);

    await typeLine("> Obrigado pela preferência! :)");
    await typeLine("> Redirecionando usuário...");

    window.location.href = "./index.html";

  } catch {
    await typeLine("> Falha ao criar conta com Google.");
    resetFlow();
  }
}

/* ================= INPUT HANDLER ================= */

async function handleEnter() {
  const val = buffer.trim();

  if (mode === "menu") {
    if (!["1","2","3"].includes(val)) {
      await typeLine("> Entrada inválida.");
      buffer = "";
      return renderInput();
    }

    if (val === "1") return emailFlow();
    if (val === "2") return googleSignup();
    if (val === "3") {
      window.location.href = "./login.html";
    }
  }

  if (mode === "email") {
    email = val;
    return passwordFlow();
  }

  if (mode === "password") {
    if (val.length < 6 || val.length > 15) {
      await typeLine("> Senha inválida.");
      return resetFlow();
    }

    try {
      await createUserWithEmailAndPassword(auth, email, val);

      await typeLine("> Obrigado pela preferência! :)");
      await typeLine("> Redirecionando usuário...");

      window.location.href = "./index.html";

    } catch {
      await typeLine("> Erro ao criar conta.");
      resetFlow();
    }
  }

  buffer = "";
}

/* ================= DESKTOP INPUT ================= */

document.addEventListener("keydown", async (e) => {

  if (isMobile()) return;

  if (e.key === "Enter") return handleEnter();

  if (e.key === "Backspace") buffer = buffer.slice(0, -1);
  else if (e.key.length === 1) buffer += e.key;

  mobileInput.value = buffer;
  renderInput();
});

/* ================= MOBILE INPUT (MESMO DO LOGIN) ================= */

let isComposing = false;

mobileInput.addEventListener("compositionstart", () => {
  isComposing = true;
});

mobileInput.addEventListener("compositionend", () => {
  isComposing = false;
  buffer = mobileInput.value;
  renderInput();
});

mobileInput.addEventListener("beforeinput", (e) => {

  if (isComposing) return;

  if (e.inputType === "deleteContentBackward") {
    buffer = buffer.slice(0, -1);
  }

  else if (e.data) {
    buffer += e.data;
  }

  renderInput();

  e.preventDefault();
});

mobileInput.addEventListener("keydown", (e) => {

  if (e.key === "Backspace") {
    buffer = buffer.slice(0, -1);
    mobileInput.value = buffer;
    renderInput();
  }

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