/**
 * Парсер Telegram-каналов с вакансиями
 * Использует MTProto API через библиотеку gramjs
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { promises as fs } from 'fs';
import { join } from 'path';
import readline from 'readline';

export class TelegramParser {
  constructor(apiId, apiHash, sessionPath = './session.json') {
    this.apiId = parseInt(apiId);
    this.apiHash = apiHash;
    this.sessionPath = sessionPath;
    this.client = null;
    this.session = null;
    
    // Каналы для парсинга
    this.channels = [
      'FreelanceBay',
      'frilanserov_chat',
      'freelancce',
      'udafrii',
      'freelancechoice'
    ];
    
    // Ключевые слова для фильтрации
    this.keywords = [
      'wordpress',
      'bitrix',
      'вёрстка',
      'создать сайт',
      'разработка сайта',
      'доработать сайт',
      'интернет магазин',
      'интеграция',
      'cms',
      'landing',
      'лендинг',
      'html',
      'css',
      'php'
    ];
  }

  /**
   * Запрос ввода пользователю
   */
  async askQuestion(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  /**
   * Инициализация клиента
   */
  async initialize() {
    console.log('[TelegramParser] Инициализация...');
    
    // Загрузка или создание сессии
    try {
      const sessionData = await fs.readFile(this.sessionPath, 'utf-8');
      this.session = new StringSession(sessionData);
      console.log('[TelegramParser] Сессия загружена');
    } catch {
      this.session = new StringSession('');
      console.log('[TelegramParser] Новая сессия');
    }
    
    this.client = new TelegramClient(this.session, this.apiId, this.apiHash, {
      connectionRetries: 5,
      useWSS: true
    });
    
    await this.client.start({
      phoneNumber: async () => await this.askQuestion('Введите номер телефона: '),
      password: async () => await this.askQuestion('Введите пароль (если 2FA): '),
      phoneCode: async () => await this.askQuestion('Введите код из Telegram: '),
      onError: (err) => console.log('[TelegramParser] Ошибка:', err)
    });
    
    console.log('[TelegramParser] Авторизация успешна');
  }

  /**
   * Парсинг канала
   */
  async parseChannel(channelName, limit = 50) {
    console.log(`[TelegramParser] Парсинг канала: ${channelName}`);
    
    try {
      const entity = await this.client.getEntity(channelName);
      const messages = await this.client.getMessages(entity, { limit });
      
      const leads = [];
      
      for (const message of messages) {
        const text = message.message || '';
        
        // Проверка на ключевые слова
        if (this.matchesKeywords(text)) {
          const lead = this.extractLeadData(message, channelName);
          leads.push(lead);
        }
      }
      
      console.log(`[TelegramParser] Найдено лидов: ${leads.length}`);
      return leads;
      
    } catch (error) {
      console.error(`[TelegramParser] Ошибка парсинга ${channelName}:`, error.message);
      return [];
    }
  }

  /**
   * Проверка на совпадение ключевых слов
   */
  matchesKeywords(text) {
    const lowerText = text.toLowerCase();
    return this.keywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Извлечение данных лида из сообщения
   */
  extractLeadData(message, channelName) {
    const text = message.message || '';
    const date = message.date;
    
    // Попытка извлечь контакты
    const phoneMatch = text.match(/[\+]?[0-9\s\-\(\)]{10,}/);
    const tgMatch = text.match(/@(\w+)/);
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    
    return {
      source: 'telegram',
      channel: channelName,
      messageId: message.id.toString(),
      description: text.substring(0, 500),
      contact: {
        telegram: tgMatch ? tgMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        email: emailMatch ? emailMatch[0] : null
      },
      postedAt: date ? new Date(date * 1000).toISOString() : new Date().toISOString(),
      rawText: text,
      projectType: this.detectProjectType(text)
    };
  }

  /**
   * Определение типа проекта
   */
  detectProjectType(text) {
    const lower = text.toLowerCase();
    
    if (lower.includes('bitrix')) return 'bitrix';
    if (lower.includes('wordpress')) return 'wordpress';
    if (lower.includes('лендинг') || lower.includes('landing')) return 'landing';
    if (lower.includes('интернет-магазин') || lower.includes('интернет магазин')) return 'shop';
    
    return 'generic';
  }

  /**
   * Парсинг всех каналов
   */
  async parseAllChannels(limit = 50) {
    console.log('[TelegramParser] Начало парсинга всех каналов...');
    
    const allLeads = [];
    
    for (const channel of this.channels) {
      const leads = await this.parseChannel(channel, limit);
      allLeads.push(...leads);
      
      // Небольшая задержка между каналами
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`[TelegramParser] Всего найдено лидов: ${allLeads.length}`);
    return allLeads;
  }

  /**
   * Сохранение лидов в файл
   */
  async saveLeads(leads, outputPath = './parsed_leads.json') {
    await fs.writeFile(outputPath, JSON.stringify(leads, null, 2), 'utf-8');
    console.log(`[TelegramParser] Лиды сохранены в ${outputPath}`);
  }

  /**
   * Закрыть соединение
   */
  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      console.log('[TelegramParser] Соединение закрыто');
    }
  }
}

export default TelegramParser;
