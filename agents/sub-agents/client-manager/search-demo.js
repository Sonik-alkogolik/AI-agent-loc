/**
 * Демонстрационный парсер заказов
 * Симулирует найденные заказы для тестирования CRM
 * В реальной версии здесь будет парсинг конкретных бирж
 */

import { ClientManagerAgent } from './agent.js';
import { MessageQueue } from '../../../shared/communication.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import readline from 'readline';

const OUTPUT_DIR = './parsed_output';

/**
 * Генерация тестовых заказов (симуляция парсинга)
 */
function generateDemoOrders() {
  const orders = [
    {
      title: 'Разработка сайта на WordPress для строительной компании',
      description: 'Нужно разработать корпоративный сайт для строительной фирмы. Дизайн есть в Figma. Требуется посадка на WordPress, настройка форм обратной связи, мультиязычность (RU/EN).',
      source: 'fl.ru',
      budget: '30 000 ₽',
      type: 'wordpress',
      url: 'https://fl.ru/projects/123456',
      postedAt: new Date().toISOString()
    },
    {
      title: 'Доработка интернет-магазина на 1С-Bitrix',
      description: 'Требуется доработать существующий интернет-магазин на Bitrix. Добавить новые свойства товаров, настроить импорт из 1С, исправить ошибки в корзине.',
      source: 'freelance.ru',
      budget: '50 000 ₽',
      type: 'bitrix',
      url: 'https://freelance.ru/projects/789012',
      postedAt: new Date().toISOString()
    },
    {
      title: 'Вёрстка лендинга из макета Figma',
      description: 'Нужно сверстать одностраничный сайт (лендинг) из готового макета в Figma. HTML + CSS + JS. Адаптивная вёрстка под мобильные устройства.',
      source: 'kwork.ru',
      budget: '15 000 ₽',
      type: 'landing',
      url: 'https://kwork.ru/project/345678',
      postedAt: new Date().toISOString()
    },
    {
      title: 'Создание интернет-магазина с нуля',
      description: 'Требуется разработать интернет-магазин с нуля. Каталог товаров, корзина, онлайн-оплата, интеграция с CRM. Предпочтительно WordPress + WooCommerce.',
      source: 'weblancer.net',
      budget: '80 000 ₽',
      type: 'shop',
      url: 'https://weblancer.net/projects/901234',
      postedAt: new Date().toISOString()
    },
    {
      title: 'Исправление ошибок на сайте WordPress',
      description: 'После обновления плагинов сайт перестал загружаться. Нужно исправить ошибки, восстановить работоспособность, настроить кэширование.',
      source: 'habr.com/freelance',
      budget: '10 000 ₽',
      type: 'wordpress',
      url: 'https://habr.com/freelance/task/567890',
      postedAt: new Date().toISOString()
    },
    {
      title: 'Техническая поддержка сайта Bitrix',
      description: 'Требуется специалист для постоянной технической поддержки сайта на Bitrix. Обновления, доработки, исправление ошибок, консультации.',
      source: 'fl.ru',
      budget: '25 000 ₽/мес',
      type: 'bitrix',
      url: 'https://fl.ru/projects/234567',
      postedAt: new Date().toISOString()
    },
    {
      title: 'Вёрстка email-рассылки',
      description: 'Нужно сверстать адаптивный шаблон для email-рассылки. Должен корректно отображаться во всех почтовых клиентах.',
      source: 'freelancehunt.com',
      budget: '5 000 ₽',
      type: 'layout',
      url: 'https://freelancehunt.com/project/678901',
      postedAt: new Date().toISOString()
    },
    {
      title: 'Интеграция CRM с сайтом WordPress',
      description: 'Требуется интегрировать CRM-систему с сайтом на WordPress. Данные из форм должны передаваться в CRM, нужна обратная синхронизация.',
      source: 't.me',
      budget: '40 000 ₽',
      type: 'wordpress',
      url: 'https://t.me/freelance/12345',
      postedAt: new Date().toISOString()
    }
  ];
  
  return orders;
}

/**
 * Главная функция
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║     Client Manager - Поиск заказов (DEMO)     ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  console.log('🔍 Поиск заказов на биржах...\n');
  
  // Имитация задержки поиска
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Генерация тестовых заказов
  const orders = generateDemoOrders();
  
  console.log(`✅ Найдено заказов: ${orders.length}\n`);
  
  // Вывод на экран
  displayOrders(orders);
  
  // Сохранение
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(
    join(OUTPUT_DIR, 'demo_orders.json'),
    JSON.stringify(orders, null, 2),
    'utf-8'
  );
  console.log(`💾 Результаты сохранены: ${OUTPUT_DIR}/demo_orders.json\n`);
  
  // Предложение импорта в CRM
  const answer = await askQuestion('📥 Импортировать заказы в CRM? (y/n): ');
  
  if (answer.toLowerCase() === 'y') {
    await importToCRM(orders);
  }
  
  console.log('\n✨ Парсинг завершён!\n');
}

/**
 * Вывод заказов на экран
 */
function displayOrders(orders) {
  console.log('═'.repeat(60));
  console.log('           НАЙДЕННЫЕ ЗАКАЗЫ');
  console.log('═'.repeat(60) + '\n');
  
  // Группировка по источникам
  const grouped = {};
  for (const order of orders) {
    const source = order.source || 'other';
    if (!grouped[source]) grouped[source] = [];
    grouped[source].push(order);
  }
  
  // Вывод по группам
  for (const [source, items] of Object.entries(grouped)) {
    console.log(`\n📌 ${source.toUpperCase()} (${items.length})`);
    console.log('─'.repeat(60));
    
    items.forEach((item, index) => {
      console.log(`\n[${index + 1}] ${item.title}`);
      console.log(`    💰 Бюджет: ${item.budget}`);
      console.log(`    🔗 ${item.url}`);
      const shortDesc = item.description.substring(0, 100);
      console.log(`    📝 ${shortDesc}...`);
      console.log(`    🏷️ Тип: ${item.type}`);
    });
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`ВСЕГО: ${orders.length} заказов`);
  console.log('═'.repeat(60) + '\n');
}

/**
 * Импорт в CRM
 */
async function importToCRM(orders) {
  console.log('\n📋 Импорт в CRM...\n');
  
  const messageQueue = new MessageQueue();
  const clientManager = new ClientManagerAgent();
  
  try {
    await clientManager.initialize(messageQueue);
    
    let imported = 0;
    for (const order of orders) {
      try {
        const lead = {
          name: `Заказ из ${order.source}`,
          contact: {},
          source: order.source,
          projectType: order.type,
          description: `${order.title}\n\n${order.description}\n\nБюджет: ${order.budget}\nСсылка: ${order.url}`,
          budget: order.budget,
          url: order.url
        };
        
        await clientManager.addLead(lead);
        imported++;
        console.log(`  + Добавлен: ${lead.name} (${order.budget})`);
        
      } catch (error) {
        console.error(`  - Ошибка: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Импортировано: ${imported}/${orders.length}`);
    
    // Статистика
    const stats = clientManager.getStats();
    console.log('\n📊 Статистика CRM:');
    console.log(`   Всего клиентов: ${stats.total}`);
    console.log(`   Лиды: ${stats.byStatus.lead}`);
    console.log(`   В работе: ${stats.byStatus.in_progress}`);
    
  } catch (error) {
    console.error('Ошибка импорта:', error.message);
  }
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
