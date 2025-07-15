require('dotenv').config();
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET_KEY || 'IXA-SECRET-123';

// Все ваши 50 ключей
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

// Хранилище активированных ключей
const activatedKeys = new Map();

// Keep-alive система
setInterval(() => {
  console.log('[Keep-Alive] Pinging server...');
  fetch(`https://${process.env.RENDER_INSTANCE_NAME || 'ixa-key-server'}.onrender.com/ping`)
    .catch(err => console.error('Keep-alive failed:', err));
}, 4 * 60 * 1000); // Каждые 4 минуты

// Middleware
app.use(express.json());

// Проверка аутентификации
const authenticate = (req, res, next) => {
  if (req.headers['x-auth'] !== SECRET) {
    return res.status(403).json({ error: "Доступ запрещен" });
  }
  next();
};

// Роуты
app.get('/ping', (req, res) => res.send('pong'));

app.get('/keys', (req, res) => {
  res.json({
    validKeys: Array.from(VALID_KEYS),
    activatedKeys: Array.from(activatedKeys.entries())
  });
});

app.post('/check', authenticate, (req, res) => {
  try {
    const { key, userId } = req.body;

    // 1. Проверка валидности ключа
    if (!VALID_KEYS.has(key)) {
      return res.json({ valid: false, error: "Неверный лицензионный ключ" });
    }

    // 2. Проверка активации
    if (activatedKeys.has(key)) {
      const keyData = activatedKeys.get(key);
      
      if (keyData.userId !== userId) {
        return res.json({ 
          valid: false, 
          error: `Ключ уже активирован пользователем ${keyData.userId}`,
          activated: keyData.activated,
          expires: keyData.expires
        });
      }
      
      return res.json({ 
        valid: true,
        activated: keyData.activated,
        expires: keyData.expires,
        daysLeft: Math.ceil((keyData.expires - Date.now()) / (1000 * 60 * 60 * 24))
      });
    }

    // 3. Активация нового ключа
    const activationData = {
      userId,
      activated: Date.now(),
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 дней
    };
    
    activatedKeys.set(key, activationData);

    res.json({ 
      valid: true,
      activated: activationData.activated,
      expires: activationData.expires,
      daysLeft: 7
    });

  } catch (err) {
    console.error("Ошибка:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Секретный ключ: ${SECRET.substring(0, 3)}...${SECRET.substring(SECRET.length - 3)}`);
  
  // Пингуем себя сразу после запуска
  fetch(`https://${process.env.RENDER_INSTANCE_NAME || 'ixa-key-server'}.onrender.com/ping`)
    .catch(err => console.error('Initial ping failed:', err));
});

// Авто-перезапуск при ошибках
process.on('uncaughtException', (err) => {
  console.error('Critical error:', err);
  setTimeout(() => process.exit(1), 1000);
});
