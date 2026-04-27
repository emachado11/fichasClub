import { auth, db } from "./firebase.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

    import("./classes.js").then(({ classes }) => {
        import("./origens.js").then(({ origens }) => {
            import("./trilhas.js").then(({ trilhas }) => {
                import("./habilidades.js").then(({ habilidades }) => {
                    import("./pericias.js").then(({ pericias }) => {

                        // ===============================
                        // ELEMENTOS
                        // ===============================

                        const nomeInput = document.getElementById("nome-input");

                        const classeSelect = document.getElementById("classe-select");
                        const origemSelect = document.getElementById("origem-select");
                        const trilhaSelect = document.getElementById("trilha-select");

                        const nivelSelect = document.getElementById("nivel-select");
                        const nexInput = document.getElementById("nex-input");

                        const checkboxNivel = document.getElementById("enable-level");
                        const levelBox = document.getElementById("level-box");

                        const determinacaoCheckbox = document.getElementById("enable-determinacao");

                        const sanidadeInput = document.getElementById("sanidade-input");
                        const esforcoInput = document.getElementById("esforco-input");
                        const determinacaoInput = document.getElementById("determinacao-input");
                        const vidaInput = document.getElementById("vida-input");

                        const historiaInput = document.getElementById("historia-input");

                        const submitBtn = document.getElementById("submit-btn");

                        const attrElements = document.querySelectorAll(".attr");
                        const pontosRestantesEl = document.getElementById("attr-restantes");

                        const modal = document.getElementById("info-modal");
                        const modalTitle = document.getElementById("modal-title");
                        const modalBody = document.getElementById("modal-body");

                        const infoBtns = document.querySelectorAll(".info-btn");

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
                            });

                            pontosRestantesEl.textContent = pontosRestantes;
                            validarFormulario();
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
                        // NEX
                        // ===============================

                        function getNexFinal(classe) {

                            let nex = parseInt(nexInput.value) || 0;
                            const usarNivel = checkboxNivel.checked;

                            // mundano só trava se NÃO estiver usando nível
                            if (classe.id === "mundano" && !usarNivel) {
                                nexInput.value = 0;
                                nexInput.disabled = true;
                                return 0;
                            }

                            nexInput.disabled = false;

                            if (classe.id !== "mundano" && nex < 5) {
                                nex = 5;
                                nexInput.value = 5;
                            }

                            return nex;
                        }

                        function nexScale(nex) {
                            return Math.floor(nex / 5);
                        }

                        // ===============================
                        // STATUS
                        // ===============================

                        function atualizarStatusBase() {

                            const classe = classes.find(c => c.id == classeSelect.value);
                            if (!classe) return;

                            const usarNivel = checkboxNivel.checked;

                            let nivel;

                            if (usarNivel) {
                                nivel = parseInt(nivelSelect.value) || 0;
                            } else {
                                const nex = getNexFinal(classe);
                                nivel = nexScale(nex);
                            }

                            vidaInput.value =
                                (classe.vida_inicial || 0) +
                                atributos.vigor +
                                ((classe.vida_por_nivel || 0) * nivel);

                            esforcoInput.value =
                                (classe.esforco_inicial || 0) +
                                atributos.presenca +
                                ((classe.esforco_por_nivel || 0) * nivel);

                            sanidadeInput.value =
                                (classe.sanidade_inicial || 0) +
                                ((classe.sanidade_por_nivel || 0) * nivel);

                            determinacaoInput.value =
                                (classe.determinacao_inicial || 0) +
                                atributos.presenca +
                                ((classe.determinacao_por_nivel || 0) * nivel);
                        }

                        // ===============================
                        // ATRIBUTO CLICK
                        // ===============================

                        attrElements.forEach(el => {

                            const key = el.dataset.attr;

                            el.addEventListener("click", () => {
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

                            const opt = document.createElement("option");
                            opt.value = "";
                            opt.textContent = placeholder;
                            opt.disabled = true;
                            opt.selected = true;

                            select.appendChild(opt);

                            data.forEach(item => {
                                const option = document.createElement("option");
                                option.value = item.id || item.nome;
                                option.textContent = item.nome;
                                select.appendChild(option);
                            });
                        }

                        function populateTrilhas() {
                            const lista = trilhas[classeSelect.value] || [];

                            populateSelect(trilhaSelect, lista, "Trilha");
                        }

                        function populateNivel() {
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
                        // UI - DETERMINAÇÃO
                        // ===============================

                        determinacaoCheckbox.addEventListener("change", () => {

                            const detWrapper = document.getElementById("det-wrapper");

                            if (determinacaoCheckbox.checked) {
                                document.querySelectorAll(".san-pe").forEach(el => el.classList.add("hidden"));
                                detWrapper.classList.remove("hidden");
                            } else {
                                document.querySelectorAll(".san-pe").forEach(el => el.classList.remove("hidden"));
                                detWrapper.classList.add("hidden");
                            }
                        });

                        // ===============================
                        // VALIDAÇÃO
                        // ===============================

                        function validarFormulario(mostrarErros = false) {

                            const nome = nomeInput.value.trim();
                            const classe = classeSelect.value !== "";
                            const origem = origemSelect.value !== "";
                            const trilha = trilhaSelect.value !== "";

                            let valido = true;

                            // RESET visual
                            [nomeInput, classeSelect, origemSelect, trilhaSelect]
                                .forEach(el => el.classList.remove("invalid"));

                            pontosRestantesEl.style.color = "white";

                            // SÓ MOSTRA ERRO SE PEDIDO
                            if (mostrarErros) {

                                if (!nome) {
                                    nomeInput.classList.add("invalid");
                                    valido = false;
                                }

                                if (!classe) {
                                    classeSelect.classList.add("invalid");
                                    valido = false;
                                }

                                if (!origem) {
                                    origemSelect.classList.add("invalid");
                                    valido = false;
                                }

                                if (!trilha) {
                                    trilhaSelect.classList.add("invalid");
                                    valido = false;
                                }

                                if (pontosRestantes !== 0) {
                                    pontosRestantesEl.style.color = "#ff4d4d";
                                    valido = false;
                                }
                            } else {
                                // mesmo sem mostrar erro, ainda precisa validar
                                if (!nome || !classe || !origem || !trilha || pontosRestantes !== 0) {
                                    valido = false;
                                }
                            }

                            // BOTÃO SEMPRE ATIVO
                            submitBtn.disabled = false;

                            // botões ?
                            infoBtns.forEach(btn => {

                                let ativo = false;

                                if (btn.dataset.type === "classe") ativo = classe;
                                if (btn.dataset.type === "origem") ativo = origem;
                                if (btn.dataset.type === "trilha") ativo = trilha;

                                btn.classList.toggle("disabled", !ativo);
                                btn.disabled = !ativo;
                            });

                            return valido;
                        }

                        // ===============================
                        // EVENTOS
                        // ===============================

                        classeSelect.addEventListener("change", () => {
                            updatePontosClasse(classeSelect.value);
                            populateTrilhas();
                        });

                        nomeInput.addEventListener("input", () => validarFormulario(false));
                        classeSelect.addEventListener("change", () => validarFormulario(false));
                        origemSelect.addEventListener("change", () => validarFormulario(false));
                        trilhaSelect.addEventListener("change", () => validarFormulario(false));

                        nexInput.addEventListener("input", () => {

                            let valor = parseInt(nexInput.value) || 0;

                            if (valor < 0) valor = 0;
                            if (valor > 99) valor = 99;

                            nexInput.value = valor;

                            atualizarStatusBase();
                        });

                        nivelSelect.addEventListener("change", atualizarStatusBase);

                        checkboxNivel.addEventListener("change", () => {
                            levelBox.classList.toggle("hidden", !checkboxNivel.checked);
                            atualizarStatusBase();
                        });

                        nivelSelect.addEventListener("input", atualizarStatusBase);

                        // ===============================
                        // MODAL
                        // ===============================

                        function getNomePericia(id) {
                            const p = pericias.find(p => p.id === id);
                            return p ? p.nome : id;
                        }

                        function openModal(item, type) {

                            modalTitle.textContent = item.nome;

                            // ===============================
                            // CLASSE
                            // ===============================
                            if (type === "classe") {

                                modalBody.innerHTML = `
            <div class="modal-section">

                <p>${item.descricao || ""}</p>

                <div class="modal-divider"></div>

                <div class="modal-stats">
                    <div>Vida inicial: ${item.vida_inicial ?? "-"}</div>
                    <div>Sanidade inicial: ${item.sanidade_inicial ?? "-"}</div>
                    <div>PE inicial: ${item.esforco_inicial ?? "-"}</div>
                    <div>PD inicial: ${item.determinacao_inicial ?? "-"}</div>
                </div>

                <div class="modal-divider"></div>

                <div><strong>Perícias treinadas:</strong><br>${(item.pericias || []).map(getNomePericia).join(", ") || "-"}</div>
                <div><strong>Proficiências:</strong><br>${(item.proficiencias || []).join(", ") || "-"}</div>

            </div>
        `;
                            }

                            // ===============================
                            // ORIGEM
                            // ===============================
                            if (type === "origem") {

                                const habilidade = habilidades.find(h => h.id === item.habilidadeId);

                                modalBody.innerHTML = `
            <div class="modal-section">

                <p>${item.descricao || ""}</p>

                <div class="modal-divider"></div>

                <div><strong>Perícias treinadas:</strong><br>${(item.pericias || []).map(getNomePericia).join(", ") || "-"}</div>

                <div class="modal-divider"></div>

                <div>
                    <strong>Habilidade:</strong><br>
                    ${habilidade ? habilidade.nome : "-"}
                </div>

                <div class="modal-habilidade-desc">
                    ${habilidade ? habilidade.descricao : ""}
                </div>

            </div>
        `;
                            }

                            // ===============================
                            // TRILHA
                            // ===============================
                            if (type === "trilha") {

                                const listaHabilidades = (item.habilidades || []).map(id => {
                                    const h = habilidades.find(h => h.id === id);

                                    return h ? `
            <div class="modal-habilidade">
                <strong>${h.nome}</strong>
                <div class="modal-habilidade-desc">
                    ${h.descricao}
                </div>
            </div>
        ` : "";
                                }).join("");

                                modalBody.innerHTML = `
        <div class="modal-section">

            <p>${item.descricao || ""}</p>

            <div class="modal-divider"></div>

            <div>
                <strong>Habilidades:</strong>
            </div>

            ${listaHabilidades || "<p>-</p>"}

        </div>
    `;
                            }

                            modal.classList.remove("hidden");
                        }

                        document.querySelectorAll(".info-btn").forEach(btn => {
                            btn.addEventListener("click", () => {

                                let data = null;

                                if (btn.dataset.type === "classe") {
                                    data = classes.find(c => c.id == classeSelect.value);
                                }

                                if (btn.dataset.type === "origem") {
                                    data = origens.find(o => o.id == origemSelect.value);
                                }

                                if (btn.dataset.type === "trilha") {
                                    const lista = trilhas[classeSelect.value] || [];
                                    data = lista.find(t => (t.id || t.nome) == trilhaSelect.value);
                                }

                                if (!data) return;

                                openModal(data, btn.dataset.type);
                            });
                        });

                        document.getElementById("close-modal")
                            .addEventListener("click", () => modal.classList.add("hidden"));

                        // ===============================
                        // SALVAR
                        // ===============================

                        async function salvarPersonagem() {

                            if (submitBtn.disabled) return;

                            const user = auth.currentUser;
                            if (!user) return alert("Loga primeiro.");

                            const id = `${user.uid}_${Date.now()}`;

                            const data = {
                                nome: nomeInput.value,
                                historia: historiaInput.value,

                                classe: classeSelect.value,
                                origem: origemSelect.value,
                                trilha: trilhaSelect.value,

                                nex: Number(nexInput.value) || 0,
                                nivel: checkboxNivel.checked ? Number(nivelSelect.value) : 0,

                                usarNivel: checkboxNivel.checked,
                                usarDeterminacao: determinacaoCheckbox.checked,

                                atributos: { ...atributos },

                                vida: Number(vidaInput.value),
                                esforco: Number(esforcoInput.value),
                                sanidade: Number(sanidadeInput.value),
                                determinacao: Number(determinacaoInput.value),

                                uid: user.uid,
                                createdAt: Date.now()
                            };

                            await setDoc(doc(db, "personagens", id), data);

                            window.location.href = `./ficha.html?id=${id}`;
                        }

                        submitBtn.addEventListener("click", () => {

                            const valido = validarFormulario(true);

                            if (!valido) return;

                            salvarPersonagem();
                        });

                        // ===============================
                        // INIT
                        // ===============================

                        renderAtributos();
                        atualizarStatusBase();
                        validarFormulario();

                    });
                });
            });
        });
    });
});