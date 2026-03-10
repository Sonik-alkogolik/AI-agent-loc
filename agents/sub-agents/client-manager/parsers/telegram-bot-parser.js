/**
 * Telegram Bot Parser - Парсинг через Telegram бота
 * Бот должен быть добавлен в каналы как администратор
 * Использует Bot API (не требует API ID/Hash)
 */

import axios from 'axios';
import { OrdersManager } from '../orders-manager.js';

export class TelegramBotParser {
  constructor(botToken) {
    this.botToken = botToken;
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
    this.ordersManager = new OrdersManager();
    
    // Каналы для парсинга (должны быть добавлены как @YourBot)
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
   * Получить информацию о боте
   */
  async getBotInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/getMe`);
      return response.data.result;
    } catch (error) {
      console.error('[TelegramBot] Ошибка получения информации о боте:', error.message);
      return null;
    }
  }

  /**
   * Получить обновления (сообщения)
   */
  async getUpdates(offset = 0, limit = 100, timeout = 30) {
    try {
      const response = await axios.get(`${this.baseUrl}/getUpdates`, {
        params: { offset, limit, timeout }
      });
      return response.data.result;
    } catch (error) {
      console.error('[TelegramBot] Ошибка получения обновлений:', error.message);
      return [];
    }
  }

  /**
   * Получить каналы, где состоит бот
   */
  async getBotChannels() {
    const channels = [];
    
    // Получаем последние обновления
    const updates = await this.getUpdates(0, 100);
    
    for (const update of updates) {
      const chat = update.channel_post?.chat;
      if (chat && chat.type === 'channel') {
        const exists = channels.find(c => c.id === chat.id);
        if (!exists) {
          channels.push({
            id: chat.id,
            username: chat.username,
            title: chat.title
          });
        }
      }
    }
    
    return channels;
  }

  /**
   * Парсинг канала через бота
   * Бот должен быть админом в канале
   */
  async parseChannel(channelId, limit = 50) {
    console.log(`[TelegramBot] Парсинг канала: ${channelId}`);
    
    const leads = [];
    let offset = 0;
    
    while (leads.length < limit) {
      const updates = await this.getUpdates(offset, 10);
      
      if (updates.length === 0) break;
      
      for (const update of updates) {
        const post = update.channel_post;
        
        // Проверяем, что это пост из нужного канала
        if (post && post.chat.id.toString() === channelId.toString()) {
          const text = post.text || '';
          
          // Фильтрация по ключевым словам
          if (this.matchesKeywords(text)) {
            const lead = this.extractLeadData(post, channelId);
            leads.push(lead);
          }
        }
        
        offset = update.update_id + 1;
      }
      
      // Небольшая задержка
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`[TelegramBot] Найдено лидов: ${leads.length}`);
    return leads;
  }

  /**
   * Проверка на ключевые слова
   */
  matchesKeywords(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return this.keywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Извлечение данных лида из поста
   */
  extractLeadData(post, channelId) {
    const text = post.text || '';
    const date = post.date;
    const chat = post.chat;

    // Попытка извлечь контакты
    const phoneMatch = text.match(/[\+]?[0-9\s\-\(\)]{10,}/);
    const tgMatch = text.match(/@(\w+)/);
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);

    return {
      source: 'telegram_bot',
      channel: chat.username || chat.title || channelId,
      messageId: post.message_id.toString(),
      title: text.substring(0, 50).replace(/\n/g, ' '),
      description: text.substring(0, 500),
      contact: {
        telegram: tgMatch ? tgMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        email: emailMatch ? emailMatch[0] : null
      },
      postedAt: new Date(date * 1000).toISOString(),
      rawText: text,
      projectType: this.detectProjectType(text),
      url: `https://t.me/${chat.username || channelId}/${post.message_id}`
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
    if (lower.includes('email') && lower.includes('рассылк')) return 'email';
    if (lower.includes('crm')) return 'crm';

    return 'generic';
  }

  /**
   * Парсинг всех каналов
   */
  async parseAllChannels(limit = 50) {
    console.log('[TelegramBot] Начало парсинга всех каналов...');
    
    const allLeads = [];
    
    // Получаем каналы, где состоит бот
    const channels = await this.getBotChannels();
    
    if (channels.length === 0) {
      console.log('[TelegramBot] Бот не состоит ни в одном канале');
      console.log('[TelegramBot] Добавьте бота как администратора в каналы');
      return [];
    }
    
    console.log(`[TelegramBot] Найдено каналов: ${channels.length}`);
    
    for (const channel of channels) {
      console.log(`\n[TelegramBot] Канал: ${channel.title} (@${channel.username || channel.id})`);
      const leads = await this.parseChannel(channel.id, Math.ceil(limit / channels.length));
      allLeads.push(...leads);
      
      // Задержка между каналами
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n[TelegramBot] Всего найдено лидов: ${allLeads.length}`);
    return allLeads;
  }

  /**
   * Сохранить найденные лиды в OrdersManager
   */
  async saveLeads(leads) {
    await this.ordersManager.initialize();
    return await this.ordersManager.saveOrders(leads);
  }

  /**
   * Парсинг и сохранение
   */
  async parseAndSave(limit = 50) {
    const leads = await this.parseAllChannels(limit);
    
    if (leads.length === 0) {
      console.log('[TelegramBot] Лиды не найдены');
      return [];
    }
    
    const saved = await this.saveLeads(leads);
    console.log(`[TelegramBot] Сохранено заказов: ${saved.length}`);
    
    // Статистика
    const stats = this.ordersManager.getStats(saved);
    console.log('[TelegramBot] Статистика:', JSON.stringify(stats, null, 2));
    
    return saved;
  }

  /**
   * Отправить сообщение (для уведомлений)
   */
  async sendMessage(chatId, text) {
    try {
      await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      });
      return true;
    } catch (error) {
      console.error('[TelegramBot] Ошибка отправки сообщения:', error.message);
      return false;
    }
  }

  /**
   * Отправить уведомление о новых лидах
   */
  async notifyNewLeads(leads, adminChatId) {
    if (leads.length === 0) return;
    
    const text = `🔔 *Новые лиды найдены!*\n\n` +
      `Найдено: ${leads.length}\n\n` +
      leads.slice(0, 5).map((lead, i) => 
        `${i + 1}. *${lead.title || 'Без названия'}*\n` +
        `   Источник: ${lead.channel}\n` +
        `   Тип: ${lead.projectType}\n` +
        `   [Пост](${lead.url})`
      ).join('\n\n') +
      (leads.length > 5 ? `\n\n... и ещё ${leads.length - 5}` : '');
    
    await this.sendMessage(adminChatId, text);
  }
}

export default TelegramBotParser;
