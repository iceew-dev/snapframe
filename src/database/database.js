const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Diz onde o arquivo do banco de dados vai ser salvo (na mesma pasta desse arquivo)
const dbPath = path.resolve(__dirname, 'snapframe.sqlite');

// Conecta ao banco de dados (se o arquivo não existir, ele cria na hora!)
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao SQLite com sucesso!');
        criarTabelas(); // Chama a função para garantir que as gavetas existam
    }
});

// Função que cria as Tabelas (Gavetas)
function criarTabelas() {
    // 1. Criando a tabela de usuários
    db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        role TEXT,
        cidade TEXT,
        estado TEXT,
        avatar TEXT,
        banner TEXT,
        bio TEXT,
        specialties TEXT
    )
`, () => {
    // Garante a criação das colunas caso o arquivo .sqlite antigo persista
    const colunas = ['avatar', 'banner', 'bio', 'specialties'];
    colunas.forEach(coluna => {
        db.run(`ALTER TABLE usuarios ADD COLUMN ${coluna} TEXT`, () => {
            // Ignora erro se a coluna já existir
        });
    });
});

    // 2. Criando a tabela de trabalhos (portfólio)
    db.run(`
        CREATE TABLE IF NOT EXISTS trabalhos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            imagem_url TEXT NOT NULL,
            categoria TEXT,
            cidade TEXT,
            estado TEXT,
            likes INTEGER DEFAULT 0,
            usuario_id INTEGER,
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
        )
    `);

    // 3. Criando a tabela de mensagens
    db.run(`
        CREATE TABLE IF NOT EXISTS mensagens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            remetente_id INTEGER NOT NULL,
            destinatario_id INTEGER NOT NULL,
            trabalho_id INTEGER,
            conteudo TEXT NOT NULL,
            data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (remetente_id) REFERENCES usuarios (id),
            FOREIGN KEY (destinatario_id) REFERENCES usuarios (id)
        )
    `);

    console.log('Tabelas de usuários, trabalhos e mensagens prontas para uso!');
}



// Exporta o banco para usarmos nos nossos "Gerentes" (Controllers)
module.exports = db;