import { auth, db } from "./firebase.js";

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
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ELEMENTOS
const userAvatar = document.getElementById("user-avatar");
const fileInput = document.getElementById("file-input");
const nickname = document.getElementById("user-nickname");
const email = document.getElementById("user-email");

const changeEmailText = document.getElementById("change-email-text");
const changePasswordText = document.getElementById("change-password-text");

const emailBox = document.getElementById("email-change-container");
const passwordBox = document.getElementById("password-change-container");

const newEmailInput = document.getElementById("new-email");
const passwordForEmailInput = document.getElementById("password-for-email");
const currentPasswordInput = document.getElementById("current-password");
const newPasswordInput = document.getElementById("new-password");

const saveEmailBtn = document.getElementById("save-email-btn");
const savePasswordBtn = document.getElementById("save-password-btn");

const logoutBtn = document.getElementById("logout-btn");
const deleteBtn = document.getElementById("delete-account-btn");

// ===== CROP =====
const cropModal = document.getElementById("crop-modal");
const canvas = document.getElementById("crop-canvas");
const ctx = canvas.getContext("2d");
const zoomSlider = document.getElementById("zoom-slider");

let img = new Image();
let baseScale = 1; // 🔥 escala inicial (fit)
let scale = 1;
let posX = 0;
let posY = 0;
let dragging = false;
let startX, startY;

// ===== AUTH =====
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "../login.html";

  nickname.value = user.displayName || "Anônimo";
  email.value = user.email;

  const docRef = doc(db, "users", user.uid);
  const snap = await getDoc(docRef);

  userAvatar.src = snap.exists() && snap.data().avatar
    ? snap.data().avatar
    : "./assets/default-avatar.png";

  // ===== ABRIR CROP =====
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result;
      cropModal.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  // ===== RESTO =====
  nickname.addEventListener("blur", async () => {
    await updateProfile(user, { displayName: nickname.value });
  });

  changeEmailText.onclick = () => emailBox.classList.toggle("hidden");
  changePasswordText.onclick = () => passwordBox.classList.toggle("hidden");

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

  logoutBtn.onclick = () => {
    auth.signOut();
    location.href = "../login.html";
  };

  deleteBtn.onclick = async () => {
    await user.delete();
    location.href = "../login.html";
  };
});

// ===== CROP ENGINE =====
img.onload = () => {
  canvas.width = 300;
  canvas.height = 300;

  const scaleX = canvas.width / img.width;
  const scaleY = canvas.height / img.height;

  baseScale = Math.min(scaleX, scaleY);

  scale = baseScale;

  posX = (canvas.width - img.width * scale) / 2;
  posY = (canvas.height - img.height * scale) / 2;

  zoomSlider.value = 1; // 🔥 slider começa neutro

  draw();
};

function draw() {
  ctx.clearRect(0, 0, 300, 300);
  ctx.drawImage(img, posX, posY, img.width * scale, img.height * scale);
}

function clamp() {
  const minX = canvas.width - img.width * scale;
  const minY = canvas.height - img.height * scale;

  // trava horizontal
  if (img.width * scale > canvas.width) {
    posX = Math.min(0, Math.max(minX, posX));
  } else {
    posX = (canvas.width - img.width * scale) / 2;
  }

  // trava vertical
  if (img.height * scale > canvas.height) {
    posY = Math.min(0, Math.max(minY, posY));
  } else {
    posY = (canvas.height - img.height * scale) / 2;
  }
}

zoomSlider.oninput = () => {
  const zoom = parseFloat(zoomSlider.value);

  const newScale = baseScale * zoom; // 🔥 usa multiplicador

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  posX = centerX - ((centerX - posX) * newScale) / scale;
  posY = centerY - ((centerY - posY) * newScale) / scale;

  scale = newScale;

  clamp();
  draw();
};

// drag
canvas.onmousedown = (e) => {
  dragging = true;
  startX = e.offsetX - posX;
  startY = e.offsetY - posY;
};

canvas.onmousemove = (e) => {
  if (!dragging) return;

  posX = e.offsetX - startX;
  posY = e.offsetY - startY;

  clamp(); // 🔥 trava aqui

  draw();
};

canvas.onmouseup = () => dragging = false;
canvas.onmouseleave = () => dragging = false;

// salvar
document.getElementById("crop-save").onclick = async () => {
  const final = document.createElement("canvas");
  final.width = 300;
  final.height = 300;

  const fctx = final.getContext("2d");

  fctx.beginPath();
  fctx.arc(150, 150, 150, 0, Math.PI * 2);
  fctx.clip();

  fctx.drawImage(img, posX, posY, img.width * scale, img.height * scale);

  const base64 = final.toDataURL("image/jpeg", 0.7);

  await setDoc(doc(db, "users", auth.currentUser.uid), {
    avatar: base64
  }, { merge: true });

  userAvatar.src = base64;
  cropModal.classList.add("hidden");
};

document.getElementById("crop-cancel").onclick = () => {
  cropModal.classList.add("hidden");
};