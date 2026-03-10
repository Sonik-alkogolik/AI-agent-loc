# Yandex Parser + CRM Integration

## 📋 Описание

Интеграция парсинга Яндекса через Selenium с CRM системой. Результаты парсинга автоматически сохраняются в формате заказов CRM.

## 🚀 Быстрый старт

### 1. Запуск интеграции

```bash
cd C:\Qwen\AI-agent-loc\parse_python
python yandex_crm_integration.py
```

### 2. Процесс работы

1. Открывается браузер Chrome
2. Выполняется поиск по заданным запросам
3. При появлении капчи — **вы решаете её вручную**
4. Результаты парсинга автоматически сохраняются в CRM
5. Каждый результат становится заказом со статусом `new`

## 📁 Структура хранения

```
BaseMD/orders/
└── parse_order_2026-03-10/
    ├── {order-id-1}.json  ← заказ из Яндекса
    ├── {order-id-2}.json
    └── ...
```

## 🔧 Настройка запросов

Откройте `yandex_crm_integration.py` и измените массив `queries`:

```python
queries = [
    'заказать сайт wordpress',
    'разработка сайтов битрикс',
    'верстка лендинга',
    'создать интернет магазин',
    'техническая поддержка сайта',
    # Добавьте свои запросы
]
```

## 📊 Поля заказа

Каждый заказ содержит:

```json
{
  "id": "uuid",
  "title": "Заголовок из выдачи",
  "description": "Сниппет из выдачи",
  "source": "yandex_search",
  "url": "https://...",
  "projectType": "wordpress|bitrix|landing|...",
  "contact": {
    "phone": "+7...",
    "email": "...",
    "telegram": "@..."
  },
  "searchQuery": "запрос по которому найден",
  "position": 1,
  "status": "new",
  "savedAt": "2026-03-10T22:00:00"
}
```

## 🎯 Автоматическое определение типа проекта

Скрипт автоматически определяет тип проекта по содержанию:

| Ключевые слова | Тип проекта |
|----------------|-------------|
| bitrix, 1с-битрикс | `bitrix` |
| wordpress, вордпресс | `wordpress` |
| landing, лендинг | `landing` |
| интернет-магазин, shop | `shop` |
| crm | `crm` |
| вёрстка, верстка | `layout` |
| поддержк, сопровожд | `support` |

## 📞 Извлечение контактов

Скрипт пытается извлечь контакты из сниппета:

- **Телефон** — по паттернам +7, 8, скобки
- **Email** — по наличию @
- **Telegram** — по символу @

## 🔗 Просмотр результатов в CRM

После парсинга просмотрите заказы:

```bash
cd C:\Qwen\AI-agent-loc
npm run crm
```

Или откройте файлы напрямую:
```
BaseMD/orders/parse_order_{date}/{order-id}.json
```

## 📝 Пример использования в коде

```python
from yandex_crm_integration import YandexCRMIntegration

# Создание интеграции
integration = YandexCRMIntegration()

# Установка запросов
integration.set_queries([
    'заказать сайт',
    'разработка сайтов'
])

# Парсинг и добавление в CRM
stats = integration.parse_and_add_to_crm(
    captcha_wait_time=60  # 60 секунд на капчу
)

# Статистика
print(f"Добавлено: {stats['added']}")
print(f"Пропущено: {stats['skipped']}")
```

## 🛠️ Модули

| Файл | Описание |
|------|----------|
| `yandex_crm_integration.py` | Основной скрипт интеграции |
| `yandex_selenium_chrome.py` | Парсер Яндекса через Selenium |
| `orders_manager.py` | Python-версия OrdersManager |
| `orders-manager.js` | JS-версия OrdersManager (для Node.js) |

## 🎯 Сценарии использования

### Сценарий 1: Разовый парсинг
1. Запустите `python yandex_crm_integration.py`
2. Решите капчу в браузере
3. Проверьте CRM через `npm run crm`

### Сценарий 2: Регулярный парсинг
1. Настройте запросы в скрипте
2. Запустите парсинг
3. Экспортируйте заказы в основную CRM

### Сценарий 3: Кастомный парсинг
```python
from orders_manager import OrdersManager
from yandex_selenium_chrome import YandexSeleniumParser

# Парсинг
parser = YandexSeleniumParser()
parser.setup_driver()
results = parser.search('мой запрос')

# Сохранение
om = OrdersManager()
om.initialize()
for r in results:
    om.save_order({'title': r['title'], ...})
```

## 📊 Статистика

После парсинга выводится статистика:

```
======================================================================
📊 Статистика:
   Запросов: 5
   Найдено: 50
   Добавлено в CRM: 48
   Пропущено: 2
======================================================================
```

## ⚠️ Важные замечания

1. **Капча** — решается вручную в браузере
2. **Время ожидания** — по умолчанию 60 сек на запрос
3. **Задержки** — 2 секунды между запросами
4. **User-Agent** — стандартный Chrome

## 🔗 Связанные документы

- `README_FULL.md` — полная документация по парсерам
- `ORDERS.md` — документация по OrdersManager
- `TELEGRAM_BOT.md` — парсинг через Telegram бота

---

*Yandex + CRM Integration — автоматизация поиска клиентов*
