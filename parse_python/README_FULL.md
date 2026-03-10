# Parse Python - Полная документация

## 📁 Структура папки

```
parse_python/
├── yandex_parser.py              # Прямой парсинг (блокируется капчей)
├── yandex_serpapi.py             # Через SerpAPI API (✅ работает)
├── yandex_captcha_simple.py      # Сохраняет HTML капчи
├── yandex_selenium.py            # Через Selenium (нужен Chrome)
├── yandex_selenium_auto.py       # Selenium с автопоиском Chrome
├── google_parser.py              # Парсинг Google
├── freelance_parser.py           # Парсинг бирж фриланса
├── universal_parser.py           # Универсальный парсер с прокси
├── requirements.txt              # Базовые зависимости
├── requirements_selenium.txt     # Зависимости для Selenium
└── README.md                    # Эта документация
```

## ✅ Рабочие методы

### 1. SerpAPI (РЕКОМЕНДУЕТСЯ)

**Плюсы:**
- ✅ Работает стабильно
- ✅ Не нужна капча
- ✅ 100 запросов бесплатно в месяц

**Минусы:**
- ❌ Ограниченное количество бесплатных запросов

**Установка:**
```bash
pip install -r requirements.txt
```

**Использование:**
```bash
# Получить ключ: https://serpapi.com/
set SERPAPI_KEY=ваш_ключ
python yandex_serpapi.py
```

### 2. Selenium с браузером

**Плюсы:**
- ✅ Вы видите капчу и решаете её вручную
- ✅ Полный контроль

**Минусы:**
- ❌ Нужен установленный Google Chrome
- ❌ Нужен ChromeDriver
- ❌ Медленнее

**Установка:**
```bash
# 1. Установите Chrome: https://google.com/chrome
# 2. Установите зависимости
pip install -r requirements_selenium.txt
```

**Использование:**
```bash
python yandex_selenium_auto.py
```

**Как работает:**
1. Скрипт открывает браузер Chrome
2. При запросе капчи — вы решаете её вручную в окне браузера
3. После решения капчи парсинг продолжается автоматически

### 3. Сохранение капчи (для ручной обработки)

**Плюсы:**
- ✅ Не нужен браузер
- ✅ Сохраняет HTML для анализа

**Минусы:**
- ❌ Нужно вручную решать капчу

**Использование:**
```bash
python yandex_captcha_simple.py
```

**Результат:**
- HTML капчи сохраняется в `parse_python/captcha/`
- Выводится путь к файлу и URL капчи

## ❌ Нерабочие методы

### Прямой парсинг (yandex_parser.py)
Блокируется капчей Яндекса.

### Google парсер (google_parser.py)
Блокируется таймаутами и капчей.

### Биржи фриланса (freelance_parser.py)
Блокируются защитой от ботов.

## 📊 Сравнение методов

| Метод | Работает | Скорость | Бесплатно | Сложность |
|-------|----------|----------|-----------|-----------|
| SerpAPI | ✅ | ⚡⚡⚡ | 100/мес | 🟢 Легко |
| Selenium | ✅ | ⚡⚡ | Да | 🟡 Средне |
| Captcha Saver | ⚠️ | ⚡ | Да | 🟡 Средне |
| Прямой | ❌ | ⚡⚡⚡ | Да | 🔴 Не работает |

## 🎯 Рекомендации

### Для разового парсинга:
Используйте **Selenium** — откроется браузер, вы решите капчу и получите результаты.

### Для регулярного парсинга:
Используйте **SerpAPI** — стабильно, быстро, без капчи.

### Для обучения/тестов:
Используйте **Captcha Saver** — сохраняйте HTML и изучайте структуру.

## 🔧 Установка зависимостей

### Базовые:
```bash
pip install -r requirements.txt
```

### Для Selenium:
```bash
pip install -r requirements_selenium.txt
```

## 📝 Структура результатов

```
parse_python/
├── parse-yandex/              # Для SerpAPI
│   └── 2026-03-10/
│       └── parse_yandex_log_10.03.2026.json
├── parse-yandex-selenium/     # Для Selenium
│   └── 2026-03-10/
│       └── parse_yandex_log_10.03.2026.json
└── captcha/                   # Сохранённые капчи
    └── captcha_20260310_123456.html
```

## 🚀 Быстрый старт

```bash
# 1. Перейдите в папку
cd parse_python

# 2. Установите зависимости
pip install -r requirements.txt

# 3. Для SerpAPI (рекомендуется):
set SERPAPI_KEY=ваш_ключ
python yandex_serpapi.py

# 4. Для Selenium (если есть Chrome):
pip install -r requirements_selenium.txt
python yandex_selenium_auto.py
```

## 🆘 Решение проблем

### "Chrome not found"
Установите Google Chrome: https://google.com/chrome

### "ChromeDriver not found"
Скачайте ChromeDriver: https://chromedriver.chromium.org/downloads
Положите в папку с Python или добавьте в PATH

### "SerpAPI key required"
Зарегистрируйтесь на https://serpapi.com/ и получите бесплатный ключ

### "Капча не решается"
Попробуйте Selenium — откроется браузер и вы решите капчу вручную

---

*Выбирайте метод в зависимости от ваших задач!*
