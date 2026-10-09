const db = require('../database/database');

// Enviar uma nova mensagem
exports.enviarMensagem = (req, res) => {
    const { remetente_id, destinatario_id, trabalho_id, conteudo } = req.body;

    if (!remetente_id || !destinatario_id || !conteudo) {
        return res.status(400).json({ erro: 'Dados incompletos para enviar mensagem.' });
    }

    const sql = `INSERT INTO mensagens (remetente_id, destinatario_id, trabalho_id, conteudo) VALUES (?, ?, ?, ?)`;
    db.run(sql, [remetente_id, destinatario_id, trabalho_id, conteudo], function(err) {
        if (err) {
            console.error("Erro ao salvar mensagem:", err);
            return res.status(500).json({ erro: 'Erro ao enviar a mensagem.' });
        }
        res.status(201).json({ mensagem: 'Mensagem enviada!', mensagemId: this.lastID });
    });
};

// Buscar histórico de conversas de um usuário
exports.buscarConversas = (req, res) => {
    const usuarioId = req.params.userId;

    // Busca todas as mensagens onde o usuário é remetente ou destinatário
    const sql = `
        SELECT m.*, 
               r.nome as remetente_nome, r.avatar as remetente_avatar,
               d.nome as destinatario_nome, d.avatar as destinatario_avatar
        FROM mensagens m
        JOIN usuarios r ON m.remetente_id = r.id
        JOIN usuarios d ON m.destinatario_id = d.id
        WHERE m.remetente_id = ? OR m.destinatario_id = ?
        ORDER BY m.data_envio ASC
    `;

    db.all(sql, [usuarioId, usuarioId], (err, rows) => {
        if (err) {
            return res.status(500).json({ erro: 'Erro ao buscar conversas.' });
        }
        res.json(rows);
    });
};