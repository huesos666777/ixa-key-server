// server.js - Полный сервер для проверки ключей
require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

// Инициализация
const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET_KEY || 'DEFAULT_SECRET_CHANGE_ME!';

// Все 50 ключей (полный список)
const VALID_KEYS = new Set([
  "IXA-57931-KEY", "IXA-68245-KEY", "IXA-79356-KEY", "IXA-86427-KEY", "IXA-92538-KEY",
  "IXA-13649-KEY", "IXA-24750-KEY", "IXA-35861-KEY", "IXA-46972-KEY", "IXA-57083-KEY",
  "IXA-68194-KEY", "IXA-79205-KEY", "IXA-80316-KEY", "IXA-91427-KEY", "IXA-12538-KEY",
  "IXA-23649-KEY", "IXA-34750-KEY", "IXA-45861-KEY", "IXA-56972-KEY", "IXA-67083-KEY",
  "IXA-78194-KEY", "IXA-89205-KEY", "IXA-90316-KEY", "IXA-01427-KEY", "IXA-23538-KEY",
  "IXA-34649-KEY", "IXA-45750-KEY", "IXA-56861-KEY", "IXA-67972-KEY", "IXA-78083-KEY",
  "IXA-89194-KEY", "IXA-90205-KEY", "IXA-01316-KEY", "IXA-12427-KEY", "IXA-33538-KEY",
  "IXA-44649-KEY", "IXA-55750-KEY", "IXA-66861-KEY", "IXA-77972-KEY", "IXA-88083-KEY",
  "IXA-99194-KEY", "IXA-00205-KEY", "IXA-11316-KEY", "IXA-22427-KEY", "IXA-43538-KEY",
  "IXA-54649-KEY", "IXA-65750-KEY", "IXA-76861-KEY", "IXA-87972-KEY", "IXA-98083-KEY"
]);

// База активированных ключей (в памяти)
const activatedKeys = {};

// Защита от DDoS
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 30 // 30 запросов с 1 IP
});

// Middleware
app.use(express.json());
app.use(limiter);

// Проверка аутентификации
const authenticate = (req, res, next) => {
  if (req.headers['x-auth'] !== SECRET) {
    return res.status(403).json({ error: "Доступ запрещен" });
  }
  next();
};

// Роут для проверки ключа
app.post('/check', authenticate, (req, res) => {
  try {
    const { key, hwid } = req.body;

    // 1. Проверка существования ключа
    if (!VALID_KEYS.has(key)) {
      return res.json({ valid: false, error: "Неверный лицензионный ключ" });
    }

    // 2. Проверка активации
    if (activatedKeys[key]) {
      if (activatedKeys[key].hwid !== hwid) {
        return res.json({ 
          valid: false, 
          error: "Ключ уже активирован на другом устройстве" 
        });
      }
      return res.json({ 
        valid: true, 
        expires: activatedKeys[key].expires,
        daysLeft: Math.ceil((activatedKeys[key].expires - Date.now()) / (1000 * 60 * 60 * 24))
      });
    }

    // 3. Активация нового ключа
    activatedKeys[key] = {
      hwid: hwid,
      activated: Date.now(),
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 дней
    };

    res.json({ 
      valid: true, 
      expires: activatedKeys[key].expires,
      daysLeft: 7
    });

  } catch (error) {
    console.error("Ошибка:", error);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// Пробуждение сервера (для Free-тарифа)
setInterval(() => {
  console.log('[Keep-Alive] Pinging server...');
  fetch(`https://${process.env.RENDER_INSTANCE_NAME}.onrender.com/check`, {
    method: 'POST',
    headers: { 
      'x-auth': SECRET,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ key: "IXA-57931-KEY", hwid: "keepalive" })
  }).catch(console.error);
}, 4 * 60 * 1000); // Каждые 4 минуты

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Секретный ключ: ${SECRET.substring(0, 3)}...${SECRET.substring(SECRET.length - 3)}`);
});
