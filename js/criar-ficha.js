import { db } from "./firebase.js"; // Importa o db do firebase.js
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Função para salvar a ficha no Firestore
async function saveFichaToFirebase(ficha) {
    try {
        const docRef = doc(db, "fichas", ficha.nome);  // Usa o nome como ID do documento
        await setDoc(docRef, ficha);  // Salva os dados da ficha no Firestore
        console.log("Ficha salva com sucesso:", ficha);
        return true;  // Retorna true se tudo der certo
    } catch (error) {
        console.error("Erro ao salvar a ficha: ", error);
        return false;  // Retorna false em caso de erro
    }
}

import { classes } from "./classes.js";
import { origens } from "./origens.js";
import { pericias } from "./pericias.js";
import { habilidades } from "./habilidades.js";

function getHabilidade(id) {
    return habilidades.find(h => h.id === id);
}

const state = {
    classIndex: 1,
    classe: null,
    origem: null,
    pontosAtributos: null,
    atributos: { FOR: 1, AGI: 1, INT: 1, PRE: 1, VIG: 1 },
    baseAtributo: 1,
    limiteAtributo: 3,
    pericia: {}
};

const attrPositions = {
    FOR: { top: 43.5, left: 19.3 },
    AGI: { top: 21.3, left: 50.3 },
    INT: { top: 43.5, left: 81.7 },
    PRE: { top: 80.5, left: 29 },
    VIG: { top: 80.5, left: 70.3 }
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
    state.pontosAtributos = null;
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

    // 🔥 AQUI ESTÁ O FIX
    state.pontosAtributos = c.pontos_atributo;

    // reset seguro
    Object.keys(state.pericia).forEach(k => {
        if (state.pericia[k]) {
            state.pericia[k].classe = 0;
        }
    });

    (c.pericias || []).forEach(id => {
        if (state.pericia[id]) {
            state.pericia[id].classe = 5;
        }
    });

    renderAtributos(); // 👈 importante pra atualizar UI
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
    const el = document.getElementById("attr-overlay");
    el.innerHTML = "";

    const pontos = calcPoints();
    document.getElementById("points-left").textContent = pontos;

    Object.keys(state.atributos).forEach(k => {
        const d = document.createElement("div");

        // Posição na tela
        d.style.position = "absolute";
        d.style.top = attrPositions[k].top + "%";
        d.style.left = attrPositions[k].left + "%";
        d.style.transform = "translate(-50%, -50%)";
        d.style.cursor = "grab";

        d.dataset.key = k;
        d.classList.add("attr");

        d.innerHTML = `
            <div class="attr-circle">
                <input 
                    class="attr-input"
                    type="number"
                    min="0"
                    max="3"
                    value="${state.atributos[k]}"
                />
            </div>
        `;

        const input = d.querySelector("input");

        // Input para alterar o valor
        input.addEventListener("input", (e) => {
            let val = Number(e.target.value);

            if (isNaN(val)) val = 0;

            val = Math.max(0, Math.min(3, val));

            state.atributos[k] = val;

            renderAtributos();
        });

        el.appendChild(d);
    });

    // Desabilita o botão de origem se os pontos não forem zero
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
    el.innerHTML = ""; // Limpa a lista de perícias para atualizar

    pericias.forEach(p => {
        const s = state.pericia[p.id];
        const t = total(p);

        const d = document.createElement("div");
        d.className = "pericia";

        // Cor do texto baseada no treino
        let textColor = "white"; // Cor padrão (sem treino)

        if (t > 15) {
            textColor = "red";  // Vermelho para perícias acima de Expert
        } else if (t >= 15) {
            textColor = "yellow";  // Amarelo para Expert
        } else if (t >= 10) {
            textColor = "blue";  // Azul para Veterano
        } else if (t >= 5) {
            textColor = "green";  // Verde para Treinado
        }

        // Aplica a cor no texto
        d.style.color = textColor;

        d.innerHTML = `
            <div class="pericia-name">${p.nome} (${p.atributo})</div>

            <div class="pericia-info">
                <div class="treino">${treinoLabel(t)}</div>
                <div class="valor">${t}</div>
            </div>

            <div class="pericia-controls">
                <select>
                    <option value="0">0</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                </select>
                <input type="number" value="${s.bonus}">
            </div>
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
    // Verifica se a origem é válida antes de tentar acessar as propriedades
    if (!o || !o.pericias) {
        console.warn("Origem ou pericias não encontradas.");
        return;  // Se não encontrar, interrompe a execução
    }

    // Limpa as pericias da origem anterior
    Object.keys(state.pericia).forEach(k => {
        if (state.pericia[k]) {
            state.pericia[k].origem = 0; // Reseta a origem
        }
    });

    // Aplica origem
    o.pericias.forEach(id => {
        if (!state.pericia[id]) {
            console.warn("Perícia não encontrada:", id);
            return;
        }

        state.pericia[id].origem = 5; // Aplica a origem nas perícias
    });
}

function renderOrigens() {
    const el = document.getElementById("origens");
    el.innerHTML = "";

    origens.forEach(o => {
        const card = document.createElement("div");
        card.className = "origem";

        // Verifica se a origem está selecionada
        const selected = state.origem && state.origem.id === o.id;
        const habilidade = getHabilidade(o.habilidadeId);

        // Cria a estrutura do card com o botão
        card.innerHTML = `
            <div class="origem-top">
                <span>V</span>  <!-- V em vez de seta -->
                <div>${o.nome}</div>
                <button class="${selected ? 'open' : ''}"></button> <!-- botão de energia -->
            </div>

            <div class="desc ${selected ? 'open' : ''}">
                <p>${o.descricao}</p>
                <p><b>Perícias:</b> ${o.pericias.join(", ")}</p>
                <p><b>Habilidade:</b> ${habilidade ? habilidade.nome : "—"}</p>
                <p>${habilidade ? habilidade.descricao : ""}</p>
            </div>
        `;

        // Evento de clique para abrir e fechar
        card.addEventListener("click", (e) => {
            if (e.target.tagName !== "BUTTON") {
                // Fecha todas as origens abertas, exceto a atual
                document.querySelectorAll(".origem.open").forEach(item => {
                    if (item !== card) item.classList.remove("open");
                });

                card.classList.toggle("open");
            }
        });

        const btn = card.querySelector("button");

        // Alteração no evento de clique do botão
        btn.addEventListener("click", (e) => {
            e.stopPropagation(); // Impede a propagação do clique

            if (card.classList.contains("selected")) {
                card.classList.remove("selected");
                state.origem = null;  // Desmarcar a origem
            } else {
                // Marca a origem como selecionada
                document.querySelectorAll(".origem").forEach(o => o.classList.remove("selected")); // Remove seleção de todas as origens
                card.classList.add("selected");
                state.origem = o; // Marca a origem no estado
            }

            // Aplica as pericias da origem
            aplicarOrigem(state.origem);

            // Re-renderiza as perícias após a mudança
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

// Função para finalizar e salvar a ficha após coletar as informações
document.getElementById("finish").onclick = () => {
    openCMD(async () => {
        await typeLine("Finalizando personagem...");
        await typeLine("(Essas informações podem ser alteradas depois)");

        // Coleta os dados do jogador
        await typeLine("Nome do Personagem.");
        const charName = await ask({
            uppercase: false,
            validate: (v) => v.length > 0,
            error: "> Nome inválido."
        });

        await typeLine("Aparência.");
        const charAppearance = await ask({
            uppercase: false,
        });

        await typeLine("Personalidade.");
        const charPersonality = await ask({
            uppercase: false,
        });

        await typeLine("Histórico.");
        const charHistory = await ask({
            uppercase: false,
        });

        await typeLine("Objetivo.");
        const charObjective = await ask({
            uppercase: false,
        });

        // Pergunta para finalizar ou revisar
        await typeLine("Finalizar? S/N");
        const ans = await ask({ uppercase: true });

        if (ans !== "S") {
            // Se escolher revisar, permitir a edição
            return openCMD(async () => {
                await typeLine("> Qual informação você quer alterar?");
                await typeLine("> 1 - Nome.");
                await typeLine("> 2 - Aparência.");
                await typeLine("> 3 - Personalidade.");
                await typeLine("> 4 - Histórico.");
                await typeLine("> 5 - Objetivo.");
                await typeLine("> 6 - Finalizar.");

                const choice = await ask({
                    validate: (input) => !isNaN(input) && input >= 1 && input <= 6,
                    error: "Escolha uma opção válida entre 1 e 5.",
                });

                // Lógica para alterar a ficha com base na escolha
                if (choice === "1") {
                    return handleEdit("Nome", charName);
                } else if (choice === "2") {
                    return handleEdit("Aparência", charAppearance);
                } else if (choice === "3") {
                    return handleEdit("Personalidade", charPersonality);
                } else if (choice === "4") {
                    return handleEdit("Histórico", charHistory);
                } else if (choice === "5") {
                    return handleEdit("Objetivo", charObjective);
                } else if (choice === "6") {
                    // Se finalizar, salva a ficha
                    const ficha = {
                        nome: charName,
                        aparencia: charAppearance,
                        historico: charHistory,
                        objetivo: charObjective,
                        personalidade: charPersonality,
                        
                    };

                    // Salva a ficha no Firestore
                    const saved = await saveFichaToFirebase(ficha);
                    if (saved) {
                        await typeLine("> Ficha criada com sucesso!");
                        closeCMD();
                    } else {
                        await typeLine("> Algo deu errado. Tente novamente.");
                    }
                }
            });
        } else {
            // Se já for "S", finaliza sem revisão
            const ficha = {
                nome: charName,
                aparencia: charAppearance,
                historico: charHistory,
                objetivo: charObjective,
            };

            // Salva a ficha no Firestore
            const saved = await saveFichaToFirebase(ficha);
            if (saved) {
                await typeLine("> Ficha criada com sucesso!");
                closeCMD();
            } else {
                await typeLine("> Algo deu errado. Tente novamente.");
            }
        }
    });
};

// INIT
renderAtributos();
renderPericias();

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

/* ================= CMD ACTIONS ================= */
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

/* ===================== CLOSE ================= */
closeBtn.onclick = closeCMD;