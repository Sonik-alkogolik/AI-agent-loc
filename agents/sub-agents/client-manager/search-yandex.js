/**
 * Поиск заказов через Яндекс
 * Выводит результаты на экран
 */

import { YandexParser } from './parsers/yandex-parser.js';
import { ClientManagerAgent } from './agent.js';
import { MessageQueue } from '../../../shared/communication.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import readline from 'readline';

const OUTPUT_DIR = './parsed_output';

/**
 * Главная функция
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║     Client Manager - Поиск заказов (Яндекс)   ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  const parser = new YandexParser();
  
  // Парсинг всех запросов
  const results = await parser.parseAllQueries(5);
  
  // Фильтрация релевантных
  const relevant = parser.filterRelevant(results);
  
  console.log(`\n✅ Найдено заказов: ${relevant.length} (из ${results.length})`);
  
  // Вывод на экран
  parser.displayResults(relevant);
  
  // Сохранение
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await parser.saveResults(relevant, join(OUTPUT_DIR, 'yandex_results.json'));
  await parser.generateMarkdownReport(relevant, join(OUTPUT_DIR, 'yandex_report.md'));
  
  // Предложение импорта в CRM
  if (relevant.length > 0) {
    const answer = await askQuestion('📥 Импортировать заказы в CRM? (y/n): ');
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'y') {
      await importToCRM(relevant);
    }
  }
  
  console.log('\n✨ Парсинг завершён!\n');
}

/**
 * Импорт в CRM
 */
async function importToCRM(results) {
  console.log('\n📋 Импорт в CRM...\n');
  
  const messageQueue = new MessageQueue();
  const clientManager = new ClientManagerAgent();
  
  try {
    await clientManager.initialize(messageQueue);
    
    let imported = 0;
    for (const result of results) {
      try {
        const lead = {
          name: `Заказ из ${result.source}`,
          contact: {},
          source: result.source || 'yandex',
          projectType: detectProjectType(result.title + ' ' + result.description),
          description: `${result.title}\n${result.description}\n\nСсылка: ${result.link}`,
          url: result.link
        };
        
        await clientManager.addLead(lead);
        imported++;
        console.log(`  + Добавлен: ${lead.name}`);
        
      } catch (error) {
        console.error(`  - Ошибка: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Импортировано: ${imported}/${results.length}`);
    
    // Статистика
    const stats = clientManager.getStats();
    console.log('\n📊 Статистика CRM:');
    console.log(`   Всего клиентов: ${stats.total}`);
    console.log(`   Лиды: ${stats.byStatus.lead}`);
    
  } catch (error) {
    console.error('Ошибка импорта:', error.message);
  }
}

/**
 * Определение типа проекта
 */
function detectProjectType(text) {
  const lower = text.toLowerCase();
  
  if (lower.includes('bitrix')) return 'bitrix';
  if (lower.includes('wordpress')) return 'wordpress';
  if (lower.includes('лендинг') || lower.includes('landing')) return 'landing';
  if (lower.includes('интернет-магазин')) return 'shop';
  if (lower.includes('верст')) return 'layout';
  
  return 'generic';
}

/**
 * Запрос ввода пользователю
 */
function askQuestion(question) {
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

// Запуск
main().catch(console.error);
