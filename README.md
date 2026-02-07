# OIDC Local Dev Redirector

[![Release](https://github.com/nctay/redirector-chrome-extension/actions/workflows/release.yml/badge.svg)](https://github.com/nctay/redirector-chrome-extension/actions/workflows/release.yml)

Chrome-расширение для перенаправления OIDC/OAuth callback URL со staging/production на localhost. Поддерживает именованные пресеты для быстрого переключения между окружениями.

## Проблема

Auth-провайдер (Keycloak, Auth0 и т.д.) редиректит на зарегистрированный callback URL (staging/prod), но разработка идёт на `localhost`. Это расширение перехватывает редирект и отправляет его на localhost с сохранением path и query-параметров.

## Установка

1. Скачайте ZIP из [последнего релиза](https://github.com/nctay/redirector-chrome-extension/releases/latest)
2. Распакуйте архив в любую папку
3. Откройте `chrome://extensions/`
4. Включите **Developer mode** (переключатель в правом верхнем углу)
5. Нажмите **Load unpacked** и выберите распакованную папку

## Использование

### Пресеты

Расширение работает через систему пресетов — именованных комбинаций URL + порт:

1. Нажмите на иконку расширения
2. Нажмите **+ Add**
3. Заполните:
   - **Name** — название окружения (например, `Staging`, `Production`)
   - **Source URL** — URL, с которого перенаправлять (например, `https://staging.example.com`)
   - **Localhost port** — порт на localhost (например, `3000`)
4. Нажмите **Save preset**

Переключение между пресетами — клик по нужному в списке. Активный пресет подсвечивается зелёным.

### Пример

```
Пресет "Staging":
  https://bonus.apps.k8s.stg.bonus.inno.tech/callback?code=abc123
  → http://localhost:3000/callback?code=abc123

Пресет "Production":
  https://bonus.apps.k8s.bonus.inno.tech/callback?code=abc123
  → http://localhost:8080/callback?code=abc123
```

### Включение / выключение

- Кнопка в popup
- Горячая клавиша: `Ctrl+Shift+9` (Mac: `Cmd+Shift+9`)

## Сборка из исходников

```bash
git clone https://github.com/nctay/redirector-chrome-extension.git
cd redirector-chrome-extension
./build.sh
```

Результат — файл `oidc-redirector-v*.zip` в корне проекта.

## Релиз

При пуше в `main` GitHub Actions автоматически:
1. Читает версию из `manifest.json`
2. Собирает ZIP
3. Создаёт тег и GitHub Release с приложенным архивом

Для нового релиза достаточно обновить `"version"` в `manifest.json` и запушить в `main`.

## Лицензия

[MIT](LICENSE)
