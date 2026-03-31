// Importa a biblioteca jsonwebtoken para trabalhar com JWT (tokens de autenticação)
const jwt = require('jsonwebtoken');

// Função middleware de autenticação (usada no Express)
function autenticar(req, res, next) {
  // Pega o header Authorization da requisição
  const authHeader = req.headers['authorization'];

  // Extrai o token (espera formato: "Bearer TOKEN")
  const token      = authHeader && authHeader.split(' ')[1];

  // Se não existir token, retorna erro 401 (não autorizado)
  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido. Faça login.' });
  }

  try {
    // Verifica e decodifica o token usando a chave secreta
    const payload  = jwt.verify(token, process.env.JWT_SECRET);

    // Salva os dados do usuário no objeto req para uso posterior
    req.usuario    = payload;

    // Continua para a próxima função (rota ou middleware)
    next();
  } catch (erro) {
    // Se o token for inválido ou expirado, retorna erro 401
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

// Exporta a função para ser usada em outras partes do projeto
module.exports = autenticar;