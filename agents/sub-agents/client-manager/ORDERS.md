# Orders Manager - Управление заказами

## 📋 Описание

Система хранения заказов с индивидуальной структурой папок. Каждый заказ сохраняется в отдельном JSON-файле в папке с датой.

## 📁 Структура хранения

```
BaseMD/orders/
└── parse_order_YYYY-MM-DD/
    ├── {order-id-1}.json
    ├── {order-id-2}.json
    └── {order-id-3}.json
```

### Пример структуры:

```
BaseMD/orders/
└── parse_order_2026-03-10/
    ├── 2b966681-45e7-4354-8756-99feadb85ae2.json
    ├── 35d3f41c-c1ef-4d13-91fd-e3ebed5353b6.json
    └── 05ec4e15-a100-4891-b2fe-e4bbb54eee29.json
```

## 🚀 Быстрый старт

### 1. Парсинг заказов

```bash
npm run parse-leads
```

Загружает демо-заказы и сохраняет их в структуру `BaseMD/orders/parse_order_{date}/`.

### 2. Просмотр CRM

```bash
npm run crm
```

Открывает интерактивную таблицу заказов с фильтрами и управлением статусами.

## 📊 Статусы заказов

| Статус | Описание |
|--------|----------|
| `new` | Новый заказ |
| `viewed` | Заказ просмотрен |
| `contact` | Контактируем с клиентом |
| `proposal` | Отправлено КП |
| `won` | Выиграли заказ |
| `lost` | Проиграли заказ |

## 🔧 API OrdersManager

### Основные методы

```javascript
import { OrdersManager } from './orders-manager.js';

const ordersManager = new OrdersManager();
await ordersManager.initialize();
```

#### Сохранение заказа

```javascript
// Сохранить один заказ
const order = await ordersManager.saveOrder({
  title: 'Разработка сайта',
  description: 'Нужен сайт на WordPress',
  source: 'fl.ru',
  budget: '30 000 ₽',
  contact: { email: 'client@example.com' }
});

// Сохранить несколько заказов
const orders = await ordersManager.saveOrders([order1, order2, order3]);
```

#### Получение заказов

```javascript
// Все заказы
const allOrders = await ordersManager.getAllOrders();

// Заказы за конкретную дату
const date = new Date('2026-03-10');
const todaysOrders = await ordersManager.getOrdersByDate(date);

// Получить заказ по ID
const order = await ordersManager.getOrderById('order-id');
```

#### Обновление статуса

```javascript
const updated = await ordersManager.updateOrderStatus(
  'order-id',
  'proposal' // new, viewed, contact, proposal, won, lost
);
```

#### Статистика

```javascript
const stats = ordersManager.getStats(allOrders);
console.log(stats);
// {
//   total: 10,
//   byStatus: { new: 5, viewed: 3, proposal: 2 },
//   bySource: { fl.ru: 4, kwork.ru: 6 },
//   byType: { wordpress: 7, bitrix: 3 },
//   today: 5,
//   thisWeek: 10
// }
```

#### Таблица для отображения

```javascript
// Конвертировать в таблицу
const table = ordersManager.toTable(allOrders);

// Вывести в консоль
ordersManager.printTable(allOrders);
```

## 📋 Интерактивное CRM-меню

После запуска `npm run crm` доступно меню:

1. **Фильтр по статусу** — показать заказы с определённым статусом
2. **Фильтр по источнику** — фильтр по источнику (fl.ru, kwork.ru, etc.)
3. **Фильтр по типу проекта** — wordpress, bitrix, landing, etc.
4. **Обновить статус заказа** — изменить статус заказа
5. **Показать детали заказа** — полная информация о заказе

## 🔗 Интеграция с ClientManagerAgent

```javascript
import { ClientManagerAgent } from './agents/sub-agents/client-manager/agent.js';

const agent = new ClientManagerAgent();
await agent.initialize(messageQueue);

// Получить заказы
const orders = await agent.getOrders();

// Статистика
const stats = agent.getOrdersStats();

// Обновить статус
await agent.updateOrderStatus('order-id', 'contact');

// Таблица
agent.printOrdersTable(orders);
```

## 📝 Пример JSON заказа

```json
{
  "id": "2b966681-45e7-4354-8756-99feadb85ae2",
  "title": "Разработка сайта на WordPress",
  "description": "Нужно разработать корпоративный сайт",
  "source": "fl.ru",
  "budget": "30 000 ₽",
  "projectType": "wordpress",
  "url": "https://fl.ru/projects/123456",
  "contact": {
    "email": "client@example.com",
    "telegram": "@client"
  },
  "postedAt": "2026-03-10T16:44:18.499Z",
  "savedAt": "2026-03-10T18:42:34.960Z",
  "updatedAt": "2026-03-10T19:00:00.000Z",
  "status": "new"
}
```

## 🛠️ Команды npm

| Команда | Описание |
|---------|----------|
| `npm run parse-leads` | Парсинг и сохранение заказов |
| `npm run crm` | Интерактивная CRM-таблица |
| `npm run client-manager` | Тест Client Manager Agent |

## 📂 Модули

- **orders-manager.js** — основной модуль управления заказами
- **parse-leads.js** — скрипт парсинга
- **crm.js** — интерактивный CRM-интерфейс
- **agent.js** — ClientManagerAgent с интеграцией OrdersManager

---

*Orders Manager — часть системы AI Agent Hierarchy*
