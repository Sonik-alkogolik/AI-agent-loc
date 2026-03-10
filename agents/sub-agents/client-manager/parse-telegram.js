/**
 * Парсинг лидов через Telegram бота
 * Бот должен быть добавлен как администратор в каналы
 * 
 * Настройка:
 * 1. Создайте бота через @BotFather
 * 2. Добавьте бота в каналы как администратора
 * 3. Укажите токен в .env или передайте в командной строке
 */

import { TelegramBotParser } from './parsers/telegram-bot-parser.js';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Загрузка .env из папки client-manager
config({ path: join(__dirname, '.env') });

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║      Telegram Bot Parser - Парсинг через бота             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Получение токена
  const botToken = process.env.TELEGRAM_BOT_TOKEN || process.argv[2];
  
  if (!botToken) {
    console.log('❌ Не указан токен бота!\n');
    console.log('Способы указания токена:');
    console.log('  1. В файле .env: TELEGRAM_BOT_TOKEN=your_token');
    console.log('  2. В командной строке: npm run parse-telegram -- YOUR_TOKEN\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 Инструкция по настройке:\n');
    console.log('1. Создайте бота:');
    console.log('   • Откройте @BotFather в Telegram');
    console.log('   • Отправьте /newbot');
    console.log('   • Введите имя и username бота');
    console.log('   • Скопируйте полученный токен\n');
    console.log('2. Добавьте бота в каналы:');
    console.log('   • Откройте настройки канала');
    console.log('   • Добавьте администратора');
    console.log('   • Найдите вашего бота по username');
    console.log('   • Дайте права на чтение сообщений\n');
    console.log('3. Запустите парсинг:');
    console.log('   npm run parse-telegram -- YOUR_TOKEN');
    return;
  }

  console.log('1. Инициализация бота...');
  const parser = new TelegramBotParser(botToken);
  
  // Проверка бота
  const botInfo = await parser.getBotInfo();
  if (!botInfo) {
    console.log('❌ Ошибка: неверный токен бота');
    return;
  }
  
  console.log(`   Бот: @${botInfo.username} (${botInfo.first_name})`);
  
  // Проверка каналов
  console.log('\n2. Проверка каналов...');
  const channels = await parser.getBotChannels();
  
  if (channels.length === 0) {
    console.log('   ⚠️ Бот не состоит ни в одном канале');
    console.log('\n   Добавьте бота как администратора в каналы:');
    console.log('   • FreelanceBay');
    console.log('   • frilanserov_chat');
    console.log('   • freelancce');
    console.log('   • udafrii');
    console.log('   • freelancechoice');
    console.log('\n   После добавления запустите парсинг снова');
    return;
  }
  
  console.log(`   Найдено каналов: ${channels.length}`);
  for (const ch of channels) {
    console.log(`   • ${ch.title || ch.username}`);
  }
  
  // Парсинг
  console.log('\n3. Парсинг каналов...');
  const leads = await parser.parseAllChannels(50);
  
  if (leads.length === 0) {
    console.log('\n   Лиды не найдены');
    console.log('   Возможно, в каналах нет сообщений с ключевыми словами');
    return;
  }
  
  // Сохранение
  console.log('\n4. Сохранение лидов...');
  const saved = await parser.saveLeads(leads);
  console.log(`   Сохранено заказов: ${saved.length}`);
  
  // Статистика
  console.log('\n5. Статистика:');
  const stats = parser.ordersManager.getStats(saved);
  console.log('   По типам:', JSON.stringify(stats.byType, null, 2));
  console.log('   По каналам:', JSON.stringify(stats.bySource, null, 2));
  
  // Таблица
  console.log('\n6. Таблица заказов:');
  parser.ordersManager.printTable(saved);
  
  console.log('\n✅ Парсинг завершён!');
  console.log('   Данные сохранены в: BaseMD/orders/parse_order_YYYY-MM-DD/');
  
  // Уведомление (если указан admin chat id)
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (adminChatId) {
    console.log('\n7. Отправка уведомления...');
    await parser.notifyNewLeads(saved, adminChatId);
    console.log('   Уведомление отправлено');
  }
}

main().catch(console.error);
