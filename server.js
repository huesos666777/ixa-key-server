const express = require('express');
const fs = require('fs');
const app = express();

// Конфигурация
const SECRET = process.env.SECRET_KEY || "IXA_SECRET_123";
const KEY_DB_FILE = 'keys.json';

// Инициализация базы ключей
const INITIAL_KEYS = {
  "IXA-57931-KEY": null, "IXA-68245-KEY": null, "IXA-79356-KEY": null,
  "IXA-86427-KEY": null, "IXA-92538-KEY": null, "IXA-13649-KEY": null,
  "IXA-24750-KEY": null, "IXA-35861-KEY": null, "IXA-46972-KEY": null,
  "IXA-57083-KEY": null, "IXA-68194-KEY": null, "IXA-79205-KEY": null,
  "IXA-80316-KEY": null, "IXA-91427-KEY": null, "IXA-12538-KEY": null,
  "IXA-23649-KEY": null, "IXA-34750-KEY": null, "IXA-45861-KEY": null,
  "IXA-56972-KEY": null, "IXA-67083-KEY": null, "IXA-78194-KEY": null,
  "IXA-89205-KEY": null, "IXA-90316-KEY": null, "IXA-01427-KEY": null,
  "IXA-23538-KEY": null, "IXA-34649-KEY": null, "IXA-45750-KEY": null,
  "IXA-56861-KEY": null, "IXA-67972-KEY": null, "IXA-78083-KEY": null,
  "IXA-89194-KEY": null, "IXA-90205-KEY": null, "IXA-01316-KEY": null,
  "IXA-12427-KEY": null, "IXA-33538-KEY": null, "IXA-44649-KEY": null,
  "IXA-55750-KEY": null, "IXA-66861-KEY": null, "IXA-77972-KEY": null,
  "IXA-88083-KEY": null, "IXA-99194-KEY": null, "IXA-00205-KEY": null,
  "IXA-11316-KEY": null, "IXA-22427-KEY": null, "IXA-43538-KEY": null,
  "IXA-54649-KEY": null, "IXA-65750-KEY": null, "IXA-76861-KEY": null,
  "IXA-87972-KEY": null, "IXA-98083-KEY": null
};

// Загрузка/создание базы
if (!fs.existsSync(KEY_DB_FILE)) {
  fs.writeFileSync(KEY_DB_FILE, JSON.stringify(INITIAL_KEYS));
}

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Проверка ключа
app.get('/check', (req, res) => {
  const { key, hwid } = req.query;
  const keysDB = JSON.parse(fs.readFileSync(KEY_DB_FILE));

  // Аутентификация
  if (req.headers['x-auth'] !== SECRET) {
    return res.status(403).json({ valid: false, error: "Access denied" });
  }

  // Проверка ключа
  if (!keysDB.hasOwnProperty(key)) {
    return res.json({ valid: false, error: "Invalid key" });
  }

  // Проверка использования
  if (keysDB[key] !== null) {
    return res.json({ 
      valid: keysDB[key].hwid === hwid,
      error: keysDB[key].hwid === hwid ? null : "Key already used"
    });
  }

  // Активация
  keysDB[key] = { 
    hwid: hwid,
    activated: Date.now(),
    expires: Date.now() + 7*24*60*60*1000 // 7 дней
  };
  
  fs.writeFileSync(KEY_DB_FILE, JSON.stringify(keysDB));
  res.json({ valid: true, expires: keysDB[key].expires });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
