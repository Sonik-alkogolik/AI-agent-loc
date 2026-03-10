"""
Orders Manager - Управление заказами (Python версия)
Хранение каждого заказа в отдельной папке: parse_order_{YYYY-MM-DD}/{id}.json
"""

import json
import uuid
from datetime import datetime
from pathlib import Path


class OrdersManager:
    def __init__(self, base_path: str = "./BaseMD/orders"):
        self.base_path = Path(base_path)

    def initialize(self):
        """Инициализация - создание базовой структуры"""
        self.base_path.mkdir(parents=True, exist_ok=True)
        print('[OrdersManager] Инициализирован')

    def get_order_date_path(self, date: datetime = None) -> Path:
        """Получить путь к папке заказа по дате"""
        if date is None:
            date = datetime.now()
        date_str = date.strftime('%Y-%m-%d')
        return self.base_path / f"parse_order_{date_str}"

    def create_order_date_folder(self, date: datetime = None) -> Path:
        """Создать папку для заказов на дату"""
        folder_path = self.get_order_date_path(date)
        folder_path.mkdir(parents=True, exist_ok=True)
        return folder_path

    def save_order(self, order_data: dict, date: datetime = None) -> dict:
        """
        Сохранить заказ в отдельный JSON файл
        
        Args:
            order_data: Данные заказа
            date: Дата (для папки)
        
        Returns:
            Сохранённый заказ с ID и путём
        """
        if date is None:
            date = datetime.now()
        
        folder_path = self.create_order_date_folder(date)
        order_id = order_data.get('id', str(uuid.uuid4()))
        file_path = folder_path / f"{order_id}.json"
        
        order = {
            'id': order_id,
            **order_data,
            'savedAt': datetime.now().isoformat(),
            'status': order_data.get('status', 'new')
        }
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(order, f, ensure_ascii=False, indent=2)
        
        print(f'[OrdersManager] Заказ сохранён: {file_path}')
        return {**order, 'filePath': str(file_path)}

    def save_orders(self, orders: list, date: datetime = None) -> list:
        """Сохранить несколько заказов"""
        saved = []
        for order in orders:
            result = self.save_order(order, date)
            saved.append(result)
        return saved

    def get_order_folders(self) -> list:
        """Получить все папки с заказами"""
        if not self.base_path.exists():
            return []
        
        folders = []
        for item in self.base_path.iterdir():
            if item.is_dir() and item.name.startswith('parse_order_'):
                folders.append(item.name)
        return sorted(folders)

    def get_order_by_id(self, order_id: str) -> dict:
        """Получить заказ по ID"""
        folders = self.get_order_folders()
        
        for folder in folders:
            file_path = self.base_path / folder / f"{order_id}.json"
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        return None

    def get_orders_from_folder(self, folder_name: str) -> list:
        """Получить все заказы из папки"""
        folder_path = self.base_path / folder_name
        if not folder_path.exists():
            return []
        
        orders = []
        for file in folder_path.glob('*.json'):
            with open(file, 'r', encoding='utf-8') as f:
                orders.append(json.load(f))
        return orders

    def get_all_orders(self) -> list:
        """Получить все заказы за все даты"""
        folders = self.get_order_folders()
        all_orders = []
        
        for folder in folders:
            orders = self.get_orders_from_folder(folder)
            all_orders.extend(orders)
        
        # Сортировка по дате размещения (новые сверху)
        return sorted(
            all_orders,
            key=lambda x: x.get('postedAt', x.get('savedAt', '')),
            reverse=True
        )

    def get_orders_by_date(self, date: datetime) -> list:
        """Получить заказы за конкретную дату"""
        folder_name = f"parse_order_{date.strftime('%Y-%m-%d')}"
        return self.get_orders_from_folder(folder_name)

    def update_order_status(self, order_id: str, status: str) -> dict:
        """Обновить статус заказа"""
        order = self.get_order_by_id(order_id)
        if not order:
            raise ValueError(f"Заказ {order_id} не найден")
        
        order['status'] = status
        order['updatedAt'] = datetime.now().isoformat()
        
        # Сохранение
        folder_path = self.get_order_date_path(datetime.fromisoformat(order['savedAt']))
        file_path = folder_path / f"{order_id}.json"
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(order, f, ensure_ascii=False, indent=2)
        
        return order

    def get_stats(self, orders: list = None) -> dict:
        """Получить статистику заказов"""
        if orders is None:
            orders = self.get_all_orders()
        
        stats = {
            'total': len(orders),
            'byStatus': {},
            'bySource': {},
            'byType': {},
            'today': 0,
            'thisWeek': 0
        }
        
        now = datetime.now()
        today = now.strftime('%Y-%m-%d')
        week_ago = datetime(now.year, now.month, now.day - 7)
        
        for order in orders:
            # По статусам
            status = order.get('status', 'new')
            stats['byStatus'][status] = stats['byStatus'].get(status, 0) + 1
            
            # По источникам
            source = order.get('source', 'unknown')
            stats['bySource'][source] = stats['bySource'].get(source, 0) + 1
            
            # По типам проектов
            project_type = order.get('projectType', 'generic')
            stats['byType'][project_type] = stats['byType'].get(project_type, 0) + 1
            
            # За сегодня
            saved_at = order.get('savedAt', '')[:10]
            if saved_at == today:
                stats['today'] += 1
            
            # За неделю
            order_date = datetime.fromisoformat(order.get('savedAt', '1970-01-01'))
            if order_date >= week_ago:
                stats['thisWeek'] += 1
        
        return stats

    def to_table(self, orders: list) -> list:
        """Конвертировать заказы в таблицу (массив строк)"""
        table = []
        for order in orders:
            table.append({
                'id': order.get('id', '')[:8] + '...',
                'title': (order.get('title', 'Без названия') or '')[:50],
                'source': order.get('source', 'unknown'),
                'type': order.get('projectType', 'generic'),
                'budget': order.get('budget', 'Не указан'),
                'status': order.get('status', 'new'),
                'postedAt': order.get('postedAt', '')[:10] if order.get('postedAt') else '-',
                'savedAt': order.get('savedAt', '')[:19].replace('T', ' ') if order.get('savedAt') else '-'
            })
        return table

    def print_table(self, orders: list):
        """Вывести таблицу в консоль"""
        table = self.to_table(orders)
        
        if not table:
            print("Нет данных для отображения")
            return
        
        # Заголовки
        print("\n┌───────────┬──────────────────────────────────────────────────┬──────────────┬────────────┬─────────────┬──────────┬────────────┬─────────────────────┐")
        print("│ ID        │ Title                                            │ Source       │ Type       │ Budget      │ Status   │ Posted     │ Saved               │")
        print("├───────────┼──────────────────────────────────────────────────┼──────────────┼────────────┼─────────────┼──────────┼────────────┼─────────────────────┤")
        
        for row in table[:20]:
            title = (row['title'][:48] + '...') if len(row['title']) > 50 else row['title'].ljust(50)
            print(f"│ {row['id'].ljust(9)} │ {title} │ {row['source'].ljust(12)} │ {row['type'].ljust(10)} │ {str(row['budget']).ljust(11)} │ {row['status'].ljust(8)} │ {row['postedAt'].ljust(10)} │ {row['savedAt'].ljust(19)} │")
        
        if len(table) > 20:
            print(f"│ ... и ещё {len(table) - 20} заказов")
        
        print("└───────────┴──────────────────────────────────────────────────┴──────────────┴────────────┴─────────────┴──────────┴────────────┴─────────────────────┘")
