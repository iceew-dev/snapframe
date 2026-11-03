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
    const usuarioId = req.query.usuario_id || 0;

    const sql = `
        SELECT
            t.id,
            t.titulo,
            t.imagem_url,
            t.categoria,
            t.cidade,
            t.estado,
            t.usuario_id,

            u.nome AS owner_display_name,
            u.role AS owner_role_name,

            (
                SELECT COUNT(*)
                FROM curtidas c
                WHERE c.trabalho_id = t.id
            ) AS likes,

            (
                SELECT COUNT(*)
                FROM curtidas c2
                WHERE c2.trabalho_id = t.id
                AND c2.usuario_id = ?
            ) AS curtido

        FROM trabalhos t

        JOIN usuarios u
            ON t.usuario_id = u.id

        ORDER BY t.id DESC
    `;

    db.all(sql, [usuarioId], (err, rows) => {

        if (err) {
            console.error("Erro ao listar trabalhos:", err);

            return res.status(500).json({
                erro: "Erro ao buscar trabalhos."
            });
        }

        res.json(rows);
    });
};

// Curtir ou remover curtida de um trabalho
exports.toggleLike = (req, res) => {
    const trabalhoId = req.params.id;
    const { usuario_id } = req.body;

    if (!usuario_id) {
        return res.status(400).json({
            erro: 'Usuário não informado.'
        });
    }

    // Primeiro verifica se esse usuário já curtiu esse trabalho
    const verificarLike = `
        SELECT * FROM curtidas
        WHERE usuario_id = ? AND trabalho_id = ?
    `;

    db.get(verificarLike, [usuario_id, trabalhoId], (err, curtida) => {
        if (err) {
            console.error(err);

            return res.status(500).json({
                erro: 'Erro ao verificar curtida.'
            });
        }

        // SE JÁ CURTIU -> remove a curtida
        if (curtida) {
            const removerLike = `
                DELETE FROM curtidas
                WHERE usuario_id = ? AND trabalho_id = ?
            `;

            db.run(removerLike, [usuario_id, trabalhoId], function (err) {
                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        erro: 'Erro ao remover curtida.'
                    });
                }

                atualizarContador(false);
            });

        } else {

            // SE NÃO CURTIU -> adiciona a curtida
            const adicionarLike = `
                INSERT INTO curtidas (usuario_id, trabalho_id)
                VALUES (?, ?)
            `;

            db.run(adicionarLike, [usuario_id, trabalhoId], function (err) {
                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        erro: 'Erro ao adicionar curtida.'
                    });
                }

                atualizarContador(true);
            });
        }
    });

    function atualizarContador(curtido) {

        const contarLikes = `
            SELECT COUNT(*) AS total
            FROM curtidas
            WHERE trabalho_id = ?
        `;

        db.get(contarLikes, [trabalhoId], (err, resultado) => {

            if (err) {
                console.error(err);

                return res.status(500).json({
                    erro: 'Erro ao contar curtidas.'
                });
            }

            const totalLikes = resultado.total;

            // Mantém também a coluna likes da tabela trabalhos atualizada
            db.run(
                `UPDATE trabalhos SET likes = ? WHERE id = ?`,
                [totalLikes, trabalhoId]
            );

            res.json({
                curtido: curtido,
                likes: totalLikes
            });
        });
    }
};

// Excluir trabalho
exports.excluirTrabalho = (req, res) => {
    const trabalhoId = req.params.id;
    const { usuario_id } = req.body;

    if (!usuario_id) {
        return res.status(400).json({
            erro: 'Usuário não informado.'
        });
    }

    // Primeiro busca o trabalho para verificar o dono
    const buscarSql = `
        SELECT *
        FROM trabalhos
        WHERE id = ?
    `;

    db.get(buscarSql, [trabalhoId], (err, trabalho) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                erro: 'Erro ao buscar trabalho.'
            });
        }

        if (!trabalho) {
            return res.status(404).json({
                erro: 'Trabalho não encontrado.'
            });
        }

        // Segurança: somente o dono pode excluir
        if (Number(trabalho.usuario_id) !== Number(usuario_id)) {
            return res.status(403).json({
                erro: 'Você não tem permissão para excluir este trabalho.'
            });
        }

        // Primeiro remove as curtidas relacionadas
        db.run(
            `DELETE FROM curtidas WHERE trabalho_id = ?`,
            [trabalhoId],
            function (err) {

                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        erro: 'Erro ao remover curtidas do trabalho.'
                    });
                }

                // Depois remove o trabalho
                db.run(
                    `DELETE FROM trabalhos WHERE id = ?`,
                    [trabalhoId],
                    function (err) {

                        if (err) {
                            console.error(err);

                            return res.status(500).json({
                                erro: 'Erro ao excluir trabalho.'
                            });
                        }

                        // Tenta remover também a imagem física
                        if (trabalho.imagem_url) {

                            const nomeArquivo =
                                path.basename(trabalho.imagem_url);

                            const caminhoImagem =
                                path.join(dir, nomeArquivo);

                            if (fs.existsSync(caminhoImagem)) {
                                fs.unlink(caminhoImagem, function (erroArquivo) {

                                    if (erroArquivo) {
                                        console.error(
                                            'Erro ao apagar imagem:',
                                            erroArquivo
                                        );
                                    }
                                });
                            }
                        }

                        res.json({
                            mensagem: 'Trabalho excluído com sucesso.'
                        });
                    }
                );
            }
        );
    });
};