require('dotenv').config();
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET_KEY || 'IXA-SECRET-123';

// Все 50 ключей (замените своими при необходимости)
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

// Хранилище активаций
const activatedKeys = new Map();

// Middleware
app.use(express.json());

// Защита от "засыпания"
setInterval(() => {
  console.log('[Keep-Alive] Pinging...');
  fetch(`https://${process.env.RENDER_INSTANCE_NAME || 'ixa-key-server'}.onrender.com/ping`)
    .catch(e => console.error('Ping error:', e));
}, 240000); // Каждые 4 минуты

// Роуты
app.get('/ping', (req, res) => res.send('pong'));

app.post('/check', (req, res) => {
  try {
    const { key, userId } = req.body;

    // Валидация
    if (!key || !userId || typeof userId !== 'number') {
      return res.status(400).json({ valid: false, error: "Неверные данные" });
    }

    // Проверка ключа
    if (!VALID_KEYS.has(key)) {
      return res.json({ valid: false, error: "Неверный ключ" });
    }

    // Проверка активации
    if (activatedKeys.has(key)) {
      const keyData = activatedKeys.get(key);
      if (keyData.userId === userId) {
        return res.json({ valid: true });
      }
      return res.json({ 
        valid: false, 
        error: `Ключ уже использован игроком #${keyData.userId}`
      });
    }

    // Активация
    activatedKeys.set(key, {
      userId,
      activated: new Date().toISOString(),
      expires: new Date(Date.now() + 604800000).toISOString() // 7 дней
    });

    res.json({ valid: true });

  } catch (err) {
    console.error("Ошибка сервера:", err);
    res.status(500).json({ error: "Внутренняя ошибка" });
  }
});

// Запуск
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Доступно ключей: ${VALID_KEYS.size}`);
});
