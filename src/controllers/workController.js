const db = require('../database/database');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Garante que a pasta 'uploads' exista no projeto
const dir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

// Publicar um novo trabalho
exports.publicarTrabalho = async (req, res) => {
    const { titulo, categoria, cidade, estado, usuario_id } = req.body;
    
    // Verifica se veio um arquivo de imagem
    if (!req.file) {
        return res.status(400).json({ erro: 'Nenhuma imagem enviada!' });
    }

    try {
        // Cria um nome único para a imagem usando a data/hora atual
        const nomeImagem = Date.now() + '.webp';
        const caminhoImagem = path.join(dir, nomeImagem);

        // A MÁGICA DO SHARP AQUI:
        await sharp(req.file.buffer)
            .resize({ width: 900, withoutEnlargement: true }) // Redimensiona sem esticar
            .webp({ quality: 80 }) // Converte para WebP mantendo 80% de qualidade
            .toFile(caminhoImagem); // Salva o arquivo levinho na pasta uploads

        // URL que o frontend vai usar para mostrar a imagem
        const imagem_url = '/uploads/' + nomeImagem;

        // Salva os dados no banco
        const sql = `INSERT INTO trabalhos (titulo, imagem_url, categoria, cidade, estado, usuario_id) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(sql, [titulo, imagem_url, categoria, cidade, estado, usuario_id], function(err) {
            if (err) {
                return res.status(500).json({ erro: 'Erro ao salvar no banco de dados.' });
            }
            res.status(201).json({ mensagem: 'Trabalho publicado com sucesso!', trabalhoId: this.lastID });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao processar a imagem.' });
    }
};

// Listar os trabalhos para o Feed
exports.listarTrabalhos = (req, res) => {
    // Busca os trabalhos e junta com o nome do dono
    const sql = `
        SELECT t.*, u.nome as owner_display_name, u.role as owner_role_name 
        FROM trabalhos t 
        JOIN usuarios u ON t.usuario_id = u.id
        ORDER BY t.id DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ erro: 'Erro ao buscar trabalhos.' });
        }
        res.json(rows); // Devolve a lista para o frontend!
    });
};