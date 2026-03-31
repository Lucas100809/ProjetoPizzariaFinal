# 🍕 Sistema de Pizzaria

## 📌 Descrição

O **Sistema de Pizzaria** é uma aplicação web desenvolvida para gerenciar pedidos, clientes, pizzas e usuários de uma pizzaria.

O sistema permite:

* Cadastro de clientes
* Criação e controle de pedidos
* Gerenciamento de pizzas
* Controle de usuários (admin e garçom)
* Acompanhamento de status dos pedidos

A aplicação é dividida em:

* **Frontend** (interface no navegador)
* **Backend** (API com regras de negócio)
* **Banco de dados SQLite**

---

## 🚀 Tecnologias Utilizadas

* **Node.js** → ambiente de execução JavaScript
* **Express** → criação da API
* **SQLite (sql.js)** → banco de dados
* **JWT (jsonwebtoken)** → autenticação
* **bcryptjs** → criptografia de senha
* **cors** → liberação de acesso entre frontend/backend
* **dotenv** → variáveis de ambiente
* **HTML, CSS, JavaScript** → frontend

---

## ⚙️ Pré-requisitos

Antes de começar, você precisa ter instalado:

* Node.js (versão 18 ou superior)
* npm (gerenciador de pacotes)

Verifique com:

```bash
node -v
npm -v
```

---

## 📥 Instalação e Execução

### 1. Clonar o projeto

```bash
git clone https://github.com/seu-repositorio/sistema_pizzaria.git
cd sistema_pizzaria
```

---

### 2. Instalar dependências

```bash
npm install
```

---

### 3. Configurar arquivo `.env`

Crie um arquivo `.env` na raiz:

```env
PORT=3000
JWT_SECRET=segredo_super_secreto
```

---

### 4. Rodar o seed (popular banco)

```bash
node seed.js
```

---

### 5. Iniciar o servidor

```bash
node server.js
```

ou (modo desenvolvimento):

```bash
nodemon server.js
```

---

### 6. Acessar no navegador

```
http://localhost:3000
```

---

## 📁 Estrutura de Pastas

```
sistema_pizzaria/
│
├── server.js
├── package.json
├── .env
│
├── src/
│   ├── database/
│   │   └── sqlite.js
│   │
│   ├── models/
│   │   ├── Cliente.js
│   │   ├── Pedido.js
│   │   ├── Pizza.js
│   │   └── Usuario.js
│   │
│   ├── routes/
│   │   ├── clientes.js
│   │   ├── pedidos.js
│   │   ├── pizzas.js
│   │   └── auth.js
│   │
│   └── middlewares/
│       └── auth.js
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
```

---

## ⚙️ Funcionalidades

### 👤 Autenticação

* Login de usuários
* Controle por perfil (Administrador / Garçom)

---

### 🍕 Pizzas

* Criar pizza
* Editar pizza
* Listar pizzas disponíveis

---

### 👥 Clientes

* Cadastro de clientes
* Busca por nome ou telefone

---

### 📦 Pedidos

* Criar pedidos com múltiplos itens
* Calcular subtotal, taxa e total
* Atualizar status:

  * pendente
  * em preparo
  * saiu para entrega
  * entregue
  * cancelado

---

### 🪑 Mesas (Garçom)

* Controle de pedidos por mesa
* Fechamento de conta

---

## 🧪 Como Testar

1. Faça login com um usuário
2. Cadastre um cliente
3. Crie pizzas
4. Abra um pedido
5. Adicione itens
6. Atualize o status do pedido

---

## 🔐 Credenciais de Teste

```txt
Administrador:
email: admin@pizza.com
senha: 123456

Garçom:
email: garcom@pizza.com
senha: 123456
```

---

## ⚠️ Desafios Encontrados

### 🔴 1. Erro com `localStorage`

* Problema: código frontend sendo executado no Node
* Solução: separar frontend e backend corretamente

---

### 🔴 2. Problemas com async/await

* Problema: funções sem `await` no banco
* Solução: padronização do uso de `await`

---

### 🔴 3. Estrutura desorganizada

* Problema: dificuldade de entender o fluxo
* Solução: análise da arquitetura (rotas → models → banco)

---

### 🔴 4. Erros de dependências (npm audit)

* Problema: vulnerabilidades em pacotes
* Solução: atualização com `npm audit fix`

---

## 🚀 Melhorias Futuras

* Interface mais moderna (UI/UX)
* Dashboard com gráficos
* Integração com pagamento online
* Sistema de notificações em tempo real
* API REST documentada (Swagger)
* Deploy em nuvem (Vercel / Render)
* Aplicativo mobile

---

## 📌 Conclusão

O sistema demonstra uma arquitetura completa de aplicação web, integrando frontend, backend e banco de dados, com autenticação e controle de usuários.

Ele serve como base sólida para evolução e aprendizado em desenvolvimento full stack.

