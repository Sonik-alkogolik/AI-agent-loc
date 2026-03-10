#!/usr/bin/env python3
"""
Yandex Parser через Selenium - использует установленный Chrome
"""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import SessionNotCreatedException
from bs4 import BeautifulSoup
from datetime import datetime
from pathlib import Path
import json
import time
import os


class YandexSeleniumParser:
    def __init__(self, base_path: str = "./parse_python", headless: bool = False):
        self.base_path = Path(base_path)
        self.headless = headless
        self.driver = None

    def setup_driver(self):
        """Настройка Chrome WebDriver с использованием установленного Chrome"""
        chrome_options = Options()
        
        if self.headless:
            chrome_options.add_argument("--headless")
        
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationDriven")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        chrome_options.add_argument("--lang=ru-RU")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        # Пытаемся найти ChromeDriver в PATH или используем стандартные пути
        possible_paths = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
            os.path.expandvars(r"%PROGRAMFILES%\Google\Chrome\Application\chrome.exe"),
        ]
        
        for chrome_path in possible_paths:
            if os.path.exists(chrome_path):
                chrome_options.binary_location = chrome_path
                print(f"✅ Chrome найден: {chrome_path}")
                break
        
        # Пробуем запустить с разными путями к chromedriver
        driver_paths = [
            r"C:\Program Files\Google\Chrome\Application\chromedriver.exe",
            r"chromedriver.exe",  # В PATH
            r".\chromedriver.exe",
        ]
        
        for driver_path in driver_paths:
            try:
                if os.path.exists(driver_path):
                    service = Service(driver_path)
                    self.driver = webdriver.Chrome(service=service, options=chrome_options)
                    print(f"✅ Chromedriver: {driver_path}")
                    return
            except Exception:
                continue
        
        # Если не нашли, пробуем без указания пути (автоматически)
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            print("✅ Chromedriver запущен автоматически")
            return
        except SessionNotCreatedException as e:
            print(f"❌ Ошибка: {e}")
            print("\n💡 Установите ChromeDriver:")
            print("   1. Скачайте с https://chromedriver.chromium.org/downloads")
            print("   2. Положите chromedriver.exe в папку с Python или в PATH")
            raise

    def close_driver(self):
        """Закрытие браузера"""
        if self.driver:
            self.driver.quit()
            print("🚫 Браузер закрыт")

    def search(self, query: str, wait_time: int = 30) -> list:
        """Поиск в Яндексе с ожиданием решения капчи"""
        url = f"https://yandex.ru/search/?text={query}"
        
        try:
            print(f"\n  🔍 Запрос: {query}")
            self.driver.get(url)
            
            # Ждём загрузки
            time.sleep(3)
            
            # Проверяем капчу
            current_url = self.driver.current_url
            
            if 'captcha' in current_url.lower() or 'verify' in current_url.lower():
                print(f"  ⚠️ Обнаружена капча!")
                print(f"  👉 Решите капчу в окне браузера")
                print(f"  ⏳ Ожидание: {wait_time} сек...")
                
                # Ждём пока пользователь решит капчу
                start_time = time.time()
                while time.time() - start_time < wait_time:
                    current_url = self.driver.current_url
                    if 'captcha' not in current_url.lower() and 'verify' not in current_url.lower():
                        print("  ✅ Капча решена!")
                        time.sleep(2)
                        break
                    time.sleep(1)
                    print(f"  ⏳ Осталось: {int(wait_time - (time.time() - start_time))} сек")
                else:
                    print("  ⏰ Время вышло!")
                    return []
            
            # Парсинг
            soup = BeautifulSoup(self.driver.page_source, 'lxml')
            results = []
            
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
        """Парсинг всех запросов"""
        print("╔═══════════════════════════════════════════════════════════╗")
        print("║    Yandex Selenium Parser - Парсинг через браузера        ║")
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
                
                if i < len(queries):
                    time.sleep(2)
            
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
    
    parser = YandexSeleniumParser(headless=False)
    result = parser.parse_and_save(queries, captcha_wait_time=60)
    
    if result:
        print(f"\n📊 Статистика:")
        print(f"   Запросов: {result['queriesCount']}")
        print(f"   Результатов: {result['totalResults']}")


if __name__ == "__main__":
    main()
