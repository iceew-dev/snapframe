const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configurações do teste
const PASTA_IMAGENS = path.join(__dirname, 'test_images');
const URL_UPLOAD = 'http://localhost:3000/api/works';
const USUARIO_ID = 1; // Assumindo que sua conta de teste é a número 1 no banco
const QUANTIDADE_DISPAROS = 50; // Quantas imagens você quer enviar

async function iniciarBombardeio() {
    const arquivos = fs.readdirSync(PASTA_IMAGENS).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
    
    if (arquivos.length === 0) {
        return console.log('❌ Nenhuma imagem encontrada na pasta test_images!');
    }

    console.log(`🔥 Iniciando bombardeio de ${QUANTIDADE_DISPAROS} uploads...`);

    for (let i = 1; i <= QUANTIDADE_DISPAROS; i++) {
        // Pega uma imagem aleatória da pasta
        const arquivoAleatorio = arquivos[Math.floor(Math.random() * arquivos.length)];
        const caminhoArquivo = path.join(PASTA_IMAGENS, arquivoAleatorio);

        // Monta o pacote simulando o seu frontend
        const form = new FormData();
        form.append('imagem', fs.createReadStream(caminhoArquivo));
        form.append('titulo', `Teste de Estresse ${i}`);
        form.append('categoria', 'Fotografia');
        form.append('cidade', 'Fortaleza');
        form.append('estado', 'CE');
        form.append('usuario_id', USUARIO_ID);

        try {
            // Dispara para o backend
            await axios.post(URL_UPLOAD, form, { headers: form.getHeaders() });
            console.log(`✅ Upload ${i} processado pelo Sharp e salvo no SQLite.`);
        } catch (erro) {
            console.error(`❌ Erro no upload ${i}:`, erro.response ? erro.response.data : erro.message);
        }
    }
    
    console.log('🚀 Bombardeio concluído! Abra o frontend e atualize a página.');
}

iniciarBombardeio();