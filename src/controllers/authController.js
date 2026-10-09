const db = require('../database/database');

// Gerente responsável pelo CADASTRO
exports.registrar = (req, res) => {
    // Pega os dados que vieram do frontend
    const { nome, email, senha } = req.body;

    // Verifica se o usuário preencheu tudo
    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: 'Por favor, preencha todos os campos!' });
    }

    // Tenta salvar no banco de dados
    const sql = `INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)`;
    db.run(sql, [nome, email, senha], function(err) {
        if (err) {
            // Se der erro (ex: email já cadastrado)
            return res.status(400).json({ erro: 'Erro ao cadastrar. Este email já existe.' });
        }
        // Se deu certo, responde com sucesso e o ID do novo usuário
        res.status(201).json({ 
            mensagem: 'Usuário cadastrado com sucesso!',
            usuarioId: this.lastID
        });
    });
};

// Gerente responsável pelo LOGIN
exports.login = (req, res) => {
    const { email, senha } = req.body;

    // Procura o usuário no banco
    const sql = `SELECT * FROM usuarios WHERE email = ? AND senha = ?`;
    db.get(sql, [email, senha], (err, usuario) => {
        if (err) {
            return res.status(500).json({ erro: 'Erro interno no servidor' });
        }
        if (!usuario) {
            return res.status(401).json({ erro: 'Email ou senha incorretos!' });
        }

        // Se achou, devolve os dados do usuário (MVP: sem tokens complexos por causa do prazo)
        res.json({
            mensagem: 'Login realizado com sucesso!',
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                avatar: usuario.avatar,
                banner: usuario.banner,
                bio: usuario.bio,
                specialties: usuario.specialties
            }
        });
    });
};