#!/usr/bin/env python3
"""
Простая установка ChromeDriver
"""

from webdriver_manager.chrome import ChromeDriverManager

print("╔═══════════════════════════════════════════════════════════╗")
print("║         Установка ChromeDriver                            ║")
print("╚═══════════════════════════════════════════════════════════╝\n")

try:
    print("Загрузка ChromeDriver...")
    driver_path = ChromeDriverManager().install()
    print(f"\n✅ ChromeDriver установлен!")
    print(f"   Путь: {driver_path}")
    print("\nТеперь можно запустить парсер:")
    print("   python yandex_selenium_chrome.py")
except Exception as e:
    print(f"❌ Ошибка: {e}")
    print("\n💡 Скачайте ChromeDriver вручную:")
    print("   https://chromedriver.chromium.org/downloads")
