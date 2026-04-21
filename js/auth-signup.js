import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ================= CONSOLE ================= */

const main = document.querySelector("main");

const consoleBox = document.createElement("div");
consoleBox.id = "console";

Object.assign(consoleBox.style, {
  fontFamily: "VT323, monospace",
  fontSize: "22px",
  color: "#fff",
  whiteSpace: "pre-wrap",
  lineHeight: "1.6",
  maxHeight: "90vh",
  overflowY: "auto",
});

main.innerHTML = "";
main.appendChild(consoleBox);

/* ================= CURSOR ================= */

const cursor = document.createElement("span");
cursor.textContent = "▌";

cursor.style.display = "inline-block";
cursor.style.animation = "blink 0.9s infinite";
cursor.style.marginLeft = "2px";

const style = document.createElement("style");
style.textContent = `
@keyframes blink {
  0%,49% { opacity: 1; }
  50%,100% { opacity: 0; }
}`;
document.head.appendChild(style);

/* ================= STATE ================= */

let mode = "menu";
let buffer = "";
let email = "";
let password = "";
let activeInput = null;

/* ================= SCROLL ================= */

function scrollDown() {
  consoleBox.scrollTop = consoleBox.scrollHeight;
}

/* ================= RESET ================= */

function resetFlow() {
  mode = "menu";
  buffer = "";
  email = "";
  password = "";
  activeInput = null;

  consoleBox.innerHTML = "";
  startMenu();
}

/* ================= TYPEWRITER ================= */

function typeLine(text, speed = 18) {
  return new Promise((resolve) => {
    const line = document.createElement("div");
    consoleBox.appendChild(line);

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

/* ================= PROMPT ================= */

function createPrompt() {
  const line = document.createElement("div");

  const prefix = document.createElement("span");
  prefix.textContent = "> ";

  const input = document.createElement("span");

  line.appendChild(prefix);
  line.appendChild(input);

  consoleBox.appendChild(line);

  activeInput = input;
  buffer = "";

  renderInput();
  scrollDown();

  return input;
}

/* ================= INPUT ================= */

function renderInput() {
  if (!activeInput) return;

  activeInput.textContent = buffer;
  activeInput.appendChild(cursor);
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
  createPrompt();

  document.onkeydown = async (e) => {
    if (mode !== "menu") return;

    if (e.key === "Enter") {
      const val = buffer.trim();

      if (!["1", "2", "3"].includes(val)) {
        await typeLine("> Entrada inválida. Use 1, 2 ou 3");
        createPrompt();
        return;
      }

      if (val === "1") return emailFlow();
      if (val === "2") return googleSignup();

      if (val === "3") {
        await typeLine("> Redirecionando usuário...");
        window.location.href = "./login.html";
      }
    }

    handleTyping(e);
  };
}

/* ================= EMAIL ================= */

async function emailFlow() {
  mode = "email";

  await typeLine("> Insira um e-mail válido.");
  createPrompt();

  document.onkeydown = async (e) => {
    if (mode !== "email") return;

    if (e.key === "Enter") {
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buffer);

      if (!valid) {
        await typeLine("> Email inválido ou já utilizado.");
        return resetFlow();
      }

      email = buffer;
      return passwordFlow();
    }

    handleTyping(e);
  };
}

/* ================= PASSWORD ================= */

async function passwordFlow() {
  mode = "password";

  await typeLine("> Insira uma senha de 6 a 15 caracteres.");
  createPrompt();

  document.onkeydown = async (e) => {
    if (mode !== "password") return;

    if (e.key === "Enter") {
      if (buffer.length < 6 || buffer.length > 15) {
        await typeLine("> Senha inválida.");
        return resetFlow();
      }

      password = buffer;

      try {
        await createUserWithEmailAndPassword(auth, email, password);

        await typeLine("> Obrigado pela preferência! :)");
        await typeLine("> Redirecionando usuário...");

        window.location.href = "./index.html";

      } catch (err) {
        await typeLine("> Erro ao criar conta.");
        return resetFlow();
      }
    }

    handleTyping(e);
  };
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

function handleTyping(e) {
  if (e.key === "Backspace") {
    buffer = buffer.slice(0, -1);
  }

  if (e.key.length === 1) {
    buffer += e.key;
  }

  renderInput();
}

/* ================= START ================= */

startMenu();