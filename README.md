# AI Agent Hierarchy

Иерархическая система AI-агентов с Senior Agent во главе и sub-агентами, каждый из которых ведёт свою базу знаний в формате Markdown.

## 📋 Содержание

- [Описание](#описание)
- [Архитектура](#архитектура)
- [Структура проекта](#структура-проекта)
- [Быстрый старт](#быстрый-старт)
- [Использование](#использование)
- [BaseMD - База знаний](#basemd---база-знаний)
- [Создание своего агента](#создание-своего-агента)

## Описание

Система представляет собой иерархию AI-агентов:

- **Senior Agent** — главный агент-координатор, который принимает задачи от пользователя, декомпозирует их и распределяет между sub-агентами
- **Sub-Agent** — специализированные агенты, которые выполняют конкретные задачи и ведут свою базу знаний

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    User / Client                        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Senior Agent                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Orchestrator                         │  │
│  │  • Управление задачами                            │  │
│  │  • Распределение между агентами                   │  │
│  │  • Агрегация результатов                          │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │            Knowledge Base (BaseMD)                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  Sub-Agent 1 │ │  Sub-Agent 2 │ │  Sub-Agent N │
    │   BaseMD     │ │   BaseMD     │ │   BaseMD     │
    └──────────────┘ └──────────────┘ └──────────────┘
```

## Структура проекта

```
AI-agent-loc/
├── agents/
│   ├── senior-agent/           # Главный агент
│   │   ├── agent.js            # Основная логика
│   │   ├── orchestrator.js     # Координатор
│   │   └── knowledge-base/     # Общая база знаний
│   │
│   └── sub-agents/             # Sub-агенты
│       └── base-sub-agent.js   # Базовый класс
│
├── examples/
│   └── agent-1/                # Пример агента
│       ├── agent.js
│       ├── agent-config.json
│       └── BaseMD/             # База знаний агента
│           ├── context/
│           ├── tasks/
│           └── memory/
│
├── shared/
│   ├── communication.js        # Коммуникация
│   └── base-md.js              # Управление BaseMD
│
├── logs/                       # Логи системы
├── config.json                 # Конфигурация
└── package.json
```

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Запуск Senior Agent

```bash
npm run senior
```

### 3. Регистрация sub-агента

Sub-агенты автоматически регистрируются при наличии файла `agent-config.json` в папке `agents/sub-agents/`.

## Использование

### Создание задачи через Senior Agent

```javascript
import { SeniorAgent } from './agents/senior-agent/agent.js';

const seniorAgent = new SeniorAgent();
await seniorAgent.initialize();

// Обработка задачи
const result = await seniorAgent.handleUserTask('Создать новый компонент');
console.log(result);
```

### Создание своего sub-агента

```javascript
import { SubAgent } from '../../agents/sub-agents/base-sub-agent.js';

export class MyAgent extends SubAgent {
  constructor() {
    super('my-agent', {
      type: 'specialized',
      specialty: 'my_specialty'
    });
  }

  async executeTask(taskMessage) {
    // Ваша логика выполнения задачи
    return { result: 'done' };
  }
}
```

## BaseMD - База знаний

Каждый sub-агент ведёт свою базу знаний в папке `BaseMD/` с тремя категориями:

### 📁 context/
Контекстные файлы для понимания текущих задач

### 📁 tasks/
История выполненных задач с результатами

### 📁 memory/
Долговременная память с важными знаниями

### Пример записи в базу знаний

```javascript
// Добавление контекста
await this.baseMD.addContext(
  'Название задачи',
  'Описание контекста',
  ['тег1', 'тег2']
);

// Добавление результата задачи
await this.baseMD.addTask(
  'task-123',
  'Описание задачи',
  'Результат выполнения',
  'completed'
);

// Добавление памяти
await this.baseMD.addMemory(
  'Важное знание',
  'Содержимое',
  4  // важность от 1 до 5
);
```

## Коммуникация между агентами

### Протоколы сообщений

| Тип | Описание |
|-----|----------|
| `task_assign` | Назначение задачи sub-агенту |
| `task_complete` | Задача выполнена успешно |
| `task_failed` | Задача не выполнена |
| `request_help` | Запрос помощи у Senior Agent |
| `provide_help` | Предоставление помощи |
| `status_request` | Запрос статуса |
| `status_response` | Ответ со статусом |
| `knowledge_update` | Обновление базы знаний |

## Конфигурация

Файл `config.json`:

```json
{
  "seniorAgent": {
    "name": "Senior Agent",
    "role": "orchestrator"
  },
  "subAgents": {
    "basePath": "./agents/sub-agents",
    "baseMDPath": "./BaseMD"
  },
  "communication": {
    "protocol": "message-queue",
    "timeout": 30000
  }
}
```

## Лицензия

MIT
