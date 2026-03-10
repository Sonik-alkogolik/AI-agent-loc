/**
 * Yandex Parser - Парсинг поисковой выдачи Яндекса
 * Сохранение результатов в parse/parse-yandex/{date}/parse_yandex_log_{date}.json
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class YandexParser {
  constructor(options = {}) {
    this.basePath = options.basePath || join(__dirname, '../../parse');
    this.searchQueries = options.queries || [
      'заказать сайт wordpress freelance',
      'разработка сайтов битрикс фриланс',
      'создать интернет магазин цена',
      'верстка лендинга заказать',
      'техническая поддержка сайта москва',
      'ремонт сайта wordpress цена',
      'интеграция crm сайт',
      'доработка сайта битрикс'
    ];
    
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.results = [];
  }

  /**
   * Получить дату в формате DD.MM.YYYY
   */
  getDateFormatted() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /**
   * Получить папку для даты в формате YYYY-MM-DD
   */
  getDateFolder() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Создать структуру папок
   */
  async createFolders() {
    const dateFolder = this.getDateFolder();
    const fullPath = join(this.basePath, 'parse-yandex', dateFolder);
    
    await fs.mkdir(fullPath, { recursive: true });
    return fullPath;
  }

  /**
   * Получить путь к файлу лога
   */
  getLogFilePath() {
    const dateFormatted = this.getDateFormatted();
    const dateFolder = this.getDateFolder();
    return join(this.basePath, 'parse-yandex', dateFolder, `parse_yandex_log_${dateFormatted}.json`);
  }

  /**
   * Парсинг поисковой выдачи Яндекса
   * Примечание: Яндекс может блокировать автоматические запросы
   */
  async search(query, page = 0) {
    const url = `https://yandex.ru/search/?text=${encodeURIComponent(query)}&p=${page}`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://yandex.ru/'
        },
        timeout: 15000,
        maxRedirects: 5
      });

      // Проверка на капчу
      if (response.data.includes('captcha') || response.data.includes('Captcha')) {
        console.log('[YandexParser] ⚠️ Яндекс запросил капчу');
        return [];
      }

      const $ = cheerio.load(response.data);
      const results = [];

      // Основные селекторы для органических результатов
      const selectors = [
        '.serp-item:not([data-cid="ads-algo"])', // Органические результаты
        '[data-cid="organic"]',
        '.Organic',
        'li.serp-item'
      ];

      for (const selector of selectors) {
        const items = $(selector);
        
        if (items.length === 0) continue;

        items.each((_, item) => {
          const $item = $(item);
          
          // Пропускаем рекламу
          if ($item.attr('data-cid') === 'ads-algo' || $item.find('[data-cid="ads-algo"]').length > 0) {
            return;
          }

          const titleEl = $item.find('a[data-cid="title"], h2 a, a.serp-title, .OrganicTitle-LinkText');
          const linkEl = titleEl;
          const snippetEl = $item.find('.OrganicText, .serp-item__text, div.serp-item__text, .Path, .OrganicText-Content');

          if (titleEl.length > 0) {
            const title = titleEl.text().trim();
            let link = linkEl.attr('href') || '';
            const snippet = snippetEl.text().trim();

            // Очистка и фильтрация ссылок
            if (link && !link.includes('yandex.ru/direct') && !link.includes('/ads/')) {
              // Обработка относительных ссылок
              if (link.startsWith('/')) {
                link = 'https://yandex.ru' + link;
              } else if (!link.startsWith('http')) {
                link = 'https://' + link;
              }

              results.push({
                title,
                url: link,
                snippet,
                position: results.length + 1
              });
            }
          }
        });

        if (results.length > 0) break;
      }

      return results;

    } catch (error) {
      console.error(`[YandexParser] Ошибка поиска "${query}":`, error.message);
      
      if (error.response?.status === 429) {
        console.log('[YandexParser] Слишком много запросов, блокировка Яндексом');
      } else if (error.response?.status === 403) {
        console.log('[YandexParser] Доступ запрещён (403)');
      }
      
      return [];
    }
  }

  /**
   * Парсинг по всем запросам
   */
  async parseAllQueries() {
    console.log('[YandexParser] Начало парсинга Яндекса...');
    console.log(`[YandexParser] Запросов: ${this.searchQueries.length}`);
    
    const allResults = [];
    
    for (let i = 0; i < this.searchQueries.length; i++) {
      const query = this.searchQueries[i];
      console.log(`\n[${i + 1}/${this.searchQueries.length}] Поиск: ${query}`);
      
      const results = await this.search(query);
      console.log(`   Найдено результатов: ${results.length}`);
      
      if (results.length > 0) {
        allResults.push({
          query,
          results,
          parsedAt: new Date().toISOString()
        });
      }
      
      // Задержка между запросами (1-3 секунды)
      const delay = Math.floor(Math.random() * 2000) + 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.log(`\n[YandexParser] Всего найдено: ${allResults.length} запросов с результатами`);
    return allResults;
  }

  /**
   * Сохранение результатов в JSON
   */
  async saveResults(results) {
    const folderPath = await this.createFolders();
    const logFilePath = this.getLogFilePath();
    
    const logData = {
      parsedAt: new Date().toISOString(),
      date: this.getDateFormatted(),
      queriesCount: results.length,
      totalResults: results.reduce((sum, r) => sum + r.results.length, 0),
      searchQueries: this.searchQueries,
      results: results
    };
    
    await fs.writeFile(logFilePath, JSON.stringify(logData, null, 2), 'utf-8');
    console.log(`[YandexParser] Результаты сохранены: ${logFilePath}`);
    
    this.results = logData;
    return logData;
  }

  /**
   * Загрузить предыдущие результаты
   */
  async loadPreviousResults() {
    const logFilePath = this.getLogFilePath();
    
    try {
      const data = await fs.readFile(logFilePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Получить статистику результатов
   */
  getStats(logData) {
    const data = logData || this.results;
    
    if (!data || !data.results) {
      return {
        queriesCount: 0,
        totalResults: 0,
        avgResultsPerQuery: 0
      };
    }
    
    const totalResults = data.results.reduce((sum, r) => sum + r.results.length, 0);
    
    return {
      date: data.date,
      queriesCount: data.queriesCount,
      totalResults,
      avgResultsPerQuery: data.queriesCount > 0 ? (totalResults / data.queriesCount).toFixed(1) : 0,
      queries: data.results.map(r => ({
        query: r.query,
        count: r.results.length
      }))
    };
  }

  /**
   * Парсинг и сохранение
   */
  async parseAndSave() {
    const results = await this.parseAllQueries();
    
    if (results.length === 0) {
      console.log('[YandexParser] Результаты не найдены');
      return null;
    }
    
    const logData = await this.saveResults(results);
    
    // Статистика
    const stats = this.getStats(logData);
    console.log('\n[YandexParser] Статистика:');
    console.log(`   Дата: ${stats.date}`);
    console.log(`   Запросов: ${stats.queriesCount}`);
    console.log(`   Всего результатов: ${stats.totalResults}`);
    console.log(`   В среднем на запрос: ${stats.avgResultsPerQuery}`);
    
    return logData;
  }

  /**
   * Экспорт в таблицу
   */
  toTable(logData) {
    const data = logData || this.results;
    
    if (!data || !data.results) {
      return [];
    }
    
    const table = [];
    
    for (const queryData of data.results) {
      for (const result of queryData.results) {
        table.push({
          query: queryData.query,
          position: result.position,
          title: result.title.substring(0, 60),
          url: result.url,
          snippet: result.snippet?.substring(0, 100) || ''
        });
      }
    }
    
    return table;
  }

  /**
   * Вывод таблицы в консоль
   */
  printTable(logData) {
    const table = this.toTable(logData);
    
    if (table.length === 0) {
      console.log('Нет данных для отображения');
      return;
    }
    
    console.log(`\n┌─────────┬──────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────┐`);
    console.log(`│ Запрос  │ Заголовок                                                    │ URL                                             │`);
    console.log(`├─────────┼──────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤`);
    
    table.slice(0, 20).forEach(row => {
      const title = row.title.length > 60 ? row.title.substring(0, 57) + '...' : row.title;
      const url = row.url.length > 47 ? row.url.substring(0, 44) + '...' : row.url;
      console.log(`│ ${row.query.substring(0, 7).padEnd(7)} │ ${title.padEnd(60)} │ ${url.padEnd(47)} │`);
    });
    
    if (table.length > 20) {
      console.log(`│ ... и ещё ${table.length - 20} результатов │`);
    }
    
    console.log(`└─────────┴──────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────┘`);
  }
}

export default YandexParser;
