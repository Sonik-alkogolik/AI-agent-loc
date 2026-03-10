/**
 * Парсер Kwork.ru
 * Использует авторизацию через axios + cheerio
 * Примечание: Kwork может требовать капчу при частых запросах
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import { join } from 'path';

export class KworkParser {
  constructor(email, password, sessionPath = './kwork_session.json') {
    this.email = email;
    this.password = password;
    this.sessionPath = sessionPath;
    this.isAuthenticated = false;
    this.cookies = [];
    
    // Настройка axios
    this.axiosInstance = axios.create({
      baseURL: 'https://kwork.ru',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      withCredentials: true
    });
    
    // Ключевые слова для поиска
    this.searchQueries = [
      'wordpress',
      'bitrix',
      'вёрстка сайта',
      'создать сайт',
      'разработка сайта',
      'интернет магазин',
      'интеграция bitrix',
      'интеграция wordpress',
      'доработать сайт',
      'landing page',
      'лендинг'
    ];
    
    this.baseUrl = 'https://kwork.ru';
    this.projectsUrl = 'https://kwork.ru/birja';
  }

  /**
   * Инициализация и авторизация
   */
  async initialize() {
    console.log('[KworkParser] Инициализация...');
    
    // Загрузка cookies если есть сессия
    await this.loadSession();
    
    if (!this.isAuthenticated) {
      await this.login();
    }
    
    console.log('[KworkParser] Авторизация успешна');
  }

  /**
   * Вход в аккаунт
   */
  async login() {
    console.log('[KworkParser] Вход в аккаунт...');
    
    try {
      // Отправка формы входа
      const response = await this.axiosInstance.post(
        '/login',
        new URLSearchParams({
          'login_or_email': this.email,
          'password': this.password
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      );
      
      // Сохранение cookies
      if (response.headers['set-cookie']) {
        this.cookies = response.headers['set-cookie'];
        this.isAuthenticated = true;
        await this.saveSession();
        console.log('[KworkParser] Вход выполнен успешно');
      } else {
        throw new Error('Не удалось получить cookies после входа');
      }
      
    } catch (error) {
      console.error('[KworkParser] Ошибка входа:', error.message);
      
      if (error.response?.status === 403) {
        console.log('[KworkParser] Возможно, требуется капча или вход через браузер');
      }
      
      throw error;
    }
  }

  /**
   * Сохранение сессии (cookies)
   */
  async saveSession() {
    await fs.writeFile(this.sessionPath, JSON.stringify(this.cookies), 'utf-8');
    console.log('[KworkParser] Сессия сохранена');
  }

  /**
   * Загрузка сессии (cookies)
   */
  async loadSession() {
    try {
      const cookiesData = await fs.readFile(this.sessionPath, 'utf-8');
      this.cookies = JSON.parse(cookiesData);
      
      if (this.cookies.length > 0) {
        this.isAuthenticated = true;
        console.log('[KworkParser] Сессия восстановлена');
      }
    } catch {
      console.log('[KworkParser] Сессия не найдена или невалидна');
      this.isAuthenticated = false;
    }
  }

  /**
   * Поиск проектов по запросу
   */
  async searchProjects(query, limit = 20) {
    console.log(`[KworkParser] Поиск по запросу: ${query}`);
    
    const projects = [];
    let page = 1;
    
    while (projects.length < limit) {
      try {
        const searchUrl = `/birja?f=all&keyword=${encodeURIComponent(query)}&page=${page}`;
        
        const response = await this.axiosInstance.get(searchUrl);
        const $ = cheerio.load(response.data);
        
        const cards = $('.projects-list .card, .projects-list .project-item, .kw-project-item');
        
        if (cards.length === 0) {
          console.log(`[KworkParser] Страница ${page}: проектов не найдено`);
          break;
        }
        
        cards.each((_, card) => {
          const $card = $(card);
          const titleEl = $card.find('.title, h4, .project-title, .kw-project-title');
          const priceEl = $card.find('.price, .cost, .kw-price');
          const authorEl = $card.find('.author, .client-name, .kw-author');
          const descEl = $card.find('.description, .project-desc, .kw-description');
          
          if (titleEl.length > 0) {
            projects.push({
              title: titleEl.text()?.trim() || '',
              price: priceEl?.text()?.trim() || 'Договорная',
              author: authorEl?.text()?.trim() || '',
              description: descEl?.text()?.trim() || '',
              url: $card.find('a').first()?.attr('href') || ''
            });
          }
        });
        
        console.log(`[KworkParser] Страница ${page}: найдено ${cards.length} проектов`);
        page++;
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`[KworkParser] Ошибка при парсинге страницы ${page}:`, error.message);
        break;
      }
    }
    
    return projects.slice(0, limit);
  }

  /**
   * Парсинг по всем поисковым запросам
   */
  async parseAllQueries(limit = 50) {
    console.log('[KworkParser] Начало парсинга всех запросов...');
    
    const allProjects = [];
    const projectsPerQuery = Math.ceil(limit / this.searchQueries.length);
    
    for (const query of this.searchQueries) {
      const projects = await this.searchProjects(query, projectsPerQuery);
      
      const typedProjects = projects.map(p => ({
        ...p,
        source: 'kwork',
        searchQuery: query,
        projectType: this.detectProjectType(query),
        postedAt: new Date().toISOString()
      }));
      
      allProjects.push(...typedProjects);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`[KworkParser] Всего найдено проектов: ${allProjects.length}`);
    return allProjects;
  }

  /**
   * Определение типа проекта
   */
  detectProjectType(query) {
    const lower = query.toLowerCase();
    
    if (lower.includes('bitrix')) return 'bitrix';
    if (lower.includes('wordpress')) return 'wordpress';
    if (lower.includes('лендинг') || lower.includes('landing')) return 'landing';
    if (lower.includes('интернет-магазин')) return 'shop';
    
    return 'generic';
  }

  /**
   * Сохранение проектов в файл
   */
  async saveProjects(projects, outputPath = './parsed_kwork_projects.json') {
    await fs.writeFile(outputPath, JSON.stringify(projects, null, 2), 'utf-8');
    console.log(`[KworkParser] Проекты сохранены в ${outputPath}`);
  }
}

export default KworkParser;
