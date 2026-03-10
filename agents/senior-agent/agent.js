/**
 * Senior Agent - Главный AI-агент
 * Координирует работу sub-агентов, управляет задачами и знаниями
 */

import { Orchestrator } from './orchestrator.js';
import { BaseMDManager } from '../../shared/base-md.js';
import { Protocol, createHelpRequest } from '../../shared/communication.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class SeniorAgent {
  constructor(configPath = '../../config.json') {
    this.config = null;
    this.orchestrator = null;
    this.knowledgeBase = null;
    this.subAgents = new Map();
    this.initialized = false;
  }

  /**
   * Инициализация Senior Agent
   */
  async initialize() {
    console.log('[SeniorAgent] Инициализация...');

    // Загрузка конфигурации
    const configFullPath = join(__dirname, configPath);
    const configData = await fs.readFile(configFullPath, 'utf-8');
    this.config = JSON.parse(configData);

    // Инициализация оркестратора
    this.orchestrator = new Orchestrator(this.config);
    this.orchestrator.on('task-completed', (event) => {
      this.handleTaskCompleted(event);
    });

    // Инициализация общей базы знаний
    this.knowledgeBase = new BaseMDManager('senior-agent', join(__dirname, 'knowledge-base'));
    await this.knowledgeBase.initialize();

    // Загрузка sub-агентов
    await this.loadSubAgents();

    this.initialized = true;
    console.log('[SeniorAgent] Инициализация завершена');
    
    // Запись в базу знаний
    await this.knowledgeBase.addMemory(
      'Инициализация системы',
      `Система AI-агентов успешно инициализирована.
      Количество sub-агентов: ${this.subAgents.size}
      Время запуска: ${new Date().toISOString()}`,
      3
    );
  }

  /**
   * Загрузить доступных sub-агентов
   */
  async loadSubAgents() {
    const subAgentsPath = join(__dirname, '../sub-agents');
    
    try {
      const entries = await fs.readdir(subAgentsPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const agentConfigPath = join(subAgentsPath, entry.name, 'agent-config.json');
          try {
            await fs.access(agentConfigPath);
            const configData = await fs.readFile(agentConfigPath, 'utf-8');
            const config = JSON.parse(configData);
            
            this.subAgents.set(entry.name, config);
            this.orchestrator.registerSubAgent(entry.name, config);
            
            console.log(`[SeniorAgent] Загружен sub-агент: ${entry.name}`);
          } catch {
            console.log(`[SeniorAgent] Агент ${entry.name} не имеет конфигурации, пропускается`);
          }
        }
      }
    } catch (error) {
      console.log('[SeniorAgent] Папка sub-agents пуста или не существует');
    }
  }

  /**
   * Обработать входящую задачу от пользователя
   */
  async handleUserTask(taskDescription, options = {}) {
    if (!this.initialized) {
      throw new Error('Senior Agent не инициализирован');
    }

    console.log(`[SeniorAgent] Получена задача: ${taskDescription}`);

    // Декомпозиция задачи
    const subtasks = this.orchestrator.decomposeTask(taskDescription);
    
    // Запись задачи в базу знаний
    await this.knowledgeBase.addContext(
      `Задача: ${taskDescription}`,
      `Описание: ${taskDescription}\nПодзадач: ${subtasks.length}`,
      ['task', 'user-request']
    );

    // Распределение подзадач
    const taskPromises = [];
    for (const subtask of subtasks) {
      const agentId = this.selectAgentForTask(subtask);
      if (agentId) {
        taskPromises.push(this.orchestrator.assignTask(agentId, subtask));
      }
    }

    return {
      taskId: `task-${Date.now()}`,
      subtasksCount: subtasks.length,
      assignedAgents: taskPromises.length,
      status: 'processing'
    };
  }

  /**
   * Выбрать агента для задачи
   */
  selectAgentForTask(subtask) {
    // Простая логика выбора - первый свободный агент
    for (const [agentId, agent] of this.subAgents) {
      const status = this.orchestrator.getAgentsStatus()[agentId];
      if (status?.status === 'idle') {
        return agentId;
      }
    }
    
    // Если все заняты, возвращаем первого
    const firstAgent = this.subAgents.keys().next().value;
    return firstAgent;
  }

  /**
   * Обработать завершение задачи
   */
  async handleTaskCompleted(event) {
    console.log(`[SeniorAgent] Задача завершена: ${event.payload.taskId}`);
    
    // Сохранение результата в базу знаний
    const result = event.result || event.payload.result;
    await this.knowledgeBase.addTask(
      event.payload.taskId,
      event.payload.description,
      JSON.stringify(result, null, 2),
      event.payload.success ? 'completed' : 'failed'
    );
  }

  /**
   * Обработать запрос помощи от sub-агента
   */
  async handleHelpRequest(agentId, question, context = {}) {
    console.log(`[SeniorAgent] Запрос помощи от ${agentId}`);
    
    // Поиск ответа в базе знаний
    const searchResults = await this.knowledgeBase.search(question);
    
    const response = {
      agentId,
      question,
      searchResults,
      timestamp: Date.now()
    };

    // Запись в память
    await this.knowledgeBase.addMemory(
      `Запрос помощи от ${agentId}`,
      `Вопрос: ${question}\nНайдено результатов: ${searchResults.length}`,
      2
    );

    return response;
  }

  /**
   * Получить статус системы
   */
  getStatus() {
    return {
      initialized: this.initialized,
      subAgentsCount: this.subAgents.size,
      agentsStatus: this.orchestrator?.getAgentsStatus() || {},
      knowledgeBasePath: this.knowledgeBase?.basePath
    };
  }

  /**
   * Добавить нового sub-агента
   */
  async registerSubAgent(agentId, agentConfig) {
    const agentPath = join(__dirname, '../sub-agents', agentId);
    
    // Создать папку агента
    await fs.mkdir(agentPath, { recursive: true });
    
    // Сохранить конфигурацию
    const configPath = join(agentPath, 'agent-config.json');
    await fs.writeFile(configPath, JSON.stringify(agentConfig, null, 2));
    
    // Создать BaseMD для агента
    const baseMDPath = join(agentPath, 'BaseMD');
    const agentBaseMD = new BaseMDManager(agentId, baseMDPath);
    await agentBaseMD.initialize();

    // Зарегистрировать в оркестраторе
    this.subAgents.set(agentId, agentConfig);
    this.orchestrator.registerSubAgent(agentId, agentConfig);

    console.log(`[SeniorAgent] Зарегистрирован новый агент: ${agentId}`);
    return agentPath;
  }
}

// Точка входа для запуска Senior Agent
async function main() {
  const seniorAgent = new SeniorAgent();
  
  try {
    await seniorAgent.initialize();
    
    console.log('\n=== Senior Agent готов к работе ===\n');
    console.log('Статус:', seniorAgent.getStatus());
    
    // Пример обработки задачи
    // const result = await seniorAgent.handleUserTask('Создать новый компонент для приложения');
    // console.log('Результат:', result);
    
  } catch (error) {
    console.error('[SeniorAgent] Ошибка:', error);
    process.exit(1);
  }
}

// Запуск если файл запущен напрямую
if (process.argv[1]?.includes('senior-agent/agent.js')) {
  main();
}

export default SeniorAgent;
