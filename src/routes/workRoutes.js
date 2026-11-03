const express = require('express');
const router = express.Router();
const workController = require('../controllers/workController');
const upload = require('../middlewares/upload');

router.get(
    '/',
    workController.listarTrabalhos
);

router.post(
    '/:id/like',
    workController.toggleLike
);

router.post(
    '/',
    upload.single('imagem'),
    workController.publicarTrabalho
);

router.delete(
    '/:id',
    workController.excluirTrabalho
);

module.exports = router;