// ====================== ATRIBUTOS ======================
const attrSpans = document.querySelectorAll('.attr-input');
const pointsLeft = document.getElementById('points-left');

let limite = 9;
const maxAttr = 3;

function updateAttributes() {
    // Conta quantos atributos estão em 0
    const zeros = Array.from(attrSpans).filter(span => parseInt(span.textContent) === 0).length;

    let total = 0;
    attrSpans.forEach(span => {
        let val = parseInt(span.textContent) || 0;

        // Se já houver outro 0 e este valor é 0, força a ser 1
        if (val === 0 && zeros > 1) {
            val = 1;
        }

        // Limita o máximo
        val = Math.min(maxAttr, val);

        span.textContent = val;
        total += val;
    });

    // Ajusta excesso se ultrapassar o limite
    if (total > limite) {
        let excess = total - limite;
        for (let i = attrSpans.length - 1; i >= 0; i--) {
            let val = parseInt(attrSpans[i].textContent);
            if (val > 0) {
                let reduce = Math.min(val, excess);

                // Não reduz se for o único zero permitido
                const otherZeros = Array.from(attrSpans).filter(s => parseInt(s.textContent) === 0 && s !== attrSpans[i]).length;
                if (val - reduce === 0 && otherZeros > 0) continue;

                attrSpans[i].textContent = val - reduce;
                excess -= reduce;
                if (excess <= 0) break;
            }
        }
    }

    let sum = 0;
    attrSpans.forEach(span => sum += parseInt(span.textContent) || 0);
    pointsLeft.textContent = limite - sum;
}

attrSpans.forEach(span => {
    span.addEventListener('input', updateAttributes);
    span.addEventListener('keypress', e => { if (!/[0-9]/.test(e.key)) e.preventDefault(); });
});

updateAttributes();

// ====================== PERÍCIAS ======================
const periciasContainer = document.getElementById('pericias-container');
let habilidadesData = [];
let periciasData = [];

// Estado das perícias
let periciaClasse = [];
let periciaOrigem = [];
let periciaFora = [];

// ====================== CARREGAR JSONS ======================
const fetchHabilidades = fetch('json/habilidades.json')
    .then(res => res.json())
    .then(data => habilidadesData = data);

const fetchPericias = fetch('json/pericias.json')
    .then(res => res.json())
    .then(data => periciasData = data);

// ====================== CRIAR LINHAS DE PERÍCIAS ======================
function criarLinhasPericias() {
    periciasData.forEach(p => {
        const line = document.createElement('div');
        line.classList.add('pericia-line');
        line.setAttribute('data-id', p.id);
        line.innerHTML = `
            <span>${p.nome}</span>
            <select>${[0,5,10,15].map(n => `<option value="${n}">${n}</option>`).join('')}</select>
            <input type="number" value="0" min="0">
        `;
        periciasContainer.appendChild(line);
    });
}

// ====================== FUNÇÃO APLICAR PERÍCIAS ======================
function aplicarPericias(ids, tipo) {
    const lines = periciasContainer.querySelectorAll('.pericia-line');

    if (tipo === 'classe') periciaClasse = ids.filter(id => id);
    if (tipo === 'origem') periciaOrigem = ids.filter(id => id);

    lines.forEach(line => {
        const id = line.getAttribute('data-id');
        const select = line.querySelector('select');
        if (!select) return;

        if (periciaClasse.includes(id)) select.value = 5;
        else if (periciaOrigem.includes(id)) select.value = 5;
        else if (periciaFora.includes(id)) select.value = 5;
        else select.value = 0;
    });
}

// ====================== CARDS ======================
let currentPopup = null;

function createCard(item, containerId, isClasse = false) {
    const container = document.getElementById(containerId);
    const card = document.createElement('div');
    card.classList.add('card');

    const arrow = document.createElement('span');
    arrow.classList.add('arrow');
    arrow.textContent = '→';

    const nameSpan = document.createElement('span');
    nameSpan.classList.add('card-name');
    nameSpan.textContent = item.nome;

    const btn = document.createElement('button');
    btn.textContent = 'Selecionar';

    card.append(arrow, nameSpan, btn);
    container.appendChild(card);

    // ================= POPUP =================
    const popup = document.createElement('div');
    popup.classList.add('details-popup');
    popup.style.display = 'none';
    document.body.appendChild(popup);

    let periciasHTML = '<span class="stat-value">Nenhuma</span>';
    if (Array.isArray(item.periciasTreinadas) && item.periciasTreinadas.filter(id => id).length) {
        periciasHTML = `<span class="stat-value">${item.periciasTreinadas.filter(id => id).map(id => {
            const p = periciasData.find(per => per.id === id);
            return p ? p.nome : id;
        }).join(', ')}</span>`;
    }

    let habilidadesHTML = '<span class="ability-name">Nenhuma</span>';
    if (Array.isArray(item.habilidade) && item.habilidade.length) {
        habilidadesHTML = item.habilidade.map(habId => {
            const hab = habilidadesData.find(h => h.id === habId);
            return `<div class="ability-block">
                        <span class="ability-name">${hab ? hab.nome : habId}</span>
                        <span class="ability-info">${hab ? hab.descricao : 'Sem descrição'}</span>
                    </div>`;
        }).join('');
    }

    popup.innerHTML = `
        <div class="class-info">${item.info || ''}</div>
        <div class="stat-line">
            <span>Perícias treinadas</span>
            <div style="height:10px"></div>
            ${periciasHTML}
        </div>
        <div class="stat-line">
            <span>Habilidades</span>${habilidadesHTML}
        </div>
    `;

    function positionPopup() {
        const rect = card.getBoundingClientRect();
        const popupWidth = popup.offsetWidth;
        const popupHeight = popup.offsetHeight;
        let left = rect.right + 10;
        let top = rect.top + window.scrollY;

        if (left + popupWidth > window.innerWidth) left = rect.left - popupWidth - 10;
        if (left < 0) left = 10;
        if (top + popupHeight > window.innerHeight + window.scrollY) top = window.innerHeight + window.scrollY - popupHeight - 10;
        if (top < 0) top = 10 + window.scrollY;

        popup.style.left = left + 'px';
        popup.style.top = top + 'px';
    }

    card.addEventListener('click', () => {
        if (currentPopup && currentPopup !== popup) currentPopup.style.display = 'none';

        if (popup.style.display === 'block') {
            popup.style.display = 'none';
            currentPopup = null;
        } else {
            popup.style.display = 'block';
            positionPopup();
            currentPopup = popup;
        }
    });

    btn.addEventListener('click', e => {
        e.stopPropagation();
        document.querySelectorAll(`#${containerId} button`).forEach(b => {
            b.textContent = 'Selecionar';
            b.style.opacity = '1';
        });
        btn.textContent = 'Selecionado';
        btn.style.opacity = '0.5';

        if (isClasse) aplicarPericias(item.periciasTreinadas || [], 'classe');
        else aplicarPericias(item.periciasTreinadas || [], 'origem');
    });
}

// ====================== FECHAR POPUP AO CLICAR FORA ==================
document.addEventListener('click', e => {
    if (currentPopup && !currentPopup.contains(e.target) &&
        !e.target.classList.contains('card-name') &&
        !e.target.classList.contains('arrow')) {
        currentPopup.style.display = 'none';
        currentPopup = null;
    }
});

// ====================== INICIALIZAÇÃO ======================
Promise.all([fetchHabilidades, fetchPericias]).then(() => {
    criarLinhasPericias();

    fetch('json/classes.json')
        .then(res => res.json())
        .then(classesData => classesData.forEach(c => createCard(c, 'classes-container', true)))
        .catch(err => console.error("Erro ao carregar classes:", err));

    fetch('json/origens.json')
        .then(res => res.json())
        .then(origensData => origensData.forEach(o => createCard(o, 'origens-cards', false)))
        .catch(err => console.error("Erro ao carregar origens:", err));
});
