import { auth, db } from "./firebase.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

    import("./classes.js").then(({ classes }) => {
        import("./origens.js").then(({ origens }) => {
            import("./trilhas.js").then(({ trilhas }) => {
                import("./habilidades.js").then(({ habilidades }) => {

                    // ===============================
                    // ELEMENTOS
                    // ===============================

                    const classeSelect = document.getElementById("classe-select");
                    const origemSelect = document.getElementById("origem-select");
                    const trilhaSelect = document.getElementById("trilha-select");
                    const nivelSelect = document.getElementById("nivel-select");
                    const nexInput = document.getElementById("nex-input");

                    const checkboxNivel = document.getElementById("enable-level");
                    const levelBox = document.getElementById("level-box");

                    const sanidadeInput = document.getElementById("sanidade-input");
                    const esforcoInput = document.getElementById("esforco-input");
                    const determinacaoInput = document.getElementById("determinacao-input");
                    const determinacaoCheckbox = document.getElementById("enable-determinacao");
                    const vidaInput = document.getElementById("vida-input");

                    const attrElements = document.querySelectorAll(".attr");
                    const pontosRestantesEl = document.getElementById("attr-restantes");
                    const attrHint = document.querySelector(".attr-hint");

                    const modal = document.getElementById("info-modal");
                    const modalTitle = document.getElementById("modal-title");
                    const modalDesc = document.getElementById("modal-desc");
                    const closeModal = document.getElementById("close-modal");

                    // ===============================
                    // BLOQUEIO INPUTS
                    // ===============================

                    [vidaInput, sanidadeInput, esforcoInput, determinacaoInput].forEach(i => {
                        if (i) i.disabled = true;
                    });

                    // ===============================
                    // UTIL
                    // ===============================

                    const getValue = (item) => item.id || item.nome;
                    const getName = (item) => item.nome || "Sem nome";
                    const getDesc = (item) => item.descricao || "Sem descrição.";

                    const findItem = (list, value) =>
                        list.find(item => getValue(item) == value);

                    const findHabilidade = (id) =>
                        habilidades.find(h => h.id === id);

                    // ===============================
                    // ATRIBUTOS
                    // ===============================

                    let pontosRestantes = 0;
                    const limite = 3;

                    const atributos = {
                        forca: 1,
                        agilidade: 1,
                        vigor: 1,
                        presenca: 1,
                        intelecto: 1
                    };

                    function renderAtributos() {
                        attrElements.forEach(el => {
                            const key = el.dataset.attr;
                            el.textContent = atributos[key];
                            el.style.opacity = atributos[key] >= limite ? "0.4" : "1";
                        });

                        pontosRestantesEl.textContent = pontosRestantes;
                    }

                    function updatePontosClasse(classeId) {
                        const classe = classes.find(c => c.id == classeId);
                        if (!classe) return;

                        pontosRestantes = classe.pontos_atributo || 0;
                        Object.keys(atributos).forEach(k => atributos[k] = 1);

                        renderAtributos();
                        atualizarStatusBase();
                    }

                    // ===============================
                    // NEX NORMALIZADO
                    // ===============================

                    function getNexFinal(classe) {

                        let nex = parseInt(nexInput.value) || 0;

                        // mundano travado
                        if (classe.id === "mundano") {
                            nexInput.value = 0;
                            nexInput.disabled = true;
                            return 0;
                        }
                        else {
                            nexInput.value = 5;
                        }

                        nexInput.disabled = false;

                        // outras classes mínimo 5
                        if (nex < 5) nex = 5;

                        return nex;
                    }

                    // converte NEX (0,5,10,15...) → escala 0,1,2,3...
                    function nexScale(nex) {
                        return Math.floor(nex / 5);
                    }

                    // ===============================
                    // STATUS (CORRIGIDO)
                    // ===============================

                    function atualizarStatusBase() {

                        const classe = classes.find(c => c.id == classeSelect.value);
                        if (!classe) return;

                        const nex = getNexFinal(classe);
                        const nivel = nexScale(nex);

                        const vida =
                            Math.floor(
                                (classe.vida_inicial || 0) +
                                atributos.vigor +
                                ((classe.vida_por_nivel || 0) * nivel)
                            );

                        const esforco =
                            Math.floor(
                                (classe.esforco_inicial || 0) +
                                atributos.presenca +
                                ((classe.esforco_por_nivel || 0) * nivel)
                            );

                        const sanidade =
                            Math.floor(
                                (classe.sanidade_inicial || 0) +
                                ((classe.sanidade_por_nivel || 0) * nivel)
                            );

                        const determinacao =
                            Math.floor(
                                (classe.determinacao_inicial || 0) +
                                atributos.presenca +
                                ((classe.determinacao_por_nivel || 0) * nivel)
                            );

                        vidaInput.value = vida;
                        esforcoInput.value = esforco;
                        sanidadeInput.value = sanidade;
                        determinacaoInput.value = determinacao;
                    }

                    // ===============================
                    // INTERAÇÃO ATRIBUTOS
                    // ===============================

                    attrElements.forEach(el => {

                        const key = el.dataset.attr;

                        let pressTimer;
                        let isLong = false;
                        let isTouch = false;

                        el.addEventListener("touchstart", () => {
                            isTouch = true;
                            isLong = false;

                            pressTimer = setTimeout(() => {
                                isLong = true;

                                if (atributos[key] <= 0) return;

                                atributos[key]--;
                                pontosRestantes++;

                                renderAtributos();
                                atualizarStatusBase();
                            }, 500);
                        });

                        el.addEventListener("touchend", () => {
                            clearTimeout(pressTimer);

                            if (!isLong) {
                                if (pontosRestantes <= 0) return;
                                if (atributos[key] >= limite) return;

                                atributos[key]++;
                                pontosRestantes--;

                                renderAtributos();
                                atualizarStatusBase();
                            }

                            setTimeout(() => isTouch = false, 50);
                        });

                        el.addEventListener("click", () => {
                            if (isTouch) return;

                            if (pontosRestantes <= 0) return;
                            if (atributos[key] >= limite) return;

                            atributos[key]++;
                            pontosRestantes--;

                            renderAtributos();
                            atualizarStatusBase();
                        });

                        el.addEventListener("contextmenu", (e) => {
                            e.preventDefault();

                            if (atributos[key] <= 0) return;

                            atributos[key]--;
                            pontosRestantes++;

                            renderAtributos();
                            atualizarStatusBase();
                        });
                    });

                    // ===============================
                    // SELECTS
                    // ===============================

                    function populateSelect(select, data, placeholder) {
                        select.innerHTML = "";

                        if (placeholder) {
                            const opt = document.createElement("option");
                            opt.textContent = placeholder;
                            opt.disabled = true;
                            opt.selected = true;
                            opt.hidden = true;
                            select.appendChild(opt);
                        }

                        data.forEach(item => {
                            const option = document.createElement("option");
                            option.value = getValue(item);
                            option.textContent = getName(item);
                            select.appendChild(option);
                        });
                    }

                    function populateNivel() {
                        nivelSelect.innerHTML = "";

                        for (let i = 1; i <= 20; i++) {
                            const o = document.createElement("option");
                            o.value = i;
                            o.textContent = i;
                            nivelSelect.appendChild(o);
                        }
                    }

                    populateSelect(classeSelect, classes, "Classe");
                    populateSelect(origemSelect, origens, "Origem");
                    populateSelect(trilhaSelect, [], "Trilha");
                    populateNivel();

                    // ===============================
                    // EVENTS
                    // ===============================

                    classeSelect.addEventListener("change", () => {
                        updatePontosClasse(classeSelect.value);

                        const lista = trilhas[classeSelect.value] || [];
                        populateSelect(trilhaSelect, lista, "Trilha");
                    });

                    nexInput.addEventListener("input", atualizarStatusBase);

                    checkboxNivel.addEventListener("change", () => {
                        levelBox.classList.toggle("hidden", !checkboxNivel.checked);
                    });

                    determinacaoCheckbox.addEventListener("change", () => {
                        if (determinacaoCheckbox.checked) {
                            sanidadeInput.classList.add("hidden");
                            esforcoInput.classList.add("hidden");
                            determinacaoInput.classList.remove("hidden");
                        } else {
                            sanidadeInput.classList.remove("hidden");
                            esforcoInput.classList.remove("hidden");
                            determinacaoInput.classList.add("hidden");
                        }
                    });

                    // ===============================
                    // HINT
                    // ===============================

                    function isMobile() {
                        return window.matchMedia("(max-width: 768px)").matches
                            || "ontouchstart" in window;
                    }

                    function updateHint() {
                        attrHint.textContent = isMobile()
                            ? "Toque para aumentar • Segure para diminuir"
                            : "Esquerdo para aumentar • Direito para diminuir";
                    }

                    updateHint();
                    window.addEventListener("resize", updateHint);

                    // ===============================
                    // MODAL
                    // ===============================

                    function openModal(item) {
                        modalTitle.textContent = getName(item);
                        modalDesc.innerHTML = `<p>${getDesc(item)}</p>`;
                        modal.classList.remove("hidden");
                    }

                    closeModal.addEventListener("click", () => {
                        modal.classList.add("hidden");
                    });

                    document.querySelectorAll(".info-btn").forEach(btn => {
                        btn.addEventListener("click", () => {

                            const type = btn.dataset.type;
                            let data = null;

                            if (type === "classe") data = findItem(classes, classeSelect.value);
                            if (type === "origem") data = findItem(origens, origemSelect.value);
                            if (type === "trilha") {
                                const lista = trilhas[classeSelect.value] || [];
                                data = lista.find(t => getValue(t) == trilhaSelect.value);
                            }

                            if (data) openModal(data);
                        });
                    });

                    async function salvarPersonagem() {

                        const user = auth.currentUser;

                        if (!user) {
                            alert("Você precisa estar logado.");
                            return;
                        }

                        const classe = classes.find(c => c.id == classeSelect.value);

                        if (!classe) {
                            alert("Classe inválida.");
                            return;
                        }

                        const usarNivel = checkboxNivel.checked;
                        const usarDeterminacao = determinacaoCheckbox.checked;

                        const nivel = usarNivel
                            ? (parseInt(nivelSelect.value) || 0)
                            : 0;

                        const data = {
                            nome: document.getElementById("nome-input").value || "Sem nome",

                            // ===============================
                            // IDS (IMPORTANTE)
                            // ===============================
                            classe: classeSelect.value,
                            origem: origemSelect.value,
                            trilha: trilhaSelect.value,

                            // ===============================
                            // PROGRESSÃO
                            // ===============================
                            nex: parseInt(nexInput.value) || 0,
                            nivel: nivel,
                            usarNivel: usarNivel,
                            usarDeterminacao: usarDeterminacao,

                            // ===============================
                            // DADOS BASE
                            // ===============================
                            atributos: { ...atributos },

                            vida: Number(vidaInput.value) || 0,
                            esforco: Number(esforcoInput.value) || 0,
                            sanidade: Number(sanidadeInput.value) || 0,
                            determinacao: Number(determinacaoInput.value) || 0,

                            // ===============================
                            // META
                            // ===============================
                            uid: user.uid,
                            createdAt: Date.now()
                        };

                        try {
                            const id = `${user.uid}_${Date.now()}`;

                            await setDoc(doc(db, "personagens", id), data);

                            alert("Personagem salvo com sucesso!");

                        } catch (err) {
                            console.error(err);
                            alert("Erro ao salvar personagem.");
                        }
                    }

                    // ===============================
                    // INIT
                    // ===============================

                    renderAtributos();
                    atualizarStatusBase();

                    document.getElementById("submit-btn")
                        .addEventListener("click", salvarPersonagem);

                });
            });
        });
    });
});