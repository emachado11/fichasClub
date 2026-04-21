import { classes } from "./classes.js";
import { origens } from "./origens.js";
import { pericias } from "./pericias.js";
import { habilidades } from "./habilidades.js";

const state = {
    classIndex: 1,
    classe: null,
    origem: null,
    pontosAtributos: 4,
    atributos: { FOR: 1, AGI: 1, INT: 1, PRE: 1, VIG: 1 },
    baseAtributo: 1,
    limiteAtributo: 3,
    pericia: {}
};

pericias.forEach(p => {
    state.pericia[p.id] = { classe: 0, origem: 0, treino: 0, bonus: 0 };
});

function go(i) {
    document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
    document.getElementById("step-" + i).classList.add("active");

    document.getElementById("progress").style.width =
        i === 0 ? "0%" : i === 1 ? "50%" : "100%";
}

let animating = false;

/* ================= INDEX HELPERS ================= */

function getIndexes() {
    const len = classes.length;

    return {
        prev: (state.classIndex - 1 + len) % len,
        cur: state.classIndex,
        next: (state.classIndex + 1) % len
    };
}

/* ================= RENDER PRINCIPAL ================= */

function renderClasse() {
    const { prev, cur, next } = getIndexes();

    const c = classes[cur];
    const p = classes[prev];
    const n = classes[next];

    const center = document.getElementById("class-card");
    const left = document.getElementById("card-prev");
    const right = document.getElementById("card-next");

    // evita erro de null crash
    if (!center || !left || !right) return;

    /* ===== CENTER ===== */
    center.innerHTML = `
        <div class="class-image"></div>
        <div class="class-name">${c.nome}</div>
    `;

    /* HUD / botão continuar */
    document.getElementById("continue-name").textContent = c.nome;

    /* painel lateral */
    document.getElementById("panel-title").textContent = c.nome;

    document.getElementById("panel-title").textContent = c.nome;

    const pv = c.vida_inicial ?? 0;
    const pe = c.esforco_inicial ?? 0;
    const pre = c.determinacao_inicial ?? 0;
    const san = c.sanidade_inicial ?? 0;

    document.getElementById("panel-stats").innerHTML = `
    
    <!-- QUOTE FORA DAS COLUNAS -->
    <div class="panel-quote-top">
        “${c.descricao || ""}”
    </div>

    <div class="panel-grid">

        <!-- COLUNA 1 -->
        <div class="panel-col">

            <div><b>PV:</b> ${pv} + <i>VIG</i></div>
            <div><b>PE:</b> ${pe} + <i>PRE</i></div>
            <div><b>PD:</b> ${pe} + <i>PRE</i></div>
            <div><b>SAN:</b> ${san}</div>

        </div>

        <!-- DIVISOR -->
        <div class="panel-divider"></div>

        <!-- COLUNA 2 -->
        <div class="panel-col">

            <div class="panel-title">Perícias Treinadas</div>
            <div class="panel-text tight">
                <i>${(c.pericias || []).join(", ")}</i>
            </div>

            <div class="panel-title">Proficiências</div>
            <div class="panel-text tight">
                <i>${(c.proficiencias || []).join(", ")}</i>
            </div>

        </div>

    </div>
`;

    /* ===== LEFT ===== */
    left.innerHTML = `
        <div class="class-image"></div>
        <div class="class-name">${p.nome}</div>
    `;

    /* ===== RIGHT ===== */
    right.innerHTML = `
        <div class="class-image"></div>
        <div class="class-name">${n.nome}</div>
    `;

    applyPositions();
}

/* ================= POSIÇÕES ================= */

function applyPositions() {
    const left = document.getElementById("card-prev");
    const center = document.getElementById("class-card");
    const right = document.getElementById("card-next");

    left.className = "class-card card-left";
    center.className = "class-card card-center";
    right.className = "class-card card-right";
}

/* ================= MOVE ================= */

function move(dir) {
    if (animating) return;
    animating = true;

    const center = document.getElementById("class-card");

    // animação leve de saída
    center.style.transform = "scale(0.95)";
    center.style.opacity = "0.2";

    setTimeout(() => {

        const len = classes.length;

        state.classIndex =
            dir === "next"
                ? (state.classIndex + 1) % len
                : (state.classIndex - 1 + len) % len;

        renderClasse();

        // reset visual entrada
        requestAnimationFrame(() => {
            center.style.transform = "scale(1)";
            center.style.opacity = "1";
        });

        animating = false;

    }, 180);
}

/* ================= EVENTS ================= */

document.getElementById("next-class").addEventListener("click", () => move("next"));
document.getElementById("prev-class").addEventListener("click", () => move("prev"));

/* painel lateral */
document.getElementById("class-card").addEventListener("click", (e) => {
    // evita conflito com cards/elementos internos
    if (e.target.closest(".nav-btn") || e.target.closest(".continue-btn")) return;

    document.getElementById("class-panel").classList.toggle("open");
});

/* botão continuar */
document.getElementById("confirm-class").addEventListener("click", (e) => {
    e.stopPropagation();

    const c = classes[state.classIndex];

    if (!c) return;

    state.classe = c;

    // reset seguro
    Object.keys(state.pericia).forEach(k => {
        if (state.pericia[k]) {
            state.pericia[k].classe = 0;
        }
    });

    // aplica bônus com proteção contra IDs inválidos
    (c.pericias || []).forEach(id => {
        if (state.pericia[id]) {
            state.pericia[id].classe = 5;
        }
    });

    renderPericias();
    go(1);
});

/* ================= INIT ================= */

renderClasse();

// ================= ATRIBUTOS =================
function calcPoints() {
    return state.pontosAtributos -
        Object.values(state.atributos)
            .reduce((a, b) => a + (b - 1), 0);
}

function renderAtributos() {
    const el = document.getElementById("atributos");
    el.innerHTML = "";

    const pontos = calcPoints();
    document.getElementById("points-left").textContent = pontos;

    Object.keys(state.atributos).forEach(k => {

        const wrapper = document.createElement("div");
        wrapper.className = "attr";

        wrapper.innerHTML = `
            <div class="attr-circle">
                <div class="attr-label">${k}</div>

                <input 
                    class="attr-input"
                    type="number"
                    min="0"
                    max="3"
                    value="${state.atributos[k]}"
                />
            </div>
        `;

        const input = wrapper.querySelector("input");

        input.addEventListener("input", (e) => {
            let val = Number(e.target.value);

            if (isNaN(val)) val = 0;

            // clamp 0–3
            val = Math.max(0, Math.min(3, val));

            state.atributos[k] = val;

            renderAtributos();
        });

        el.appendChild(wrapper);
    });

    document.getElementById("to-origem").disabled = pontos !== 0;
}

window.chg = (k, v) => {
    const next = state.atributos[k] + v;
    if (next < 0 || next > 3) return;

    const gasto =
        Object.values(state.atributos).reduce((a, b) => a + (b - 1), 0);

    if (gasto + v > state.pontosAtributos || gasto + v < 0) return;

    state.atributos[k] = next;
    renderAtributos();
};

// ================= PERICIAS =================
function total(p) {
    const s = state.pericia[p.id];

    return (
        Number(s.classe) +
        Number(s.origem) +
        Number(s.treino) +
        Number(s.bonus)
    );
}

function treinoLabel(v) {
    if (v >= 15) return "Expert";
    if (v >= 10) return "Veterano";
    if (v >= 5) return "Treinado";
    return "Sem treino";
}

function renderPericias() {
    const el = document.getElementById("pericias");
    el.innerHTML = "";

    pericias.forEach(p => {
        const s = state.pericia[p.id];
        const t = total(p);

        const d = document.createElement("div");
        d.className = "pericia";

        d.innerHTML = `
        <div>${p.nome} (${p.atributo})</div>
        <div>${t}</div>
        <div>${treinoLabel(t)}</div>

        <select>
            <option value="0">0</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
        </select>

        <input type="number" value="${s.bonus}">
        `;

        el.appendChild(d);

        const select = d.querySelector("select");
        const input = d.querySelector("input");

        select.value = s.treino;

        select.addEventListener("change", (e) => {
            state.pericia[p.id].treino = Number(e.target.value);
            renderPericias();
        });

        input.addEventListener("change", (e) => {
            state.pericia[p.id].bonus = Number(e.target.value);
            renderPericias();
        });
    });
}

// ================= ORIGENS =================
function aplicarOrigem(o) {
    Object.keys(state.pericia).forEach(k => {
        state.pericia[k].origem = 0;
    });

    o.pericias.forEach(id => {
        state.pericia[id].origem = 5;
    });
}

function renderOrigens() {
    const el = document.getElementById("origens");
    el.innerHTML = "";

    origens.forEach(o => {
        const card = document.createElement("div");
        card.className = "origem";

        const selected = state.origem && state.origem.id === o.id;
        const habilidade = getHabilidade(o.habilidadeId);

        card.innerHTML = `
        <div class="origem-top">
            <span>▼</span>
            <div>${o.nome}</div>
            <button>${selected ? "Selecionado" : "Selecionar"}</button>
        </div>

        <div class="desc" style="display:none">
            <p>${o.descricao}</p>
            <p><b>Perícias:</b> ${o.pericias.join(", ")}</p>
            <p><b>Habilidade:</b> ${habilidade ? habilidade.nome : "—"}</p>
            <p>${habilidade ? habilidade.descricao : ""}</p>
        </div>
        `;

        card.addEventListener("click", (e) => {
            if (e.target.tagName === "BUTTON") return;

            const desc = card.querySelector(".desc");
            desc.style.display = desc.style.display === "block" ? "none" : "block";
        });

        const btn = card.querySelector("button");

        btn.addEventListener("click", (e) => {
            e.stopPropagation();

            state.origem = o;
            aplicarOrigem(o);

            document.querySelectorAll("#origens button")
                .forEach(b => b.textContent = "Selecionar");

            btn.textContent = "Selecionado";

            renderPericias();
        });

        el.appendChild(card);
    });
}

// ================= FLOW =================
document.getElementById("to-origem").onclick = () => {
    if (calcPoints() !== 0) return;
    go(2);
    renderOrigens();
    renderPericias();
};

document.getElementById("back-to-class").onclick = () => go(0);
document.getElementById("back-to-atributos").onclick = () => go(1);

document.getElementById("finish").onclick = () => {
    console.log("FICHA FINAL:", state);
};

// INIT
renderAtributos();
renderPericias();