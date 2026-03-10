#!/usr/bin/env python3
"""
Google Parser - Парсинг Google через BeautifulSoup
Сохранение результатов в parse_python/{date}/parse_google_log_{date}.json
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
from pathlib import Path
import json
import time
import random


class GoogleParser:
    def __init__(self, base_path: str = "./parse_python"):
        self.base_path = Path(base_path)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
        })
        
        self.queries = [
            'заказать сайт wordpress freelance',
            'разработка сайтов битрикс фриланс',
            'создать интернет магазин цена',
            'верстка лендинга заказать',
            'техническая поддержка сайта',
            'ремонт сайта wordpress',
            'интеграция crm сайт',
            'доработка сайта битрикс'
        ]

    def get_date_folder(self) -> str:
        return datetime.now().strftime("%Y-%m-%d")

    def get_date_formatted(self) -> str:
        return datetime.now().strftime("%d.%m.%Y")

    def create_folders(self) -> Path:
        folder = self.base_path / "parse-google" / self.get_date_folder()
        folder.mkdir(parents=True, exist_ok=True)
        return folder

    def get_log_filepath(self) -> Path:
        folder = self.create_folders()
        return folder / f"parse_google_log_{self.get_date_formatted()}.json"

    def search(self, query: str, num: int = 10) -> list:
        """Парсинг Google выдачи"""
        url = "https://www.google.com/search"
        params = {
            'q': query,
            'num': num,
            'hl': 'ru',
            'gl': 'ru'
        }
        
        try:
            response = self.session.get(url, params=params, timeout=15)
            
            # Проверка на капчу
            if 'captcha' in response.text.lower() or 'robot' in response.text.lower():
                print(f"  ⚠️ Google запросил капчу")
                return []
            
            soup = BeautifulSoup(response.text, 'lxml')
            results = []
            
            # Селекторы для результатов
            selectors = [
                'div.g',
                'div.tF2Cxc',
                'div.yuRUbf',
                'li.b_algo'
            ]
            
            for selector in selectors:
                items = soup.select(selector)
                if not items:
                    continue
                
                for item in items:
                    title_el = item.select_one('h3, a h3, .vvjwJb')
                    link_el = item.select_one('a[href]')
                    snippet_el = item.select_one('.VwiC3b, .lEBKkf, span, .s3v9rd')
                    
                    if title_el and link_el:
                        title = title_el.get_text(strip=True)
                        link = link_el.get('href', '')
                        snippet = snippet_el.get_text(strip=True) if snippet_el else ''
                        
                        # Фильтрация
                        if link and not link.startswith('/search') and not link.startswith('javascript:'):
                            results.append({
                                'title': title,
                                'url': link,
                                'snippet': snippet,
                                'position': len(results) + 1
                            })
                
                if results:
                    break
            
            return results[:num]
            
        except requests.exceptions.RequestException as e:
            print(f"  ❌ Ошибка: {e}")
            return []

    def parse_all_queries(self) -> list:
        """Парсинг всех запросов"""
        print(f"[GoogleParser] Начало парсинга...")
        print(f"[GoogleParser] Запросов: {len(self.queries)}\n")
        
        all_results = []
        
        for i, query in enumerate(self.queries, 1):
            print(f"[{i}/{len(self.queries)}] Поиск: {query}")
            
            results = self.search(query)
            print(f"   Найдено: {len(results)}")
            
            if results:
                all_results.append({
                    'query': query,
                    'results': results,
                    'parsedAt': datetime.now().isoformat()
                })
            
            # Задержка
            delay = random.uniform(2, 4)
            time.sleep(delay)
        
        return all_results

    def save_results(self, results: list) -> dict:
        """Сохранение в JSON"""
        log_path = self.get_log_filepath()
        
        log_data = {
            'parsedAt': datetime.now().isoformat(),
            'date': self.get_date_formatted(),
            'queriesCount': len(results),
            'totalResults': sum(len(r['results']) for r in results),
            'searchQueries': self.queries,
            'results': results,
            'source': 'Google'
        }
        
        with open(log_path, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n[GoogleParser] Сохранено: {log_path}")
        return log_data

    def parse_and_save(self) -> dict:
        """Парсинг и сохранение"""
        results = self.parse_all_queries()
        
        if not results:
            print("\n[GoogleParser] Результаты не найдены")
            return None
        
        log_data = self.save_results(results)
        
        stats = {
            'date': log_data['date'],
            'queriesCount': log_data['queriesCount'],
            'totalResults': log_data['totalResults']
        }
        
        print(f"\n[GoogleParser] Статистика:")
        print(f"   Дата: {stats['date']}")
        print(f"   Запросов: {stats['queriesCount']}")
        print(f"   Результатов: {stats['totalResults']}")
        
        return log_data


def main():
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║       Google Parser (BeautifulSoup) - Парсинг Google      ║")
    print("╚═══════════════════════════════════════════════════════════╝\n")
    
    parser = GoogleParser()
    log_data = parser.parse_and_save()
    
    if log_data:
        print(f"\n✅ Парсинг завершён!")
        print(f"   Файл: {parser.get_log_filepath()}")
    else:
        print("\n❌ Парсинг не удался")


if __name__ == "__main__":
    main()
