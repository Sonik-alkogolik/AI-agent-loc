/**
 * Система управления базой знаний (BaseMD)
 * Каждый sub-агент ведёт свою базу знаний в формате Markdown
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class BaseMDManager {
  constructor(agentId, basePath = './BaseMD') {
    this.agentId = agentId;
    this.basePath = basePath;
    this.structure = {
      context: join(basePath, 'context'),
      tasks: join(basePath, 'tasks'),
      memory: join(basePath, 'memory')
    };
  }

  /**
   * Инициализировать структуру папок BaseMD
   */
  async initialize() {
    for (const path of Object.values(this.structure)) {
      await fs.mkdir(path, { recursive: true });
    }
    await this.createGitKeep();
    console.log(`[BaseMD] Инициализирована база знаний для агента ${this.agentId}`);
  }

  /**
   * Создать .gitkeep файлы для пустых папок
   */
  async createGitKeep() {
    for (const path of Object.values(this.structure)) {
      const gitKeepPath = join(path, '.gitkeep');
      try {
        await fs.access(gitKeepPath);
      } catch {
        await fs.writeFile(gitKeepPath, '');
      }
    }
  }

  /**
   * Записать файл в базу знаний
   */
  async write(category, filename, content) {
    const folder = this.structure[category];
    if (!folder) {
      throw new Error(`Неизвестная категория: ${category}`);
    }

    const filePath = join(folder, filename);
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`[BaseMD] Записан файл: ${filePath}`);
    return filePath;
  }

  /**
   * Прочитать файл из базы знаний
   */
  async read(category, filename) {
    const folder = this.structure[category];
    const filePath = join(folder, filename);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`[BaseMD] Ошибка чтения: ${filePath}`, error);
      return null;
    }
  }

  /**
   * Получить список файлов в категории
   */
  async list(category) {
    const folder = this.structure[category];
    
    try {
      const files = await fs.readdir(folder);
      return files.filter(f => f !== '.gitkeep');
    } catch (error) {
      console.error(`[BaseMD] Ошибка списка файлов:`, error);
      return [];
    }
  }

  /**
   * Создать запись контекста
   */
  async addContext(title, content, tags = []) {
    const filename = `${Date.now()}-${this.slugify(title)}.md`;
    const markdown = this.formatContextMD(title, content, tags);
    return await this.write('context', filename, markdown);
  }

  /**
   * Создать запись задачи
   */
  async addTask(taskId, description, result, status = 'completed') {
    const filename = `${taskId}-${this.slugify(description.substring(0, 30))}.md`;
    const markdown = this.formatTaskMD(taskId, description, result, status);
    return await this.write('tasks', filename, markdown);
  }

  /**
   * Добавить запись в память
   */
  async addMemory(title, content, importance = 1) {
    const filename = `${Date.now()}-${this.slugify(title)}.md`;
    const markdown = this.formatMemoryMD(title, content, importance);
    return await this.write('memory', filename, markdown);
  }

  /**
   * Форматировать контекст в Markdown
   */
  formatContextMD(title, content, tags) {
    return `# Контекст: ${title}

**Теги:** ${tags.join(', ')}
**Дата создания:** ${new Date().toISOString()}

---

${content}

---
*Сгенерировано автоматически BaseMD*
`;
  }

  /**
   * Форматировать задачу в Markdown
   */
  formatTaskMD(taskId, description, result, status) {
    return `# Задача: ${description}

**ID задачи:** ${taskId}
**Статус:** ${status}
**Дата выполнения:** ${new Date().toISOString()}

---

## Результат

${result}

---
*Сгенерировано автоматически BaseMD*
`;
  }

  /**
   * Форматировать память в Markdown
   */
  formatMemoryMD(title, content, importance) {
    return `# Память: ${title}

**Важность:** ${'★'.repeat(importance)}${'☆'.repeat(5 - importance)}
**Дата записи:** ${new Date().toISOString()}

---

${content}

---
*Сгенерировано автоматически BaseMD*
`;
  }

  /**
   * Преобразовать строку в slug
   */
  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Поиск по базе знаний
   */
  async search(query, category = null) {
    const categories = category ? [category] : Object.keys(this.structure);
    const results = [];

    for (const cat of categories) {
      const files = await this.list(cat);
      for (const file of files) {
        const content = await this.read(cat, file);
        if (content && content.toLowerCase().includes(query.toLowerCase())) {
          results.push({ category: cat, file, snippet: content.substring(0, 200) });
        }
      }
    }

    return results;
  }
}
