#!/usr/bin/env python3
"""
Yandex Parser - Парсинг поисковой выдачи Яндекса на Python
Сохранение результатов в parse_python/{date}/parse_yandex_log_{date}.json
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
from pathlib import Path
import json
import time
import random


class YandexParser:
    def __init__(self, base_path: str = "./parse_python"):
        self.base_path = Path(base_path)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
        })
        
        # Поисковые запросы
        self.queries = [
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
        
        self.results = []

    def get_date_formatted(self) -> str:
        """Получить дату в формате DD.MM.YYYY"""
        return datetime.now().strftime("%d.%m.%Y")

    def get_date_folder(self) -> str:
        """Получить имя папки для даты в формате YYYY-MM-DD"""
        return datetime.now().strftime("%Y-%m-%d")

    def get_log_filename(self) -> str:
        """Получить имя файла лога"""
        date_str = self.get_date_formatted()
        return f"parse_yandex_log_{date_str}.json"

    def create_folders(self) -> Path:
        """Создать структуру папок"""
        date_folder = self.get_date_folder()
        full_path = self.base_path / "parse-yandex" / date_folder
        full_path.mkdir(parents=True, exist_ok=True)
        return full_path

    def get_log_filepath(self) -> Path:
        """Получить полный путь к файлу лога"""
        folder = self.create_folders()
        return folder / self.get_log_filename()

    def search(self, query: str, page: int = 0) -> list:
        """Парсинг поисковой выдачи Яндекса"""
        url = "https://yandex.ru/search/"
        params = {
            'text': query,
            'p': page
        }
        
        try:
            response = self.session.get(url, params=params, timeout=15)
            
            # Проверка на капчу
            if 'captcha' in response.text.lower():
                print(f"  ⚠️ Яндекс запросил капчу для запроса: {query}")
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            results = []
            
            # Селекторы для органических результатов
            selectors = [
                '.serp-item:not([data-cid="ads-algo"])',
                '[data-cid="organic"]',
                'li.serp-item'
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
                    snippet_el = item.select_one('.OrganicText, .serp-item__text, .serp-item__snippet')
                    
                    if title_el:
                        title = title_el.get_text(strip=True)
                        link = title_el.get('href', '')
                        snippet = snippet_el.get_text(strip=True) if snippet_el else ''
                        
                        # Фильтрация и обработка ссылок
                        if link and 'yandex.ru/direct' not in link and '/ads/' not in link:
                            if link.startswith('/'):
                                link = 'https://yandex.ru' + link
                            elif not link.startswith('http'):
                                link = 'https://' + link
                            
                            results.append({
                                'title': title,
                                'url': link,
                                'snippet': snippet,
                                'position': len(results) + 1
                            })
                
                if results:
                    break
            
            return results
            
        except requests.exceptions.RequestException as e:
            print(f"  ❌ Ошибка при поиске '{query}': {e}")
            return []

    def parse_all_queries(self) -> list:
        """Парсинг по всем запросам"""
        print(f"[YandexParser] Начало парсинга Яндекса...")
        print(f"[YandexParser] Запросов: {len(self.queries)}\n")
        
        all_results = []
        
        for i, query in enumerate(self.queries, 1):
            print(f"[{i}/{len(self.queries)}] Поиск: {query}")
            
            results = self.search(query)
            print(f"   Найдено результатов: {len(results)}")
            
            if results:
                all_results.append({
                    'query': query,
                    'results': results,
                    'parsedAt': datetime.now().isoformat()
                })
            
            # Задержка между запросами (2-4 секунды)
            delay = random.uniform(2, 4)
            time.sleep(delay)
        
        print(f"\n[YandexParser] Всего найдено: {len(all_results)} запросов с результатами")
        return all_results

    def save_results(self, results: list) -> dict:
        """Сохранение результатов в JSON"""
        log_path = self.get_log_filepath()
        
        log_data = {
            'parsedAt': datetime.now().isoformat(),
            'date': self.get_date_formatted(),
            'queriesCount': len(results),
            'totalResults': sum(len(r['results']) for r in results),
            'searchQueries': self.queries,
            'results': results
        }
        
        with open(log_path, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n[YandexParser] Результаты сохранены: {log_path}")
        self.results = log_data
        return log_data

    def get_stats(self, log_data: dict = None) -> dict:
        """Получить статистику результатов"""
        data = log_data or self.results
        
        if not data or not data.get('results'):
            return {
                'queriesCount': 0,
                'totalResults': 0,
                'avgResultsPerQuery': 0
            }
        
        total = sum(len(r['results']) for r in data['results'])
        queries_count = data['queriesCount']
        
        return {
            'date': data['date'],
            'queriesCount': queries_count,
            'totalResults': total,
            'avgResultsPerQuery': round(total / queries_count, 1) if queries_count else 0,
            'queries': [
                {'query': r['query'], 'count': len(r['results'])}
                for r in data['results']
            ]
        }

    def parse_and_save(self) -> dict:
        """Парсинг и сохранение"""
        results = self.parse_all_queries()
        
        if not results:
            print("\n[YandexParser] Результаты не найдены")
            return None
        
        log_data = self.save_results(results)
        
        # Статистика
        stats = self.get_stats(log_data)
        print("\n[YandexParser] Статистика:")
        print(f"   Дата: {stats['date']}")
        print(f"   Запросов: {stats['queriesCount']}")
        print(f"   Всего результатов: {stats['totalResults']}")
        print(f"   В среднем на запрос: {stats['avgResultsPerQuery']}")
        
        return log_data


def main():
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║    Yandex Parser (Python) - Парсинг поисковой выдачи      ║")
    print("╚═══════════════════════════════════════════════════════════╝\n")
    
    parser = YandexParser(base_path="./parse_python")
    log_data = parser.parse_and_save()
    
    if log_data:
        print(f"\n✅ Парсинг завершён!")
        print(f"   Файл: {parser.get_log_filepath()}")
    else:
        print("\n❌ Парсинг не удался")


if __name__ == "__main__":
    main()
