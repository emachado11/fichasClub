import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
  deleteUser,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Variáveis globais para manipulação da imagem
let user = null;

document.addEventListener("DOMContentLoaded", () => {
  // ===== ELEMENTOS =====
  const userAvatar = document.getElementById("user-avatar");
  const fileInput = document.getElementById("file-input");
  const cropModal = document.getElementById("crop-modal");
  const canvas = document.getElementById("crop-canvas");
  const zoomSlider = document.getElementById("zoom-slider");

  let img = new Image();
  let baseScale = 1;
  let scale = 1;
  let posX = 0;
  let posY = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;

  // Verificar se os elementos necessários existem antes de usá-los
  if (!userAvatar || !fileInput || !canvas || !zoomSlider) {
    console.error("Alguns elementos necessários não foram encontrados no DOM.");
    return;
  }

  const ctx = canvas.getContext("2d");


  // Adicionando evento para clicar nas fotos predefinidas
  const defaultAvatars = document.querySelectorAll('.default-avatar');

  // Quando o usuário clica na foto de perfil
  document.getElementById('user-avatar').addEventListener('click', function () {
    // Exibe o modal de crop
    document.getElementById('crop-modal').classList.add('show');
  });

  // Quando o usuário clica em "Cancelar"
  document.getElementById('crop-cancel').addEventListener('click', function () {
    // Oculta o modal de crop
    document.getElementById('crop-modal').classList.remove('show');
  });

  // Quando o usuário clica em "Salvar"
  document.getElementById('crop-save').addEventListener('click', function () {
    // Aqui você pode adicionar a lógica para salvar a imagem cortada e fechar o modal
    document.getElementById('crop-modal').classList.remove('show');
  });

  defaultAvatars.forEach((avatar) => {
    avatar.addEventListener('click', async () => {
      const img = new Image();
      img.src = avatar.src;

      img.onload = async () => {
        // Criar canvas temporário para manipulação da imagem
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Ajuste do tamanho da imagem
        const maxSize = 300;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Desenhar a imagem no canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Converter para base64 (JPEG com qualidade de 0.7)
        const base64 = canvas.toDataURL("image/jpeg", 0.7);

        // Salvar no Firebase
        await setDoc(doc(db, "users", user.uid), { avatar: base64 }, { merge: true });

        // Atualizar a foto de perfil na interface
        userAvatar.src = base64;
      };
    });
  });
  // =========================
  // 🔐 AUTH
  // =========================
  onAuthStateChanged(auth, async (currentUser) => {
    if (!currentUser) return (location.href = "./login.html");

    // Exibir ou esconder o avatar dependendo da seleção do menu
    toggleAvatarVisibility();

    user = currentUser;  // Definir a variável global user
    await loadUserAvatar();
  });

  // Função para carregar imagem de perfil do Firestore
  async function loadUserAvatar() {
    const docRef = doc(db, "users", user.uid);
    const snap = await getDoc(docRef);

    // Verificar se existe imagem e atribuí-la
    userAvatar.src = snap.exists() && snap.data().avatar
      ? snap.data().avatar
      : "./assets/default-avatar.png";  // Foto padrão caso não tenha
  }

  fileInput.addEventListener("change", (e) => handleFileUpload(e));

  // Função para configurar o crop da imagem
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result;  // Carregar a imagem no objeto Image
      cropModal.classList.add("show");  // Exibir o modal de crop
    };
    reader.readAsDataURL(file);  // Ler o arquivo como DataURL
  }

  // Cancelar o modal
  document.getElementById("crop-cancel").onclick = () => {
    cropModal.classList.remove("show");  // Fechar o modal
  };

  // Evento de upload do arquivo
  fileInput.addEventListener("change", (e) => handleFileUpload(e));

  // Salvar o arquivo após o crop
  document.getElementById("crop-save").onclick = async () => {
    const final = document.createElement("canvas");
    final.width = 300;
    final.height = 300;

    const fctx = final.getContext("2d");

    // Máscara circular
    fctx.beginPath();
    fctx.arc(150, 150, 150, 0, Math.PI * 2);
    fctx.clip();

    fctx.drawImage(img, posX, posY, img.width * scale, img.height * scale);

    const base64 = final.toDataURL("image/jpeg", 0.7);

    // Salvar no Firebase
    await setDoc(doc(db, "users", auth.currentUser.uid), { avatar: base64 }, { merge: true });

    userAvatar.src = base64;
    cropModal.classList.remove("show"); // Fechar o modal após salvar
  };

  // =========================
  // CROP - Manipulação da foto
  // =========================
  img.onload = () => {
    initializeCanvas();
    drawImage();
  };

  function initializeCanvas() {
    canvas.width = 300;
    canvas.height = 300;

    const scaleX = canvas.width / img.width;
    const scaleY = canvas.height / img.height;

    baseScale = Math.max(scaleX, scaleY);
    scale = baseScale;

    posX = (canvas.width - img.width * scale) / 2;
    posY = (canvas.height - img.height * scale) / 2;

    zoomSlider.value = 1;
  }

  // Função para desenhar a imagem no canvas
  function drawImage() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, posX, posY, img.width * scale, img.height * scale);
  }

  // Ajustar a posição da imagem e limites do canvas
  function clamp() {
    const minX = canvas.width - img.width * scale;
    const minY = canvas.height - img.height * scale;

    posX = Math.min(0, Math.max(minX, posX));
    posY = Math.min(0, Math.max(minY, posY));
  }

  // Função de zoom
  zoomSlider.oninput = () => {
    const zoom = parseFloat(zoomSlider.value);
    const newScale = baseScale * zoom;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    posX = centerX - ((centerX - posX) * newScale) / scale;
    posY = centerY - ((centerY - posY) * newScale) / scale;

    scale = newScale;

    clamp();
    drawImage();
  };

  // =========================
  // DRAG
  // =========================
  canvas.onmousedown = (e) => {
    dragging = true;
    startX = e.offsetX - posX;
    startY = e.offsetY - posY;
  };

  canvas.onmousemove = (e) => {
    if (!dragging) return;

    posX = e.offsetX - startX;
    posY = e.offsetY - startY;

    clamp();
    drawImage();
  };

  canvas.onmouseup = () => dragging = false;
  canvas.onmouseleave = () => dragging = false;

  // =========================
  // SALVAR
  // =========================
  document.getElementById("crop-save").onclick = async () => {
    const final = document.createElement("canvas");
    final.width = 300;
    final.height = 300;

    const fctx = final.getContext("2d");

    // Máscara circular
    fctx.beginPath();
    fctx.arc(150, 150, 150, 0, Math.PI * 2);
    fctx.clip();

    fctx.drawImage(img, posX, posY, img.width * scale, img.height * scale);

    const base64 = final.toDataURL("image/jpeg", 0.7);

    // Salvar no Firebase
    await setDoc(doc(db, "users", auth.currentUser.uid), { avatar: base64 }, { merge: true });

    userAvatar.src = base64;
    cropModal.classList.add("hidden");
  };

  // Cancelar
  document.getElementById("crop-cancel").onclick = () => cropModal.classList.add("hidden");

  /* ================= MENU ================= */
  let index = 1;
  const items = document.querySelectorAll(".menu-item");

  function updateMenu() {
    items.forEach((el, i) => el.classList.toggle("active", i === index));
  }

  items.forEach((el, i) => {
    el.onclick = () => handleSelect(i);
  });

  function handleSelect(i) {
    index = i;
    updateMenu();
    toggleAvatarVisibility();

    const flows = {
      1: flowRename,
      3: flowEmail,
      4: flowPassword,
      5: flowDeleteAccount
    };

    if (i === 6) {
      handleLogout();
      return;
    }

    if (flows[i]) openCMD(flows[i]);
  }

  // Focar nas alterações do menu
  document.addEventListener("keydown", (e) => {
    if (cmdActive) return;
    if (e.key === "ArrowDown") index = (index + 1) % items.length;
    if (e.key === "ArrowUp") index = (index - 1 + items.length) % items.length;
    updateMenu();

    if (e.key === "Enter") handleSelect(index);
    if (e.key === "Backspace") goHome();
  });

  function goHome() {
    window.location.href = "./index.html";
  }

  /* ================= CMD STATE ================= */
  let cmdActive = false;
  let buffer = "";
  let forceUppercase = false;
  let currentStep = null;

  const overlay = document.getElementById("cmd-window");
  const log = document.getElementById("cmd-log");
  const inputEl = document.getElementById("cmd-input");
  const cursor = document.querySelector(".cmd-cursor");
  const closeBtn = document.querySelector(".cmd-controls span:last-child");

  /* ===================== CMD CORE ====================== */
  function openCMD(flow) {
    if (!user) return;

    cmdActive = true;

    overlay.classList.remove("hidden");
    requestAnimationFrame(() => overlay.classList.add("show"));

    resetCMD();
    bindInput();

    flow();
  }

  function closeCMD() {
    cmdActive = false;

    overlay.classList.remove("show");

    setTimeout(() => {
      overlay.classList.add("hidden");
      resetCMD();
    }, 150);
  }

  function resetCMD() {
    log.innerHTML = "";
    inputEl.textContent = "";
    buffer = "";
    forceUppercase = false;
    currentStep = null;
  }

  /* ================= INPUT ================= */
  function bindInput() {
    document.onkeydown = (e) => {
      if (!cmdActive || !currentStep) return;
      currentStep(e);
    };
  }

  function setStep(fn) {
    currentStep = fn;
  }

  /* ================= OUTPUT ================= */
  function typeLine(text, speed = 15) {
    return new Promise((res) => {
      const line = document.createElement("div");
      log.appendChild(line);

      let i = 0;

      const tick = () => {
        if (i < text.length) {
          line.textContent += text[i++];
          log.scrollTop = log.scrollHeight;
          setTimeout(tick, speed);
        } else res();
      };

      tick();
    });
  }

  function renderInput() {
    inputEl.textContent = buffer;
    inputEl.appendChild(cursor);
  }

  function createPrompt() {
    const line = document.createElement("div");
    line.innerHTML = "> <span></span>";
    log.appendChild(line);

    buffer = "";
    renderInput();
  }

  /* ================= INPUT ================= */
  function handleTyping(e) {
    if (e.key === "Backspace") buffer = buffer.slice(0, -1);

    if (e.key.length === 1) {
      buffer += forceUppercase ? e.key.toUpperCase() : e.key;
    }

    renderInput();
  }

  async function handleLogout() {
    await signOut(auth);
    window.location.href = "./index.html";
  }

  /* ================= ASK ENGINE ================= */
  function ask({ uppercase = false, validate = () => true, error = "> Entrada inválida." } = {}) {
    return new Promise((resolve) => {
      forceUppercase = uppercase;
      createPrompt();

      setStep(async (e) => {
        if (e.key !== "Enter") return handleTyping(e);

        const value = buffer.trim();

        if (!validate(value)) {
          await typeLine(error);
          createPrompt();
          return;
        }

        resolve(value);
      });
    });
  }

  /* ===================== FLOWS ========================= */
  /* ================= USERNAME ================= */
  async function flowRename() {
    const name = user.displayName || "usuário";

    await typeLine(`> Saudações, ${name}.`);
    await typeLine("> Alterar nome? S/N");

    const ans = await ask({ uppercase: true });

    if (ans !== "S") return finish("> Até breve :)");

    await typeLine("> Novo nome:");

    const newName = await ask({
      uppercase: false,
      validate: (v) => v.length > 0,
      error: "> Nome inválido."
    });

    await updateProfile(auth.currentUser, { displayName: newName });
    user = auth.currentUser;

    finish(`> Nome alterado para ${newName}`);
  }

  /* ================= EMAIL ================= */
  async function flowEmail() {
    const masked = maskEmail(user.email);

    await typeLine("> E-mail atual:");
    await typeLine(`> ${masked}`);
    await typeLine("> Alterar? S/N");

    const ans = await ask({ uppercase: true });

    if (ans !== "S") return finish("> Cancelado.");

    await typeLine("> Digite o e-mail atual:");

    const current = await ask({
      uppercase: false,
      validate: (v) => v === user.email,
      error: "> E-mail não confere."
    });

    await typeLine("> Novo e-mail:");

    const newEmail = await ask({
      uppercase: false,
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      error: "> E-mail inválido."
    });

    await typeLine("> Senha atual:");

    const password = await ask({
      uppercase: false,
      validate: (v) => v.length > 0,
      error: "> Senha inválida."
    });

    try {
      const cred = EmailAuthProvider.credential(user.email, password);

      await reauthenticateWithCredential(auth.currentUser, cred);
      await updateEmail(auth.currentUser, newEmail);

      user = auth.currentUser;

      finish("> E-mail atualizado com sucesso.");
    } catch (err) {
      console.log(err);
      finish("> Erro ao atualizar e-mail.");
    }
  }

  /* ================= PASSWORD ================= */
  async function flowPassword() {
    await typeLine("> Você quer alterar sua senha? S/N");

    const wantChange = await ask({
      uppercase: true,
      validate: (v) => ["S", "N"].includes(v),
      error: "> Entrada inválida."
    });

    if (wantChange === "S") {
      await typeLine("> Você esqueceu sua senha? S/N");

      const forgot = await ask({
        uppercase: true,
        validate: (v) => ["S", "N"].includes(v),
        error: "> Entrada inválida."
      });

      if (forgot === "S") {
        await typeLine("> Insira o e-mail cadastrado:");

        const email = await ask({
          uppercase: false,
          validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
          error: "> E-mail inválido."
        });

        await sendPasswordResetEmail(auth, email);

        await typeLine("> Link de redefinição enviado para o e-mail.");
        await typeLine("> Não se esqueça de verificar o spam!");

        return finish("> Finalizando processo...");
      }

      // Troca direta
      await typeLine("> Insira a senha atual:");

      const oldPass = await ask({
        uppercase: false,
        validate: (v) => v.length > 0,
        error: "> Senha inválida."
      });

      try {
        const cred = EmailAuthProvider.credential(user.email, oldPass);
        await reauthenticateWithCredential(auth.currentUser, cred);
      } catch {
        return finish("> Senha incorreta.");
      }

      await typeLine("> Insira a senha nova:");

      const newPass = await ask({
        uppercase: false,
        validate: (v) => v.length >= 6,
        error: "> Mínimo 6 caracteres."
      });

      await typeLine("> Repita a senha nova:");

      const confirmPass = await ask({
        uppercase: false,
        validate: (v) => v === newPass,
        error: "> Senhas não conferem."
      });

      await updatePassword(auth.currentUser, confirmPass);

      return finish("> Senha alterada com sucesso.");
    }

    return finish("> Operação cancelada.");
  }

  async function flowDeleteAccount() {
    await typeLine("> Você tem certeza de que quer apagar sua conta?");
    await typeLine("> Seus dados não poderão ser recuperados depois. S/N");

    const confirm = await ask({
      uppercase: true,
      validate: (v) => ["S", "N"].includes(v),
      error: "> Entrada inválida."
    });

    if (confirm === "N") {
      return finish("> Operação cancelada.");
    }

    await typeLine("> Digite APAGAR para confirmar.");

    const finalConfirm = await ask({
      uppercase: true,
      validate: (v) => v === "APAGAR",
      error: "> Texto incorreto."
    });

    try {
      await deleteUser(auth.currentUser);

      await typeLine("> Conta apagada com sucesso.");

      setTimeout(() => {
        window.location.href = "./index.html";
      }, 1000);

    } catch (err) {
      if (err.code === "auth/requires-recent-login") {

        await typeLine("> Confirmação necessária.");
        await typeLine("> Insira sua senha:");

        const password = await ask({
          uppercase: false,
          validate: (v) => v.length > 0,
          error: "> Senha inválida."
        });

        try {
          const cred = EmailAuthProvider.credential(user.email, password);

          await reauthenticateWithCredential(auth.currentUser, cred);
          await deleteUser(auth.currentUser);

          await typeLine("> Conta apagada com sucesso.");

          setTimeout(() => {
            window.location.href = "./index.html";
          }, 1000);

        } catch (e) {
          console.log(e);
          finish("> Falha na autenticação.");
        }

      } else {
        console.log(err);
        finish("> Erro ao apagar conta.");
      }
    }
  }


  /* ================= HELPERS ================= */
  function maskEmail(email) {
    const [n, d] = email.split("@");
    return `${n.slice(0, 3)}***@${d}`;
  }

  function finish(msg) {
    typeLine(msg);
    setTimeout(closeCMD, msg.length * 100);
  }

  /* ================= CLOSE ================= */
  closeBtn.onclick = closeCMD;

  /* ================= AVATAR VISIBILITY ================= */
  const changeAvatarTip = document.querySelector(".account-position");

  function toggleAvatarVisibility() {
    const show = index === 2;
    userAvatar.classList.toggle("hidden", !show);
    if (changeAvatarTip) changeAvatarTip.classList.toggle("hidden", !show);
  }

  // Evento para clicar na foto de perfil e abrir o seletor de arquivos
  userAvatar.addEventListener("click", () => {
    fileInput.click();  // Acionar o input de arquivo
  });

  // Função para lidar com o upload do arquivo
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result;  // Carregar a imagem no objeto Image
      cropModal.classList.remove("hidden");  // Exibir o modal de crop
    };
    reader.readAsDataURL(file);  // Ler o arquivo como DataURL
  }

  // Adicionando o evento de upload para o input de arquivo
  fileInput.addEventListener("change", (e) => handleFileUpload(e));
});