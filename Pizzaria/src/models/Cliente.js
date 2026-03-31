// ============================================================
// Cliente.js — Model de Cliente (sql.js)
// ============================================================

// Importa funções auxiliares do banco SQLite
const { ready, query, run, get } = require('../database/sqlite');

// Função para formatar o objeto retornado do banco
function formatarCliente(row) {
  if (!row) return null; // Se não existir resultado, retorna null

  return {
    _id:        row.id, // ID duplicado (compatibilidade com alguns padrões)
    id:         row.id,
    nome:       row.nome,
    telefone:   row.telefone,
    endereco:   JSON.parse(row.endereco || '{}'), // Converte JSON string para objeto
    observacoes: row.observacoes,
    ativo:      row.ativo === 1, // Converte 1/0 para true/false
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
  };
}

// Objeto que representa o model Cliente
const Cliente = {

  // Busca todos os clientes (com opção de filtro por nome/telefone)
  async findAll(busca = '') {
    await ready; // Aguarda o banco estar pronto
    let rows;

    if (busca) {
      // Se houver termo de busca, usa LIKE no SQL
      const t = `%${busca}%`;
      rows = query(
        'SELECT * FROM clientes WHERE ativo = 1 AND (nome LIKE ? OR telefone LIKE ?) ORDER BY nome',
        [t, t]
      );
    } else {
      // Se não houver busca, retorna todos os clientes ativos
      rows = query('SELECT * FROM clientes WHERE ativo = 1 ORDER BY nome');
    }

    // Formata cada resultado antes de retornar
    return rows.map(formatarCliente);
  },

  // Busca um cliente pelo ID
  async findById(id) {
    await ready;
    return formatarCliente(get('SELECT * FROM clientes WHERE id = ?', [id]));
  },

  // Cria um novo cliente
  async create({ nome, telefone, endereco = {}, observacoes = '' }) {
    await ready;

    // Executa o INSERT no banco
    const info = run(
      'INSERT INTO clientes (nome, telefone, endereco, observacoes) VALUES (?, ?, ?, ?)',
      [nome.trim(), telefone.trim(), JSON.stringify(endereco), observacoes]
    );

    // Retorna o cliente recém-criado
    return this.findById(info.lastInsertRowid);
  },

  // Atualiza um cliente existente
  async update(id, { nome, telefone, endereco, observacoes, ativo }) {
    await ready;

    // Busca o cliente atual no banco
    const atual = get('SELECT * FROM clientes WHERE id = ?', [id]);
    if (!atual) return null; // Se não existir, retorna null

    // Endereço atual (convertido de JSON)
    const endAtual = JSON.parse(atual.endereco || '{}');

    // Mescla endereço antigo com o novo (se houver)
    const endFinal = endereco ? { ...endAtual, ...endereco } : endAtual;

    // Executa o UPDATE no banco
    run(`
      UPDATE clientes SET
        nome        = ?,
        telefone    = ?,
        endereco    = ?,
        observacoes = ?,
        ativo       = ?,
        updated_at  = datetime('now')
      WHERE id = ?
    `, [
      nome        ?? atual.nome, // Mantém valor antigo se não for enviado
      telefone    ?? atual.telefone,
      JSON.stringify(endFinal),
      observacoes ?? atual.observacoes,
      ativo !== undefined ? (ativo ? 1 : 0) : atual.ativo, // Converte boolean para 1/0
      id
    ]);

    // Retorna o cliente atualizado
    return this.findById(id);
  },

  // Remove um cliente pelo ID
  async delete(id) {
    await ready;

    // Executa o DELETE
    const info = run('DELETE FROM clientes WHERE id = ?', [id]);

    // Retorna true se algo foi deletado
    return info.changes > 0;
  },
};

// Exporta o model
module.exports = Cliente;