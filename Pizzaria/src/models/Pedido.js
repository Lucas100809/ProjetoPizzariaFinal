// ============================================================
// Pedido.js — Model de Pedido (sql.js)
// ============================================================

// Importa funções do banco
const { ready, query, run, get } = require('../database/sqlite');

// Query base com JOIN de cliente
const SELECT_PEDIDO = `
  SELECT
    p.*,
    c.nome     AS cliente_nome,
    c.telefone AS cliente_telefone
  FROM pedidos p
  LEFT JOIN clientes c ON c.id = p.cliente_id
`;

// Função que transforma dados do banco em objeto JS
function formatarPedido(row, itens = []) {
  if (!row) return null;

  return {
    _id:           row.id,
    id:            row.id,
    numeroPedido:  row.numero_pedido,

    cliente: {
      _id:      row.cliente_id,
      id:       row.cliente_id,
      nome:     row.cliente_nome,
      telefone: row.cliente_telefone,
    },

    // Lista de itens do pedido
    itens: itens.map(it => ({
      _id:           it.id,
      pizza:         it.pizza_id,
      nomePizza:     it.nome_pizza,
      tamanho:       it.tamanho,
      quantidade:    it.quantidade,
      precoUnitario: it.preco_unitario,
      subtotal:      it.subtotal,
    })),

    subtotal:       row.subtotal,
    taxaEntrega:    row.taxa_entrega,
    total:          row.total,
    formaPagamento: row.forma_pagamento,
    troco:          row.troco,
    status:         row.status,
    observacoes:    row.observacoes,
    mesa:           row.mesa,
    origem:         row.origem,
    garcom:         row.garcom_id,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}

const Pedido = {

  // ================= LISTAR PEDIDOS =================
  async findAll({ garcomId } = {}) {
    await ready;

    let rows;

    // Filtra por garçom se necessário
    if (garcomId) {
      rows = query(
        `${SELECT_PEDIDO} WHERE p.garcom_id = ? ORDER BY p.created_at DESC`,
        [garcomId]
      );
    } else {
      rows = query(`${SELECT_PEDIDO} ORDER BY p.created_at DESC`);
    }

    // Para cada pedido, busca seus itens
    return rows.map(row => {
      const itens = query(
        'SELECT * FROM itens_pedido WHERE pedido_id = ?',
        [row.id]
      );
      return formatarPedido(row, itens);
    });
  },

  // ================= BUSCAR POR ID =================
  async findById(id) {
    await ready;

    const row = get(`${SELECT_PEDIDO} WHERE p.id = ?`, [id]);
    if (!row) return null;

    const itens = query(
      'SELECT * FROM itens_pedido WHERE pedido_id = ?',
      [id]
    );

    return formatarPedido(row, itens);
  },

  // ================= CRIAR PEDIDO =================
  async create({
    clienteId,
    itens,
    taxaEntrega = 0,
    formaPagamento,
    troco = 0,
    observacoes = '',
    mesa = null,
    origem = 'balcao',
    garcomId = null
  }) {
    await ready;

    const Pizza = require('./Pizza');

    let subtotal = 0;
    const itensProcessados = [];

    // Processa cada item do pedido
    for (const item of itens) {
      const pizza = await Pizza.findById(item.pizza);

      if (!pizza) {
        throw new Error(`Pizza ID ${item.pizza} não encontrada`);
      }

      const preco   = pizza.precos[item.tamanho] || 0;
      const subItem = preco * item.quantidade;

      subtotal += subItem;

      itensProcessados.push({
        pizzaId:       pizza.id,
        nomePizza:     pizza.nome,
        tamanho:       item.tamanho,
        quantidade:    item.quantidade,
        precoUnitario: preco,
        subtotal:      subItem,
      });
    }

    const total = subtotal + (taxaEntrega || 0);

    // Gera número do pedido
    const contagem     = get('SELECT COUNT(*) as total FROM pedidos');
    const numeroPedido = (contagem?.total || 0) + 1;

    // Insere pedido
    const infoPedido = run(`
      INSERT INTO pedidos
        (numero_pedido, cliente_id, subtotal, taxa_entrega, total,
         forma_pagamento, troco, observacoes, mesa, origem, garcom_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      numeroPedido,
      clienteId,
      subtotal,
      taxaEntrega || 0,
      total,
      formaPagamento,
      troco || 0,
      observacoes,
      mesa,
      origem,
      garcomId
    ]);

    const pedidoId = infoPedido.lastInsertRowid;

    // Insere itens do pedido
    for (const it of itensProcessados) {
      run(`
        INSERT INTO itens_pedido
          (pedido_id, pizza_id, nome_pizza, tamanho, quantidade, preco_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        pedidoId,
        it.pizzaId,
        it.nomePizza,
        it.tamanho,
        it.quantidade,
        it.precoUnitario,
        it.subtotal
      ]);
    }

    return this.findById(pedidoId);
  },

  // ================= ATUALIZAR STATUS =================
  async updateStatus(id, status) {
    await ready;

    const info = run(
      "UPDATE pedidos SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, id]
    );

    return info.changes > 0 ? this.findById(id) : null;
  },

  // ================= DELETAR =================
  async delete(id) {
    await ready;

    // Deleta itens primeiro
    run('DELETE FROM itens_pedido WHERE pedido_id = ?', [id]);

    const info = run('DELETE FROM pedidos WHERE id = ?', [id]);

    return info.changes > 0;
  },
};

module.exports = Pedido;