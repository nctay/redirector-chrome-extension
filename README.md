# 🔄 OIDC Local Dev Redirector

[![Build Extension](https://github.com/YOUR_USERNAME/oidc-redirector/actions/workflows/build.yml/badge.svg)](https://github.com/YOUR_USERNAME/oidc-redirector/actions/workflows/build.yml)
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/YOUR_USERNAME/oidc-redirector/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Настраиваемое Chrome-расширение для перенаправления URL production/staging на локальный сервер разработки. Идеально для работы с OIDC/OAuth callback URLs.

![Extension Screenshot](https://via.placeholder.com/800x400/2196F3/FFFFFF?text=Extension+Demo)

## 🎯 Проблема

При разработке приложений с OIDC/OAuth авторизацией:

- Auth-провайдер (Keycloak, Auth0) перенаправляет на зарегистрированный callback URL
- В настройках указан production/staging URL
- Но разработка идет на `http://localhost:3000`

**Решение:** Расширение автоматически перехватывает редирект и отправляет на localhost с сохранением всех параметров.

## ✨ Возможности

- ⚙️ **Настраиваемые URL** — укажите любые source и target URL
- 💾 **Автосохранение** — настройки сохраняются при перезагрузке
- 🔄 **Быстрое переключение** — кнопка в popup
- ⌨️ **Горячая клавиша** — `Ctrl+Shift+9` (Mac: `Command+Shift+9`)
- 👁️ **Визуальная индикация** — текущий статус и маппинг
- 🚀 **Легкая установка** — один ZIP файл

## 📦 Установка

### Способ 1: Из Releases (рекомендуется)

1. Перейдите на [Releases](https://github.com/YOUR_USERNAME/oidc-redirector/releases)
2. Скачайте `oidc-redirector-v1.0.0.zip` из последнего релиза
3. Распакуйте архив
4. Откройте `chrome://extensions/`
5. Включите "Режим разработчика"
6. Нажмите "Загрузить распакованное расширение"
7. Выберите папку с распакованными файлами

### Способ 2: Сборка из исходников

```bash
# Клонируйте репозиторий
git clone https://github.com/YOUR_USERNAME/oidc-redirector.git
cd oidc-redirector

# Соберите расширение
./build.sh

# Или вручную создайте ZIP
zip -r oidc-redirector.zip manifest.json background.js popup.html popup.js icon.png README.md
```

## 🚀 Использование

### Первичная настройка

1. Кликните на иконку расширения
2. В разделе "Configuration" введите:
   - **From URL**: `https://staging.example.com`
   - **To URL**: `http://localhost:3000`
3. Нажмите "Save Settings"

### Включение/выключение

**Через popup:**

- Кликните на иконку → кнопка "Enable/Disable redirects"

**Горячая клавиша:**

- `Ctrl+Shift+9` (Mac: `Command+Shift+9`)

## 📝 Примеры использования

### Пример 1: Keycloak OIDC

```
From: https://auth.myapp.com
To:   http://localhost:3000

https://auth.myapp.com/callback?code=abc123
  ↓
http://localhost:3000/callback?code=abc123
```

### Пример 2: Auth0

```
From: https://app.us.auth0.com
To:   http://localhost:8080

https://app.us.auth0.com/oauth/callback?state=xyz
  ↓
http://localhost:8080/oauth/callback?state=xyz
```

### Пример 3: Custom staging

```
From: https://staging.api.example.com
To:   http://localhost:4000

https://staging.api.example.com/api/users
  ↓
http://localhost:4000/api/users
```

## 🔧 Разработка

### Требования

- Chrome/Chromium browser
- Git

### Структура проекта

```
oidc-redirector/
├── manifest.json       # Конфигурация расширения
├── background.js       # Service worker
├── popup.html         # UI popup
├── popup.js           # Логика popup
├── icon.png           # Иконка
├── build.sh           # Скрипт сборки
├── .github/
│   └── workflows/
│       └── build.yml  # GitHub Actions
└── README.md
```

### Локальная разработка

1. Клонируйте репозиторий

```bash
git clone https://github.com/YOUR_USERNAME/oidc-redirector.git
cd oidc-redirector
```

2. Загрузите в Chrome

- Откройте `chrome://extensions/`
- Включите "Режим разработчика"
- "Загрузить распакованное расширение"
- Выберите папку с проектом

3. При изменениях нажимайте "Обновить" (⟳) в `chrome://extensions/`

### Релиз новой версии

1. Обновите версию в `manifest.json`

```json
{
  "version": "2.1.0"
}
```

2. Создайте тег и запушьте

```bash
git add manifest.json
git commit -m "Bump version to 2.1.0"
git tag v2.1.0
git push origin main
git push origin v2.1.0
```

3. GitHub Actions автоматически:
   - Соберет ZIP
   - Создаст Release
   - Прикрепит ZIP к релизу

## 🤖 GitHub Actions

При каждом push в `main` или создании тега:

- ✅ Автоматически собирается ZIP
- ✅ Загружается как Artifact
- ✅ При теге создается Release с файлом

### Просмотр сборок

[Actions](https://github.com/YOUR_USERNAME/oidc-redirector/actions)

### Скачивание artifacts

1. Перейдите в Actions → Build Extension
2. Выберите последний успешный workflow
3. Скачайте artifact внизу страницы

## 🔐 Безопасность

- ✅ Работает только локально
- ✅ Не отправляет данные на внешние серверы
- ✅ Использует динамические правила (минимальные разрешения)
- ✅ Open source — можете проверить код

## 🐛 Troubleshooting

**Редирект не работает:**

- Убедитесь, что расширение включено (зеленый статус)
- Проверьте правильность URL
- URL должны содержать `http://` или `https://`
- Не добавляйте `/` в конце URL

**Настройки не сохраняются:**

- Проверьте разрешения в `chrome://extensions/`
- Убедитесь, что разрешение "storage" активно

**GitHub Actions не работает:**

- Проверьте права доступа в Settings → Actions → General
- Должен быть включен "Read and write permissions"

## 📄 Лицензия

MIT License - используйте свободно

## 🤝 Вклад в проект

Contributions welcome!

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📞 Поддержка

- 🐛 [Issues](https://github.com/YOUR_USERNAME/oidc-redirector/issues)
- 💬 [Discussions](https://github.com/YOUR_USERNAME/oidc-redirector/discussions)

## ⭐ Star History

Если проект полезен, поставьте звезду! ⭐

---

**Автор:** Nctay
**Версия:** 1.0.0  
**Дата:** 2026
