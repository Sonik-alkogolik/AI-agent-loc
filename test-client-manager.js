/**
 * Тестовый скрипт для Client Manager Agent
 * Демонстрация основных возможностей
 */

import { ClientManagerAgent } from './agents/sub-agents/client-manager/agent.js';
import { MessageQueue } from './shared/communication.js';

async function main() {
  console.log('=== Client Manager Agent - Тестирование ===\n');

  // Создание очереди сообщений и агента
  const messageQueue = new MessageQueue();
  const clientManager = new ClientManagerAgent();

  try {
    // Инициализация
    await clientManager.initialize(messageQueue);
    console.log('\n--- Агент инициализирован ---\n');

    // 1. Добавление тестового лида
    console.log('1. Добавление лида...');
    const lead1 = await clientManager.addLead({
      name: 'Иван Петров',
      contact: {
        telegram: '@ivan_p',
        email: 'ivan@example.com'
      },
      source: 'fl.ru',
      projectType: 'wordpress',
      description: 'Нужно сделать сайт для компании по продаже оборудования'
    });
    console.log(`   Лид добавлен: ${lead1.id}`);

    // 2. Добавление второго лида
    console.log('\n2. Добавление второго лида...');
    const lead2 = await clientManager.addLead({
      name: 'ООО "ТехСтрой"',
      contact: {
        email: 'info@techstroy.ru'
      },
      source: 'telegram',
      projectType: 'bitrix',
      description: 'Требуется доработка существующего сайта на Bitrix'
    });
    console.log(`   Лид добавлен: ${lead2.id}`);

    // 3. Логирование взаимодействия
    console.log('\n3. Запись взаимодействия...');
    await clientManager.logInteraction(
      lead1.id,
      'Отправлено первое сообщение клиенту. Интересуется стоимостью и сроками.',
      'outgoing'
    );
    console.log('   Взаимодействие записано');

    // 4. Генерация предложения
    console.log('\n4. Генерация КП для Ивана...');
    const proposal = await clientManager.generateProposal(lead1.id);
    console.log('   КП сгенерировано!');
    console.log('   --- Начало КП ---');
    console.log(proposal.substring(0, 300) + '...');
    console.log('   --- Конец КП ---');

    // 5. Планирование follow-up
    console.log('\n5. Планирование follow-up...');
    const followUpDate = await clientManager.scheduleFollowUp(lead1.id, 3);
    console.log(`   Follow-up запланирован на: ${followUpDate.toISOString()}`);

    // 6. Получение статистики
    console.log('\n6. Статистика по клиентам:');
    const stats = clientManager.getStats();
    console.log('   Всего клиентов:', stats.total);
    console.log('   По статусам:', JSON.stringify(stats.byStatus, null, 2));
    console.log('   Требуется follow-up:', stats.followUpNeeded);

    // 7. Поиск лидов (демо)
    console.log('\n7. Поиск лидов (демо режим)...');
    const searchResults = await clientManager.searchLeads();
    console.log('   Найдено запросов:', searchResults.length);

    console.log('\n=== Тестирование завершено ===\n');
    console.log('Данные сохранены в:');
    console.log('  - BaseMD/data/clients.json');
    console.log('  - BaseMD/leads/active/');
    console.log('  - BaseMD/interactions/{client-id}/');

  } catch (error) {
    console.error('Ошибка при тестировании:', error);
    process.exit(1);
  }
}

// Запуск
main();
