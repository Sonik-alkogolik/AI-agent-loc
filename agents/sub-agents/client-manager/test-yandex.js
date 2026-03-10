import axios from 'axios';
import * as cheerio from 'cheerio';

async function testYandex() {
  const query = 'заказать сайт wordpress';
  const url = `https://yandex.ru/search/?text=${encodeURIComponent(query)}`;
  
  console.log('Тест запроса к Яндексу...');
  console.log(`URL: ${url}\n`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9'
      },
      timeout: 15000
    });
    
    console.log(`Статус: ${response.status}`);
    console.log(`Размер ответа: ${response.data.length} байт\n`);
    
    // Проверка на капчу
    if (response.data.includes('captcha')) {
      console.log('⚠️ Яндекс вернул капчу!\n');
    }
    
    const $ = cheerio.load(response.data);
    
    // Пробуем разные селекторы
    const selectors = [
      '.serp-item',
      '[data-cid="organic"]',
      '.Organic',
      'li.serp-item',
      '.serp-item__content'
    ];
    
    console.log('Проверка селекторов:');
    for (const sel of selectors) {
      const count = $(sel).length;
      console.log(`  ${sel}: ${count} элементов`);
    }
    
    // Вывод первого serp-item для отладки
    const firstItem = $('.serp-item').first();
    if (firstItem.length > 0) {
      console.log('\nПервый элемент .serp-item:');
      console.log('  data-cid:', firstItem.attr('data-cid'));
      console.log('  class:', firstItem.attr('class'));
      
      const title = firstItem.find('a[data-cid="title"], h2 a, a.serp-title').first();
      if (title.length > 0) {
        console.log('  Заголовок:', title.text().trim().substring(0, 50));
        console.log('  Ссылка:', title.attr('href'));
      }
    }
    
  } catch (error) {
    console.error('Ошибка:', error.message);
    if (error.response) {
      console.log('Статус:', error.response.status);
    }
  }
}

testYandex();
