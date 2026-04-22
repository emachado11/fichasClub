/* ================= DEVICE DETECTOR ================= */

function getDeviceType(width) {
  if (width <= 480) return "mobile";
  if (width <= 768) return "tablet";
  return "desktop";
}

function applyDeviceClass() {
  const width = window.innerWidth;
  const device = getDeviceType(width);

  const body = document.body;

  // remove classes antigas
  body.classList.remove("mobile", "tablet", "desktop");

  // aplica nova
  body.classList.add(device);
}

/* ================= INIT ================= */

applyDeviceClass();

/* ================= UPDATE ON RESIZE ================= */

let resizeTimeout;

window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);

  resizeTimeout = setTimeout(() => {
    applyDeviceClass();
  }, 100);
});