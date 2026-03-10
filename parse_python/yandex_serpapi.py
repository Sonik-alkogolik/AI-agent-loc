#!/usr/bin/env python3
"""
Yandex Parser через SerpAPI (бесплатный тариф 100 запросов/мес)
Регистрация: https://serpapi.com/
Сохранение результатов в parse_python/{date}/parse_yandex_log_{date}.json
"""

import requests
from datetime import datetime
from pathlib import Path
import json
import os


class YandexSerpAPI:
    def __init__(self, api_key: str = None, base_path: str = "./parse_python"):
        self.api_key = api_key or os.getenv('SERPAPI_KEY', '')
        self.base_path = Path(base_path)
        
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
        return datetime.now().strftime("%d.%m.%Y")

    def get_date_folder(self) -> str:
        return datetime.now().strftime("%Y-%m-%d")

    def get_log_filepath(self) -> Path:
        folder = self.base_path / "parse-yandex" / self.get_date_folder()
        folder.mkdir(parents=True, exist_ok=True)
        return folder / f"parse_yandex_log_{self.get_date_formatted()}.json"

    def search(self, query: str) -> list:
        """Поиск через SerpAPI"""
        if not self.api_key:
            print("  ⚠️ API ключ не указан")
            return []
        
        url = "https://serpapi.com/search"
        params = {
            'engine': 'yandex',
            'text': query,
            'api_key': self.api_key,
            'lang': 'ru'
        }
        
        try:
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            # Органические результаты
            organic = data.get('organic_results', [])
            
            for i, item in enumerate(organic[:10], 1):
                results.append({
                    'title': item.get('title', ''),
                    'url': item.get('link', ''),
                    'snippet': item.get('snippet', ''),
                    'position': i
                })
            
            return results
            
        except requests.exceptions.RequestException as e:
            print(f"  ❌ Ошибка: {e}")
            return []

    def parse_all_queries(self) -> list:
        """Парсинг всех запросов"""
        print(f"[SerpAPI] Начало парсинга...")
        print(f"[SerpAPI] Запросов: {len(self.queries)}\n")
        
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
        
        print(f"\n[SerpAPI] Всего: {len(all_results)} запросов с результатами")
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
            'source': 'SerpAPI'
        }
        
        with open(log_path, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n[SerpAPI] Сохранено: {log_path}")
        self.results = log_data
        return log_data

    def get_stats(self, log_data: dict = None) -> dict:
        """Статистика"""
        data = log_data or self.results
        
        if not data or not data.get('results'):
            return {'queriesCount': 0, 'totalResults': 0}
        
        total = sum(len(r['results']) for r in data['results'])
        return {
            'date': data['date'],
            'queriesCount': data['queriesCount'],
            'totalResults': total,
            'avgResultsPerQuery': round(total / data['queriesCount'], 1) if data['queriesCount'] else 0
        }

    def parse_and_save(self) -> dict:
        """Парсинг и сохранение"""
        results = self.parse_all_queries()
        
        if not results:
            print("\n[SerpAPI] Результаты не найдены")
            return None
        
        return self.save_results(results)


def main():
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║      Yandex Parser (SerpAPI) - Парсинг через API          ║")
    print("╚═══════════════════════════════════════════════════════════╝\n")
    
    # Получить API ключ: https://serpapi.com/
    api_key = os.getenv('SERPAPI_KEY', '')
    
    if not api_key:
        print("❌ Не указан API ключ SerpAPI!\n")
        print("Инструкция:")
        print("1. Зарегистрируйтесь на https://serpapi.com/")
        print("2. Получите бесплатный API ключ (100 запросов/мес)")
        print("3. Установите переменную окружения:")
        print("   Windows: set SERPAPI_KEY=ваш_ключ")
        print("   Linux/Mac: export SERPAPI_KEY=ваш_ключ")
        print("\nИли передайте ключ в конструктор:\n")
        print("   parser = YandexSerpAPI(api_key='ваш_ключ')")
        return
    
    parser = YandexSerpAPI(api_key=api_key)
    log_data = parser.parse_and_save()
    
    if log_data:
        stats = parser.get_stats(log_data)
        print(f"\n✅ Парсинг завершён!")
        print(f"   Дата: {stats['date']}")
        print(f"   Запросов: {stats['queriesCount']}")
        print(f"   Результатов: {stats['totalResults']}")
        print(f"   Файл: {parser.get_log_filepath()}")
    else:
        print("\n❌ Парсинг не удался")


if __name__ == "__main__":
    main()
