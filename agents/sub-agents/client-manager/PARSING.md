# Парсинг лидов — Client Manager

## 🚀 Быстрый старт

### 1. Настройка Telegram API

Получите ключи на https://my.telegram.org/apps:

```env
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890
```

### 2. Запуск парсинга

```bash
npm run parse-leads
```

---

## 📁 Структура файлов

```
client-manager/
├── parsers/
│   ├── telegram-parser.js    # Парсер Telegram каналов
│   └── kwork-parser.js       # Парсер Kwork.ru
├── .env                      # Конфигурация (email, пароли, API ключи)
├── parse-leads.js            # Главный скрипт парсинга
└── SETUP.md                  # Подробная инструкция
```

---

## 🔧 Настройка

### Telegram каналы

Откройте `parsers/telegram-parser.js`:

```javascript
this.channels = [
  'FreelanceBay',
  'frilanserov_chat',
  'freelancce',
  'udafrii',
  'freelancechoice'
];
```

### Ключевые слова для поиска

```javascript
this.keywords = [
  'wordpress',
  'bitrix',
  'вёрстка',
  'создать сайт',
  // Добавьте свои
];
```

### Kwork запросы

Откройте `parsers/kwork-parser.js`:

```javascript
this.searchQueries = [
  'wordpress',
  'bitrix',
  'вёрстка сайта',
  // Добавьте свои
];
```

---

## 📊 Результаты

Результаты сохраняются в:
- `parsed_output/telegram_leads.json` — лиды из Telegram
- `parsed_output/kwork_projects.json` — проекты с Kwork

После парсинга скрипт предложит импортировать лиды в CRM.

---

## ⚠️ Важные замечания

### Kwork
- Может требоваться капча при частых запросах
- Рекомендуется делать перерывы между парсингом
- Сессия сохраняется в `kwork_session.json`

### Telegram
- Первая авторизация требует ввода номера телефона и кода
- Сессия сохраняется в `telegram_session.json`
- Не парсите слишком часто (риск блокировки)

---

## 🐛 Решение проблем

### Ошибка "PHONE_NUMBER_INVALID"
Введите номер в международном формате: `+79991234567`

### Ошибка "SESSION_PASSWORD_NEEDED"
Введите пароль 2FA от Telegram

### Kwork возвращает 403
- Войдите через браузер
- Экспортируйте cookies
- Или подождите 1-2 часа

---

## 📞 Поддержка

При проблемах:
1. Проверьте `.env` файл
2. Убедитесь, что зависимости установлены (`npm install`)
3. Проверьте логи в консоли
