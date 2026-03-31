// Importa o framework Express (para criar API)
const express  = require('express');

// Importa biblioteca para trabalhar com JWT (autenticação)
const jwt      = require('jsonwebtoken');

// Cria um roteador (organiza as rotas separadamente do app principal)
const router   = express.Router();

// Importa middleware de autenticação (verifica token)
const auth     = require('../middlewares/auth');

// Importa os models (responsáveis por acessar o banco)
const Usuario  = require('../models/Usuario');
const Pizza    = require('../models/Pizza');
const Cliente  = require('../models/Cliente');
const Pedido   = require('../models/Pedido');


// ========================== LOGIN ==========================
router.post('/auth/login', async (req, res) => {
  try {
    // Pega email e senha enviados pelo frontend
    const { email, senha } = req.body;

    // Valida se os campos foram enviados
    if (!email || !senha)
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });

    // Busca usuário pelo email
    const usuario = await Usuario.findByEmail(email);

    // Se não existir, erro de autenticação
    if (!usuario) return res.status(401).json({ erro: 'Credenciais inválidas' });

    // Verifica se a senha está correta
    const ok = await Usuario.verificarSenha(senha, usuario.senha);

    if (!ok) return res.status(401).json({ erro: 'Credenciais inválidas' });

    // Gera o token JWT com dados do usuário
    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      },
      process.env.JWT_SECRET, // chave secreta
      { expiresIn: '8h' } // validade do token
    );

    // Retorna token + dados básicos do usuário
    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });

  } catch (e) {
    // Erro interno
    res.status(500).json({ erro: e.message });
  }
});


// ========================== PIZZAS ==========================

// Lista todas as pizzas
router.get('/pizzas', auth, async (req, res) => {
  try {
    res.json(await Pizza.findAll());
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Busca pizza por ID
router.get('/pizzas/:id', auth, async (req, res) => {
  try {
    const p = await Pizza.findById(req.params.id);

    // Se não existir, retorna 404
    if (!p)
      return res.status(404).json({ erro: 'Pizza não encontrada' });

    res.json(p);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Cria nova pizza
router.post('/pizzas', auth, async (req, res) => {
  try {
    // Valida campos obrigatórios
    if (!req.body.nome || !req.body.ingredientes)
      return res.status(400).json({ erro: 'Nome e ingredientes são obrigatórios' });

    // Cria no banco
    res.status(201).json(await Pizza.create(req.body));
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Atualiza pizza
router.put('/pizzas/:id', auth, async (req, res) => {
  try {
    const p = await Pizza.update(req.params.id, req.body);

    if (!p)
      return res.status(404).json({ erro: 'Pizza não encontrada' });

    res.json(p);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Deleta pizza
router.delete('/pizzas/:id', auth, async (req, res) => {
  try {
    const ok = await Pizza.delete(req.params.id);

    if (!ok)
      return res.status(404).json({ erro: 'Pizza não encontrada' });

    res.json({ mensagem: 'Pizza deletada' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});


// ========================== CLIENTES ==========================

// Lista clientes (com busca opcional)
router.get('/clientes', auth, async (req, res) => {
  try {
    res.json(await Cliente.findAll(req.query.busca));
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Busca cliente por ID
router.get('/clientes/:id', auth, async (req, res) => {
  try {
    const c = await Cliente.findById(req.params.id);

    if (!c)
      return res.status(404).json({ erro: 'Cliente não encontrado' });

    res.json(c);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Cria cliente
router.post('/clientes', auth, async (req, res) => {
  try {
    if (!req.body.nome || !req.body.telefone)
      return res.status(400).json({ erro: 'Nome e telefone são obrigatórios' });

    res.status(201).json(await Cliente.create(req.body));
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Atualiza cliente
router.put('/clientes/:id', auth, async (req, res) => {
  try {
    const c = await Cliente.update(req.params.id, req.body);

    if (!c)
      return res.status(404).json({ erro: 'Cliente não encontrado' });

    res.json(c);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Deleta cliente
router.delete('/clientes/:id', auth, async (req, res) => {
  try {
    const ok = await Cliente.delete(req.params.id);

    if (!ok)
      return res.status(404).json({ erro: 'Cliente não encontrado' });

    res.json({ mensagem: 'Cliente deletado' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});


// ========================== PEDIDOS ==========================

// Lista pedidos (pode filtrar por garçom)
router.get('/pedidos', auth, async (req, res) => {
  try {
    const filtros = {};

    // Se vier query ?garcom=ID
    if (req.query.garcom)
      filtros.garcomId = req.query.garcom;

    res.json(await Pedido.findAll(filtros));
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Busca pedido por ID
router.get('/pedidos/:id', auth, async (req, res) => {
  try {
    const p = await Pedido.findById(req.params.id);

    if (!p)
      return res.status(404).json({ erro: 'Pedido não encontrado' });

    res.json(p);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Cria pedido
router.post('/pedidos', auth, async (req, res) => {
  try {
    const { cliente, itens, formaPagamento } = req.body;

    // Validação
    if (!cliente || !itens?.length || !formaPagamento)
      return res.status(400).json({ erro: 'cliente, itens e formaPagamento são obrigatórios' });

    // Cria pedido
    const novo = await Pedido.create({
      clienteId: cliente,
      itens,
      taxaEntrega: req.body.taxaEntrega,
      formaPagamento,
      troco: req.body.troco,
      observacoes: req.body.observacoes,
      mesa: req.body.mesa,
      origem: req.body.origem,
      garcomId: req.body.garcom || req.usuario?.id,
    });

    res.status(201).json(novo);

  } catch (e) {
    res.status(400).json({ erro: e.message });
  }
});

// Atualiza status do pedido
router.patch('/pedidos/:id/status', auth, async (req, res) => {
  try {
    // Status permitidos
    const validos = ['recebido','em_preparo','saiu_entrega','entregue','cancelado'];

    // Validação
    if (!validos.includes(req.body.status))
      return res.status(400).json({ erro: 'Status inválido' });

    const p = await Pedido.updateStatus(req.params.id, req.body.status);

    if (!p)
      return res.status(404).json({ erro: 'Pedido não encontrado' });

    res.json(p);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Deleta pedido
router.delete('/pedidos/:id', auth, async (req, res) => {
  try {
    const ok = await Pedido.delete(req.params.id);

    if (!ok)
      return res.status(404).json({ erro: 'Pedido não encontrado' });

    res.json({ mensagem: 'Pedido deletado' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});


// ========================== USUÁRIOS (ADMIN) ==========================

// Lista usuários (somente admin)
router.get('/usuarios', auth, async (req, res) => {
  try {
    if (req.usuario.perfil !== 'Administrador')
      return res.status(403).json({ erro: 'Acesso restrito a Administradores' });

    res.json(await Usuario.findAll());
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Cria usuário (admin)
router.post('/usuarios', auth, async (req, res) => {
  try {
    if (req.usuario.perfil !== 'Administrador')
      return res.status(403).json({ erro: 'Acesso restrito a Administradores' });

    const { nome, email, senha, perfil } = req.body;

    if (!nome || !email || !senha)
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });

    res.status(201).json(await Usuario.create({ nome, email, senha, perfil }));

  } catch (e) {
    if (e.message?.includes('UNIQUE'))
      return res.status(400).json({ erro: 'E-mail já cadastrado' });

    res.status(500).json({ erro: e.message });
  }
});

// Atualiza usuário
router.put('/usuarios/:id', auth, async (req, res) => {
  try {
    if (req.usuario.perfil !== 'Administrador')
      return res.status(403).json({ erro: 'Acesso restrito a Administradores' });

    const u = await Usuario.update(req.params.id, req.body);

    if (!u)
      return res.status(404).json({ erro: 'Usuário não encontrado' });

    res.json(u);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Deleta usuário
router.delete('/usuarios/:id', auth, async (req, res) => {
  try {
    if (req.usuario.perfil !== 'Administrador')
      return res.status(403).json({ erro: 'Acesso restrito a Administradores' });

    const ok = await Usuario.delete(req.params.id);

    if (!ok)
      return res.status(404).json({ erro: 'Usuário não encontrado' });

    res.json({ mensagem: 'Usuário deletado' });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// Exporta as rotas
module.exports = router;