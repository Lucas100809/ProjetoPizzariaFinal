const API = '/api';  // Via definir o caminho da base (todas as requisições começaram com a API)

// são arrays para guardar os cadastros (inicia vazio)//
let cPizzas   = [];
let cClientes = [];

// salva o token de login no navegador //
let TOKEN          = localStorage.getItem('pz_token') || '';
let USUARIO_LOGADO = JSON.parse(localStorage.getItem('pz_usuario') || 'null');  // Recupera os dados do usuário logado //
let mesaEmFechamento = null; // guarda a mesa q esta sendo fechada //

// Função assíncrona (await faz login no sistema) //
async function fazerLogin() { // ira pegar os elementos da tela //
  const email = document.getElementById('l-email').value.trim();
  const senha = document.getElementById('l-senha').value;
  const btn   = document.getElementById('btn-login');
  const erro  = document.getElementById('login-erro');

  // sem email ou senha mostrara erro na tela //
  if (!email || !senha) {
    erro.style.display = 'block';
    erro.textContent   = 'Preencha e-mail e senha.';
    return;
  }

  // estado de carregamento //
  btn.disabled    = true;
  btn.textContent = 'Entrando...';
  erro.style.display = 'none';

  // requisita a API
  try {
    const res  = await fetch(API + '/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, senha }),
    });

    //converte em json e avisa se der erro //
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || 'Credenciais inválidas');

    // salva o login //
    TOKEN = data.token;
    USUARIO_LOGADO = data.usuario;
    localStorage.setItem('pz_token', TOKEN);
    localStorage.setItem('pz_usuario', JSON.stringify(data.usuario));

    aplicarPerfil(data.usuario);
    document.body.classList.add('logado'); // mostra o usuario logado //

    // exibi se der erro //
  } catch (e) {
    erro.style.display = 'block';
    erro.textContent   = e.message;
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Entrar';
  }
}

// faz logout sair do sistema //
function sair() {
  TOKEN = '';
  USUARIO_LOGADO = null;
  localStorage.removeItem('pz_token');
  localStorage.removeItem('pz_usuario');
  document.body.classList.remove('logado');
  document.getElementById('l-senha').value = '';
}

// verifica o login //
if (TOKEN && USUARIO_LOGADO) {
  aplicarPerfil(USUARIO_LOGADO);
  document.body.classList.add('logado');
}

// Mostra mensagem (ok, erro, etc.) // 
function toast(msg, tipo = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `show ${tipo}`;
  setTimeout(() => el.className = '', 3000);
}

// Controla janelas modais //
function abrir(id)  { document.getElementById(id).classList.add('open'); }
function fechar(id) { document.getElementById(id).classList.remove('open'); }

// Fecha modal clicando fora //
document.querySelectorAll('.modal-bg').forEach(bg =>
  bg.addEventListener('click', e => { if (e.target === bg) bg.classList.remove('open'); })
);

// Formata valores (real) //
function R$(v) {
  return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
}

// mostra status do pedido //
function badge(s) {
  const r = {
    recebido:     '📥 Recebido',
    em_preparo:   '👨‍🍳 Em Preparo',
    saiu_entrega: '🛵 Saiu p/ Entrega',
    entregue:     '✅ Entregue',
    cancelado:    '❌ Cancelado',
  };
  return `<span class="badge b-${s}">${r[s] || s}</span>`;
}

// requisita a API e define os métodos //
async function api(method, url, body) {
  const opts = {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res  = await fetch(API + url, opts);
  const data = await res.json();

  // se token expirar faz o logout automático // 
  if (res.status === 401) { sair(); throw new Error('Sessão expirada'); }
  if (!res.ok) throw new Error(data.erro || 'Erro na requisição');
  return data; // retorna os dados da API //
}

// adapta o sistema dependendo do tipo de usuário //
function aplicarPerfil(usuario) {
  document.getElementById('sb-nome').textContent   = usuario.nome;
  document.getElementById('sb-perfil').textContent = usuario.perfil;

  // identifica o tipo de usuário (usando atalhos)//
  const perfil  = usuario.perfil;
  const isAdmin = perfil === 'Administrador';
  const isGar   = perfil === 'Garcom';

  // mostra ou esconde os elementos pelo id //
  function show(id, visible, type = 'flex') {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? type : 'none';
  }

  function showEl(el, visible, type = 'flex') {
    if (el) el.style.display = visible ? type : 'none';
  }

  // só admin ve //
  show('menu-usuarios',   isAdmin, 'block');
  show('btn-usuarios',    isAdmin, 'flex');
  // só garçom ve //
  show('sb-group-garcom', isGar,   'block');
  show('btn-nav-mesas',   isGar,   'flex');

  // garçom nao pode ver //
  showEl(document.querySelector('[onclick*="clientes"]'),  !isGar);
  showEl(document.querySelector('[onclick*="pedidos"]'),   !isGar);
  showEl(document.querySelector('[onclick*="dashboard"]'), !isGar);
  showEl(document.querySelector('.sb-group'), !isGar, 'block');

  // para garçom = cardapio  /  para admin = pizzas //
  const labelPizzas = document.getElementById('nav-pizzas-label');
  if (labelPizzas) labelPizzas.textContent = isGar ? 'Cardápio' : 'Pizzas';

  // muda o titulo //
  const tituloPizzas = document.getElementById('pg-pizzas-titulo');
  const subPizzas    = document.getElementById('pg-pizzas-sub');
  if (tituloPizzas) tituloPizzas.textContent = isGar ? 'Cardápio' : 'Pizzas';
  if (subPizzas)    subPizzas.textContent    = isGar ? 'Pizzas disponíveis hoje' : 'Gerencie o cardápio';
  show('btn-nova-pizza', !isGar, 'inline-flex');

  // garçon nao pode ver faturamento e clientes //
  show('stat-fat', !isGar, 'block');
  show('stat-cli', !isGar, 'block');

  // redireciona automáticamente //
  if (isGar) {
    ir('mesas', document.getElementById('btn-nav-mesas'));
  } else {
    ir('dashboard', document.querySelector('[onclick*="dashboard"]'));
  }
}

// -- PEDIDOS -- //
async function carregarMesas(mesaFiltro = null) {
  const grid = document.getElementById('grid-mesas');
  grid.innerHTML = '<div class="spin-wrap"><div class="spin"></div> Carregando...</div>';

  document.getElementById('mesas-sub').textContent =
    `Olá, ${USUARIO_LOGADO?.nome}! Seus pedidos ativos.`;

    // Busca pedidos de um determinado garçom //
  try {
    const url = `/pedidos?garcom=${USUARIO_LOGADO.id}`;
    const pedidos = await api('GET', url);

    // filtra os pedidos ativos //
    const ativos = pedidos.filter(p => !['entregue','cancelado'].includes(p.status));

    // mostra o total de pedidos //
    document.getElementById('g-ped').textContent     = pedidos.length;
    document.getElementById('g-ped-sub').textContent = `${ativos.length} ativo(s)`; // quais ativos// 

    // lista das mesas que têm pedidos ativos //
    const mesasAtivas = new Set(ativos.map(p => p.mesa).filter(Boolean));
    document.getElementById('g-mesas').textContent   = mesasAtivas.size; // quantas estão ocupadas //
    document.getElementById('g-preparo').textContent = ativos.filter(p => p.status === 'em_preparo').length; // quantos pedidos estao em preparo //
    document.getElementById('g-prontos').textContent = ativos.filter(p => p.status === 'saiu_entrega').length; // quantas sairam para entrega //

    const botoes = document.getElementById('mesa-botoes');
    botoes.innerHTML = Array.from({length: 10}, (_, i) => {
      const n      = i + 1;  // numero da mesa // 
      const temPed = mesasAtivas.has(n);
      const ativo  = mesaFiltro === n; // mesa selecionada //
      return `
        <button class="btn btn-sm ${ativo ? 'btn-red' : temPed ? 'btn-green' : 'btn-ghost'}"
          onclick="carregarMesas(${n})"
          title="${temPed ? 'Mesa com pedido ativo' : 'Mesa livre'}">
          ${n}${temPed ? ' 🔴' : ''} 
        </button>`;
    }).join('');

    // Vermelho → selecionado --- Verde → tem pedido --- Ghost → vazio //
    const pedidosFiltrados = mesaFiltro // escolhe uma mesa e a mostra // 
      ? ativos.filter(p => p.mesa === mesaFiltro)
      : ativos;

      // sem pedidos fica uma lsita vazio //
    if (!pedidosFiltrados.length) {
      grid.innerHTML = `
        <div class="empty" style="grid-column:1/-1">
          <span class="ei">🪑</span>
          Nenhum pedido ativo no momento.<br>
          <button class="btn btn-red" style="margin-top:12px" onclick="abrirPedidoMesa()">
            + Abrir primeiro pedido
          </button>
        </div>`;
      return;
    }

    const porMesa = {}; // separa pedido por mesa //
    pedidosFiltrados.forEach(p => { // sem mesa vira balcão //
      const key = p.mesa || 'balcão';
      if (!porMesa[key]) porMesa[key] = []; // Agrupa: mesa 1 → lista de pedidos // 
      porMesa[key].push(p);
    });

    // card por mesa //
    grid.innerHTML = Object.entries(porMesa).map(([mesa, peds]) => {
      const totalMesa  = peds.reduce((s, p) => s + (p.total || 0), 0); // soma os pedidos da mesa //
      const todosItens = peds.flatMap(p => p.itens); // junta tudo (pedidos e pizzas) //
      const itensAgrup = {}; // junta itens iguais //
      todosItens.forEach(it => {
        const k = `${it.nomePizza} (${it.tamanho})`;
        itensAgrup[k] = (itensAgrup[k] || 0) + it.quantidade;
      });
      const statusAtual = peds[peds.length - 1]?.status; // status do ultimo pedido //

      return `
        <div class="mesa-card">
          <div class="mesa-card-head">
            <div>
              <div class="mesa-num">Mesa ${mesa}</div>
              <div style="font-size:.72rem;color:var(--muted);margin-top:2px">
                ${peds.length} pedido(s) · ${peds[0]?.cliente?.nome || 'Sem cadastro'}
              </div>
            </div>
            ${badge(statusAtual)}
          </div>
          <div class="mesa-card-body">
            ${Object.entries(itensAgrup).map(([nome, qtd]) => `
              <div class="mesa-item">
                <strong>${qtd}x ${nome}</strong>
              </div>`).join('')}
            <div class="mesa-total">
              <span style="color:var(--muted)">Total da mesa</span>
              <span style="color:var(--gold)">${R$(totalMesa)}</span>
            </div>
          </div>
          <div class="mesa-card-foot">
            <button class="btn btn-ghost btn-sm" style="flex:1"
              onclick="abrirPedidoMesa(${mesa})">
              + Item
            </button>
            <button class="btn btn-blue btn-sm"
              onclick="abrirStatus('${peds[peds.length-1]?._id}','${statusAtual}')">
              📝 Status
            </button>
            <button class="btn btn-green btn-sm"
              onclick="abrirFecharMesa(${mesa}, ${totalMesa}, '${peds.map(p=>p._id).join(',')}')">
              ✅ Fechar
            </button>
          </div>
        </div>`;
    }).join('');

  } catch (e) { // mostra se der erro //
    grid.innerHTML = `<div class="empty" style="color:var(--red)">${e.message}</div>`;
  }
}

async function abrirPedidoMesa(mesaNum = null) {
  try {
    if (!cPizzas.length)   cPizzas   = await api('GET', '/pizzas'); // busca na API se nao tiver carregado //
    if (!cClientes.length) cClientes = await api('GET', '/clientes');
  } catch (e) { toast('Erro ao carregar dados', 'err'); return; } // cancela se tiver erro //

  // preenche lista de clientes //
  document.getElementById('pm-cli').innerHTML =
    '<option value="">— Sem cadastro —</option>' +
    cClientes.map(c => `<option value="${c._id}">${c.nome} · ${c.telefone}</option>`).join('');

    // define a mesa e limpa o formulario 
  document.getElementById('pm-mesa').value = mesaNum || '';
  document.getElementById('itens-mesa-lista').innerHTML = ''; // limpa lista de pizzas //
  document.getElementById('pm-obs').value  = ''; // Limpa observações //
  document.getElementById('pm-sub').textContent = 'R$ 0,00'; // Zera valores //
  document.getElementById('pm-tot').textContent = 'R$ 0,00'; // abre com pizza 1 pronta pra selecionar //

  // abre modal //
  addItemMesa();
  abrir('m-pedido-mesa');
}

// Cria elemento//
function addItemMesa() {
  const d = document.createElement('div'); // Cria uma div que representa uma linha de item //
  d.className = 'item-row'; // Define a classe da linha

  // Filtra pizzas disponíveis e cria opções do select com preços nos atributos data
  const opts = cPizzas.filter(p => p.disponivel)
    .map(p => `<option value="${p._id}"
      data-p="${p.precos?.P||0}" data-m="${p.precos?.M||0}" data-g="${p.precos?.G||0}">
      ${p.nome}</option>`).join('');

  // Estrutura HTML da linha do item
  d.innerHTML = `
    <!-- Select da pizza -->
    <select class="ip" onchange="recalcMesa()"><option value="">Selecione...</option>${opts}</select>

    <!-- Select do tamanho -->
    <select class="it" onchange="recalcMesa()">
      <option value="P">P</option><option value="M">M</option><option value="G" selected>G</option>
    </select>

    <!-- Quantidade -->
    <input class="iq" type="number" value="1" min="1" oninput="recalcMesa()">

    <!-- Subtotal do item -->
    <div class="is" style="font-size:.8rem;text-align:right;color:var(--muted)">R$ 0,00</div>

    <!-- Botão para remover item -->
    <button class="btn-rm" onclick="this.parentElement.remove();recalcMesa()">×</button>`;

  // Adiciona a linha na lista de itens da mesa
  document.getElementById('itens-mesa-lista').appendChild(d);
}

function recalcMesa() {
  let sub = 0; // Variável para subtotal geral

  // Percorre todos os itens da mesa
  document.querySelectorAll('#itens-mesa-lista .item-row').forEach(row => {
    const sel = row.querySelector('.ip'); // Select da pizza
    const tam = row.querySelector('.it').value.toLowerCase(); // Tamanho selecionado
    const qtd = parseInt(row.querySelector('.iq').value) || 0; // Quantidade

    // Pega o preço do tamanho selecionado através do dataset
    const pc  = parseFloat(sel.options[sel.selectedIndex]?.dataset?.[tam] || 0);

    const s   = pc * qtd; // Subtotal do item
    sub += s; // Soma no subtotal geral

    // Atualiza subtotal do item na tela
    row.querySelector('.is').textContent = R$(s);
  });

  // Atualiza subtotal e total geral
  document.getElementById('pm-sub').textContent = R$(sub);
  document.getElementById('pm-tot').textContent = R$(sub);
}

async function salvarPedidoMesa() {
  // Pega número da mesa
  const mesa = parseInt(document.getElementById('pm-mesa').value) || 0;

  // Validação da mesa
  if (!mesa || mesa < 1) { toast('Selecione a mesa', 'err'); return; }

  const cliId = document.getElementById('pm-cli').value || null; // Cliente selecionado
  const itens = []; 
  let valido = true;

  // Monta lista de itens
  document.querySelectorAll('#itens-mesa-lista .item-row').forEach(row => {
    const pid = row.querySelector('.ip').value; // ID da pizza

    // Se algum item não tiver pizza selecionada
    if (!pid) { valido = false; return; }

    itens.push({
      pizza:      pid,
      tamanho:    row.querySelector('.it').value,
      quantidade: parseInt(row.querySelector('.iq').value) || 1,
    });
  });

  // Validação dos itens
  if (!valido || !itens.length) { toast('Adicione ao menos um item', 'err'); return; }

  let clienteId = cliId;

  // Se não tiver cliente, cria ou busca um cliente "Mesa X"
  if (!clienteId) {
    try {
      const todos = await api('GET', `/clientes?busca=Mesa ${mesa}`);
      const existe = todos.find(c => c.nome === `Mesa ${mesa}`);

      if (existe) {
        clienteId = existe._id; // Usa cliente existente
      } else {
        const novo = await api('POST', '/clientes', { nome: `Mesa ${mesa}`, telefone: 'Mesa' });
        clienteId = novo._id; // Cria novo cliente
        cClientes = []; // Limpa cache
      }
    } catch (e) { toast('Erro ao registrar mesa', 'err'); return; }
  }

  try {
    // Envia pedido para API
    await api('POST', '/pedidos', {
      cliente:        clienteId,
      itens,
      taxaEntrega:    0,
      formaPagamento: 'pix',
      observacoes:    document.getElementById('pm-obs').value,
      mesa,
      origem:         'mesa',
      garcom:         USUARIO_LOGADO?.id,
    });

    toast(`Pedido lançado na Mesa ${mesa}! 🍕`);
    fechar('m-pedido-mesa'); // Fecha modal
    carregarMesas(); // Atualiza lista de mesas
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
}

function abrirFecharMesa(mesa, total, ids) {
  // Armazena dados da mesa que será fechada
  mesaEmFechamento = { mesa, total, ids: ids.split(',') };

  // Atualiza título e total no modal
  document.getElementById('fm-titulo').textContent = `Fechar Mesa ${mesa}`;
  document.getElementById('fm-total').textContent  = R$(total);

  // Mostra resumo dos pedidos
  document.getElementById('fm-resumo').innerHTML   =
    `<p style="font-size:.82rem;color:var(--muted)">
      ${mesaEmFechamento.ids.length} pedido(s) serão marcados como <strong style="color:var(--green)">Entregue</strong>.
    </p>`;

  abrir('m-fechar-mesa'); // Abre modal
}

async function confirmarFechamento() {
  if (!mesaEmFechamento) return; // Se não houver mesa selecionada, sai

  try {
    // Atualiza status de todos pedidos da mesa
    await Promise.all(
      mesaEmFechamento.ids.map(id =>
        api('PATCH', `/pedidos/${id}/status`, { status: 'entregue' })
      )
    );

    toast(`Mesa ${mesaEmFechamento.mesa} fechada! ✅`);
    fechar('m-fechar-mesa'); // Fecha modal
    mesaEmFechamento = null; // Limpa variável
    carregarMesas(); // Atualiza mesas
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
}

function ir(pg, btn) {
  const perfil = document.getElementById('sb-perfil').textContent; // Perfil do usuário

  // Regras de acesso por perfil
  if (pg === 'usuarios' && perfil !== 'Administrador') {
    toast('Acesso restrito a Administradores', 'err'); return;
  }
  if (pg === 'mesas' && perfil !== 'Garcom') {
    toast('Área exclusiva para Garçom', 'err'); return;
  }
  if (perfil === 'Garcom' && !['mesas','pizzas'].includes(pg)) {
    toast('Acesso não permitido para Garçom', 'err'); return;
  }

  // Remove classes de ativo das seções e botões
  document.querySelectorAll('.secao').forEach(s => s.classList.remove('ativa'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('ativo'));

  // Ativa página selecionada
  document.getElementById('pg-' + pg).classList.add('ativa');
  if (btn) btn.classList.add('ativo');

  // Mapeamento de carregadores por página
  const loaders = {
    dashboard: carregarDashboard,
    pedidos:   carregarPedidos,
    pizzas:    carregarPizzas,
    clientes:  carregarClientes,
    usuarios:  carregarUsuarios,
    mesas:     carregarMesas,
  };

  // Executa loader se existir
  if (loaders[pg]) loaders[pg]();
}

async function carregarDashboard() {
  const h = new Date().getHours(); // Hora atual

  // Define saudação
  const s = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  document.getElementById('dash-sub').textContent = `${s}! Aqui está o resumo.`;

  try {
    // Busca dados em paralelo
    const [pizzas, clientes, pedidos] = await Promise.all([
      api('GET', '/pizzas'),
      api('GET', '/clientes'),
      api('GET', '/pedidos'),
    ]);

    // Armazena em cache
    cPizzas   = pizzas;
    cClientes = clientes;

    // Atualiza indicadores
    document.getElementById('s-piz').textContent = pizzas.length;
    document.getElementById('s-cli').textContent = clientes.length;
    document.getElementById('s-ped').textContent = pedidos.length;

    // Pedidos em entrega
    document.getElementById('s-ent').textContent =
      pedidos.filter(p => p.status === 'saiu_entrega').length;

    // Faturamento total
    document.getElementById('s-fat').textContent =
      R$(pedidos.reduce((acc, p) => acc + (p.total || 0), 0));

    // Pedidos pendentes
    const pend = pedidos.filter(p => !['entregue','cancelado'].includes(p.status)).length;
    document.getElementById('s-ped-sub').textContent = `${pend} pendente(s)`;

    // Lista de pedidos recentes
    const elP = document.getElementById('dash-pedidos');
    elP.innerHTML = pedidos.slice(0, 8).map(p => `
      <div class="mini-row">
        <div>
          <div class="mn">#${String(p.numeroPedido || '?').padStart(3,'0')} · ${p.cliente?.nome || '—'}</div>
          <div class="mc">${new Date(p.createdAt).toLocaleString('pt-BR')}</div>
        </div>
        <div style="text-align:right">
          ${badge(p.status)}<br>
          <small style="color:var(--muted)">${R$(p.total)}</small>
        </div>
      </div>`).join('') ||
      '<div class="empty"><span class="ei">📋</span>Nenhum pedido ainda</div>';

    // Lista de pizzas disponíveis
    const elC = document.getElementById('dash-cardapio');
    elC.innerHTML = pizzas.filter(p => p.disponivel).slice(0, 8).map(p => `
      <div class="mini-row">
        <span>🍕 ${p.nome}</span>
        <small style="color:var(--muted)">${R$(p.precos?.G)}</small>
      </div>`).join('') ||
      '<div class="empty"><span class="ei">🍕</span>Nenhuma pizza</div>';

  } catch (e) { toast('Erro dashboard: ' + e.message, 'err'); }
}

async function carregarPizzas() {
  const el = document.getElementById('tbl-pizzas');

  // Mostra loading
  el.innerHTML = '<div class="spin-wrap"><div class="spin"></div> Carregando...</div>';

  try {
    cPizzas = await api('GET', '/pizzas');

    // Se não houver pizzas
    if (!cPizzas.length) {
      el.innerHTML = '<div class="empty"><span class="ei">🍕</span>Nenhuma pizza</div>';
      return;
    }

    // Monta tabela de pizzas
    el.innerHTML = `
      <table>
        <thead>
          <tr><th>Nome</th><th>Categoria</th><th>Ingredientes</th><th>P</th><th>M</th><th>G</th><th>Status</th><th>Ações</th>
        </thead>
        <tbody>
          ${cPizzas.map(p => `
            <tr>
              <td><strong>${p.nome}</strong><br><small style="color:var(--muted)">${p.descricao || ''}</small></td>
              <td><span class="badge b-cat">${p.categoria || 'tradicional'}</span></td>
              <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.ingredientes}</td>
              <td>${R$(p.precos?.P)}</td>
              <td>${R$(p.precos?.M)}</td>
              <td><strong style="color:var(--gold)">${R$(p.precos?.G)}</strong></td>
              <td><span class="badge ${p.disponivel ? 'b-on' : 'b-off'}">${p.disponivel ? '✅ Disponível' : '❌ Off'}</span></td>
              <td><div style="display:flex;gap:5px"><button class="btn btn-ghost btn-sm" onclick="editarPizza('${p._id}')">✏️</button><button class="btn btn-danger btn-sm" onclick="deletarPizza('${p._id}','${p.nome}')">🗑️</button></div></td>
             </tr>`).join('')}
        </tbody>
      </table>`;

} catch (e) {
  // Em caso de erro, mostra a mensagem na tela
  el.innerHTML = `<div class="empty" style="color:var(--red)">${e.message}</div>`;
}
}

// Abre modal para criar nova pizza
function abrirPizza() {
  document.getElementById('m-pizza-t').textContent = 'Nova Pizza';

  // Limpa todos os campos do formulário
  ['p-id','p-nome','p-ing','p-desc','p-pp','p-pm','p-pg']
    .forEach(id => document.getElementById(id).value = '');

  // Define valores padrão
  document.getElementById('p-cat').value  = 'tradicional';
  document.getElementById('p-disp').value = 'true';

  abrir('m-pizza'); // Abre modal
}

// Preenche formulário para editar uma pizza existente
function editarPizza(id) {
  const p = cPizzas.find(x => x._id === id); // Busca pizza pelo ID
  if (!p) return;

  document.getElementById('m-pizza-t').textContent = 'Editar Pizza';

  // Preenche campos com dados da pizza
  document.getElementById('p-id').value   = p._id;
  document.getElementById('p-nome').value = p.nome;
  document.getElementById('p-ing').value  = p.ingredientes;
  document.getElementById('p-desc').value = p.descricao || '';
  document.getElementById('p-pp').value   = p.precos?.P || '';
  document.getElementById('p-pm').value   = p.precos?.M || '';
  document.getElementById('p-pg').value   = p.precos?.G || '';
  document.getElementById('p-cat').value  = p.categoria || 'tradicional';
  document.getElementById('p-disp').value = String(p.disponivel);

  abrir('m-pizza'); // Abre modal
}

// Salva (cria ou atualiza) uma pizza
async function salvarPizza() {
  const id   = document.getElementById('p-id').value;
  const nome = document.getElementById('p-nome').value.trim();
  const ing  = document.getElementById('p-ing').value.trim();

  // Validação obrigatória
  if (!nome || !ing) { toast('Nome e ingredientes são obrigatórios', 'err'); return; }

  // Monta objeto da pizza
  const d = {
    nome,
    ingredientes: ing,
    descricao:    document.getElementById('p-desc').value.trim(),
    precos: {
      P: parseFloat(document.getElementById('p-pp').value) || 0,
      M: parseFloat(document.getElementById('p-pm').value) || 0,
      G: parseFloat(document.getElementById('p-pg').value) || 0,
    },
    categoria:  document.getElementById('p-cat').value,
    disponivel: document.getElementById('p-disp').value === 'true',
  };

  try {
    // Se tiver ID atualiza, senão cria nova
    id ? await api('PUT', '/pizzas/' + id, d) : await api('POST', '/pizzas', d);

    toast(id ? 'Pizza atualizada!' : 'Pizza criada!');
    fechar('m-pizza'); // Fecha modal
    carregarPizzas();  // Atualiza lista
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
}

// Deleta uma pizza
async function deletarPizza(id, nome) {
  // Confirmação antes de deletar
  if (!confirm(`Deletar "${nome}"?`)) return;

  try {
    await api('DELETE', '/pizzas/' + id);
    toast('Pizza deletada!');
    carregarPizzas(); // Atualiza lista
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
}

// Carrega lista de clientes (com busca opcional)
async function carregarClientes(busca = '') {
  const el = document.getElementById('tbl-clientes');

  // Loading
  el.innerHTML = '<div class="spin-wrap"><div class="spin"></div> Carregando...</div>';

  try {
    // Monta URL com ou sem filtro de busca
    const url = busca ? `/clientes?busca=${encodeURIComponent(busca)}` : '/clientes';

    cClientes = await api('GET', url);

    // Se não houver clientes
    if (!cClientes.length) {
      el.innerHTML = '<div class="empty"><span class="ei">👥</span>Nenhum cliente</div>';
      return;
    }

    // Monta tabela de clientes
    el.innerHTML = `
      <table>
        <thead><tr><th>Nome</th><th>Telefone</th><th>Endereço</th><th>Obs</th><th>Ações</th></tr></thead>
        <tbody>
          ${cClientes.map(c => `
            <tr>
              <td><strong>${c.nome}</strong></td>
              <td>${c.telefone}</td>

              <!-- Monta endereço dinamicamente -->
              <td style="font-size:.76rem;color:var(--muted)">
                ${[c.endereco?.rua, c.endereco?.numero, c.endereco?.bairro, c.endereco?.cidade].filter(Boolean).join(', ') || '—'}
              </td>

              <!-- Observações -->
              <td style="font-size:.76rem;color:var(--muted)">${c.observacoes || '—'}</td>

              <!-- Ações -->
              <td>
                <div style="display:flex;gap:5px">
                  <button class="btn btn-ghost btn-sm" onclick="editarCliente('${c._id}')">✏️</button>
                  <button class="btn btn-danger btn-sm" onclick="deletarCliente('${c._id}','${c.nome}')">🗑️</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    // Mostra erro na tela
    el.innerHTML = `<div class="empty" style="color:var(--red)">${e.message}</div>`;
  }
}

// Controle de debounce para busca de clientes
let _t;
function buscarCli(v) {
  clearTimeout(_t); // Cancela busca anterior
  _t = setTimeout(() => carregarClientes(v), 400); // Executa após 400ms
}

// Abre modal para novo cliente
function abrirCliente() {
  document.getElementById('m-cli-t').textContent = 'Novo Cliente';

  // Limpa campos
  ['c-id','c-nome','c-tel','c-rua','c-num','c-bairro','c-cidade','c-cep','c-comp','c-obs']
    .forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });

  abrir('m-cliente');
}

// Preenche formulário para editar cliente
function editarCliente(id) {
  const c = cClientes.find(x => x._id === id);
  if (!c) return;

  document.getElementById('m-cli-t').textContent = 'Editar Cliente';

  // Preenche dados
  document.getElementById('c-id').value     = c._id;
  document.getElementById('c-nome').value   = c.nome;
  document.getElementById('c-tel').value    = c.telefone;
  document.getElementById('c-rua').value    = c.endereco?.rua || '';
  document.getElementById('c-num').value    = c.endereco?.numero || '';
  document.getElementById('c-bairro').value = c.endereco?.bairro || '';
  document.getElementById('c-cidade').value = c.endereco?.cidade || '';
  document.getElementById('c-cep').value    = c.endereco?.cep || '';
  document.getElementById('c-comp').value   = c.endereco?.complemento || '';
  document.getElementById('c-obs').value    = c.observacoes || '';

  abrir('m-cliente');
}

// Salva cliente (criar ou atualizar)
async function salvarCliente() {
  const id   = document.getElementById('c-id').value;
  const nome = document.getElementById('c-nome').value.trim();
  const tel  = document.getElementById('c-tel').value.trim();

  // Validação obrigatória
  if (!nome || !tel) { toast('Nome e telefone são obrigatórios', 'err'); return; }

  // Monta objeto cliente
  const d = {
    nome,
    telefone: tel,
    endereco: {
      rua:         document.getElementById('c-rua').value.trim(),
      numero:      document.getElementById('c-num').value.trim(),
      bairro:      document.getElementById('c-bairro').value.trim(),
      cidade:      document.getElementById('c-cidade').value.trim(),
      cep:         document.getElementById('c-cep').value.trim(),
      complemento: document.getElementById('c-comp').value.trim(),
    },
    observacoes: document.getElementById('c-obs').value.trim(),
  };

  try {
    // Atualiza ou cria
    id ? await api('PUT', '/clientes/' + id, d) : await api('POST', '/clientes', d);

    toast(id ? 'Cliente atualizado!' : 'Cliente cadastrado!');
    fechar('m-cliente');
    carregarClientes(); // Atualiza lista
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
}

// Deleta cliente
async function deletarCliente(id, nome) {
  if (!confirm(`Deletar "${nome}"?`)) return;

  try {
    await api('DELETE', '/clientes/' + id);
    toast('Cliente deletado!');
    carregarClientes();
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
}

// Carrega lista de pedidos
async function carregarPedidos() {
  const el = document.getElementById('tbl-pedidos');

  // Loading
  el.innerHTML = '<div class="spin-wrap"><div class="spin"></div> Carregando...</div>';

  try {
    const pedidos = await api('GET', '/pedidos');

    // Se não houver pedidos
    if (!pedidos.length) {
      el.innerHTML = '<div class="empty"><span class="ei">📋</span>Nenhum pedido</div>';
      return;
    }

    // Monta tabela de pedidos
    el.innerHTML = `
      <table>
        <thead>
          <tr><th>#</th><th>Cliente</th><th>Itens</th><th>Subtotal</th><th>Entrega</th><th>Total</th><th>Pagamento</th><th>Status</th><th>Data</th><th>Ações</th>
        </thead>
        <tbody>
          ${pedidos.map(p => `
            <tr>
              <td><strong style="color:var(--red)">#${String(p.numeroPedido||'?').padStart(3,'0')}</strong></td>

              <!-- Cliente -->
              <td><strong>${p.cliente?.nome || '—'}</strong><br><small style="color:var(--muted)">${p.cliente?.telefone || ''}</small></td>

              <!-- Itens -->
              <td style="font-size:.76rem">
                ${p.itens.map(it => `${it.quantidade}x ${it.nomePizza || '?'} (${it.tamanho})`).join('<br>')}
              </td>

              <!-- Valores -->
              <td>${R$(p.subtotal)}</td>
              <td>${R$(p.taxaEntrega)}</td>
              <td><strong style="color:var(--gold)">${R$(p.total)}</strong></td>

              <!-- Pagamento -->
              <td style="font-size:.76rem">${(p.formaPagamento || '—').replace('_', ' ')}</td>

              <!-- Status -->
              <td>${badge(p.status)}</td>

              <!-- Data -->
              <td style="font-size:.7rem;color:var(--muted)">${new Date(p.createdAt).toLocaleString('pt-BR')}</td>

              <!-- Ações -->
              <td>
                <div style="display:flex;gap:5px">
                  <button class="btn btn-blue btn-sm" onclick="abrirStatus('${p._id}','${p.status}')">📝</button>
                  <button class="btn btn-danger btn-sm" onclick="deletarPedido('${p._id}')">🗑️</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    // Mostra erro
    el.innerHTML = `<div class="empty" style="color:var(--red)">${e.message}</div>`;
  }
}

// Abre modal de pedido
async function abrirPedido() {
  try {
    // Garante que dados estejam carregados
    if (!cPizzas.length)   cPizzas   = await api('GET', '/pizzas');
    if (!cClientes.length) cClientes = await api('GET', '/clientes');
  } catch (e) { toast('Erro ao carregar dados', 'err'); return; }

  // Preenche select de clientes
  document.getElementById('ped-cli').innerHTML =
    '<option value="">— Selecione o cliente —</option>' +
    cClientes.map(c => `<option value="${c._id}">${c.nome} · ${c.telefone}</option>`).join('');

  // Reseta formulário
  document.getElementById('itens-lista').innerHTML = '';
  document.getElementById('ped-taxa').value  = '0';
  document.getElementById('ped-obs').value   = '';
  document.getElementById('ped-pag').value   = 'pix';
  document.getElementById('ped-sub').textContent = 'R$ 0,00';
  document.getElementById('ped-tot').textContent = 'R$ 0,00';
  document.getElementById('wrap-troco').style.display = 'none';

  addItem(); // Adiciona primeiro item automaticamente
  abrir('m-pedido'); // Abre modal
}
function addItem() {
  const d = document.createElement('div'); // Cria uma nova linha de item
  d.className = 'item-row'; // Define a classe da linha

  // Gera opções de pizzas disponíveis com preços nos atributos data
  const opts = cPizzas
    .filter(p => p.disponivel)
    .map(p => `<option value="${p._id}" data-p="${p.precos?.P || 0}" data-m="${p.precos?.M || 0}" data-g="${p.precos?.G || 0}">${p.nome}</option>`).join('');

  // Estrutura HTML do item
  d.innerHTML = `
    <!-- Seleção da pizza -->
    <select class="ip" onchange="recalc()"><option value="">Selecione...</option>${opts}</select>

    <!-- Seleção do tamanho -->
    <select class="it" onchange="recalc()">
      <option value="P">P</option><option value="M">M</option><option value="G" selected>G</option>
    </select>

    <!-- Quantidade -->
    <input class="iq" type="number" value="1" min="1" oninput="recalc()">

    <!-- Subtotal do item -->
    <div class="is" style="font-size:.8rem;text-align:right;color:var(--muted)">R$ 0,00</div>

    <!-- Botão remover -->
    <button class="btn-rm" onclick="this.parentElement.remove(); recalc()">×</button>`;

  // Adiciona o item na lista
  document.getElementById('itens-lista').appendChild(d);
}

function recalc() {
  let sub = 0; // Subtotal geral

  // Percorre todos os itens do pedido
  document.querySelectorAll('#itens-lista .item-row').forEach(row => {
    const sel = row.querySelector('.ip'); // Select da pizza
    const tam = row.querySelector('.it').value.toLowerCase(); // Tamanho
    const qtd = parseInt(row.querySelector('.iq').value) || 0; // Quantidade

    const opt = sel.options[sel.selectedIndex]; // Opção selecionada

    // Pega preço pelo dataset (p, m ou g)
    const pc  = parseFloat(opt?.dataset?.[tam] || 0);

    const s   = pc * qtd; // Subtotal do item
    sub += s; // Soma no total

    // Atualiza subtotal do item
    row.querySelector('.is').textContent = R$(s);
  });

  // Pega taxa de entrega
  const taxa = parseFloat(document.getElementById('ped-taxa').value) || 0;

  // Atualiza valores na tela
  document.getElementById('ped-sub').textContent = R$(sub);
  document.getElementById('ped-tot').textContent = R$(sub + taxa);
}

// Mostra ou esconde campo de troco dependendo da forma de pagamento
function toggleTroco() {
  const pag = document.getElementById('ped-pag').value;

  document.getElementById('wrap-troco').style.display =
    pag === 'dinheiro' ? 'block' : 'none';
}

// Salva um novo pedido
async function salvarPedido() {
  const cliId = document.getElementById('ped-cli').value;

  // Validação de cliente
  if (!cliId) { toast('Selecione um cliente', 'err'); return; }

  const itens = [];
  let valido = true;

  // Monta lista de itens
  document.querySelectorAll('#itens-lista .item-row').forEach(row => {
    const pid = row.querySelector('.ip').value;

    // Se item inválido
    if (!pid) { valido = false; return; }

    itens.push({
      pizza:      pid,
      tamanho:    row.querySelector('.it').value,
      quantidade: parseInt(row.querySelector('.iq').value) || 1,
    });
  });

  // Validação final
  if (!valido || !itens.length) {
    toast('Adicione ao menos um item válido', 'err'); return;
  }

  try {
    // Envia pedido para API
    await api('POST', '/pedidos', {
      cliente:        cliId,
      itens,
      taxaEntrega:    parseFloat(document.getElementById('ped-taxa').value) || 0,
      formaPagamento: document.getElementById('ped-pag').value,
      troco:          parseFloat(document.getElementById('ped-troco')?.value) || 0,
      observacoes:    document.getElementById('ped-obs').value,
    });

    toast('Pedido criado! 🍕');
    fechar('m-pedido'); // Fecha modal
    carregarPedidos();  // Atualiza lista
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
}

// Abre modal para alterar status do pedido
function abrirStatus(id, status) {
  document.getElementById('st-id').value  = id;     // Define ID
  document.getElementById('st-val').value = status; // Define status atual
  abrir('m-status'); // Abre modal
}

// Salva novo status do pedido
async function salvarStatus() {
  const id     = document.getElementById('st-id').value;
  const status = document.getElementById('st-val').value;

  try {
    await api('PATCH', '/pedidos/' + id + '/status', { status });
    toast('Status atualizado!');
    fechar('m-status');
    carregarPedidos(); // Atualiza lista
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
}

// Deleta pedido
async function deletarPedido(id) {
  if (!confirm('Deletar este pedido?')) return;

  try {
    await api('DELETE', '/pedidos/' + id);
    toast('Pedido deletado!');
    carregarPedidos();
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
}

// Carrega usuários
async function carregarUsuarios() {
  const el = document.getElementById('tbl-usuarios');

  // Loading
  el.innerHTML = '<div class="spin-wrap"><div class="spin"></div> Carregando...</div>';

  try {
    const us = await api('GET', '/usuarios');

    // Se não houver usuários
    if (!us.length) {
      el.innerHTML = '<div class="empty"><span class="ei">🔐</span>Nenhum usuário</div>';
      return;
    }

    // Monta tabela de usuários
    el.innerHTML = `
      <table>
        <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Criado em</th><th>Ações</th></tr></thead>
        <tbody>
          ${us.map(u => `
            <tr>
              <td><strong>${u.nome}</strong></td>
              <td>${u.email}</td>

              <!-- Perfil -->
              <td><span class="badge ${u.perfil === 'Administrador' ? 'b-admin' : 'b-atend'}">${u.perfil}</span></td>

              <!-- Status -->
              <td><span class="badge ${u.ativo ? 'b-on' : 'b-off'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>

              <!-- Data -->
              <td style="font-size:.73rem;color:var(--muted)">
                ${new Date(u.createdAt).toLocaleDateString('pt-BR')}
              </td>

              <!-- Ações -->
              <td>
                <button class="btn btn-danger btn-sm" onclick="deletarUsuario('${u._id}','${u.nome}')">🗑️</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    // Mostra erro
    el.innerHTML = `<div class="empty" style="color:var(--red)">${e.message}</div>`;
  }
}

// Abre modal para criar usuário
function abrirUsuario() {
  // Limpa campos
  ['u-nome','u-email','u-senha'].forEach(id => document.getElementById(id).value = '');

  document.getElementById('u-perfil').value = 'Atendente'; // Perfil padrão
  abrir('m-usuario');
}

// Salva novo usuário
async function salvarUsuario() {
  const nome  = document.getElementById('u-nome').value.trim();
  const email = document.getElementById('u-email').value.trim();
  const senha = document.getElementById('u-senha').value;

  // Validação
  if (!nome || !email || !senha) { toast('Preencha todos os campos', 'err'); return; }

  try {
    await api('POST', '/usuarios', {
      nome,
      email,
      senha,
      perfil: document.getElementById('u-perfil').value,
    });

    toast('Usuário criado!');
    fechar('m-usuario');
    carregarUsuarios();
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
}

// Deleta usuário
async function deletarUsuario(id, nome) {
  if (!confirm(`Deletar "${nome}"?`)) return;

  try {
    await api('DELETE', '/usuarios/' + id);
    toast('Usuário deletado!');
    carregarUsuarios();
  } catch (e) { toast('Erro: ' + e.message, 'err'); }
}
