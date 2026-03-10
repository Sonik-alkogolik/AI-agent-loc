/**
 * Agent-1 - Пример sub-агента общего назначения
 * Наследуется от базового класса SubAgent
 */

import { SubAgent } from '../../agents/sub-agents/base-sub-agent.js';

export class Agent1 extends SubAgent {
  constructor() {
    super('agent-1', {
      type: 'general',
      specialty: 'code_generation'
    });
  }

  /**
   * Переопределённый метод выполнения задачи
   * Специфичная логика для этого агента
   */
  async executeTask(taskMessage) {
    console.log(`[Agent-1] Начинаю выполнение задачи: ${taskMessage.description}`);

    // Симуляция выполнения задачи
    const result = await this.processTask(taskMessage);

    return {
      agentId: this.agentId,
      taskId: taskMessage.taskId,
      result,
      executedAt: new Date().toISOString()
    };
  }

  /**
   * Логика обработки задачи
   */
  async processTask(taskMessage) {
    // Здесь должна быть специфичная логика агента
    // Например: генерация кода, анализ данных, обработка текста
    
    console.log(`[Agent-1] Обработка задачи...`);
    
    // Симуляция работы
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      status: 'success',
      message: `Задача "${taskMessage.description}" выполнена`,
      data: {
        processed: true,
        processingTime: 1000
      }
    };
  }

  /**
   * Пример специализированного метода для генерации кода
   */
  async generateCode(prompt, options = {}) {
    console.log(`[Agent-1] Генерация кода: ${prompt}`);
    
    // Запись в базу знаний
    await this.saveKnowledge(
      'Генерация кода',
      `Запрос: ${prompt}\nОпции: ${JSON.stringify(options)}`,
      'context'
    );

    return {
      code: '// Сгенерированный код',
      language: options.language || 'javascript'
    };
  }

  /**
   * Пример специализированного метода для анализа данных
   */
  async analyzeData(data, options = {}) {
    console.log(`[Agent-1] Анализ данных`);
    
    // Запись в базу знаний
    await this.saveKnowledge(
      'Анализ данных',
      `Объём данных: ${JSON.stringify(data).length} байт`,
      'memory',
      2
    );

    return {
      summary: 'Данные проанализированы',
      metrics: {
        count: Array.isArray(data) ? data.length : 1,
        size: JSON.stringify(data).length
      }
    };
  }
}

// Точка входа для запуска агента
async function main() {
  const agent = new Agent1();
  
  try {
    // Для демонстрации создадим mock message queue
    const mockMessageQueue = {
      subscribe: () => {},
      send: () => {}
    };
    
    await agent.initialize(mockMessageQueue);
    
    console.log('\n=== Agent-1 готов к работе ===\n');
    console.log('Статус:', agent.getStatus());
    
    // Пример выполнения задачи
    const taskResult = await agent.executeTask({
      taskId: 'demo-task-1',
      description: 'Демонстрационная задача'
    });
    
    console.log('\nРезультат выполнения:', taskResult);
    
  } catch (error) {
    console.error('[Agent-1] Ошибка:', error);
    process.exit(1);
  }
}

// Запуск если файл запущен напрямую
if (process.argv[1]?.includes('agent-1/agent.js')) {
  main();
}

export default Agent1;
