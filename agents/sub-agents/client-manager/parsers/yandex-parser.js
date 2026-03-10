/**
 * Парсер Яндекс Поиска
 * Ищет заказы на фриланс-биржах и форумах по поисковым запросам
 * Использует axios + cheerio для парсинга выдачи
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import { join } from 'path';

export class YandexParser {
  constructor() {
    // Поисковые запросы для поиска заказов
    this.searchQueries = [
      'заказать сайт wordpress разработка',
      'заказать сайт bitrix разработка',
      'верстка сайта на заказ',
      'разработка лендинга заказать',
      'интернет магазин под ключ заказать',
      'доработать сайт wordpress',
      'доработать сайт bitrix',
      'исправить ошибки сайта',
      'техническая поддержка сайта',
      'веб разработчик требуется',
      'создать сайт с нуля заказать',
      'интеграция bitrix wordpress'
    ];
    
    // Сайты для приоритетного поиска
    this.targetSites = [
      'fl.ru',
      'freelance.ru',
      'kwork.ru',
      'weblancer.net',
      'freelancehunt.com',
      'habr.com/freelance',
      't.me',
      'vk.com'
    ];
    
    this.baseUrl = 'https://yandex.ru/search';
    this.results = [];
  }

  /**
   * Поиск в Яндексе
   */
  async search(query, limit = 10) {
    console.log(`[Yandex] Поиск: ${query}`);
    
    try {
      // Эмуляция браузера
      const response = await axios.get(this.baseUrl, {
        params: { text: query },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://yandex.ru/'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      const items = [];
      
      // Парсинг результатов поиска
      // Яндекс использует различные классы, поэтому ищем по общим селекторам
      $('li.serp-item, .serp-item, .organic, .SearchItem').each((i, elem) => {
        if (items.length >= limit) return;
        
        const $elem = $(elem);
        const titleEl = $elem.find('h2 a, .organic__title a, a.Link');
        const linkEl = $elem.find('h2 a, .organic__url a, a.Link');
        const descEl = $elem.find('.organic__text, .Organic-Content, .Path');
        
        if (titleEl.length > 0 && linkEl.length > 0) {
          const title = titleEl.text().trim();
          const link = linkEl.attr('href');
          const desc = descEl.text().trim();
          
          // Пропускаем рекламу и Яндекс-сервисы
          if (link && !link.includes('yandex.ru') && !link.includes('/ads/')) {
            items.push({
              title,
              link: link.startsWith('http') ? link : `https://yandex.ru${link}`,
              description: desc,
              source: this.detectSource(link),
              query: query,
              foundAt: new Date().toISOString()
            });
          }
        }
      });
      
      console.log(`[Yandex] Найдено результатов: ${items.length}`);
      return items;
      
    } catch (error) {
      console.error(`[Yandex] Ошибка поиска "${query}":`, error.message);
      
      // Если Яндекс блокирует, возвращаем заглушку
      if (error.code === 'ERR_BAD_REQUEST' || error.response?.status === 429) {
        console.log('[Yandex] Возможно, Яндекс блокирует запросы. Попробуйте позже.');
      }
      
      return [];
    }
  }

  /**
   * Определение источника (биржа, канал и т.д.)
   */
  detectSource(url) {
    if (!url) return 'unknown';
    
    const urlLower = url.toLowerCase();
    
    for (const site of this.targetSites) {
      if (urlLower.includes(site)) {
        return site;
      }
    }
    
    if (urlLower.includes('freelance')) return 'freelance-site';
    if (urlLower.includes('telegram')) return 'telegram';
    if (urlLower.includes('vk.com')) return 'vk';
    if (urlLower.includes('habr')) return 'habr';
    
    return 'other';
  }

  /**
   * Парсинг по всем запросам
   */
  async parseAllQueries(resultsPerQuery = 5) {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║     Яндекс Парсер - Поиск заказов             ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    const allResults = [];
    
    for (const query of this.searchQueries) {
      const results = await this.search(query, resultsPerQuery);
      allResults.push(...results);
      
      // Задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    }
    
    // Удаление дубликатов
    const uniqueResults = this.removeDuplicates(allResults);
    
    console.log(`\n📊 Всего найдено: ${uniqueResults.length} заказов`);
    return uniqueResults;
  }

  /**
   * Удаление дубликатов по URL
   */
  removeDuplicates(results) {
    const seen = new Set();
    return results.filter(item => {
      if (seen.has(item.link)) return false;
      seen.add(item.link);
      return true;
    });
  }

  /**
   * Фильтрация по релевантности
   */
  filterRelevant(results) {
    const relevantKeywords = [
      'заказать', 'разработка', 'создать', 'требуется',
      'нужен', 'ищу', 'предложение', 'проект',
      'wordpress', 'bitrix', 'верстка', 'сайт',
      'лендинг', 'интернет-магазин', 'cms'
    ];
    
    return results.filter(item => {
      const text = (item.title + ' ' + item.description).toLowerCase();
      return relevantKeywords.some(keyword => text.includes(keyword));
    });
  }

  /**
   * Вывод результатов на экран
   */
  displayResults(results) {
    console.log('\n' + '═'.repeat(60));
    console.log('           НАЙДЕННЫЕ ЗАКАЗЫ');
    console.log('═'.repeat(60) + '\n');
    
    if (results.length === 0) {
      console.log('❌ Ничего не найдено\n');
      return;
    }
    
    // Группировка по источникам
    const grouped = {};
    for (const result of results) {
      const source = result.source || 'other';
      if (!grouped[source]) grouped[source] = [];
      grouped[source].push(result);
    }
    
    // Вывод по группам
    for (const [source, items] of Object.entries(grouped)) {
      console.log(`\n📌 ${source.toUpperCase()} (${items.length})`);
      console.log('─'.repeat(60));
      
      items.forEach((item, index) => {
        console.log(`\n[${index + 1}] ${item.title}`);
        console.log(`    🔗 ${item.link}`);
        if (item.description) {
          const shortDesc = item.description.substring(0, 150);
          console.log(`    📝 ${shortDesc}${item.description.length > 150 ? '...' : ''}`);
        }
        console.log(`    🕐 ${new Date(item.foundAt).toLocaleString('ru-RU')}`);
      });
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log(`ВСЕГО: ${results.length} заказов`);
    console.log('═'.repeat(60) + '\n');
  }

  /**
   * Сохранение результатов в файл
   */
  async saveResults(results, outputPath = './parsed_output/yandex_results.json') {
    await fs.mkdir(join(outputPath, '..'), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`💾 Результаты сохранены: ${outputPath}`);
  }

  /**
   * Генерация отчёта в Markdown
   */
  async generateMarkdownReport(results, outputPath = './parsed_output/yandex_report.md') {
    let report = `# Отчёт по поиску заказов\n\n`;
    report += `**Дата:** ${new Date().toLocaleString('ru-RU')}\n`;
    report += `**Всего найдено:** ${results.length}\n\n`;
    report += `---\n\n`;
    
    // Группировка
    const grouped = {};
    for (const result of results) {
      const source = result.source || 'other';
      if (!grouped[source]) grouped[source] = [];
      grouped[source].push(result);
    }
    
    for (const [source, items] of Object.entries(grouped)) {
      report += `## ${source.toUpperCase()} (${items.length})\n\n`;
      
      items.forEach((item, index) => {
        report += `### ${index + 1}. ${item.title}\n\n`;
        report += `- **Ссылка:** ${item.link}\n`;
        report += `- **Описание:** ${item.description || 'Нет описания'}\n`;
        report += `- **Найдено:** ${new Date(item.foundAt).toLocaleString('ru-RU')}\n\n`;
        report += `---\n\n`;
      });
    }
    
    await fs.writeFile(outputPath, report, 'utf-8');
    console.log(`📄 Markdown отчёт: ${outputPath}`);
  }
}

export default YandexParser;
