const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('cuidadora.db');

app.use(express.json());

// --- INICIALIZAÇÃO DO BANCO ---
db.exec(`
  CREATE TABLE IF NOT EXISTS pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    observacoes_criticas TEXT
  );

  CREATE TABLE IF NOT EXISTS atendimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER,
    tipo TEXT NOT NULL, 
    descricao TEXT NOT NULL,
    data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
  );
`);

// --- ROTAS PARA PACIENTES ---

// Cadastrar novo paciente
app.post('/pacientes', (req, res) => {
  const { nome, observacoes_criticas } = req.body;
  const insert = db.prepare('INSERT INTO pacientes (nome, observacoes_criticas) VALUES (?, ?)');
  const info = insert.run(nome, observacoes_criticas);
  res.status(201).json({ id: info.lastInsertRowid, status: "Paciente cadastrado" });
});

// Listar todos os pacientes ativos
app.get('/pacientes', (req, res) => {
  const pacientes = db.prepare('SELECT * FROM pacientes').all();
  res.json(pacientes);
});

// --- ROTAS PARA ATENDIMENTOS (DIÁRIO DE BORDO) ---

// Registrar uma ação de cuidado
app.post('/atendimentos', (req, res) => {
  const { paciente_id, tipo, descricao } = req.body;
  const insert = db.prepare('INSERT INTO atendimentos (paciente_id, tipo, descricao) VALUES (?, ?, ?)');
  const info = insert.run(paciente_id, tipo, descricao);
  res.status(201).json({ id: info.lastInsertRowid, status: "Registro salvo com sucesso" });
});

// Ver histórico de um paciente (O que ajuda a responder os familiares)
app.get('/pacientes/:id/historico', (req, res) => {
  const { id } = req.params;
  
  const historico = db.prepare(`
    SELECT a.tipo, a.descricao, a.data_registro 
    FROM atendimentos a 
    WHERE a.paciente_id = ? 
    ORDER BY a.data_registro DESC
  `).all(id);

  const paciente = db.prepare('SELECT nome FROM pacientes WHERE id = ?').get(id);

  if (!paciente) return res.status(404).json({ erro: "Paciente não encontrado" });

  res.json({
    paciente: paciente.nome,
    relatorio: historico
  });
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Sistema de cuidadores de idosos rodando na porta http://localhost:${PORT}`);
});