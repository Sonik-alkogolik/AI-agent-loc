#!/usr/bin/env python3
"""
Yandex Parser - Сохраняет ссылку на капчу для ручного ввода
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
from pathlib import Path
import json
import time
import re


class YandexCaptchaSaver:
    def __init__(self, base_path: str = "./parse_python"):
        self.base_path = Path(base_path)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9'
        })
        
        self.captcha_folder = self.base_path / "captcha"
        self.captcha_folder.mkdir(parents=True, exist_ok=True)

    def search(self, query: str) -> tuple:
        """
        Поиск с возвратом информации о капче
        
        Returns:
            (results, captcha_info)
        """
        url = "https://yandex.ru/search/"
        params = {'text': query}
        
        try:
            print(f"  Запрос: {query}")
            response = self.session.get(url, params=params, timeout=15)
            
            # Проверка на капчу
            if 'captcha' in response.text.lower() or response.status_code == 403:
                print("  ⚠️ Обнаружена капча!")
                
                # Сохраняем HTML
                html_path = self.captcha_folder / f"captcha_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
                with open(html_path, 'w', encoding='utf-8') as f:
                    f.write(response.text)
                
                # Ищем URL капчи
                captcha_url = None
                soup = BeautifulSoup(response.text, 'lxml')
                
                # Разные способы найти капчу
                img = soup.find('img', class_='CaptchaBlob')
                if img:
                    captcha_url = img.get('src')
                
                if not captcha_url:
                    img = soup.find('img', src=lambda x: x and 'captcha' in x.lower())
                    if img:
                        captcha_url = img.get('src')
                
                # Ключ капчи
                captcha_key = None
                key_input = soup.find('input', {'name': 'key'})
                if key_input:
                    captcha_key = key_input.get('value')
                
                captcha_info = {
                    'html_path': str(html_path.absolute()),
                    'captcha_url': captcha_url,
                    'captcha_key': captcha_key,
                    'solve_url': 'https://yandex.ru/verify/captcha' if captcha_key else None
                }
                
                return [], captcha_info
            
            # Парсинг результатов
            soup = BeautifulSoup(response.text, 'lxml')
            results = []
            
            items = soup.select('.serp-item:not([data-cid="ads-algo"])')
            
            for item in items[:10]:
                title_el = item.select_one('a[data-cid="title"], h2 a, a.serp-title')
                if title_el:
                    results.append({
                        'title': title_el.get_text(strip=True),
                        'url': title_el.get('href', ''),
                        'position': len(results) + 1
                    })
            
            return results, None
            
        except Exception as e:
            print(f"  Ошибка: {e}")
            return [], None

    def print_captcha_instructions(self, captcha_info: dict):
        """Вывод инструкции по капче"""
        print("\n" + "="*70)
        print("📷 ЯНДЕКС ЗАПРОСИЛ КАПЧУ")
        print("="*70)
        print(f"\n📄 HTML сохранён: {captcha_info['html_path']}")
        
        if captcha_info['captcha_url']:
            print(f"🔗 URL капчи: {captcha_info['captcha_url']}")
            print(f"\n💡 Откройте URL в браузере и решите капчу вручную")
        
        if captcha_info['captcha_key']:
            print(f"\n🔑 Ключ капчи: {captcha_info['captcha_key']}")
            print(f"📬 URL для отправки решения: {captcha_info['solve_url']}")
            print(f"\nПример отправки:")
            print(f"   POST {captcha_info['solve_url']}")
            print(f"   key={captcha_info['captcha_key']}&answer=ВАШ_КОД")
        
        print("\n" + "="*70)

    def parse_and_save(self, queries: list) -> dict:
        """Парсинг с обработкой капчи"""
        print("╔═══════════════════════════════════════════════════════════╗")
        print("║      Yandex Parser - Парсинг с сохранением капчи          ║")
        print("╚═══════════════════════════════════════════════════════════╝\n")
        
        all_results = []
        captcha_encountered = False
        
        for i, query in enumerate(queries, 1):
            results, captcha_info = self.search(query)
            print(f"   Найдено: {len(results)}")
            
            if captcha_info and not captcha_encountered:
                self.print_captcha_instructions(captcha_info)
                captcha_encountered = True
            
            if results:
                all_results.append({
                    'query': query,
                    'results': results,
                    'parsedAt': datetime.now().isoformat()
                })
            
            time.sleep(2)
        
        # Сохранение
        if all_results:
            date_folder = self.base_path / "parse-yandex" / datetime.now().strftime("%Y-%m-%d")
            date_folder.mkdir(parents=True, exist_ok=True)
            log_path = date_folder / f"parse_yandex_log_{datetime.now().strftime('%d.%m.%Y')}.json"
            
            log_data = {
                'parsedAt': datetime.now().isoformat(),
                'date': datetime.now().strftime("%d.%m.%Y"),
                'queriesCount': len(all_results),
                'totalResults': sum(len(r['results']) for r in all_results),
                'results': all_results,
                'captcha_info': captcha_info if captcha_encountered else None
            }
            
            with open(log_path, 'w', encoding='utf-8') as f:
                json.dump(log_data, f, ensure_ascii=False, indent=2)
            
            print(f"\n✅ Сохранено: {log_path}")
            return log_data
        
        return None


def main():
    queries = [
        'заказать сайт wordpress',
        'разработка сайтов битрикс',
        'верстка лендинга'
    ]
    
    parser = YandexCaptchaSaver()
    result = parser.parse_and_save(queries)
    
    if result:
        print(f"\n📊 Статистика:")
        print(f"   Запросов: {result['queriesCount']}")
        print(f"   Результатов: {result['totalResults']}")


if __name__ == "__main__":
    main()
