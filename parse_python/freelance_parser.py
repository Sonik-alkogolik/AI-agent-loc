#!/usr/bin/env python3
"""
Парсинг бирж фриланса (FL.ru, Freelance.ru, Kwork)
Сохранение в parse_python/parse-freelance/{date}/parse_freelance_log_{date}.json
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
from pathlib import Path
import json
import time
import random


class FreelanceParser:
    def __init__(self, base_path: str = "./parse_python"):
        self.base_path = Path(base_path)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9'
        })
        
        self.results = []

    def get_date_folder(self) -> str:
        return datetime.now().strftime("%Y-%m-%d")

    def get_date_formatted(self) -> str:
        return datetime.now().strftime("%d.%m.%Y")

    def create_folders(self) -> Path:
        folder = self.base_path / "parse-freelance" / self.get_date_folder()
        folder.mkdir(parents=True, exist_ok=True)
        return folder

    def get_log_filepath(self) -> Path:
        folder = self.create_folders()
        return folder / f"parse_freelance_log_{self.get_date_formatted()}.json"

    def parse_fl_ru(self) -> list:
        """Парсинг FL.ru (публичные проекты)"""
        print("\n[FL.ru] Парсинг биржи...")
        projects = []
        
        try:
            # Публичные проекты (доступны без авторизации)
            url = "https://www.fl.ru/projects/"
            response = self.session.get(url, timeout=15)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                # Ищем проекты (селекторы могут измениться)
                items = soup.select('.projectsList__item, .project-card, div.project')
                
                for item in items[:10]:
                    title_el = item.select_one('h3 a, .title a, a.project-title')
                    price_el = item.select_one('.price, .budget, .cost')
                    desc_el = item.select_one('.description, .project-desc, p')
                    
                    if title_el:
                        projects.append({
                            'source': 'fl.ru',
                            'title': title_el.get_text(strip=True),
                            'url': 'https://www.fl.ru' + title_el.get('href', '') if title_el.get('href', '').startswith('/') else title_el.get('href', ''),
                            'budget': price_el.get_text(strip=True) if price_el else 'Не указан',
                            'description': desc_el.get_text(strip=True)[:200] if desc_el else '',
                            'parsedAt': datetime.now().isoformat()
                        })
                
                print(f"   Найдено проектов: {len(projects)}")
            else:
                print(f"   Статус: {response.status_code}")
                
        except Exception as e:
            print(f"   Ошибка: {e}")
        
        return projects

    def parse_freelance_ru(self) -> list:
        """Парсинг Freelance.ru"""
        print("[Freelance.ru] Парсинг биржи...")
        projects = []
        
        try:
            url = "https://freelance.ru/projects/"
            response = self.session.get(url, timeout=15)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                items = soup.select('.project-item, .projects-list li, div.project-card')
                
                for item in items[:10]:
                    title_el = item.select_one('h3 a, .title a, a.project-link')
                    price_el = item.select_one('.price, .budget')
                    
                    if title_el:
                        projects.append({
                            'source': 'freelance.ru',
                            'title': title_el.get_text(strip=True),
                            'url': title_el.get('href', ''),
                            'budget': price_el.get_text(strip=True) if price_el else 'Не указан',
                            'parsedAt': datetime.now().isoformat()
                        })
                
                print(f"   Найдено проектов: {len(projects)}")
                
        except Exception as e:
            print(f"   Ошибка: {e}")
        
        return projects

    def parse_kwork(self) -> list:
        """Парсинг Kwork (публичные кворки)"""
        print("[Kwork] Парсинг биржи...")
        projects = []
        
        try:
            url = "https://kwork.ru/birja"
            response = self.session.get(url, timeout=15)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                items = soup.select('.kw-project-item, .projects-list .card')
                
                for item in items[:10]:
                    title_el = item.select_one('.kw-project-title a, h4 a, .title a')
                    price_el = item.select_one('.kw-price, .price')
                    author_el = item.select_one('.author, .client-name')
                    
                    if title_el:
                        projects.append({
                            'source': 'kwork.ru',
                            'title': title_el.get_text(strip=True),
                            'url': 'https://kwork.ru' + title_el.get('href', '') if title_el.get('href', '').startswith('/') else title_el.get('href', ''),
                            'budget': price_el.get_text(strip=True) if price_el else 'Не указан',
                            'author': author_el.get_text(strip=True) if author_el else '',
                            'parsedAt': datetime.now().isoformat()
                        })
                
                print(f"   Найдено проектов: {len(projects)}")
                
        except Exception as e:
            print(f"   Ошибка: {e}")
        
        return projects

    def parse_all(self) -> list:
        """Парсинг всех бирж"""
        print("╔═══════════════════════════════════════════════════════════╗")
        print("║         Freelance Parser - Парсинг бирж фриланса          ║")
        print("╚═══════════════════════════════════════════════════════════╝\n")
        
        all_projects = []
        
        # FL.ru
        fl_projects = self.parse_fl_ru()
        all_projects.extend(fl_projects)
        
        time.sleep(random.uniform(1, 2))
        
        # Freelance.ru
        fr_projects = self.parse_freelance_ru()
        all_projects.extend(fr_projects)
        
        time.sleep(random.uniform(1, 2))
        
        # Kwork
        kwork_projects = self.parse_kwork()
        all_projects.extend(kwork_projects)
        
        print(f"\n[FreelanceParser] Всего найдено: {len(all_projects)} проектов")
        return all_projects

    def save_results(self, projects: list) -> dict:
        """Сохранение в JSON"""
        log_path = self.get_log_filepath()
        
        # Группировка по источникам
        by_source = {}
        for p in projects:
            source = p.get('source', 'unknown')
            if source not in by_source:
                by_source[source] = []
            by_source[source].append(p)
        
        log_data = {
            'parsedAt': datetime.now().isoformat(),
            'date': self.get_date_formatted(),
            'totalProjects': len(projects),
            'bySource': {src: len(items) for src, items in by_source.items()},
            'projects': projects
        }
        
        with open(log_path, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, ensure_ascii=False, indent=2)
        
        print(f"[FreelanceParser] Сохранено: {log_path}")
        return log_data

    def parse_and_save(self) -> dict:
        """Парсинг и сохранение"""
        projects = self.parse_all()
        
        if not projects:
            print("\n[FreelanceParser] Проекты не найдены")
            return None
        
        return self.save_results(projects)


def main():
    parser = FreelanceParser()
    log_data = parser.parse_and_save()
    
    if log_data:
        print(f"\n✅ Парсинг завершён!")
        print(f"   Всего проектов: {log_data['totalProjects']}")
        print(f"   По источникам: {log_data['bySource']}")
        print(f"   Файл: {parser.get_log_filepath()}")
    else:
        print("\n❌ Парсинг не удался")


if __name__ == "__main__":
    main()
