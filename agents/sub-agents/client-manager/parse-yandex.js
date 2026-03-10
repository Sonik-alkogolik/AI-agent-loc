/**
 * Парсинг поисковой выдачи Яндекса
 * Сохранение результатов в parse/parse-yandex/{date}/parse_yandex_log_{date}.json
 */

import { YandexParser } from './parsers/yandex-parser.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         Yandex Parser - Парсинг поисковой выдачи          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Настройка парсера
  const parser = new YandexParser({
    basePath: join(__dirname, '../../parse'),
    queries: [
      'заказать сайт wordpress freelance',
      'разработка сайтов битрикс фриланс',
      'создать интернет магазин цена',
      'верстка лендинга заказать',
      'техническая поддержка сайта москва',
      'ремонт сайта wordpress цена',
      'интеграция crm сайт',
      'доработка сайта битрикс',
      'фрилансер веб разработчик wordpress',
      'создать сайт на битрикс цена',
      'landing page заказать разработку',
      'интернет магазин под ключ цена'
    ]
  });

  console.log('1. Проверка предыдущих результатов...');
  const previous = await parser.loadPreviousResults();
  
  if (previous) {
    console.log(`   Найдены результаты за ${previous.date}`);
    console.log(`   Запросов: ${previous.queriesCount}`);
    console.log(`   Всего результатов: ${previous.totalResults}`);
    console.log('   \n   Хотите перезаписать? (y/n): ');
    // Для простоты всегда перезаписываем
  }

  console.log('\n2. Запуск парсинга...');
  console.log(`   Запросов в работе: ${parser.searchQueries.length}\n`);

  // Парсинг и сохранение
  const logData = await parser.parseAndSave();

  if (!logData) {
    console.log('\n❌ Парсинг не удался');
    return;
  }

  // Вывод статистики
  const stats = parser.getStats(logData);
  console.log('\n3. Статистика парсинга:');
  console.log(`   Дата: ${stats.date}`);
  console.log(`   Запросов обработано: ${stats.queriesCount}`);
  console.log(`   Всего результатов: ${stats.totalResults}`);
  console.log(`   В среднем на запрос: ${stats.avgResultsPerQuery}`);

  // Таблица результатов
  console.log('\n4. Первые 20 результатов:');
  parser.printTable(logData);

  // Путь к файлу
  const logFilePath = parser.getLogFilePath();
  console.log('\n✅ Парсинг завершён!');
  console.log(`   Файл сохранён: ${logFilePath}`);
  console.log(`   Папка: parse/parse-yandex/${parser.getDateFolder()}/`);
}

main().catch(console.error);
