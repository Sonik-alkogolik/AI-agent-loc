/**
 * Client Manager Agent - Персональный менеджер по поиску и управлению клиентами
 * Наследуется от базового класса SubAgent
 */

import { SubAgent } from '../base-sub-agent.js';
import { BaseMDManager } from '../../../shared/base-md.js';
import { OrdersManager } from './orders-manager.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class ClientManagerAgent extends SubAgent {
  constructor() {
    super('client-manager', {
      type: 'specialized',
      specialty: 'client_acquisition'
    });

    // __dirname уже содержит путь до client-manager
    this.basePath = __dirname;
    this.baseMDPath = join(this.basePath, 'BaseMD');
    this.dataPath = join(this.baseMDPath, 'data', 'clients.json');
    this.infoPath = join(this.baseMDPath, 'info', 'info_developer.md');
    this.templatesPath = join(this.baseMDPath, 'templates');
    this.leadsPath = join(this.baseMDPath, 'leads', 'active');
    this.interactionsPath = join(this.baseMDPath, 'interactions');
    this.ordersPath = join(this.baseMDPath, 'orders');

    this.developerInfo = null;
    this.clientsData = null;
    this.ordersManager = new OrdersManager(this.ordersPath);
  }

  /**
   * Инициализация Client Manager Agent
   */
  async initialize(messageQueue) {
    console.log('[ClientManager] Инициализация...');

    this.messageQueue = messageQueue;

    // Инициализация базы знаний
    this.baseMD = new BaseMDManager(this.agentId, this.baseMDPath);
    await this.baseMD.initialize();

    // Инициализация менеджера заказов
    await this.ordersManager.initialize();

    // Загрузка информации о разработчике
    await this.loadDeveloperInfo();

    // Загрузка данных клиентов
    await this.loadClientsData();

    // Подписка на сообщения
    this.messageQueue.subscribe(this.agentId, (message) => {
      this.handleMessage(message);
    });

    this.initialized = true;
    console.log('[ClientManager] Инициализация завершена');

    // Запись в базу знаний
    await this.baseMD.addMemory(
      'Инициализация агента',
      `Client Manager успешно инициализирован.
      Тип: ${this.config.type}
      Время запуска: ${new Date().toISOString()}`,
      3
    );
  }

  /**
   * Загрузить информацию о разработчике из MD файла
   */
  async loadDeveloperInfo() {
    try {
      const content = await fs.readFile(this.infoPath, 'utf-8');
      this.developerInfo = this.parseDeveloperInfo(content);
      console.log('[ClientManager] Информация о разработчике загружена');
    } catch (error) {
      console.error('[ClientManager] Ошибка загрузки info_developer.md:', error);
      this.developerInfo = this.getDefaultDeveloperInfo();
    }
  }

  /**
   * Парсинг информации о разработчике из MD
   */
  parseDeveloperInfo(content) {
    const info = {
      name: 'Дмитрий',
      specialization: 'Web-разработчик',
      skills: [],
      services: [],
      rate: '500₽/час',
      contactTelegram: 'https://t.me/vveb_front',
      rawContent: content
    };

    // Извлечение имени
    const nameMatch = content.match(/\*\*Имя:\*\*\s*(.+)/i);
    if (nameMatch) info.name = nameMatch[1].trim();

    // Извлечение специализации
    const specMatch = content.match(/\*\*Специализация:\*\*\s*(.+)/i);
    if (specMatch) info.specialization = specMatch[1].trim();

    // Извлечение ставки
    const rateMatch = content.match(/\*\*Ставка:\*\*\s*(.+)/i);
    if (rateMatch) info.rate = rateMatch[1].trim();

    // Извлечение Telegram
    const tgMatch = content.match(/Telegram:\s*(https?:\/\/t\.me\/\w+)/i);
    if (tgMatch) info.contactTelegram = tgMatch[1];

    return info;
  }

  /**
   * Информация о разработчике по умолчанию
   */
  getDefaultDeveloperInfo() {
    return {
      name: 'Дмитрий',
      specialization: 'Web-разработчик',
      skills: ['HTML5', 'CSS3', 'JavaScript', 'PHP', 'WordPress', 'Bitrix'],
      rate: '500₽/час',
      contactTelegram: 'https://t.me/vveb_front',
      rawContent: ''
    };
  }

  /**
   * Загрузить данные клиентов из JSON
   */
  async loadClientsData() {
    try {
      const content = await fs.readFile(this.dataPath, 'utf-8');
      this.clientsData = JSON.parse(content);
      console.log('[ClientManager] Данные клиентов загружены');
    } catch (error) {
      console.error('[ClientManager] Ошибка загрузки clients.json:', error);
      this.clientsData = this.getDefaultClientsData();
    }
  }

  /**
   * Данные клиентов по умолчанию
   */
  getDefaultClientsData() {
    return {
      clients: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0'
      },
      statuses: {
        lead: 'Лид',
        conversation: 'Переписка',
        proposal_sent: 'КП отправлено',
        contract: 'Договор',
        in_progress: 'В работе',
        paid: 'Оплачено'
      }
    };
  }

  /**
   * Сохранить данные клиентов в JSON
   */
  async saveClientsData() {
    this.clientsData.metadata.updatedAt = new Date().toISOString();
    await fs.writeFile(this.dataPath, JSON.stringify(this.clientsData, null, 2), 'utf-8');
  }

  /**
   * ==================== CRM ФУНКЦИОНАЛ ====================
   */

  /**
   * Добавить нового лида/клиента
   */
  async addLead(clientData) {
    const client = {
      id: `client-${Date.now()}`,
      name: clientData.name || 'Неизвестный клиент',
      contact: clientData.contact || {},
      source: clientData.source || 'manual',
      projectType: clientData.projectType || 'generic',
      description: clientData.description || '',
      status: 'lead',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      followUpDate: null,
      proposalData: null
    };

    this.clientsData.clients.push(client);
    await this.saveClientsData();

    // Создание MD-файла лида
    await this.createLeadFile(client);

    console.log(`[ClientManager] Добавлен новый лид: ${client.id}`);
    return client;
  }

  /**
   * Создать MD-файл для лида
   */
  async createLeadFile(client) {
    const filename = `${client.id}-${this.slugify(client.name)}.md`;
    const content = `# Лид: ${client.name}

**ID:** ${client.id}
**Дата создания:** ${client.createdAt}
**Статус:** ${this.clientsData.statuses[client.status]}
**Источник:** ${client.source}
**Тип проекта:** ${client.projectType}

---

## Описание проекта

${client.description || 'Нет описания'}

## Контактная информация

${JSON.stringify(client.contact, null, 2)}

## История взаимодействий

*История будет добавляться по мере общения*

---
*Сгенерировано автоматически Client Manager*
`;
    await fs.writeFile(join(this.leadsPath, filename), content, 'utf-8');
  }

  /**
   * Обновить статус клиента
   */
  async updateStatus(clientId, newStatus) {
    const client = this.clientsData.clients.find(c => c.id === clientId);
    if (!client) {
      throw new Error(`Клиент ${clientId} не найден`);
    }

    const oldStatus = client.status;
    client.status = newStatus;
    client.updatedAt = new Date().toISOString();

    await this.saveClientsData();

    console.log(`[ClientManager] Статус клиента ${clientId} изменён: ${oldStatus} → ${newStatus}`);
    return client;
  }

  /**
   * Получить данные клиента
   */
  getClient(clientId) {
    return this.clientsData.clients.find(c => c.id === clientId);
  }

  /**
   * Получить всех клиентов по статусу
   */
  getClientsByStatus(status) {
    return this.clientsData.clients.filter(c => c.status === status);
  }

  /**
   * ==================== ГЕНЕРАЦИЯ ПРЕДЛОЖЕНИЙ ====================
   */

  /**
   * Сгенерировать коммерческое предложение
   */
  async generateProposal(clientId, customData = {}) {
    const client = this.getClient(clientId);
    if (!client) {
      throw new Error(`Клиент ${clientId} не найден`);
    }

    // Выбор шаблона по типу проекта
    const templateName = this.selectTemplate(client.projectType);
    const templatePath = join(this.templatesPath, templateName);
    
    let template = await fs.readFile(templatePath, 'utf-8');

    // Замена плейсхолдеров
    template = this.fillTemplate(template, {
      clientName: client.name,
      developerName: this.developerInfo.name,
      specialization: this.developerInfo.specialization,
      rate: this.developerInfo.rate,
      contactTelegram: this.developerInfo.contactTelegram,
      projectDescription: client.description,
      ...customData
    });

    // Сохранение предложения
    client.proposalData = {
      generatedAt: new Date().toISOString(),
      template: templateName,
      content: template
    };
    await this.saveClientsData();

    // Обновление статуса
    await this.updateStatus(clientId, 'proposal_sent');

    console.log(`[ClientManager] Сгенерировано КП для клиента ${clientId}`);
    return template;
  }

  /**
   * Выбрать шаблон по типу проекта
   */
  selectTemplate(projectType) {
    const mapping = {
      bitrix: 'proposal-bitrix.md',
      wordpress: 'proposal-wordpress.md',
      landing: 'proposal-landing.md',
      generic: 'proposal-generic.md'
    };
    return mapping[projectType] || mapping.generic;
  }

  /**
   * Заполнить шаблон данными
   */
  fillTemplate(template, data) {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(placeholder, value);
    }
    return result;
  }

  /**
   * ==================== ПОИСК ЛИДОВ ====================
   */

  /**
   * Поиск лидов по запросам (заготовка для парсинга)
   */
  async searchLeads(queries = []) {
    const defaultQueries = [
      'техподдержка сайта',
      'разработчик для сайта',
      'создать сайт',
      'wordpress разработчик',
      'bitrix разработчик',
      'вёрстка сайта',
      'исправить ошибку сайт'
    ];

    const searchQueries = queries.length > 0 ? queries : defaultQueries;
    const leads = [];

    console.log('[ClientManager] Поиск лидов по запросам:', searchQueries);

    // Здесь будет логика парсинга бирж, Telegram, сайтов
    // Для демонстрации возвращаем заглушку
    for (const query of searchQueries) {
      leads.push({
        query,
        found: false,
        message: 'Парсинг будет реализован в следующей версии'
      });
    }

    return leads;
  }

  /**
   * Добавить найденный лид из внешнего источника
   */
  async addLeadFromSource(sourceData) {
    return await this.addLead({
      name: sourceData.clientName || 'Клиент из ' + sourceData.source,
      contact: sourceData.contact || {},
      source: sourceData.source || 'external',
      projectType: sourceData.projectType || 'generic',
      description: sourceData.description || ''
    });
  }

  /**
   * ==================== FOLLOW-UP НАПОМИНАНИЯ ====================
   */

  /**
   * Запланировать follow-up для клиента
   */
  async scheduleFollowUp(clientId, daysFromNow = 3) {
    const client = this.getClient(clientId);
    if (!client) {
      throw new Error(`Клиент ${clientId} не найден`);
    }

    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + daysFromNow);
    
    client.followUpDate = followUpDate.toISOString();
    client.updatedAt = new Date().toISOString();
    
    await this.saveClientsData();

    console.log(`[ClientManager] Follow-up запланирован для ${clientId} на ${followUpDate.toISOString()}`);
    return followUpDate;
  }

  /**
   * Получить список клиентов для follow-up
   */
  getFollowUpList() {
    const now = new Date();
    return this.clientsData.clients.filter(c => 
      c.followUpDate && new Date(c.followUpDate) <= now
    );
  }

  /**
   * ==================== ИСТОРИЯ ВЗАИМОДЕЙСТВИЙ ====================
   */

  /**
   * Записать взаимодействие с клиентом
   */
  async logInteraction(clientId, message, type = 'outgoing') {
    const client = this.getClient(clientId);
    if (!client) {
      throw new Error(`Клиент ${clientId} не найден`);
    }

    // Создание папки для истории клиента
    const clientHistoryPath = join(this.interactionsPath, clientId);
    await fs.mkdir(clientHistoryPath, { recursive: true });

    // Добавление записи в историю
    const filename = `${Date.now()}-${type}.md`;
    const content = `# Взаимодействие с ${client.name}

**Дата:** ${new Date().toISOString()}
**Тип:** ${type === 'outgoing' ? 'Исходящее' : 'Входящее'}

---

${message}

---
*Записано автоматически Client Manager*
`;
    await fs.writeFile(join(clientHistoryPath, filename), content, 'utf-8');

    // Обновление статуса на "переписка" если это первое взаимодействие
    if (client.status === 'lead') {
      await this.updateStatus(clientId, 'conversation');
    }

    console.log(`[ClientManager] Записано взаимодействие с ${clientId}`);
    return filename;
  }

  /**
   * Получить историю взаимодействий с клиентом
   */
  async getHistory(clientId) {
    const clientHistoryPath = join(this.interactionsPath, clientId);
    
    try {
      const files = await fs.readdir(clientHistoryPath);
      const history = [];
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = await fs.readFile(join(clientHistoryPath, file), 'utf-8');
          history.push({ file, content });
        }
      }
      
      return history.sort((a, b) => a.file.localeCompare(b.file));
    } catch (error) {
      console.error('[ClientManager] Ошибка чтения истории:', error);
      return [];
    }
  }

  /**
   * ==================== УТИЛИТЫ ====================
   */

  /**
   * Преобразовать строку в slug
   */
  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Получить сводную статистику
   */
  getStats() {
    const clients = this.clientsData.clients;
    return {
      total: clients.length,
      byStatus: {
        lead: clients.filter(c => c.status === 'lead').length,
        conversation: clients.filter(c => c.status === 'conversation').length,
        proposal_sent: clients.filter(c => c.status === 'proposal_sent').length,
        contract: clients.filter(c => c.status === 'contract').length,
        in_progress: clients.filter(c => c.status === 'in_progress').length,
        paid: clients.filter(c => c.status === 'paid').length
      },
      followUpNeeded: this.getFollowUpList().length
    };
  }

  /**
   * Выполнить задачу (переопределение базового метода)
   */
  async executeTask(taskMessage) {
    const { action, data } = taskMessage.metadata || {};

    console.log(`[ClientManager] Выполнение задачи: ${action}`);

    switch (action) {
      case 'add_lead':
        return await this.addLead(data);
      
      case 'generate_proposal':
        return await this.generateProposal(data.clientId, data.customData);

      case 'update_status':
        return await this.updateStatus(data.clientId, data.status);

      case 'schedule_followup':
        return await this.scheduleFollowUp(data.clientId, data.days);

      case 'log_interaction':
        return await this.logInteraction(data.clientId, data.message, data.type);

      case 'get_stats':
        return this.getStats();

      case 'search_leads':
        return await this.searchLeads(data.queries);

      // Методы работы с заказами
      case 'get_orders':
        return await this.getOrders(data.date);

      case 'get_order_stats':
        return this.getOrdersStats();

      case 'update_order_status':
        return await this.updateOrderStatus(data.orderId, data.status);

      default:
        console.log('[ClientManager] Неизвестное действие:', action);
        return { status: 'unknown_action', action };
    }
  }

  /**
   * ==================== УПРАВЛЕНИЕ ЗАКАЗАМИ ====================
   */

  /**
   * Получить все заказы
   */
  async getOrders(date) {
    if (date) {
      const dateObj = new Date(date);
      return await this.ordersManager.getOrdersByDate(dateObj);
    }
    return await this.ordersManager.getAllOrders();
  }

  /**
   * Получить статистику заказов
   */
  getOrdersStats() {
    const orders = this.ordersManager.toTable(this.ordersManager.getAllOrders());
    return this.ordersManager.getStats(orders);
  }

  /**
   * Обновить статус заказа
   */
  async updateOrderStatus(orderId, status) {
    return await this.ordersManager.updateOrderStatus(orderId, status);
  }

  /**
   * Вывести таблицу заказов в консоль
   */
  printOrdersTable(orders) {
    this.ordersManager.printTable(orders);
  }

  /**
   * Конвертировать заказы в таблицу
   */
  getOrdersTable(orders) {
    return this.ordersManager.toTable(orders);
  }
}

export default ClientManagerAgent;
