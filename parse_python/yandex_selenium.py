#!/usr/bin/env python3
"""
Yandex Parser через Selenium - открывает браузер для ручного решения капчи
"""

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
from datetime import datetime
from pathlib import Path
import json
import time


class YandexSeleniumParser:
    def __init__(self, base_path: str = "./parse_python", headless: bool = False):
        self.base_path = Path(base_path)
        self.headless = headless
        self.driver = None
        self.results = []

    def setup_driver(self):
        """Настройка Chrome WebDriver"""
        chrome_options = Options()
        
        if self.headless:
            chrome_options.add_argument("--headless")
        
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationDriven")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        chrome_options.add_argument("--lang=ru-RU")
        
        # Путь для загрузки
        download_path = self.base_path / "downloads"
        download_path.mkdir(parents=True, exist_ok=True)
        chrome_options.add_argument(f"--download-dir={download_path}")
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        
        print(f"✅ Браузер запущен")
        if not self.headless:
            print("💡 Решите капчу в открывшемся окне браузера")

    def close_driver(self):
        """Закрытие браузера"""
        if self.driver:
            self.driver.quit()
            print("🚫 Браузер закрыт")

    def search(self, query: str, wait_time: int = 30) -> list:
        """
        Поиск в Яндексе с ожиданием решения капчи
        
        Args:
            query: Поисковый запрос
            wait_time: Время ожидания (секунды) для решения капчи
        
        Returns:
            Список результатов
        """
        url = f"https://yandex.ru/search/?text={query}"
        
        try:
            print(f"\n  🔍 Запрос: {query}")
            self.driver.get(url)
            
            # Ждём загрузки страницы или капчи
            time.sleep(2)
            
            # Проверяем, есть ли капча
            current_url = self.driver.current_url
            
            if 'captcha' in current_url.lower():
                print(f"  ⚠️ Обнаружена капча!")
                print(f"  ⏳ У вас есть {wait_time} сек на решение капчи...")
                
                # Ждём пока пользователь решит капчу
                start_time = time.time()
                while time.time() - start_time < wait_time:
                    current_url = self.driver.current_url
                    if 'captcha' not in current_url.lower():
                        print("  ✅ Капча решена!")
                        time.sleep(2)  # Ждём загрузки результатов
                        break
                    time.sleep(1)
                else:
                    print("  ⏰ Время вышло!")
                    return []
            
            # Парсинг результатов
            soup = BeautifulSoup(self.driver.page_source, 'lxml')
            results = []
            
            # Селекторы для результатов
            selectors = [
                '.serp-item:not([data-cid="ads-algo"])',
                '[data-cid="organic"]',
                '.Organic'
            ]
            
            for selector in selectors:
                items = soup.select(selector)
                if not items:
                    continue
                
                for item in items:
                    # Пропускаем рекламу
                    if item.get('data-cid') == 'ads-algo':
                        continue
                    
                    title_el = item.select_one('a[data-cid="title"], h2 a, a.serp-title, .OrganicTitle-LinkText')
                    snippet_el = item.select_one('.OrganicText, .serp-item__text')
                    
                    if title_el:
                        results.append({
                            'title': title_el.get_text(strip=True),
                            'url': title_el.get('href', ''),
                            'snippet': snippet_el.get_text(strip=True) if snippet_el else '',
                            'position': len(results) + 1
                        })
                
                if results:
                    break
            
            print(f"   Найдено: {len(results)}")
            return results
            
        except Exception as e:
            print(f"  ❌ Ошибка: {e}")
            return []

    def get_date_folder(self) -> str:
        return datetime.now().strftime("%Y-%m-%d")

    def get_date_formatted(self) -> str:
        return datetime.now().strftime("%d.%m.%Y")

    def get_log_filepath(self) -> Path:
        folder = self.base_path / "parse-yandex-selenium" / self.get_date_folder()
        folder.mkdir(parents=True, exist_ok=True)
        return folder / f"parse_yandex_log_{self.get_date_formatted()}.json"

    def parse_and_save(self, queries: list, captcha_wait_time: int = 60) -> dict:
        """
        Парсинг всех запросов с сохранением
        
        Args:
            queries: Список запросов
            captcha_wait_time: Время на решение капчи (секунды)
        """
        print("╔═══════════════════════════════════════════════════════════╗")
        print("║    Yandex Selenium Parser - Парсинг через браузер         ║")
        print("╚═══════════════════════════════════════════════════════════╝\n")
        
        self.setup_driver()
        
        try:
            all_results = []
            
            for i, query in enumerate(queries, 1):
                print(f"\n[{i}/{len(queries)}]")
                results = self.search(query, wait_time=captcha_wait_time)
                
                if results:
                    all_results.append({
                        'query': query,
                        'results': results,
                        'parsedAt': datetime.now().isoformat()
                    })
                
                # Небольшая задержка между запросами
                if i < len(queries):
                    time.sleep(2)
            
            # Сохранение
            if all_results:
                log_path = self.get_log_filepath()
                log_data = {
                    'parsedAt': datetime.now().isoformat(),
                    'date': self.get_date_formatted(),
                    'queriesCount': len(all_results),
                    'totalResults': sum(len(r['results']) for r in all_results),
                    'results': all_results
                }
                
                with open(log_path, 'w', encoding='utf-8') as f:
                    json.dump(log_data, f, ensure_ascii=False, indent=2)
                
                print(f"\n✅ Сохранено: {log_path}")
                return log_data
            else:
                print("\n❌ Результаты не найдены")
                return None
                
        finally:
            self.close_driver()


def main():
    queries = [
        'заказать сайт wordpress',
        'разработка сайтов битрикс',
        'верстка лендинга'
    ]
    
    # headless=False означает, что браузер будет виден
    parser = YandexSeleniumParser(headless=False)
    
    # captcha_wait_time=60 — 60 секунд на решение капчи
    result = parser.parse_and_save(queries, captcha_wait_time=60)
    
    if result:
        print(f"\n📊 Статистика:")
        print(f"   Запросов: {result['queriesCount']}")
        print(f"   Результатов: {result['totalResults']}")


if __name__ == "__main__":
    main()
