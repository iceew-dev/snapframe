const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const db = require('../database/database'); // <-- ADICIONE ESTA LINHA

router.post('/registrar', authController.registrar);
router.post('/login', authController.login);

// Rota para atualizar o perfil no SQLite
router.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    const { avatar, banner, bio, specialties } = req.body;

    const sql = `UPDATE usuarios SET avatar = ?, banner = ?, bio = ?, specialties = ? WHERE id = ?`;
    
    db.run(sql, [avatar, banner, bio, specialties, userId], function(err) {
        if (err) {
            console.error("Erro no SQLite:", err);
            return res.status(500).json({ erro: "Erro ao atualizar perfil no banco." });
        }
        res.json({ mensagem: "Perfil atualizado com sucesso!" });
    });
});

module.exports = router;