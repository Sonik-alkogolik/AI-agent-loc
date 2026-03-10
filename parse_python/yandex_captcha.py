#!/usr/bin/env python3
"""
Yandex Parser с отображением капчи
Сохраняет капчу как изображение и показывает путь
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
from pathlib import Path
import json
import time
import base64
import os


class YandexCaptchaParser:
    def __init__(self, base_path: str = "./parse_python"):
        self.base_path = Path(base_path)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9'
        })
        
        self.captcha_folder = self.base_path / "captcha"
        self.captcha_folder.mkdir(parents=True, exist_ok=True)

    def solve_captcha(self, captcha_url: str, captcha_key: str) -> str:
        """
        Сохраняет капчу и запрашивает ввод у пользователя
        
        Args:
            captcha_url: URL изображения капчи
            captcha_key: Ключ капчи для отправки
            
        Returns:
            Введённый пользователем код капчи
        """
        # Скачиваем изображение капчи
        try:
            img_response = requests.get(captcha_url, timeout=10)
            img_path = self.captcha_folder / f"captcha_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            
            with open(img_path, 'wb') as f:
                f.write(img_response.content)
            
            print("\n" + "="*60)
            print("📷 ЯНДЕКС ЗАПРОСИЛ КАПЧУ")
            print("="*60)
            print(f"\nИзображение сохранено: {img_path.absolute()}")
            print(f"\nОткройте файл и введите код с картинки:")
            
            # Ввод капчи пользователем
            captcha_code = input("\nВведите код с капчи: ").strip()
            
            print("="*60 + "\n")
            
            return captcha_code
            
        except Exception as e:
            print(f"Ошибка сохранения капчи: {e}")
            return ""

    def search_with_captcha(self, query: str) -> list:
        """Поиск с обработкой капчи"""
        url = "https://yandex.ru/search/"
        params = {'text': query}
        
        retry_count = 0
        max_retries = 2
        
        while retry_count <= max_retries:
            try:
                print(f"  Запрос: {query} (попытка {retry_count + 1})")
                response = self.session.get(url, params=params, timeout=15)
                
                # Проверка на капчу
                if 'captcha' in response.text.lower() or response.status_code == 403:
                    print("  ⚠️ Обнаружена капча!")
                    
                    # Извлекаем URL капчи и ключ
                    soup = BeautifulSoup(response.text, 'lxml')
                    
                    # Ищем изображение капчи
                    captcha_img = soup.find('img', {'class': 'CaptchaBlob'})
                    if not captcha_img:
                        captcha_img = soup.find('img', src=lambda x: x and 'captcha' in x.lower())
                    
                    # Ищем ключ капчи
                    captcha_key = None
                    key_input = soup.find('input', {'name': 'key'})
                    if key_input:
                        captcha_key = key_input.get('value')
                    
                    if captcha_img and captcha_key:
                        captcha_url = captcha_img.get('src')
                        if captcha_url.startswith('//'):
                            captcha_url = 'https:' + captcha_url
                        
                        # Запрашиваем ввод капчи у пользователя
                        captcha_code = self.solve_captcha(captcha_url, captcha_key)
                        
                        if captcha_code:
                            # Отправляем решение капчи
                            solve_url = "https://yandex.ru/verify/captcha"
                            solve_data = {
                                'key': captcha_key,
                                'answer': captcha_code
                            }
                            
                            solve_response = self.session.post(solve_url, data=solve_data, timeout=10)
                            result = solve_response.json()
                            
                            if result.get('status') == 'ok':
                                print("  ✅ Капча решена верно!")
                                # Повторяем исходный запрос с куками
                                time.sleep(1)
                                continue
                            else:
                                print("  ❌ Неверная капча, попробуйте снова")
                                retry_count += 1
                                continue
                        else:
                            print("  ❌ Капча не введена")
                            return []
                    else:
                        print("  ❌ Не удалось найти капчу на странице")
                        return []
                
                # Парсинг результатов (если нет капчи)
                soup = BeautifulSoup(response.text, 'lxml')
                results = []
                
                items = soup.select('.serp-item:not([data-cid="ads-algo"])')
                
                for item in items[:10]:
                    title_el = item.select_one('a[data-cid="title"], h2 a, a.serp-title')
                    snippet_el = item.select_one('.OrganicText, .serp-item__text')
                    
                    if title_el:
                        results.append({
                            'title': title_el.get_text(strip=True),
                            'url': title_el.get('href', ''),
                            'snippet': snippet_el.get_text(strip=True) if snippet_el else '',
                            'position': len(results) + 1
                        })
                
                return results
                
            except Exception as e:
                print(f"  Ошибка: {e}")
                return []
        
        print("  ❌ Превышено количество попыток ввода капчи")
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
            print(f"\n[{i}/{len(queries)}] Поиск: {query}")
            results = self.search_with_captcha(query)
            print(f"   Найдено: {len(results)}")
            
            if results:
                all_results.append({
                    'query': query,
                    'results': results,
                    'parsedAt': datetime.now().isoformat()
                })
            
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


if __name__ == "__main__":
    main()
