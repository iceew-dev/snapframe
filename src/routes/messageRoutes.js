const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.post('/', messageController.enviarMensagem);
router.get('/:userId', messageController.buscarConversas);

module.exports = router;