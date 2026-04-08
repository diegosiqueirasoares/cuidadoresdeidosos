const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const db = new sqlite3.Database('cuidadora.db');

app.use(express.json());

// --- INICIALIZAÇÃO DO BANCO ---
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS pacientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      observacoes_criticas TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS atendimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER,
      tipo TEXT NOT NULL, 
      descricao TEXT NOT NULL,
      data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
    )
  `);
});

// --- ROTAS PARA PACIENTES ---

app.post('/pacientes', (req, res) => {
  const { nome, observacoes_criticas } = req.body;

  db.run(
    'INSERT INTO pacientes (nome, observacoes_criticas) VALUES (?, ?)',
    [nome, observacoes_criticas],
    function (err) {
      if (err) return res.status(500).json(err);

      res.status(201).json({
        id: this.lastID,
        status: "Paciente cadastrado"
      });
    }
  );
});

app.get('/pacientes', (req, res) => {
  db.all('SELECT * FROM pacientes', [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// --- ATENDIMENTOS ---

app.post('/atendimentos', (req, res) => {
  const { paciente_id, tipo, descricao } = req.body;

  db.run(
    'INSERT INTO atendimentos (paciente_id, tipo, descricao) VALUES (?, ?, ?)',
    [paciente_id, tipo, descricao],
    function (err) {
      if (err) return res.status(500).json(err);

      res.status(201).json({
        id: this.lastID,
        status: "Registro salvo com sucesso"
      });
    }
  );
});

app.get('/pacientes/:id/historico', (req, res) => {
  const { id } = req.params;

  db.get('SELECT nome FROM pacientes WHERE id = ?', [id], (err, paciente) => {
    if (err) return res.status(500).json(err);
    if (!paciente) return res.status(404).json({ erro: "Paciente não encontrado" });

    db.all(
      `SELECT tipo, descricao, data_registro 
       FROM atendimentos 
       WHERE paciente_id = ? 
       ORDER BY data_registro DESC`,
      [id],
      (err, historico) => {
        if (err) return res.status(500).json(err);

        res.json({
          paciente: paciente.nome,
          relatorio: historico
        });
      }
    );
  });
});

// --- SERVIDOR ---
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});