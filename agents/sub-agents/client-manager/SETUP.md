# Инструкция по настройке парсинга лидов

## 📋 Шаг 1: Получение Telegram API ключей

1. Зайдите на https://my.telegram.org/apps
2. Введите номер телефона, к которому привязан Telegram
3. Получите код подтверждения в приложении Telegram (не SMS!)
4. Заполните форму создания приложения:
   - **App title:** `Client Manager Parser`
   - **Short name:** `cm-parser`
   - **Platform:** `Desktop`
5. Нажмите **Create application**
6. Скопируйте `api_id` и `api_hash`

## 📋 Шаг 2: Настройка .env файла

Откройте файл `.env` в папке `client-manager/` и заполните:

```env
# Kwork аккаунт (уже заполнено)
KWORK_EMAIL=kokoskokosewwe@gmail.com
KWORK_PASSWORD=4589fdgjfgh89345

# Telegram API (вставьте ваши ключи)
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890

# Путь для сохранения сессий
SESSION_PATH=./sessions/
```

## 📋 Шаг 3: Установка зависимостей

```bash
cd C:\Qwen\AI-agent-loc
npm install
```

## 📋 Шаг 4: Запуск парсинга

### Парсинг из Telegram и Kwork:
```bash
npm run parse-leads
```

### Только тест Client Manager:
```bash
npm run client-manager
```

## 📋 Шаг 5: Просмотр результатов

Результаты парсинга сохраняются в:
- `parsed_output/telegram_leads.json` — лиды из Telegram
- `parsed_output/kwork_projects.json` — проекты с Kwork

После парсинга скрипт предложит импортировать лиды в CRM.

---

## 🔧 Настройка каналов для парсинга

Откройте `parsers/telegram-parser.js` и измените список каналов:

```javascript
this.channels = [
  'FreelanceBay',
  'frilanserov_chat',
  'freelancce',
  'udafrii',
  'freelancechoice',
  // Добавьте свои каналы
];
```

## 🔧 Настройка ключевых слов

Для фильтрации проектов измените:

```javascript
this.keywords = [
  'wordpress',
  'bitrix',
  'вёрстка',
  // Добавьте свои ключевые слова
];
```

---

## ⚠️ Возможные проблемы

### 1. Ошибка "PHONE_NUMBER_INVALID"
Убедитесь, что номер телефона введён в международном формате: `+79991234567`

### 2. Ошибка "SESSION_PASSWORD_NEEDED"
Если включена 2FA, введите пароль от аккаунта Telegram

### 3. Kwork не входит в аккаунт
- Проверьте правильность email/password
- Возможно, требуется капча — войдите вручную через браузер

### 4. Блокировка со стороны Telegram/Kwork
- Не парсите слишком часто (раз в 1-2 часа достаточно)
- Используйте задержки между запросами

---

## 📞 Поддержка

При проблемах проверьте логи в консоли и убедитесь, что:
- Все зависимости установлены (`npm install`)
- API ключи правильно указаны в `.env`
- У аккаунта Telegram есть доступ к указанным каналам
