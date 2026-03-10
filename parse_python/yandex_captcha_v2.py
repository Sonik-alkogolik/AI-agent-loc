#!/usr/bin/env python3
"""
Yandex Parser с отображением капчи v2
Сохраняет HTML и изображение капчи
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
from pathlib import Path
import json
import time
import re


class YandexCaptchaParser:
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

    def extract_captcha_data(self, html: str) -> dict:
        """Извлечение данных капчи из HTML"""
        soup = BeautifulSoup(html, 'lxml')
        
        # Ищем изображение капчи разными способами
        captcha_url = None
        captcha_key = None
        
        # Способ 1: по классу
        img = soup.find('img', class_='CaptchaBlob')
        if img:
            captcha_url = img.get('src')
        
        # Способ 2: по атрибуту src с captcha
        if not captcha_url:
            img = soup.find('img', src=lambda x: x and 'captcha' in x.lower())
            if img:
                captcha_url = img.get('src')
        
        # Способ 3: по любому изображению на странице капчи
        if not captcha_url:
            imgs = soup.find_all('img')
            for img in imgs:
                src = img.get('src', '')
                if 'jpg' in src.lower() or 'png' in src.lower() or 'image' in src.lower():
                    captcha_url = src
                    break
        
        # Ищем ключ
        key_input = soup.find('input', {'name': 'key'})
        if key_input:
            captcha_key = key_input.get('value')
        
        # Ищем скрытые поля формы
        if not captcha_key:
            for input_el in soup.find_all('input', type='hidden'):
                name = input_el.get('name', '')
                if 'key' in name.lower() or 'captcha' in name.lower():
                    captcha_key = input_el.get('value')
                    break
        
        # Сохраняем HTML для отладки
        html_path = self.captcha_folder / f"captcha_page_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html)
        
        return {
            'captcha_url': captcha_url,
            'captcha_key': captcha_key,
            'html_path': html_path
        }

    def download_captcha(self, captcha_url: str) -> Path:
        """Скачивание изображения капчи"""
        if captcha_url.startswith('//'):
            captcha_url = 'https:' + captcha_url
        elif not captcha_url.startswith('http'):
            captcha_url = 'https://yandex.ru' + captcha_url
        
        img_response = requests.get(captcha_url, timeout=10)
        img_path = self.captcha_folder / f"captcha_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        
        with open(img_path, 'wb') as f:
            f.write(img_response.content)
        
        return img_path

    def solve_captcha(self, captcha_data: dict) -> str:
        """Отображение капчи и ввод кода"""
        print("\n" + "="*60)
        print("📷 ЯНДЕКС ЗАПРОСИЛ КАПЧУ")
        print("="*60)
        
        if captcha_data['captcha_url']:
            try:
                img_path = self.download_captcha(captcha_data['captcha_url'])
                print(f"\n✅ Капча сохранена: {img_path.absolute()}")
            except Exception as e:
                print(f"\n⚠️ Не удалось скачать изображение: {e}")
        else:
            print("\n⚠️ Не удалось найти изображение капчи")
        
        print(f"\n📄 HTML страницы сохранён: {captcha_data['html_path'].absolute()}")
        print("\n" + "-"*60)
        print("Инструкция:")
        print("1. Откройте файл капчи (PNG) в папке captcha/")
        print("2. Введите код с картинки ниже")
        print("-"*60)
        
        captcha_code = input("\nВведите код с капчи (или Enter для пропуска): ").strip()
        
        print("="*60 + "\n")
        
        return captcha_code

    def search_with_captcha(self, query: str) -> list:
        """Поиск с обработкой капчи"""
        url = "https://yandex.ru/search/"
        params = {'text': query}
        
        max_retries = 2
        retry_count = 0
        
        while retry_count <= max_retries:
            try:
                print(f"\n  Запрос: {query} (попытка {retry_count + 1})")
                response = self.session.get(url, params=params, timeout=15)
                
                # Проверка на капчу по различным признакам
                is_captcha = (
                    'captcha' in response.text.lower() or 
                    'Captcha' in response.text or
                    'проверка' in response.text.lower() or
                    'robot' in response.text.lower() or
                    response.status_code == 403
                )
                
                if is_captcha:
                    print("  ⚠️ Обнаружена капча!")
                    
                    captcha_data = self.extract_captcha_data(response.text)
                    
                    if captcha_data['captcha_url'] or captcha_data['captcha_key']:
                        captcha_code = self.solve_captcha(captcha_data)
                        
                        if captcha_code and captcha_data['captcha_key']:
                            # Отправка решения
                            solve_url = "https://yandex.ru/verify/captcha"
                            solve_data = {'key': captcha_data['captcha_key'], 'answer': captcha_code}
                            
                            solve_response = self.session.post(solve_url, data=solve_data, timeout=10)
                            result = solve_response.json()
                            
                            if result.get('status') == 'ok':
                                print("  ✅ Капча решена верно! Повтор запроса...")
                                time.sleep(2)
                                continue  # Повторяем запрос
                            else:
                                print("  ❌ Неверная капча!")
                                retry_count += 1
                                continue
                        else:
                            print("  ❌ Капча не решена")
                            return []
                    else:
                        print("  ⚠️ Не удалось извлечь данные капчи")
                        print(f"  HTML сохранён: {captcha_data['html_path']}")
                        return []
                
                # Парсинг результатов
                soup = BeautifulSoup(response.text, 'lxml')
                results = []
                
                # Пробуем разные селекторы
                selectors = [
                    '.serp-item:not([data-cid="ads-algo"])',
                    '[data-cid="organic"]',
                    '.Organic',
                    'li.serp-item'
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
                
                return results
                
            except Exception as e:
                print(f"  Ошибка: {e}")
                return []
        
        print("  ❌ Превышено количество попыток")
        return []

    def get_date_folder(self) -> str:
        return datetime.now().strftime("%Y-%m-%d")

    def get_date_formatted(self) -> str:
        return datetime.now().strftime("%d.%m.%Y")

    def get_log_filepath(self) -> Path:
        folder = self.base_path / "parse-yandex-captcha" / self.get_date_folder()
        folder.mkdir(parents=True, exist_ok=True)
        return folder / f"parse_yandex_log_{self.get_date_formatted()}.json"

    def parse_and_save(self, queries: list) -> dict:
        """Парсинг с обработкой капчи"""
        print("╔═══════════════════════════════════════════════════════════╗")
        print("║    Yandex Parser + Captcha - Парсинг с вводом капчи       ║")
        print("╚═══════════════════════════════════════════════════════════╝\n")
        
        all_results = []
        
        for i, query in enumerate(queries, 1):
            results = self.search_with_captcha(query)
            print(f"   Найдено: {len(results)}")
            
            if results:
                all_results.append({
                    'query': query,
                    'results': results,
                    'parsedAt': datetime.now().isoformat()
                })
            
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
        
        return None


def main():
    queries = [
        'заказать сайт wordpress',
        'разработка сайтов битрикс',
        'верстка лендинга'
    ]
    
    parser = YandexCaptchaParser()
    result = parser.parse_and_save(queries)
    
    if result:
        print(f"\n📊 Статистика:")
        print(f"   Запросов: {result['queriesCount']}")
        print(f"   Результатов: {result['totalResults']}")
    else:
        print("\n❌ Парсинг не удался")
        print("\nПроверьте папку captcha/ для отладки:")
        print(f"   - Изображения капчи")
        print(f"   - HTML страницы")


if __name__ == "__main__":
    main()
