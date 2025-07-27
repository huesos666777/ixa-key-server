const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');

// Конфигурация из файлов
const config = {
  PORT: 3000,
  SECRET_KEY: 'IXA-SECRET-123', // Замените на ваш реальный ключ
  GAMEPASS_ID: 1350640366       // Убедитесь, что это правильный ID
};

// Попытка прочитать из .env если есть
if (fs.existsSync('.env')) {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      config[key.trim()] = value.trim().replace(/['"]+/g, '');
    }
  });
}

const app = express();

// Настройки CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-auth");
  next();
});

app.use(express.json());

// Проверка GamePass
app.post('/check', async (req, res) => {
  try {
    // Проверка секретного ключа
    if (req.headers['x-auth'] !== config.SECRET_KEY) {
      return res.status(401).json({ error: "Invalid auth key" });
    }

    const { userId } = req.body;
    if (!userId || typeof userId !== 'number') {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Проверка через Roblox API
    const response = await fetch(
      `https://inventory.roblox.com/v1/users/${userId}/items/GamePass/${config.GAMEPASS_ID}/is-owned`
    );
    
    if (!response.ok) {
      throw new Error(`Roblox API error: ${response.status}`);
    }

    const data = await response.json();
    const hasPremium = data.success === true;

    res.json({
      valid: hasPremium,
      isPremium: hasPremium,
      message: hasPremium ? "Premium access granted" : "Purchase GamePass to unlock"
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Keep-Alive
app.get('/ping', (req, res) => res.send('pong'));

// Запуск сервера
app.listen(config.PORT, () => {
  console.log(`╔══════════════════════════════╗`);
  console.log(`║    IXA HUB Premium Server    ║`);
  console.log(`╠══════════════════════════════╣`);
  console.log(`║ Port: ${config.PORT}${' '.repeat(17 - config.PORT.toString().length)}║`);
  console.log(`║ GamePass ID: ${config.GAMEPASS_ID}${' '.repeat(10 - config.GAMEPASS_ID.toString().length)}║`);
  console.log(`╚══════════════════════════════╝`);
});
