/**
 * Orchestrator - Координатор работы sub-агентов
 * Управляет жизненным циклом задач и распределением между агентами
 */

import { EventEmitter } from 'events';
import { MessageQueue, Protocol, createTaskMessage, createResultMessage } from '../shared/communication.js';

export class Orchestrator extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.messageQueue = new MessageQueue();
    this.subAgents = new Map();
    this.activeTasks = new Map();
    this.taskResults = new Map();
    
    this.setupMessageHandlers();
  }

  /**
   * Настроить обработчики сообщений
   */
  setupMessageHandlers() {
    this.messageQueue.on('message', (envelope) => {
      console.log(`[Orchestrator] Получено сообщение: ${envelope.id}`);
    });

    this.messageQueue.on('status-update', (envelope) => {
      if (envelope.status === 'completed' || envelope.status === 'failed') {
        this.handleTaskCompletion(envelope);
      }
    });
  }

  /**
   * Зарегистрировать sub-агента
   */
  registerSubAgent(agentId, agentInfo) {
    this.subAgents.set(agentId, {
      id: agentId,
      ...agentInfo,
      status: 'idle',
      currentTask: null
    });
    console.log(`[Orchestrator] Зарегистрирован sub-агент: ${agentId}`);
  }

  /**
   * Декомпозиция сложной задачи на подзадачи
   */
  decomposeTask(taskDescription) {
    // Здесь должна быть логика с использованием LLM
    // Для демонстрации возвращаем заглушку
    console.log(`[Orchestrator] Декомпозиция задачи: ${taskDescription}`);
    
    return [
      {
        id: `subtask-${Date.now()}-1`,
        description: `Подзадача 1 для: ${taskDescription}`,
        agentType: 'general',
        priority: 'high'
      },
      {
        id: `subtask-${Date.now()}-2`,
        description: `Подзадача 2 для: ${taskDescription}`,
        agentType: 'general',
        priority: 'normal'
      }
    ];
  }

  /**
   * Назначить задачу sub-агенту
   */
  async assignTask(agentId, task) {
    const agent = this.subAgents.get(agentId);
    if (!agent) {
      throw new Error(`Агент ${agentId} не найден`);
    }

    if (agent.status !== 'idle') {
      console.log(`[Orchestrator] Агент ${agentId} занят, задача поставлена в очередь`);
      // Здесь можно реализовать очередь задач
    }

    const message = createTaskMessage(task.id, task.description, task.priority);
    const messageId = this.messageQueue.send(agentId, message);

    // Обновить статус агента
    agent.status = 'busy';
    agent.currentTask = task.id;
    this.activeTasks.set(task.id, {
      agentId,
      messageId,
      task,
      createdAt: Date.now()
    });

    console.log(`[Orchestrator] Задача ${task.id} назначена агенту ${agentId}`);
    return messageId;
  }

  /**
   * Обработать завершение задачи
   */
  handleTaskCompletion(envelope) {
    const activeTask = this.activeTasks.get(envelope.payload.taskId);
    if (activeTask) {
      const agent = this.subAgents.get(activeTask.agentId);
      if (agent) {
        agent.status = 'idle';
        agent.currentTask = null;
      }

      this.taskResults.set(envelope.payload.taskId, {
        ...envelope,
        processedAt: Date.now()
      });

      this.activeTasks.delete(envelope.payload.taskId);
      this.emit('task-completed', envelope);

      console.log(`[Orchestrator] Задача ${envelope.payload.taskId} завершена`);
    }
  }

  /**
   * Получить статус всех агентов
   */
  getAgentsStatus() {
    const status = {};
    for (const [id, agent] of this.subAgents) {
      status[id] = {
        status: agent.status,
        currentTask: agent.currentTask
      };
    }
    return status;
  }

  /**
   * Получить результат задачи
   */
  getTaskResult(taskId) {
    return this.taskResults.get(taskId);
  }

  /**
   * Агрегировать результаты нескольких задач
   */
  aggregateResults(taskIds) {
    const results = taskIds.map(id => this.getTaskResult(id));
    return {
      totalTasks: taskIds.length,
      completed: results.filter(r => r?.payload?.success).length,
      failed: results.filter(r => !r?.payload?.success).length,
      results
    };
  }

  /**
   * Обработать запрос помощи от sub-агента
   */
  async handleHelpRequest(agentId, helpRequest) {
    console.log(`[Orchestrator] Запрос помощи от ${agentId}: ${helpRequest.question}`);
    
    // Здесь должна быть логика предоставления помощи
    // Например, поиск в общей базе знаний или переназначение задачи
    
    this.emit('help-requested', { agentId, helpRequest });
    
    return {
      status: 'processing',
      message: 'Запрос принят в обработку'
    };
  }
}
