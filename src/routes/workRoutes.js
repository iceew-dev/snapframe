const express = require('express');
const router = express.Router();
const workController = require('../controllers/workController');
const upload = require('../middlewares/upload');

// Quando alguém pedir a lista de trabalhos (GET)
router.get('/', workController.listarTrabalhos);

// Quando alguém for publicar um trabalho (POST)
// Note que o inspetor "upload.single('imagem')" intercepta o arquivo antes de chegar no controller!
router.post('/', upload.single('imagem'), workController.publicarTrabalho);

module.exports = router;