require('dotenv').config();
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET_KEY || 'IXA-SECRET-123';
const GAMEPASS_ID = process.env.GAMEPASS_ID || 1350640366; // Замените на ваш ID

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
    if (req.headers['x-auth'] !== SECRET) {
      return res.status(401).json({ error: "Invalid auth key" });
    }

    const { userId } = req.body;
    if (!userId || typeof userId !== 'number') {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Запрос к Roblox API
    const ROBLOX_API_URL = `https://inventory.roblox.com/v1/users/${userId}/items/GamePass/${GAMEPASS_ID}`;
    const apiResponse = await fetch(ROBLOX_API_URL);
    
    if (!apiResponse.ok) {
      throw new Error(`Roblox API error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    const hasPremium = data.data?.length > 0;

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

// Keep-Alive для Render
app.get('/ping', (req, res) => res.send('pong'));

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`GamePass ID: ${GAMEPASS_ID}`);
  console.log(`Secret key: ${SECRET}`);
});
