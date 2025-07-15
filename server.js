const express = require('express');
const app = express();
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

let activatedKeys = {};

app.use(express.json());

app.post('/check', (req, res) => {
  const { key, hwid } = req.body;
  
  if (!VALID_KEYS.has(key)) {
    return res.json({ valid: false, error: "Неверный ключ" });
  }

  if (activatedKeys[key]) {
    if (activatedKeys[key].hwid !== hwid) {
      return res.json({ valid: false, error: "Ключ уже используется" });
    }
    return res.json({ valid: true, expires: activatedKeys[key].expires });
  }

  // Активация нового ключа
  activatedKeys[key] = {
    hwid: hwid,
    expires: Date.now() + 7*24*60*60*1000 // 7 дней
  };

  res.json({ valid: true, expires: activatedKeys[key].expires });
});

// Пробуждение сервера
setInterval(() => console.log('[Keep-Alive] Ping'), 5*60*1000);

app.listen(3000, () => console.log('Сервер запущен'));
