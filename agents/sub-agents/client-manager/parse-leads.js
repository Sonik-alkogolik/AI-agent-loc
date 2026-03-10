/**
 * Скрипт парсинга лидов с сохранением в Orders Manager
 * Каждый заказ сохраняется в отдельной папке: parse_order_{YYYY-MM-DD}/{id}.json
 */

import { OrdersManager } from './orders-manager.js';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Загрузка демо-заказов из JSON файла
 */
async function loadDemoOrders() {
  try {
    // Абсолютный путь к демо-файлу
    const demoPath = 'C:\\Qwen\\AI-agent-loc\\parsed_output\\demo_orders.json';
    console.log(`[ParseLeads] Поиск демо-файла: ${demoPath}`);
    const data = await fs.readFile(demoPath, 'utf-8');
    const orders = JSON.parse(data);
    console.log(`[ParseLeads] Загружено заказов: ${orders.length}`);
    return orders;
  } catch (error) {
    console.log('[ParseLeads] Демо-файл не найден:', error.message);
    return [];
  }
}

/**
 * Основная функция
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         Parse Leads - Парсинг заказов с источников        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const ordersManager = new OrdersManager();
  await ordersManager.initialize();

  const allOrders = [];

  // 1. Загрузка демо-заказов
  console.log('1. Загрузка демо-заказов...');
  const demoOrders = await loadDemoOrders();
  console.log(`   Найдено демо-заказов: ${demoOrders.length}`);
  allOrders.push(...demoOrders);

  // 2. Сохранение всех заказов через OrdersManager
  console.log(`\n2. Сохранение ${allOrders.length} заказов...`);

  const savedOrders = await ordersManager.saveOrders(allOrders);

  console.log(`   Сохранено заказов: ${savedOrders.length}`);

  // 3. Вывод статистики
  console.log('\n3. Статистика:');
  const stats = ordersManager.getStats(savedOrders);
  console.log('   Всего заказов:', stats.total);
  console.log('   По источникам:', JSON.stringify(stats.bySource, null, 2));
  console.log('   По типам:', JSON.stringify(stats.byType, null, 2));

  // 4. Таблица заказов
  console.log('\n4. Таблица заказов:');
  ordersManager.printTable(savedOrders);

  console.log('\n✅ Парсинг завершён!');
  console.log('   Данные сохранены в: BaseMD/orders/parse_order_YYYY-MM-DD/');
}

// Запуск
main().catch(console.error);
