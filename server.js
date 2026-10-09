const express = require('express');
const cors = require('cors');
const db = require('./src/database/database.js');
const authRoutes = require('./src/routes/authRoutes');
// Inicializa o aplicativo
const app = express();

// Configura os 'Inspetores' globais
app.use(cors()); // Permite que o frontend converse com o backend
app.use(express.json()); // Permite que o servidor entenda dados no formato JSON

// Uma rota de teste (A nossa Recepcionista dizendo "Olá")
app.get('/api/status', (req, res) => {
    res.json({ mensagem: "Servidor do Snap Frame rodando com sucesso!" });
});

app.use('/api/auth', authRoutes);

const workRoutes = require('./src/routes/workRoutes');
app.use('/api/works', workRoutes);

// Isso permite que o frontend acesse as imagens na pasta uploads pela URL (Ex: localhost:3000/uploads/foto.webp)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Diz para o servidor entregar os arquivos da pasta frontend
app.use(express.static(path.join(__dirname, 'frontend'))); // <-- ADICIONE ESTA LINHA[cite: 2]

const messageRoutes = require('./src/routes/messageRoutes');
app.use('/api/messages', messageRoutes);

// Liga o interruptor na porta 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
