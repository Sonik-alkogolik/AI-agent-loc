/**
 * Orders Manager - Управление заказами
 * Хранение каждого заказа в отдельной папке: parse_order_{YYYY-MM-DD}/{id}.json
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class OrdersManager {
  constructor(basePath = './BaseMD/orders') {
    this.basePath = basePath;
  }

  /**
   * Инициализация - создание базовой структуры
   */
  async initialize() {
    await fs.mkdir(this.basePath, { recursive: true });
    console.log('[OrdersManager] Инициализирован');
  }

  /**
   * Получить путь к папке заказа по дате
   */
  getOrderDatePath(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return join(this.basePath, `parse_order_${dateStr}`);
  }

  /**
   * Создать папку для заказов на дату
   */
  async createOrderDateFolder(date = new Date()) {
    const folderPath = this.getOrderDatePath(date);
    await fs.mkdir(folderPath, { recursive: true });
    return folderPath;
  }

  /**
   * Сохранить заказ в отдельный JSON файл
   * @param {Object} orderData - Данные заказа
   * @param {Date} date - Дата (для папки)
   * @returns {Object} - Сохранённый заказ с ID и путём
   */
  async saveOrder(orderData, date = new Date()) {
    const folderPath = await this.createOrderDateFolder(date);
    const orderId = orderData.id || uuidv4();
    const filePath = join(folderPath, `${orderId}.json`);

    const order = {
      id: orderId,
      ...orderData,
      savedAt: new Date().toISOString(),
      status: orderData.status || 'new' // new, viewed, contact, proposal, won, lost
    };

    await fs.writeFile(filePath, JSON.stringify(order, null, 2), 'utf-8');
    console.log(`[OrdersManager] Заказ сохранён: ${filePath}`);

    return { ...order, filePath };
  }

  /**
   * Сохранить несколько заказов
   */
  async saveOrders(orders, date = new Date()) {
    const saved = [];
    for (const order of orders) {
      const result = await this.saveOrder(order, date);
      saved.push(result);
    }
    return saved;
  }

  /**
   * Получить все папки с заказами
   */
  async getOrderFolders() {
    const entries = await fs.readdir(this.basePath, { withFileTypes: true });
    return entries
      .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('parse_order_'))
      .map(dirent => dirent.name);
  }

  /**
   * Получить заказ по ID
   */
  async getOrderById(orderId) {
    const folders = await this.getOrderFolders();
    
    for (const folder of folders) {
      const filePath = join(this.basePath, folder, `${orderId}.json`);
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
      } catch {
        continue;
      }
    }
    return null;
  }

  /**
   * Получить все заказы из папки
   */
  async getOrdersFromFolder(folderName) {
    const folderPath = join(this.basePath, folderName);
    const files = await fs.readdir(folderPath);
    
    const orders = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(folderPath, file);
        const data = await fs.readFile(filePath, 'utf-8');
        orders.push(JSON.parse(data));
      }
    }
    return orders;
  }

  /**
   * Получить все заказы за все даты
   */
  async getAllOrders() {
    const folders = await this.getOrderFolders();
    const allOrders = [];

    for (const folder of folders) {
      const orders = await this.getOrdersFromFolder(folder);
      allOrders.push(...orders);
    }

    // Сортировка по дате размещения (новые сверху)
    return allOrders.sort((a, b) => 
      new Date(b.postedAt || 0) - new Date(a.postedAt || 0)
    );
  }

  /**
   * Получить заказы за конкретную дату
   */
  async getOrdersByDate(date) {
    const folderName = `parse_order_${date.toISOString().split('T')[0]}`;
    return this.getOrdersFromFolder(folderName);
  }

  /**
   * Обновить статус заказа
   */
  async updateOrderStatus(orderId, status) {
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error(`Заказ ${orderId} не найден`);
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();

    const folderPath = this.getOrderDatePath(new Date(order.savedAt));
    const filePath = join(folderPath, `${orderId}.json`);

    await fs.writeFile(filePath, JSON.stringify(order, null, 2), 'utf-8');
    return order;
  }

  /**
   * Обновить данные заказа
   */
  async updateOrder(orderId, updates) {
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error(`Заказ ${orderId} не найден`);
    }

    Object.assign(order, updates);
    order.updatedAt = new Date().toISOString();

    const folderPath = this.getOrderDatePath(new Date(order.savedAt));
    const filePath = join(folderPath, `${orderId}.json`);

    await fs.writeFile(filePath, JSON.stringify(order, null, 2), 'utf-8');
    return order;
  }

  /**
   * Удалить заказ
   */
  async deleteOrder(orderId) {
    const order = await this.getOrderById(orderId);
    if (!order) {
      return false;
    }

    const folderPath = this.getOrderDatePath(new Date(order.savedAt));
    const filePath = join(folderPath, `${orderId}.json`);

    await fs.unlink(filePath);
    console.log(`[OrdersManager] Заказ удалён: ${filePath}`);
    return true;
  }

  /**
   * Получить статистику заказов
   */
  getStats(orders) {
    const stats = {
      total: orders.length,
      byStatus: {},
      bySource: {},
      byType: {},
      today: 0,
      thisWeek: 0
    };

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    for (const order of orders) {
      // По статусам
      const status = order.status || 'new';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // По источникам
      const source = order.source || 'unknown';
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;

      // По типам проектов
      const type = order.projectType || 'generic';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // За сегодня
      const orderDate = order.savedAt ? order.savedAt.split('T')[0] : '';
      if (orderDate === today) {
        stats.today++;
      }

      // За неделю
      const orderSavedAt = order.savedAt ? new Date(order.savedAt) : new Date(0);
      if (orderSavedAt >= weekAgo) {
        stats.thisWeek++;
      }
    }

    return stats;
  }

  /**
   * Конвертировать заказы в таблицу (массив строк)
   */
  toTable(orders) {
    return orders.map(order => ({
      id: order.id.substring(0, 8) + '...',
      title: order.title?.substring(0, 50) || 'Без названия',
      source: order.source || 'unknown',
      type: order.projectType || 'generic',
      budget: order.budget || 'Не указан',
      status: order.status || 'new',
      postedAt: order.postedAt ? new Date(order.postedAt).toLocaleDateString('ru-RU') : '-',
      savedAt: order.savedAt ? new Date(order.savedAt).toLocaleString('ru-RU') : '-'
    }));
  }

  /**
   * Вывести таблицу в консоль
   */
  printTable(orders) {
    const table = this.toTable(orders);
    
    console.table(table, [
      'id', 'title', 'source', 'type', 'budget', 'status', 'postedAt', 'savedAt'
    ]);
  }
}

export default OrdersManager;
