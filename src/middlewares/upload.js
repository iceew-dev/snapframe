const multer = require('multer');

// Usa a memória para não salvar o arquivo pesado no disco direto.
// Vamos deixar o Sharp processar primeiro!
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

module.exports = upload;