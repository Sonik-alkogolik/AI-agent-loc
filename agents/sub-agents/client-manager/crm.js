/**
 * CRM - Просмотр таблицы заказов
 * Отображает все заказы в виде консолидной таблицы
 */

import { OrdersManager } from './orders-manager.js';
import readline from 'readline';

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║              CRM - Таблица заказов                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const ordersManager = new OrdersManager();
  await ordersManager.initialize();

  // Получение всех заказов
  const orders = await ordersManager.getAllOrders();

  if (orders.length === 0) {
    console.log('📭 Заказов пока нет.\n');
    console.log('Запустите парсинг: npm run parse-leads');
    return;
  }

  // Статистика
  const stats = ordersManager.getStats(orders);
  console.log('📊 Статистика:');
  console.log(`   Всего заказов: ${stats.total}`);
  console.log(`   За сегодня: ${stats.today}`);
  console.log(`   За неделю: ${stats.thisWeek}`);
  console.log(`   По статусам: ${JSON.stringify(stats.byStatus, null, 2)}`);
  console.log(`   По источникам: ${JSON.stringify(stats.bySource, null, 2)}`);
  console.log(`   По типам: ${JSON.stringify(stats.byType, null, 2)}\n`);

  // Таблица заказов
  console.log('📋 Таблица заказов:\n');
  ordersManager.printTable(orders);

  // Интерактивное меню
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('Меню:');
  console.log('  [1] Фильтр по статусу');
  console.log('  [2] Фильтр по источнику');
  console.log('  [3] Фильтр по типу проекта');
  console.log('  [4] Обновить статус заказа');
  console.log('  [5] Показать детали заказа');
  console.log('  [0] Выход\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => {
    rl.question(query, resolve);
  });

  let exit = false;
  while (!exit) {
    const choice = await question('Выберите действие: ');

    switch (choice.trim()) {
      case '1': {
        console.log('\nДоступные статусы:', Object.keys(stats.byStatus).join(', '));
        const status = await question('Введите статус: ');
        const filtered = orders.filter(o => o.status === status.trim());
        console.log(`\nЗаказы со статусом "${status}":`);
        ordersManager.printTable(filtered);
        break;
      }

      case '2': {
        console.log('\nДоступные источники:', Object.keys(stats.bySource).join(', '));
        const source = await question('Введите источник: ');
        const filtered = orders.filter(o => o.source === source.trim());
        console.log(`\nЗаказы из источника "${source}":`);
        ordersManager.printTable(filtered);
        break;
      }

      case '3': {
        console.log('\nДоступные типы:', Object.keys(stats.byType).join(', '));
        const type = await question('Введите тип проекта: ');
        const filtered = orders.filter(o => o.projectType === type.trim());
        console.log(`\nЗаказы типа "${type}":`);
        ordersManager.printTable(filtered);
        break;
      }

      case '4': {
        const orderId = await question('Введите ID заказа: ');
        const status = await question('Введите новый статус (new/viewed/contact/proposal/won/lost): ');
        try {
          const updated = await ordersManager.updateOrderStatus(orderId.trim(), status.trim());
          console.log(`✅ Статус заказа ${orderId} обновлён на "${status}"`);
        } catch (error) {
          console.log(`❌ Ошибка: ${error.message}`);
        }
        break;
      }

      case '5': {
        const orderId = await question('Введите ID заказа: ');
        const order = await ordersManager.getOrderById(orderId.trim());
        if (order) {
          console.log('\n═══════════════════════════════════════════════════════════');
          console.log(`Заказ: ${order.title || 'Без названия'}`);
          console.log('═══════════════════════════════════════════════════════════');
          console.log(`ID: ${order.id}`);
          console.log(`Статус: ${order.status}`);
          console.log(`Источник: ${order.source}`);
          console.log(`Тип проекта: ${order.projectType}`);
          console.log(`Бюджет: ${order.budget || 'Не указан'}`);
          console.log(`Описание: ${order.description || 'Нет описания'}`);
          console.log(`Контакты: ${JSON.stringify(order.contact, null, 2)}`);
          console.log(`Размещён: ${order.postedAt ? new Date(order.postedAt).toLocaleString('ru-RU') : '-'}`);
          console.log(`Сохранён: ${order.savedAt ? new Date(order.savedAt).toLocaleString('ru-RU') : '-'}`);
          if (order.url) {
            console.log(`URL: ${order.url}`);
          }
          console.log('═══════════════════════════════════════════════════════════');
        } else {
          console.log(`❌ Заказ ${orderId} не найден`);
        }
        break;
      }

      case '0':
      case 'exit':
      case 'q':
        exit = true;
        console.log('👋 До свидания!');
        break;

      default:
        console.log('Неверная команда, попробуйте снова.');
    }

    if (!exit) {
      console.log('');
    }
  }

  rl.close();
}

main().catch(console.error);
