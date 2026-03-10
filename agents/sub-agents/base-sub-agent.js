/**
 * Базовый класс Sub-Agent
 * Все sub-агенты наследуются от этого класса
 */

import { EventEmitter } from 'events';
import { BaseMDManager } from '../../shared/base-md.js';
import { Protocol, createResultMessage, createHelpRequest } from '../../shared/communication.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class SubAgent extends EventEmitter {
  constructor(agentId, config = {}) {
    super();
    this.agentId = agentId;
    this.config = config;
    this.status = 'idle';
    this.currentTask = null;
    this.baseMD = null;
    this.messageQueue = null;
    this.initialized = false;
  }

  /**
   * Инициализация sub-агента
   */
  async initialize(messageQueue) {
    console.log(`[SubAgent:${this.agentId}] Инициализация...`);

    this.messageQueue = messageQueue;

    // Инициализация базы знаний агента
    const agentPath = join(__dirname, '../sub-agents', this.agentId);
    const baseMDPath = join(agentPath, 'BaseMD');
    this.baseMD = new BaseMDManager(this.agentId, baseMDPath);
    await this.baseMD.initialize();

    // Подписка на сообщения
    this.messageQueue.subscribe(this.agentId, (message) => {
      this.handleMessage(message);
    });

    this.initialized = true;
    console.log(`[SubAgent:${this.agentId}] Инициализация завершена`);

    // Запись в базу знаний
    await this.baseMD.addMemory(
      'Инициализация агента',
      `Агент ${this.agentId} успешно инициализирован.
      Тип: ${this.config.type || 'general'}
      Время запуска: ${new Date().toISOString()}`,
      3
    );
  }

  /**
   * Обработать входящее сообщение
   */
  async handleMessage(envelope) {
    const { payload } = envelope;
    
    console.log(`[SubAgent:${this.agentId}] Получено сообщение типа: ${payload.type}`);

    switch (payload.type) {
      case Protocol.TASK_ASSIGN:
        await this.handleTaskAssign(payload);
        break;
      
      case Protocol.PROVIDE_HELP:
        await this.handleProvideHelp(payload);
        break;
      
      default:
        console.log(`[SubAgent:${this.agentId}] Неизвестный тип сообщения: ${payload.type}`);
    }
  }

  /**
   * Обработать назначение задачи
   */
  async handleTaskAssign(taskMessage) {
    this.status = 'busy';
    this.currentTask = taskMessage;

    console.log(`[SubAgent:${this.agentId}] Получена задача: ${taskMessage.taskId}`);

    // Запись задачи в базу знаний
    await this.baseMD.addContext(
      `Задача ${taskMessage.taskId}`,
      taskMessage.description,
      ['task', 'assigned']
    );

    try {
      // Выполнение задачи (переопределяется в подклассах)
      const result = await this.executeTask(taskMessage);

      // Отправка результата
      await this.sendResult(taskMessage.taskId, true, result);

      // Запись результата в базу знаний
      await this.baseMD.addTask(
        taskMessage.taskId,
        taskMessage.description,
        JSON.stringify(result, null, 2),
        'completed'
      );

    } catch (error) {
      console.error(`[SubAgent:${this.agentId}] Ошибка выполнения задачи:`, error);
      await this.sendResult(taskMessage.taskId, false, null, error.message);
      
      await this.baseMD.addTask(
        taskMessage.taskId,
        taskMessage.description,
        `Ошибка: ${error.message}`,
        'failed'
      );
    } finally {
      this.status = 'idle';
      this.currentTask = null;
    }
  }

  /**
   * Выполнить задачу (переопределяется в подклассах)
   */
  async executeTask(taskMessage) {
    // Базовая реализация - заглушка
    // Подклассы должны переопределять этот метод
    console.log(`[SubAgent:${this.agentId}] Выполнение задачи (базовая реализация)`);
    
    return {
      status: 'completed',
      message: 'Задача выполнена (базовая реализация)',
      agentId: this.agentId
    };
  }

  /**
   * Отправить результат выполнения задачи
   */
  async sendResult(taskId, success, result, error = null) {
    const message = createResultMessage(taskId, success, result, error);
    
    // Отправляем результат Senior Agent
    this.messageQueue.send('senior-agent', {
      ...message,
      from: this.agentId
    });

    console.log(`[SubAgent:${this.agentId}] Отправлен результат задачи ${taskId}`);
  }

  /**
   * Запросить помощь у Senior Agent
   */
  async requestHelp(taskId, question, context = {}) {
    console.log(`[SubAgent:${this.agentId}] Запрос помощи: ${question}`);

    const helpRequest = createHelpRequest(this.agentId, taskId, question, context);
    
    // Запись запроса в базу знаний
    await this.baseMD.addMemory(
      'Запрос помощи',
      `Вопрос: ${question}\nЗадача: ${taskId}`,
      4
    );

    return helpRequest;
  }

  /**
   * Обработать полученную помощь
   */
  async handleProvideHelp(helpData) {
    console.log(`[SubAgent:${this.agentId}] Получена помощь:`, helpData);
    
    // Запись помощи в базу знаний
    await this.baseMD.addContext(
      'Полученная помощь',
      JSON.stringify(helpData, null, 2),
      ['help', 'from-senior']
    );

    this.emit('help-received', helpData);
  }

  /**
   * Получить статус агента
   */
  getStatus() {
    return {
      agentId: this.agentId,
      status: this.status,
      currentTask: this.currentTask?.taskId || null,
      initialized: this.initialized,
      config: this.config
    };
  }

  /**
   * Сохранить знание в базу
   */
  async saveKnowledge(title, content, category = 'memory', importance = 3) {
    if (category === 'memory') {
      return await this.baseMD.addMemory(title, content, importance);
    } else if (category === 'context') {
      return await this.baseMD.addContext(title, content, ['knowledge']);
    }
  }

  /**
   * Поиск в базе знаний
   */
  async searchKnowledge(query) {
    return await this.baseMD.search(query);
  }
}

export default SubAgent;
