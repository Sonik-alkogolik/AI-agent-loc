/**
 * Система коммуникации между агентами
 * Реализует очередь сообщений и протоколы обмена
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export class MessageQueue extends EventEmitter {
  constructor() {
    super();
    this.messages = new Map();
    this.subscribers = new Map();
  }

  /**
   * Отправить сообщение агенту
   */
  send(targetAgent, message) {
    const messageId = uuidv4();
    const envelope = {
      id: messageId,
      from: 'senior-agent',
      to: targetAgent,
      payload: message,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    this.messages.set(messageId, envelope);
    this.emit('message', envelope);
    
    console.log(`[MessageQueue] Сообщение отправлено: ${targetAgent}`);
    return messageId;
  }

  /**
   * Подписаться на сообщения для агента
   */
  subscribe(agentId, callback) {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, []);
    }
    this.subscribers.get(agentId).push(callback);
    console.log(`[MessageQueue] Агент ${agentId} подписан на сообщения`);
  }

  /**
   * Получить сообщение по ID
   */
  getMessage(messageId) {
    return this.messages.get(messageId);
  }

  /**
   * Обновить статус сообщения
   */
  updateStatus(messageId, status, result = null) {
    const message = this.messages.get(messageId);
    if (message) {
      message.status = status;
      message.result = result;
      message.updatedAt = Date.now();
      this.emit('status-update', message);
    }
  }
}

/**
 * Протоколы коммуникации
 */
export const Protocol = {
  TASK_ASSIGN: 'task_assign',
  TASK_COMPLETE: 'task_complete',
  TASK_FAILED: 'task_failed',
  REQUEST_HELP: 'request_help',
  PROVIDE_HELP: 'provide_help',
  STATUS_REQUEST: 'status_request',
  STATUS_RESPONSE: 'status_response',
  KNOWLEDGE_UPDATE: 'knowledge_update'
};

/**
 * Создать сообщение задачи
 */
export function createTaskMessage(taskId, description, priority = 'normal', metadata = {}) {
  return {
    type: Protocol.TASK_ASSIGN,
    taskId,
    description,
    priority,
    metadata,
    createdAt: Date.now()
  };
}

/**
 * Создать сообщение результата
 */
export function createResultMessage(taskId, success, result, error = null) {
  return {
    type: success ? Protocol.TASK_COMPLETE : Protocol.TASK_FAILED,
    taskId,
    success,
    result,
    error,
    completedAt: Date.now()
  };
}

/**
 * Создать запрос помощи к Senior Agent
 */
export function createHelpRequest(agentId, taskId, question, context = {}) {
  return {
    type: Protocol.REQUEST_HELP,
    from: agentId,
    taskId,
    question,
    context,
    timestamp: Date.now()
  };
}
