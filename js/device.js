export const isMobile = () => window.innerWidth <= 768;

function applyDeviceMode() {
  document.body.classList.toggle("mobile", window.innerWidth <= 768);
}

window.addEventListener("resize", applyDeviceMode);
window.addEventListener("load", applyDeviceMode);

applyDeviceMode();