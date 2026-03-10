#!/usr/bin/env python3
"""
Универсальный парсер с поддержкой прокси
Использует BeautifulSoup для парсинга любых сайтов
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
from pathlib import Path
import json
import time
import random


class UniversalParser:
    def __init__(self, base_path: str = "./parse_python", proxy: str = None):
        self.base_path = Path(base_path)
        self.proxy = proxy
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9'
        })
        
        # Настройка прокси
        if proxy:
            self.session.proxies.update({
                'http': proxy,
                'https': proxy
            })
            print(f"[Parser] Используется прокси: {proxy}")

    def parse_url(self, url: str, selectors: dict) -> list:
        """
        Парсинг произвольного URL
        
        Args:
            url: URL для парсинга
            selectors: Словарь селекторов CSS
                {
                    'item': '.project-card',      # Контейнер элемента
                    'title': 'h3 a',              # Заголовок
                    'link': 'h3 a',               # Ссылка
                    'price': '.price',            # Цена
                    'desc': '.description'        # Описание
                }
        """
        results = []
        
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'lxml')
            items = soup.select(selectors.get('item', 'body'))
            
            for item in items:
                title_el = item.select_one(selectors.get('title', 'a'))
                link_el = item.select_one(selectors.get('link', 'a'))
                price_el = item.select_one(selectors.get('price', ''))
                desc_el = item.select_one(selectors.get('desc', ''))
                
                if title_el:
                    results.append({
                        'title': title_el.get_text(strip=True),
                        'url': link_el.get('href', '') if link_el else '',
                        'price': price_el.get_text(strip=True) if price_el else '',
                        'description': desc_el.get_text(strip=True)[:200] if desc_el else '',
                        'parsedAt': datetime.now().isoformat()
                    })
            
            return results
            
        except Exception as e:
            print(f"Ошибка парсинга {url}: {e}")
            return []

    def save_results(self, data: dict, prefix: str = "parse") -> Path:
        """Сохранение результатов"""
        date_folder = datetime.now().strftime("%Y-%m-%d")
        date_str = datetime.now().strftime("%d.%m.%Y")
        
        folder = self.base_path / prefix / date_folder
        folder.mkdir(parents=True, exist_ok=True)
        
        log_path = folder / f"{prefix}_log_{date_str}.json"
        
        log_data = {
            'parsedAt': datetime.now().isoformat(),
            'date': date_str,
            **data
        }
        
        with open(log_path, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, ensure_ascii=False, indent=2)
        
        print(f"Сохранено: {log_path}")
        return log_path


# Примеры использования
def main():
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║         Universal Parser - Универсальный парсер           ║")
    print("╚═══════════════════════════════════════════════════════════╝\n")
    
    # Без прокси
    parser = UniversalParser(base_path="./parse_python")
    
    # С прокси (раскомментировать при необходимости)
    # parser = UniversalParser(
    #     base_path="./parse_python",
    #     proxy="http://username:password@proxy-server.com:8080"
    # )
    
    # Пример парсинга
    url = "https://example.com"  # Замените на нужный сайт
    selectors = {
        'item': '.article',
        'title': 'h2 a',
        'link': 'h2 a',
        'price': '.price',
        'desc': 'p'
    }
    
    print(f"Парсинг: {url}")
    results = parser.parse_url(url, selectors)
    print(f"Найдено: {len(results)} элементов")
    
    if results:
        parser.save_results({
            'url': url,
            'count': len(results),
            'items': results
        }, prefix="custom")


if __name__ == "__main__":
    main()
