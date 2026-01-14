// ================= SIDEBAR =================
const sidebarBtns = document.querySelectorAll('.sidebar-wrapper button');
sidebarBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab;
    const tab = document.getElementById(tabId);
    const isOpen = tab.style.display === 'block';

    // fechar todas
    document.querySelectorAll('.tab-panel').forEach(t => t.style.display = 'none');
    sidebarBtns.forEach(b => b.classList.remove('active'));

    if (!isOpen) {
      tab.style.display = 'block';
      btn.classList.add('active');
    }
  });
});

// ================= CARDS CLASSES / ORIGENS =================
let classesData = [], origensData = [], habilidadesData = [], periciasData = [];
let periciaClasse = null, periciaOrigem = null, periciaFora = [];

Promise.all([
  fetch('json/classes.json').then(r => r.json()),
  fetch('json/origens.json').then(r => r.json()),
  fetch('json/habilidades.json').then(r => r.json()),
  fetch('json/pericias.json').then(r => r.json())
]).then(([classes, origens, habilidades, pericias]) => {
  classesData = classes;
  origensData = origens;
  habilidadesData = habilidades;
  periciasData = pericias;
  criarCards(classes, 'classes-tab', true);
  criarCards(origens, 'origens-tab', false);
  criarLinhasPericias();
});

// ======= CRIAR CARDS =========
function criarCards(items, containerId, isClasse) {
  const container = document.getElementById(containerId);
  items.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `<span>▶ ${item.nome}</span> <button>Selecionar</button>`;
    container.appendChild(card);

    let popup = null;

    // clique card abre popup
    card.addEventListener('click', () => {
      if (popup && popup.parentNode) popup.remove();
      else {
        popup = document.createElement('div');
        popup.classList.add('details-popup');
        let periciasHTML = 'Nenhuma';
        if (Array.isArray(item.periciasTreinadas)) {
          periciasHTML = item.periciasTreinadas.map(id => {
            const p = periciasData.find(pp => pp.id === id);
            return p ? p.nome : id;
          }).join(', ');
        }
        let habHTML = 'Nenhuma';
        if (Array.isArray(item.habilidade)) {
          habHTML = item.habilidade.map(hid => {
            const h = habilidadesData.find(hh => hh.id === hid);
            return `<strong>${h ? h.nome : hid}:</strong> ${h ? h.descricao : 'Sem descrição'}`;
          }).join('<br>');
        }
        if (isClasse) {
          popup.innerHTML = `<strong>Informações de ${item.nome}</strong><br>
        ${item.info || ''}<br><br>
        PV Inicial <strong>${item.vidaInicial || 0} + VIG</strong><br>
        PV por NEX/Nível <strong>${item.vidaPorNivel || 0} + VIG</strong><br>
        PE Inicial <strong>${item.esforcoInicial || 0} + PRE</strong><br>
        PE por NEX/Nível <strong>${item.esforcoPorNivel || 0} + PRE</strong><br>
        SAN Inicial <strong>${item.sanidadeInicial || 0}</strong><br>
        SAN por NEX/Nível <strong>${item.sanidadePorNivel || 0}</strong><br><br>
      <strong>Perícias treinadas</strong><br>${periciasHTML ? periciasHTML : 'Nenhuma'}<br><strong>${item.quantidadePericias} + INT</strong><br><br>
      <strong>Habilidades</strong><br>${habHTML}<br><br>
      <strong>Proficiencias</strong><br>${item.proficiencias ? item.proficiencias.join(', ') : 'Nenhuma'}`;
        } else{
          popup.innerHTML = `<strong>Informações de ${item.nome}</strong><br>
        ${item.info || ''}<br><br>
      <strong>Perícias treinadas</strong><br>${periciasHTML}<br><br>
      <strong>Habilidades</strong><br>${habHTML}`;
        }

        document.body.appendChild(popup);
        // posicionar sem ultrapassar tela
        const rect = card.getBoundingClientRect();
        let left = rect.right + 10;
        let top = rect.top;
        if (left + popup.offsetWidth > window.innerWidth) left = rect.left - popup.offsetWidth - 10;
        if (top + popup.offsetHeight > window.innerHeight) top = window.innerHeight - popup.offsetHeight - 10;
        popup.style.left = left + 'px';
        popup.style.top = top + 'px';

        // click fora fecha
        const clickFora = e => {
          if (!popup.contains(e.target) && e.target !== card) popup.remove();
          document.removeEventListener('click', clickFora);
        };
        setTimeout(() => document.addEventListener('click', clickFora), 0);
      }
    });

    // botão selecionar
    const btn = card.querySelector('button');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (isClasse) {
        periciaClasse = item.periciasTreinadas;
        setAttributeLimit(8);
        limite = item.nome.toLowerCase() === 'mundano/sobrevivente' ? 8 : 9;
      } else periciaOrigem = item.periciasTreinadas;
      aplicarPericias();
      setAttributeLimit(9);
    });
  });
}

// ======== PERÍCIAS =========
function criarLinhasPericias() {
  const container = document.getElementById('pericias-container');
  container.innerHTML = '';
  periciasData.forEach(p => {
    const line = document.createElement('div');
    line.classList.add('pericia-line');
    line.dataset.id = p.id;
    let sinal = '';
    if (p.carga) sinal += '+';
    if (p.treino) sinal += '*';
    line.innerHTML = `<span class="pericia-nome">${p.nome}${sinal} (${p.atributo})</span>
        <select>
            ${[0, 5, 10, 15].map(n => `<option value="${n}">${n}</option>`).join('')}
        </select>
        <input type="number" value="0">`;
    container.appendChild(line);
  });
}

// ======== Aplicar perícias =======
function aplicarPericias() {
  const lines = document.querySelectorAll('.pericia-line');
  lines.forEach(l => {
    const id = l.dataset.id;
    const select = l.querySelector('select');
    if (periciaClasse && periciaClasse.includes(id)) select.value = 5;
    else if (periciaOrigem && periciaOrigem.includes(id)) select.value = 5;
    else select.value = 0;

    // aplicar cores
    const val = parseInt(select.value);
    let cor = 'white';
    if (val === 5) cor = 'green';
    else if (val === 10) cor = 'blue';
    else if (val === 15) cor = 'yellow';
    l.querySelector('.pericia-nome').style.color = cor;
    l.querySelector('input').style.color = cor;
  });
}

// ====================== ATRIBUTOS ======================
const attrSpans = document.querySelectorAll('.attr-input');
const pointsLeft = document.getElementById('points-left');

let limite = 9; // padrão 9, muda se classe for Mundano
const maxAttr = 3;

// Função para atualizar os atributos
function updateAttributes() {
    let total = 0;
    let zeroCount = 0;

    // Conta total e quantos estão zerados
    attrSpans.forEach(span => {
        let val = parseInt(span.textContent) || 0;
        val = Math.max(0, Math.min(maxAttr, val));
        span.textContent = val;
        total += val;
        if (val === 0) zeroCount++;
    });

    // Garantir que só 1 atributo possa ser 0
    if (zeroCount > 1) {
        attrSpans.forEach(span => {
            if (parseInt(span.textContent) === 0 && zeroCount > 1) {
                span.textContent = 1;
                zeroCount--;
            }
        });
        total = Array.from(attrSpans).reduce((acc, s) => acc + parseInt(s.textContent), 0);
    }

    // Ajusta valores digitados para não ultrapassar o limite
    if (total > limite) {
        let excess = total - limite;
        for (let i = attrSpans.length - 1; i >= 0; i--) {
            let val = parseInt(attrSpans[i].textContent);
            if (val > 0) {
                let reduce = Math.min(val, excess);
                attrSpans[i].textContent = val - reduce;
                excess -= reduce;
                if (excess <= 0) break;
            }
        }
        total = Array.from(attrSpans).reduce((acc, s) => acc + parseInt(s.textContent), 0);
    }

    // Atualiza o contador centralizado, sempre 0 ou positivo
    pointsLeft.textContent = Math.max(limite - total, 0);
}

// Eventos para cada atributo
attrSpans.forEach(span => {
    span.addEventListener('input', () => {
        // Remove qualquer caractere que não seja número
        span.textContent = span.textContent.replace(/\D/g, '');
        updateAttributes();
    });

    // Bloquear teclas inválidas
    span.addEventListener('keypress', e => {
        if (!/[0-9]/.test(e.key)) e.preventDefault();
    });
});

// ====================== FUNÇÃO PARA MUDAR LIMITE PELO TIPO DE CLASSE ======================
function setAttributeLimit(novoLimite) {
    limite = novoLimite;
    updateAttributes();
}

// Inicializa
updateAttributes();