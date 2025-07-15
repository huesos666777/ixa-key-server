// Основные библиотеки
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

// Настройки
const app = express();
const SECRET = process.env.SECRET_KEY || 'IXA-SECRET-123';
const PORT = process.env.PORT || 3000;

// Защита сервера
app.use(helmet());
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // Лимит запросов
}));

// Список всех ваших ключей
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

// База активированных ключей
let activatedKeys = {};

// Проверка лицензии
app.post('/check', (req, res) => {
  try {
    // Проверка секретного ключа
    if (req.headers['x-auth'] !== SECRET) {
      return res.status(403).json({ valid: false, error: "Access denied" });
    }

    const { key, hwid } = req.body;

    // Проверка валидности ключа
    if (!VALID_KEYS.has(key)) {
      return res.json({ valid: false, error: "Invalid license key" });
    }

    // Проверка активации
    if (activatedKeys[key]) {
      if (activatedKeys[key].hwid !== hwid) {
        return res.json({ valid: false, error: "Key already activated on another device" });
      }
      return res.json({ 
        valid: true, 
        expires: activatedKeys[key].expires 
      });
    }

    // Активация нового ключа
    activatedKeys[key] = {
      hwid: hwid,
      activated: Date.now(),
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 дней
    };

    res.json({ valid: true, expires: activatedKeys[key].expires });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Пробуждение сервера
setInterval(() => {
  console.log('[Keep-Alive] Server ping');
}, 5 * 60 * 1000); // Каждые 5 минут

// Запуск сервера
app.listen(PORT, () => {
  console.log(`License server started on port ${PORT}`);
});
