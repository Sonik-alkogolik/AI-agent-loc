# Parse Python - Парсинг на Python с BeautifulSoup

## 📁 Структура

```
parse_python/
├── yandex_parser.py          # Прямой парсинг Яндекса (блокируется капчей)
├── yandex_serpapi.py         # Яндекс через SerpAPI API (работает)
├── google_parser.py          # Парсинг Google (блокируется)
├── freelance_parser.py       # Парсинг бирж фриланса (блокируется)
├── universal_parser.py       # Универсальный парсер с прокси
├── requirements.txt          # Зависимости
└── README.md                # Эта документация
```

## 🔧 Установка

```bash
cd parse_python
pip install -r requirements.txt
```

## 📊 Статус парсеров

| Парсер | Статус | Причина |
|--------|--------|---------|
| Yandex (прямой) | ❌ Блокируется | Капча |
| Yandex (SerpAPI) | ✅ Работает | Официальный API |
| Google | ❌ Блокируется | Таймауты/капча |
| Биржи фриланса | ❌ Блокируются | Защита от ботов |

## ✅ Рабочее решение

**SerpAPI** для Яндекса — единственный стабильный вариант:

```bash
# Установить API ключ
set SERPAPI_KEY=ваш_ключ

# Запустить парсинг
python yandex_serpapi.py
```

Получить ключ: https://serpapi.com/ (100 запросов бесплатно/мес)

## 🛠️ Обход блокировок

### 1. Использование прокси

```python
from universal_parser import UniversalParser

parser = UniversalParser(
    base_path="./parse_python",
    proxy="http://username:password@proxy-server.com:8080"
)
```

### 2. Ротация User-Agent

```python
from fake_useragent import UserAgent
ua = UserAgent()
session.headers.update({'User-Agent': ua.random})
```

### 3. Задержки между запросами

```python
import time, random
time.sleep(random.uniform(3, 6))  # 3-6 секунд
```

## 📝 Структура результатов

```
parse_python/
├── parse-yandex/
│   └── 2026-03-10/
│       └── parse_yandex_log_10.03.2026.json
├── parse-google/
│   └── 2026-03-10/
│       └── parse_google_log_10.03.2026.json
└── parse-freelance/
    └── 2026-03-10/
        └── parse_freelance_log_10.03.2026.json
```

## 🎯 Рекомендации

1. **Для Яндекса** — используйте SerpAPI
2. **Для других сайтов** — используйте прокси + ротацию UA
3. **Для надёжности** — рассмотрите платные API сервисы

## 🔗 Альтернативы

| Сервис | Бесплатно | Сайт |
|--------|-----------|------|
| SerpAPI | 100/мес | serpapi.com |
| ScraperAPI | 5000 | scraperapi.com |
| Oxylabs | Trial | oxylabs.io |
| Zenserp | 1000/мес | zenserp.com |

---

*Используйте BeautifulSoup responsibly!*
