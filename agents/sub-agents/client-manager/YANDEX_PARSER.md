# Yandex Parser - Парсинг Яндекса

## 📋 Описание

Парсинг поисковой выдачи Яндекса для поиска потенциальных клиентов на разработку сайтов.

**Структура хранения:**
```
parse/
└── parse-yandex/
    └── 2026-03-10/
        └── parse_yandex_log_10.03.2026.json
```

## ⚠️ Ограничения

Яндекс активно блокирует автоматические запросы:
- **Капча** при частых запросах
- **403 Forbidden** при подозрительной активности
- **429 Too Many Requests** при превышении лимита

## 🚀 Использование

### Быстрый старт

```bash
npm run parse-yandex
```

### Программное использование

```javascript
import { YandexParser } from './parsers/yandex-parser.js';

const parser = new YandexParser({
  basePath: './parse',
  queries: [
    'заказать сайт wordpress',
    'разработка сайтов битрикс'
  ]
});

// Парсинг и сохранение
const logData = await parser.parseAndSave();

// Статистика
const stats = parser.getStats(logData);
console.log(stats);

// Таблица
parser.printTable(logData);
```

## 🔧 Настройка

### Поисковые запросы

Откройте `parse-yandex.js` и отредактируйте массив `queries`:

```javascript
queries: [
  'заказать сайт wordpress freelance',
  'разработка сайтов битрикс фриланс',
  'создать интернет магазин цена',
  // Добавьте свои запросы
]
```

### Обход блокировок

#### 1. Использование прокси

```javascript
const parser = new YandexParser({
  basePath: './parse',
  proxy: 'http://username:password@proxy-server.com:port'
});
```

#### 2. Увеличение задержек

В `yandex-parser.js` измените задержку:

```javascript
const delay = Math.floor(Math.random() * 5000) + 3000; // 3-8 секунд
```

#### 3. Ротация User-Agent

```javascript
this.userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
  'Mozilla/5.0 (X11; Linux x86_64)...'
];
```

## 📁 Структура JSON лога

```json
{
  "parsedAt": "2026-03-10T12:00:00.000Z",
  "date": "10.03.2026",
  "queriesCount": 8,
  "totalResults": 156,
  "searchQueries": [...],
  "results": [
    {
      "query": "заказать сайт wordpress",
      "results": [
        {
          "title": "Разработка сайтов на WordPress",
          "url": "https://example.com",
          "snippet": "Профессиональная разработка...",
          "position": 1
        }
      ],
      "parsedAt": "2026-03-10T12:00:00.000Z"
    }
  ]
}
```

## 📊 API Методы

| Метод | Описание |
|-------|----------|
| `parseAndSave()` | Парсинг всех запросов и сохранение |
| `parseAllQueries()` | Только парсинг без сохранения |
| `search(query)` | Поиск по одному запросу |
| `getStats(logData)` | Статистика результатов |
| `toTable(logData)` | Конвертация в таблицу |
| `printTable(logData)` | Вывод таблицы в консоль |
| `loadPreviousResults()` | Загрузка предыдущих результатов |
| `getLogFilePath()` | Путь к файлу лога |

## 🛠️ Решение проблем

### Капча Яндекса

**Проблема:** Яндекс запрашивает капчу

**Решения:**
1. Увеличьте задержки между запросами
2. Используйте прокси
3. Используйте Yandex Search API (платно)

### 403 Forbidden

**Проблема:** Доступ запрещён

**Решение:**
- Смените IP адрес
- Используйте прокси
- Проверьте User-Agent

### 0 результатов

**Проблема:** Парсер не находит результаты

**Решение:**
- Яндекс изменил структуру HTML
- Проверьте селекторы в `yandex-parser.js`
- Запустите `test-yandex.js` для отладки

## 🔗 Альтернативы

Если парсинг Яндекса невозможен:

1. **Yandex Search API** (официальный, платный)
2. **SerpAPI** (сторонний сервис)
3. **Google Search API** (альтернативный поисковик)
4. **Ручной парсинг** через браузер

## 📝 Команды npm

```bash
# Запуск парсинга
npm run parse-yandex

# Тест соединения с Яндексом
node agents/sub-agents/client-manager/test-yandex.js
```

---

*Yandex Parser — часть системы AI Agent Hierarchy*
