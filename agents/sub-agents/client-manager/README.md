# Client Manager Agent — Полная документация

## 📋 Описание

Персональный AI-менеджер для поиска и управления клиентами веб-разработчика.

**Возможности:**
- ✅ CRM система (6 статусов клиентов)
- ✅ Генерация коммерческих предложений
- ✅ Парсинг лидов из Telegram и Kwork
- ✅ Follow-up напоминания
- ✅ История взаимодействий

---

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd C:\Qwen\AI-agent-loc
npm install
```

### 2. Настройка API ключей

Откройте `.env` в папке `client-manager/`:

```env
# Kwork (уже настроено)
KWORK_EMAIL=kokoskokosewwe@gmail.com
KWORK_PASSWORD=4589fdgjfgh89345

# Telegram (получите на https://my.telegram.org/apps)
TELEGRAM_API_ID=ваш_api_id
TELEGRAM_API_HASH=ваш_api_hash
```

### 3. Запуск

#### Тест Client Manager:
```bash
npm run client-manager
```

#### Парсинг лидов:
```bash
npm run parse-leads
```

---

## 📁 Структура проекта

```
client-manager/
├── agent.js                      # Основной класс агента
├── agent-config.json             # Конфигурация
├── test-client-manager.js        # Тестовый скрипт
├── parse-leads.js                # Парсинг лидов
├── .env                          # Конфигурация (чувствительные данные)
├── .gitignore                    # Игнорируемые файлы
│
├── parsers/
│   ├── telegram-parser.js        # Парсер Telegram
│   └── kwork-parser.js           # Парсер Kwork
│
├── BaseMD/
│   ├── info/
│   │   └── info_developer.md     # Информация о разработчике
│   ├── data/
│   │   └── clients.json          # CRM база
│   ├── templates/
│   │   ├── proposal-bitrix.md
│   │   ├── proposal-wordpress.md
│   │   ├── proposal-landing.md
│   │   └── proposal-generic.md
│   ├── leads/active/             # Активные лиды
│   └── interactions/             # История переписки
│
└── README.md                     # Этот файл
```

---

## 📊 API Методы

### CRM

| Метод | Описание |
|-------|----------|
| `addLead(clientData)` | Добавить лида |
| `updateStatus(clientId, status)` | Обновить статус |
| `getClient(clientId)` | Получить клиента |
| `getClientsByStatus(status)` | Фильтр по статусу |
| `getStats()` | Статистика |

### Коммерческие предложения

| Метод | Описание |
|-------|----------|
| `generateProposal(clientId)` | Сгенерировать КП |
| `selectTemplate(projectType)` | Выбрать шаблон |

### Follow-up

| Метод | Описание |
|-------|----------|
| `scheduleFollowUp(clientId, days)` | Запланировать напоминание |
| `getFollowUpList()` | Список для напоминания |

### История

| Метод | Описание |
|-------|----------|
| `logInteraction(clientId, message, type)` | Записать взаимодействие |
| `getHistory(clientId)` | Получить историю |

### Парсинг

| Метод | Описание |
|-------|----------|
| `searchLeads(queries)` | Поиск лидов |
| `parseTelegram()` | Парсинг Telegram |
| `parseKwork()` | Парсинг Kwork |

---

## 📋 Статусы клиентов

1. **lead** — Лид (новый контакт)
2. **conversation** — Переписка
3. **proposal_sent** — КП отправлено
4. **contract** — Договор
5. **in_progress** — В работе
6. **paid** — Оплачено

---

## 🔧 Настройка парсинга

### Telegram каналы

Файл: `parsers/telegram-parser.js`

```javascript
this.channels = [
  'FreelanceBay',
  'frilanserov_chat',
  'freelancce',
  'udafrii',
  'freelancechoice'
];
```

### Ключевые слова

```javascript
this.keywords = [
  'wordpress',
  'bitrix',
  'вёрстка',
  'создать сайт',
  'разработка сайта',
  'интернет магазин',
  'интеграция',
  'landing',
  'лендинг'
];
```

### Kwork запросы

Файл: `parsers/kwork-parser.js`

```javascript
this.searchQueries = [
  'wordpress',
  'bitrix',
  'вёрстка сайта',
  'создать сайт',
  'разработка сайта',
  'интернет магазин',
  'интеграция bitrix',
  'интеграция wordpress',
  'доработать сайт',
  'landing page',
  'лендинг'
];
```

---

## 📝 Примеры использования

### Добавление лида

```javascript
const lead = await clientManager.addLead({
  name: 'Иван Петров',
  contact: { telegram: '@ivan', email: 'ivan@example.com' },
  source: 'telegram',
  projectType: 'wordpress',
  description: 'Нужен сайт для компании'
});
```

### Генерация КП

```javascript
const proposal = await clientManager.generateProposal(lead.id);
console.log(proposal);
```

### Запись взаимодействия

```javascript
await clientManager.logInteraction(
  lead.id,
  'Отправлено первое сообщение, клиент заинтересован',
  'outgoing'
);
```

### Планирование follow-up

```javascript
await clientManager.scheduleFollowUp(lead.id, 3); // через 3 дня
```

---

## ⚠️ Важные замечания

### Безопасность
- Файл `.env` не коммитить в git
- После настройки смените пароль Kwork
- Telegram API ключи храните в секрете

### Парсинг
- Не парсите слишком часто (риск блокировки)
- Делайте перерывы 1-2 часа между парсингом
- Kwork может требовать капчу

### CRM
- Регулярно проверяйте follow-up список
- Обновляйте статусы клиентов
- Ведите историю переписки

---

## 🐛 Решение проблем

### Ошибка "PHONE_NUMBER_INVALID"
Введите номер в формате: `+79991234567`

### Ошибка "SESSION_PASSWORD_NEEDED"
Введите 2FA пароль от Telegram

### Kwork возвращает 403
- Войдите через браузер
- Или подождите 1-2 часа

### Зависимости не устанавливаются
```bash
npm install --force
```

---

## 📞 Поддержка

1. Проверьте логи в консоли
2. Убедитесь, что `.env` заполнен правильно
3. Прочитайте `SETUP.md` и `PARSING.md`

---

## 📚 Дополнительная документация

- `SETUP.md` — Подробная настройка
- `PARSING.md` — Парсинг лидов
- `info_developer.md` — Информация о разработчике

---

*Client Manager Agent — часть иерархической системы AI-агентов*
