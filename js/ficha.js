import { pericias } from "./pericias.js";
import { habilidades } from "./habilidades.js";

import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


const adicionados = {
    habilidades: new Set(),
    rituais: new Set(),
    inventario: new Set()
};

const params = new URLSearchParams(window.location.search);
const fichaId = params.get("id");

let fichaData = null;

/* ATRIBUTOS GLOBAL (IMPORTANTE PRO DEFESA + SAVE) */
let atributos = {
    forca: 1,
    agilidade: 1,
    vigor: 1,
    presenca: 1,
    intelecto: 1
};

if (fichaData?.atributos) {
    Object.assign(atributos, fichaData.atributos);
}

document.addEventListener("DOMContentLoaded", () => {

    const attrElements = document.querySelectorAll(".attr");
    const pontosRestantesEl = document.getElementById("attr-restantes");

    let pontosRestantes = 0;
    const limite = 99;

    function renderAtributos() {

        attrElements.forEach(el => {
            const key = el.dataset.attr;
            el.textContent = atributos[key];
        });

        pontosRestantesEl.textContent = pontosRestantes;
    }

    function setClassePontos() {
        // se você ainda não tem dados dinâmicos, deixa fixo por enquanto
        pontosRestantes = 3; // ou troca depois pelo valor da classe
        renderAtributos();
    }

    attrElements.forEach(el => {

        const key = el.dataset.attr;

        el.addEventListener("click", () => {
            if (pontosRestantes <= 0) return;
            if (atributos[key] >= limite) return;

            atributos[key]++;
            pontosRestantes--;

            renderAtributos();
        });

        el.addEventListener("contextmenu", (e) => {
            e.preventDefault();

            if (atributos[key] <= 0) return;

            atributos[key]--;
            pontosRestantes++;

            renderAtributos();
        });

    });

    setClassePontos();
});

const stats = {
    pv: { current: 0, max: 10 },
    san: { current: 0, max: 10 },
    pe: { current: 0, max: 10 },
    pd: { current: 0, max: 10 }
};

function updateBar(type) {
    const fill = document.getElementById(`${type}-fill`);
    const data = stats[type];

    const max = data.max || 1;

    // porcentagem CLAMPADA só pra renderização
    const percent = Math.min((data.current / max) * 100, 100);

    fill.style.width = `${percent}%`;

    document.getElementById(`${type}-current`).value = data.current;
    document.getElementById(`${type}-max`).value = data.max;
}

function updateAll() {
    Object.keys(stats).forEach(updateBar);
}

document.querySelectorAll(".controls button").forEach(btn => {
    btn.addEventListener("click", () => {
        const t = btn.dataset.target;
        const a = btn.dataset.action;

        if (a === "inc") stats[t].current++;
        if (a === "dec") stats[t].current--;

        stats[t].current = Math.max(0, stats[t].current);
        updateBar(t);
    });
});

document.querySelectorAll(".controls input").forEach(inp => {
    inp.addEventListener("input", () => {
        const t = inp.id.split("-")[0];

        const current = document.getElementById(`${t}-current`);
        const max = document.getElementById(`${t}-max`);

        stats[t].current = parseInt(current.value) || 0;
        stats[t].max = parseInt(max.value) || 0;

        updateBar(t);
    });
});

// toggle PD
document.getElementById("toggle-pd")?.addEventListener("change", (e) => {
    const pd = document.querySelector(".pd");

    if (e.target.checked) {
        pd.classList.remove("hidden");
        document.querySelector(".san").classList.add("hidden");
        document.querySelector(".pe").classList.add("hidden");
    } else {
        pd.classList.add("hidden");
        document.querySelector(".san").classList.remove("hidden");
        document.querySelector(".pe").classList.remove("hidden");
    }
});

updateAll();

/* =========================
   DEFESA
========================= */

const defEquip = document.getElementById("def-equip");
const defOutros = document.getElementById("def-outros");
const defTotal = document.getElementById("def-total");

/* fallback caso atributos ainda não existam carregados */
function getAGI() {
    if (typeof atributos !== "undefined" && atributos.agilidade !== undefined) {
        return atributos.agilidade;
    }
    return 0;
}

function atualizarDefesa() {
    const agi = getAGI();

    const equip = Number(defEquip?.value) || 0;
    const outros = Number(defOutros?.value) || 0;

    const total = 10 + agi + equip + outros;

    if (defTotal) {
        defTotal.textContent = total;
    }
}

/* eventos da defesa */
defEquip?.addEventListener("input", atualizarDefesa);
defOutros?.addEventListener("input", atualizarDefesa);


/* =========================
   BLOQUEIO / ESQUIVA (opcional básico)
========================= */

const bloqueio = document.getElementById("bloqueio");
const esquiva = document.getElementById("esquiva");

function validarNumeroInput(el) {
    if (!el) return;

    el.addEventListener("input", () => {
        let v = Number(el.value);

        if (isNaN(v)) v = 0;
        if (v < 0) v = 0;

        el.value = v;
    });
}

validarNumeroInput(bloqueio);
validarNumeroInput(esquiva);


/* =========================
   INIT
========================= */

function initInfos() {
    atualizarDefesa();
}

initInfos();

const nex = document.getElementById("nex");
const nivel = document.getElementById("nivel");
const toggleNivel = document.getElementById("toggle-nivel");
const nivelBox = document.getElementById("nivel-box");

/* preencher nível 1-20 igual criar-ficha */
for (let i = 1; i <= 20; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    nivel.appendChild(opt);
}

/* toggle estilo criar-ficha */
toggleNivel.addEventListener("change", () => {
    const ativo = toggleNivel.checked;

    nivel.disabled = !ativo;
    nivelBox.classList.toggle("hidden", !ativo);

    if (!ativo) {
        nivel.value = "";
    }
});

/* NEX não escala nível automaticamente (igual create-ficha) */
nex.addEventListener("input", () => {
    let v = parseInt(nex.value || 0);

    if (v < 0) v = 0;
    if (v > 99) v = 99;

    nex.value = v;
});

/* =========================
   CARREGAR FICHA FIREBASE
========================= */

async function carregarFicha() {
    if (!fichaId) return;

    const ref = doc(db, "personagens", fichaId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    fichaData = snap.data();

    /* ATRIBUTOS */
    if (fichaData.atributos) {
        Object.assign(atributos, fichaData.atributos);
    }

    /* STATS */
    if (fichaData.stats) {
        Object.assign(stats, fichaData.stats);
    }

    /* UI INIT */
    updateAll();
    atualizarDefesa();
}

document.addEventListener("DOMContentLoaded", carregarFicha);

document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       TABS
    ========================= */
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {

            const target = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            tabPanels.forEach(p => {
                p.classList.remove("active");
                if (p.id === target) p.classList.add("active");
            });

        });
    });

    /* =========================
   MODAL (FIXADO)
========================= */

    const modal = document.getElementById("modal");
    const modalList = document.getElementById("modal-list");
    const modalSearch = document.getElementById("modal-search");

    let currentTarget = null;
    let currentData = [];

    /* SORT ALFABÉTICO */
    function sortAlpha(lista) {
        return [...lista].sort((a, b) =>
            (a.nome || "").localeCompare(b.nome || "", "pt-BR")
        );
    }

    /* ABRIR MODAL */
    function abrirModal(target, lista) {
        currentTarget = target;
        currentData = sortAlpha(lista || []);

        renderModal(currentData);
        modal.classList.remove("hidden");
    }

    /* RENDER */
    function renderModal(lista) {
        modalList.innerHTML = "";

        lista
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
            .forEach(item => {

                const div = document.createElement("div");
                div.classList.add("modal-item");

                div.innerHTML = `
            <strong>${item.nome}</strong>
            <div style="opacity:.6;font-size:12px">${item.descricao || ""}</div>
        `;

                div.onmouseenter = () => div.style.background = "rgba(255,255,255,0.06)";
                div.onmouseleave = () => div.style.background = "transparent";

                div.onclick = () => adicionarItem(item);

                modalList.appendChild(div);
            });
    }

    /* ADICIONAR ITEM + LIXEIRA */
    function adicionarItem(item) {
        const container = document.getElementById(currentTarget);

        const card = document.createElement("div");
        card.classList.add("acc");

        const header = document.createElement("div");
        header.classList.add("acc-header");

        const title = document.createElement("span");
        title.textContent = item.nome;

        const actions = document.createElement("div");
        actions.classList.add("acc-actions");

        const del = document.createElement("button");
        del.classList.add("acc-delete");
        del.textContent = "🗑";

        actions.appendChild(del);

        header.appendChild(title);
        header.appendChild(actions);

        const content = document.createElement("div");
        content.classList.add("acc-content");

        content.innerHTML = `<p>${item.descricao || "Sem descrição"}</p>`;

        let open = false;

        header.addEventListener("click", () => {
            open = !open;
            card.classList.toggle("open", open);
        });

        del.addEventListener("click", (e) => {
            e.stopPropagation();
            card.remove();
        });

        card.appendChild(header);
        card.appendChild(content);
        container.appendChild(card);
    }

    /* FECHAR */
    document.getElementById("modal-close").onclick = () => {
        modal.classList.add("hidden");
    };

    /* SEARCH */
    modalSearch.addEventListener("input", () => {
        const value = modalSearch.value.toLowerCase();

        document.querySelectorAll(".modal-item").forEach(el => {
            el.style.display = el.textContent.toLowerCase().includes(value)
                ? "block"
                : "none";
        });
    });

    /* BOTÃO ADICIONAR HABILIDADE */
    document.getElementById("add-habilidade").onclick = () => {
        abrirModal("habilidades-container", habilidades);
    };

    /* BOTÃO CRIAR HABILIDADE */
    document.getElementById("criar-habilidade").onclick = () => {
        const nome = prompt("Nome da habilidade:");
        if (!nome) return;

        const nova = {
            nome,
            descricao: "Nova habilidade criada"
        };

        habilidades.push(nova);

        abrirModal("habilidades-container", habilidades);
    };

    const lista = document.getElementById("pericias-list");

    const dadosPericias = {};

    function criarDropdownTreino() {
        const select = document.createElement("select");

        for (let i = 0; i <= 15; i += 5) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = i;
            select.appendChild(opt);
        }

        return select;
    }

    function limitarNumero(input) {
        input.addEventListener("input", () => {
            let v = parseInt(input.value || 0);

            if (isNaN(v)) v = 0;
            if (v < -99) v = -99;
            if (v > 99) v = 99;

            input.value = v;
        });
    }

    pericias.forEach(p => {

        const row = document.createElement("div");
        row.classList.add("pericia-row");

        const nome = document.createElement("span");

        let icons = "";

        // treino = *
        if (p.treino) icons += "*";

        // carga = +
        if (p.carga) icons += "+";

        // kit = $
        if (p.kit) icons += "$";

        nome.textContent = icons + p.nome;

        const attr = document.createElement("span");
        attr.textContent = p.atributo;

        // BÔNUS EDITÁVEL (-99 a 99)
        const bonus = document.createElement("input");
        bonus.type = "number";
        bonus.value = 0;
        bonus.min = -99;
        bonus.max = 99;

        const treino = document.createElement("select");

        for (let i = 0; i <= 15; i += 5) {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = i;
            treino.appendChild(opt);
        }

        const valor = document.createElement("input");
        valor.type = "number";
        valor.readOnly = true;

        function clampBonus() {
            let v = Number(bonus.value);

            if (isNaN(v)) v = 0;
            if (v < -99) v = -99;
            if (v > 99) v = 99;

            bonus.value = v;
            return v;
        }

        function atualizarPericia() {
            const t = Number(treino.value || 0);
            const b = clampBonus();

            const total = t + b;
            valor.value = total;

            // cor baseada no treino
            if (total === 0) row.style.color = "#ffffff";
            else if (total === 5) row.style.color = "#3bff7a";
            else if (total === 10) row.style.color = "#3b8bff";
            else if (total === 15) row.style.color = "#ffd23b";
            else if (total > 15) row.style.color = "#ff3b3b";
        }

        treino.addEventListener("change", atualizarPericia);
        bonus.addEventListener("input", atualizarPericia);

        row.appendChild(nome);
        row.appendChild(attr);
        row.appendChild(valor);
        row.appendChild(treino);
        row.appendChild(bonus);

        lista.appendChild(row);

        atualizarPericia();
    });

});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        modal.classList.add("hidden");
    }
});

document.getElementById("modal")?.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.add("hidden");
    }
});