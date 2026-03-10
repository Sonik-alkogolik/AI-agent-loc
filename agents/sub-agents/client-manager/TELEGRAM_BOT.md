# Telegram Bot Parser - Парсинг через бота

## 📋 Описание

Парсинг заказов из Telegram-каналов через **Telegram Bot API**. Этот способ проще, чем использование MTProto — не требуется API ID и API Hash.

## 🔧 Настройка

### 1. Создание бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Введите имя бота (например, `Freelance Parser Bot`)
4. Введите username бота (должен заканчиваться на `bot`, например `freelance_parser_bot`)
5. Скопируйте полученный токен

### 2. Добавление бота в каналы

1. Откройте настройки канала
2. Перейдите в раздел "Администраторы"
3. Нажмите "Добавить администратора"
4. Найдите вашего бота по username
5. **Важно:** Дайте боту права на **чтение сообщений**

### 3. Настройка .env

Скопируйте `.env.example` в `.env`:

```bash
cp .env.example .env
```

Заполните токен:

```env
# Telegram Bot (создать через @BotFather)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Опционально: ID чата для уведомлений
TELEGRAM_ADMIN_CHAT_ID=123456789
```

### 4. Рекомендуемые каналы для парсинга

Добавьте бота в эти каналы:

- **FreelanceBay** - @FreelanceBay
- **frilanserov_chat** - @frilanserov_chat
- **freelancce** - @freelancce
- **udafrii** - @udafrii
- **freelancechoice** - @freelancechoice

## 🚀 Использование

### Быстрый старт

```bash
# Запуск с токеном из .env
npm run parse-telegram

# Запуск с токеном в командной строке
npm run parse-telegram -- YOUR_BOT_TOKEN
```

### Пример вывода

```
╔═══════════════════════════════════════════════════════════╗
║      Telegram Bot Parser - Парсинг через бота             ║
╚═══════════════════════════════════════════════════════════╝

1. Инициализация бота...
   Бот: @freelance_parser_bot (Freelance Parser Bot)

2. Проверка каналов...
   Найдено каналов: 3
   • FreelanceBay
   • frilanserov_chat
   • freelancce

3. Парсинг каналов...
[TelegramBot] Парсинг канала: -1001234567890
[TelegramBot] Найдено лидов: 15

4. Сохранение лидов...
   Сохранено заказов: 15

5. Статистика:
   По типам: {
     "wordpress": 5,
     "bitrix": 3,
     "landing": 4,
     "generic": 3
   }

✅ Парсинг завершён!
```

## 📁 Структура хранения

Заказы сохраняются в:

```
BaseMD/orders/parse_order_YYYY-MM-DD/{order-id}.json
```

### Пример JSON заказа

```json
{
  "id": "abc123-def456",
  "title": "Разработка сайта на WordPress",
  "description": "Нужен сайт для компании...",
  "source": "telegram_bot",
  "channel": "FreelanceBay",
  "projectType": "wordpress",
  "contact": {
    "telegram": "@client",
    "email": "client@example.com"
  },
  "url": "https://t.me/FreelanceBay/12345",
  "postedAt": "2026-03-10T12:00:00.000Z",
  "savedAt": "2026-03-10T14:30:00.000Z",
  "status": "new"
}
```

## 🔧 API TelegramBotParser

### Инициализация

```javascript
import { TelegramBotParser } from './parsers/telegram-bot-parser.js';

const parser = new TelegramBotParser('YOUR_BOT_TOKEN');
```

### Основные методы

```javascript
// Информация о боте
const botInfo = await parser.getBotInfo();

// Каналы, где состоит бот
const channels = await parser.getBotChannels();

// Парсинг одного канала
const leads = await parser.parseChannel(channelId, limit);

// Парсинг всех каналов
const allLeads = await parser.parseAllChannels(50);

// Сохранение в OrdersManager
const saved = await parser.saveLeads(leads);

// Парсинг и сохранение
const results = await parser.parseAndSave(50);
```

### Уведомления

```javascript
// Отправить уведомление о новых лидах
await parser.notifyNewLeads(leads, adminChatId);
```

## 📊 Ключевые слова для фильтрации

Бот фильтрует сообщения по ключевым словам:

- wordpress
- bitrix
- вёрстка
- создать сайт
- разработка сайта
- доработать сайт
- интернет магазин
- интеграция
- cms
- landing / лендинг
- html, css, php

## 🛠️ Решение проблем

### Бот не видит каналы

**Проблема:** Бот не состоит в каналах или не имеет прав

**Решение:**
1. Добавьте бота как администратора
2. Дайте права на чтение сообщений
3. Перезапустите парсинг

### Ошибка "Unauthorized"

**Проблема:** Неверный токен бота

**Решение:** Проверьте токен в `.env` или получите новый у @BotFather

### Мало лидов найдено

**Проблема:** В каналах нет сообщений с ключевыми словами

**Решение:**
1. Добавьте больше каналов
2. Расширьте список ключевых слов в `telegram-bot-parser.js`
3. Увеличьте лимит парсинга

## 📝 Интеграция с CRM

После парсинга используйте CRM для просмотра:

```bash
npm run crm
```

Доступные функции:
- Фильтр по статусу
- Фильтр по источнику
- Фильтр по типу проекта
- Обновление статуса
- Просмотр деталей заказа

---

*Telegram Bot Parser — часть системы AI Agent Hierarchy*
