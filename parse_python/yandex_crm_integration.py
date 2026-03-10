#!/usr/bin/env python3
"""
Yandex Parser + CRM Integration
Парсинг Яндекса через Selenium с сохранением в CRM (OrdersManager)

Запуск:
    python yandex_crm_integration.py
"""

from pathlib import Path
from yandex_selenium_chrome import YandexSeleniumParser
from orders_manager import OrdersManager
from datetime import datetime
import time
import re


class YandexCRMIntegration:
    """Интеграция Yandex Parser с CRM системой"""
    
    def __init__(self, base_path: str = "./parse_python"):
        self.parser = YandexSeleniumParser(base_path=base_path, headless=False)
        self.orders_manager = OrdersManager(base_path=str(Path(base_path).parent / "BaseMD" / "orders"))
        self.queries = []

    def set_queries(self, queries: list):
        """Установить поисковые запросы"""
        self.queries = queries
        print(f"📋 Запросы установлены: {len(queries)} шт.")
        for i, q in enumerate(queries, 1):
            print(f"   {i}. {q}")

    def extract_contact_info(self, snippet: str, title: str) -> dict:
        """Извлечение контактной информации из сниппета"""
        contacts = {
            'phone': None,
            'email': None,
            'telegram': None
        }
        
        text = snippet + ' ' + title
        
        # Поиск телефона
        phone_patterns = [
            r'[\+]?[0-9\s\-\(\)]{10,}',
            r'\+7\s?\(?\d{3}\)?\s?\d{3}\s?\d{2}\s?\d{2}',
            r'8\s?\(?\d{3}\)?\s?\d{3}\s?\d{2}\s?\d{2}'
        ]
        
        for pattern in phone_patterns:
            match = re.search(pattern, text)
            if match:
                contacts['phone'] = match.group().strip()
                break
        
        # Поиск email
        email_match = re.search(r'[\w.-]+@[\w.-]+\.\w+', text)
        if email_match:
            contacts['email'] = email_match.group()
        
        # Поиск Telegram
        tg_match = re.search(r'@(\w+)', text)
        if tg_match:
            contacts['telegram'] = tg_match.group()
        
        return contacts

    def detect_project_type(self, query: str, title: str, snippet: str) -> str:
        """Определение типа проекта"""
        text = (query + ' ' + title + ' ' + snippet).lower()
        
        if 'bitrix' in text or '1с-битрикс' in text:
            return 'bitrix'
        elif 'wordpress' in text or 'вордпресс' in text:
            return 'wordpress'
        elif 'landing' in text or 'лендинг' in text or 'одностраничн' in text:
            return 'landing'
        elif 'интернет-магазин' in text or 'интернет магазин' in text or 'shop' in text:
            return 'shop'
        elif 'crm' in text:
            return 'crm'
        elif 'вёрстка' in text or 'верстка' in text:
            return 'layout'
        elif 'поддержк' in text or 'сопровожд' in text:
            return 'support'
        
        return 'web_development'

    def parse_and_add_to_crm(self, captcha_wait_time: int = 60) -> dict:
        """
        Парсинг Яндекса и добавление результатов в CRM
        
        Returns:
            dict со статистикой добавленных заказов
        """
        print("\n" + "="*70)
        print("🚀 Yandex Parser + CRM Integration")
        print("="*70)
        
        # Инициализация
        print("\n1. Инициализация парсера...")
        self.parser.setup_driver()
        
        try:
            # Парсинг
            print("\n2. Запуск парсинга...")
            all_results = []
            
            for i, query in enumerate(self.queries, 1):
                print(f"\n[{i}/{len(self.queries)}]")
                results = self.parser.search(query, wait_time=captcha_wait_time)
                
                if results:
                    all_results.extend(results)
                
                if i < len(self.queries):
                    time.sleep(2)
            
            print(f"\n✅ Парсинг завершён. Найдено: {len(all_results)} результатов")
            
            # Добавление в CRM
            print("\n3. Добавление в CRM...")
            self.orders_manager.initialize()
            
            added_count = 0
            skipped_count = 0
            
            for result in all_results:
                # Извлечение данных
                contacts = self.extract_contact_info(
                    result.get('snippet', ''),
                    result.get('title', '')
                )
                
                # Определяем тип проекта на основе запроса
                search_query = next(
                    (q for q in self.queries if q.lower() in (result.get('title', '') + result.get('snippet', '')).lower()),
                    ''
                )
                
                project_type = self.detect_project_type(
                    search_query,
                    result.get('title', ''),
                    result.get('snippet', '')
                )
                
                # Формирование заказа
                order_data = {
                    'title': result.get('title', 'Без названия'),
                    'description': result.get('snippet', ''),
                    'source': 'yandex_search',
                    'url': result.get('url', ''),
                    'projectType': project_type,
                    'contact': contacts,
                    'searchQuery': search_query,
                    'position': result.get('position', 0),
                    'status': 'new'
                }
                
                # Сохранение
                try:
                    saved_order = self.orders_manager.save_order(order_data)
                    added_count += 1
                    print(f"   ✅ Добавлен: {order_data['title'][:50]}...")
                except Exception as e:
                    skipped_count += 1
                    print(f"   ⚠️ Пропущен: {e}")
            
            # Статистика
            stats = {
                'parsed': len(all_results),
                'added': added_count,
                'skipped': skipped_count,
                'queries': len(self.queries)
            }
            
            print(f"\n{'='*70}")
            print(f"📊 Статистика:")
            print(f"   Запросов: {stats['queries']}")
            print(f"   Найдено: {stats['parsed']}")
            print(f"   Добавлено в CRM: {stats['added']}")
            print(f"   Пропущено: {stats['skipped']}")
            print(f"{'='*70}")
            
            return stats
            
        finally:
            self.parser.close_driver()


def main():
    from pathlib import Path
    
    # Поисковые запросы
    queries = [
        'заказать сайт wordpress',
        'разработка сайтов битрикс',
        'верстка лендинга',
        'создать интернет магазин',
        'техническая поддержка сайта'
    ]
    
    # Интеграция
    integration = YandexCRMIntegration()
    integration.set_queries(queries)
    
    # Парсинг и добавление в CRM
    stats = integration.parse_and_add_to_crm(captcha_wait_time=60)
    
    if stats['added'] > 0:
        print(f"\n✅ Успешно добавлено {stats['added']} заказов в CRM!")
        print("   Проверьте: BaseMD/orders/parse_order_{date}/")
        print("\n   Для просмотра CRM запустите:")
        print("   cd C:\\Qwen\\AI-agent-loc")
        print("   npm run crm")
    else:
        print("\n❌ Ни одного заказа не добавлено")


if __name__ == "__main__":
    main()
