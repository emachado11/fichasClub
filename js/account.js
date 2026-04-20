import { auth, storage } from "./firebase.js";

import {
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ELEMENTOS
const userAvatar = document.getElementById("user-avatar");
const userNicknameInput = document.getElementById("user-nickname");
const userEmail = document.getElementById("user-email");
const fileInput = document.getElementById("file-input");

const changeEmailText = document.getElementById("change-email-text");
const changePasswordText = document.getElementById("change-password-text");

const newEmailInput = document.getElementById("new-email");
const passwordForEmailInput = document.getElementById("password-for-email");
const currentPasswordInput = document.getElementById("current-password");
const newPasswordInput = document.getElementById("new-password");

const emailChangeContainer = document.getElementById("email-change-container");
const passwordChangeContainer = document.getElementById("password-change-container");

const forgotPasswordBtn = document.getElementById("forgot-password-btn");
const saveEmailBtn = document.getElementById("save-email-btn");
const savePasswordBtn = document.getElementById("save-password-btn");

const logoutBtn = document.getElementById("logout-btn");
const deleteAccountBtn = document.getElementById("delete-account-btn");

// ===== COMPRESSÃO =====
async function compressImage(file, maxSize = 512, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // mantém proporção
      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        quality
      );
    };
  });
}

// ===== AUTH =====
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Faça login.");
    window.location.href = "../login.html";
    return;
  }

  console.log("User carregado:", user.uid);

  userAvatar.src = user.photoURL || "./assets/default-avatar.png";
  userNicknameInput.value = user.displayName || "Anônimo";

  userEmail.value = maskEmail(user.email);

  // ===== FOTO =====
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("Arquivo selecionado:", file);

    try {
      // compressão
      const compressed = await compressImage(file);
      console.log("Imagem comprimida:", compressed);

      const storageRef = ref(storage, `avatars/${user.uid}.jpg`);

      // upload
      await uploadBytes(storageRef, compressed);
      console.log("Upload feito");

      const downloadURL = await getDownloadURL(storageRef);
      console.log("URL:", downloadURL);

      // salva no auth
      await updateProfile(user, {
        photoURL: downloadURL
      });

      console.log("Perfil atualizado");

      // força atualização (cache bust)
      userAvatar.src = downloadURL + "?t=" + Date.now();

      alert("Foto atualizada!");
    } catch (err) {
      console.error("ERRO UPLOAD:", err);
      alert("Erro real: " + err.message);
    }
  });

  // ===== RESTO DO SEU CÓDIGO (inalterado) =====

  userNicknameInput.addEventListener("blur", async () => {
    await updateProfile(user, { displayName: userNicknameInput.value });
  });

  changeEmailText.onclick = () => toggle(emailChangeContainer);
  changePasswordText.onclick = () => toggle(passwordChangeContainer);

  saveEmailBtn.onclick = async () => {
    const cred = EmailAuthProvider.credential(
      user.email,
      passwordForEmailInput.value
    );

    await reauthenticateWithCredential(user, cred);
    await updateEmail(user, newEmailInput.value);

    alert("Email atualizado!");
  };

  savePasswordBtn.onclick = async () => {
    const cred = EmailAuthProvider.credential(
      user.email,
      currentPasswordInput.value
    );

    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPasswordInput.value);

    alert("Senha atualizada!");
  };

  forgotPasswordBtn.onclick = () =>
    sendPasswordResetEmail(auth, user.email);

  logoutBtn.onclick = () => {
    auth.signOut();
    location.href = "../login.html";
  };

  deleteAccountBtn.onclick = async () => {
    await user.delete();
    location.href = "../login.html";
  };
});

// ===== UTILS =====
function maskEmail(email) {
  const [l, d] = email.split("@");
  return l.slice(0, 3) + "***@" + d;
}

function toggle(el) {
  el.classList.toggle("hidden");
}