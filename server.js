// Основные библиотеки
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

// Настройки
const app = express();
const SECRET = process.env.SECRET_KEY || 'DEFAULT_SECRET_CHANGE_ME';
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
  "IXA-57931-KEY", "IXA-68245-KEY", "IXA-79356-KEY", 
  "IXA-86427-KEY", "IXA-92538-KEY", "IXA-13649-KEY",
  // ... Вставьте ВСЕ ваши 50 ключей ...
  "IXA-98083-KEY" // Последний ключ
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
