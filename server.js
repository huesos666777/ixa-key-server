require('dotenv').config();
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET_KEY || 'IXA-SECRET-123';

// Все 50 ключей (замените своими при необходимости)
const VALID_KEYS = new Set([
  "IXA-11111-AAAAA", "IXA-22222-BBBBB", "IXA-33333-CCCCC", "IXA-44444-DDDDD", "IXA-55555-EEEEE",
  "IXA-66666-FFFFF", "IXA-77777-GGGGG", "IXA-88888-HHHHH", "IXA-99999-IIIII", "IXA-00000-JJJJJ",
  "IXA-12121-KKKKK", "IXA-23232-LLLLL", "IXA-34343-MMMMM", "IXA-45454-NNNNN", "IXA-56565-OOOOO",
  "IXA-67676-PPPPP", "IXA-78787-QQQQQ", "IXA-89898-RRRRR", "IXA-90909-SSSSS", "IXA-01010-TTTTT",
  "IXA-13131-UUUUU", "IXA-24242-VVVVV", "IXA-35353-WWWWW", "IXA-46464-XXXXX", "IXA-57575-YYYYY",
  "IXA-68686-ZZZZZ", "IXA-79797-ABCDE", "IXA-80808-FGHIJ", "IXA-91919-KLMNO", "IXA-02020-PQRST",
  "IXA-14141-UVWXY", "IXA-25252-ZABCD", "IXA-36363-EFGHI", "IXA-47474-JKLMN", "IXA-58585-OPQRS",
  "IXA-69696-TUVWX", "IXA-70707-YZABC", "IXA-81818-DEFGH", "IXA-92929-IJKLM", "IXA-03030-NOPQR",
  "IXA-15151-STUVW", "IXA-26262-XYZAB", "IXA-37373-CDEFG", "IXA-48484-HIJKL", "IXA-59595-MNOPQ",
  "IXA-60606-RSTUV", "IXA-71717-WXYZA", "IXA-82828-BCDEF", "IXA-93939-GHIJK", "IXA-04040-LMNOP"
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
