# Cantor CRM — Cloudflare Worker

Канбан-доска клиентских проектов: направления (вкладки) → этапы → карточки проектов.
Всё редактируется кликом прямо в интерфейсе, данные хранятся в Cloudflare KV.
Изначально доска полностью пустая — вкладки, этапы и проекты добавляются вручную через «+».

Файлы:
- `src/index.js` — Worker: отдаёт статику и обслуживает `/api/board` (чтение/запись состояния в KV), базовая авторизация.
- `public/index.html` — весь фронтенд (HTML/CSS/JS в одном файле, без сборки).
- `wrangler.toml` — конфигурация Worker'а.

## 1. Создать KV namespace

В Cloudflare Dashboard: **Storage & Databases → KV → Create namespace**, например `cantor-crm-board`.
Скопировать её ID и вставить в `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "BOARD_KV"
id = "сюда_вставить_id"
```

(Или через CLI: `npx wrangler kv namespace create BOARD_KV` — команда сама выведет ID.)

Без этого шага Worker задеплоится, но `/api/board` будет отдавать ошибку — привязка обязательна.

## 2. Задеплоить Worker

### Вариант A — через Git-интеграцию (рекомендуется, раз уж воркер живёт в этом репо)

1. Cloudflare Dashboard → **Workers & Pages → Create → Import a Git repository**.
2. Выбрать репозиторий `schoolsmartagency-art/mainweb`, нужную ветку.
3. **Root directory**: `worker`
4. **Build command**: оставить пустым
5. **Deploy command**: `npx wrangler deploy`
6. Задеплоить. Cloudflare будет пересобирать Worker при каждом пуше в выбранную ветку (изменения статического сайта в других папках репо тоже триггерят билд — это ожидаемо, просто deploy пройдёт быстро и ничего не сломает).

### Вариант B — вручную через CLI

```bash
cd worker
npm install
npx wrangler login
npx wrangler deploy
```

## 3. Защитить доступ паролем (настоятельно рекомендуется)

В карточках — реальные имена клиентов, доска будет доступна по публичному URL. Задайте пароль:

```bash
npx wrangler secret put DASHBOARD_PASSWORD
```

(или через Dashboard: **Worker → Settings → Variables and Secrets → Add secret**)

Логин фиксированный — `admin`, пароль — то, что вы зададите. Это обычная HTTP Basic Auth,
браузер сам покажет окно логина при первом заходе. Если секрет не задан — доска открыта всем, у кого есть ссылка.

## 4. Готово

Открыть URL воркера (`*.workers.dev` или подключённый домен), ввести логин/пароль (если включили),
нажать «+» рядом со вкладками и добавить первое направление.

## Как устроены данные

Всё состояние доски хранится одним JSON-объектом в KV под ключом `board`:

```json
{
  "directions": [
    {
      "id": "…", "name": "Авито",
      "stages": [ { "id": "…", "name": "В работе" } ],
      "projects": [
        {
          "id": "…", "name": "Иван Иванов", "stageId": "…",
          "color": "green",
          "launchDate": "2026-01-15",
          "description": "…",
          "currentTask": { "text": "Настроить кабинет", "days": 3 },
          "pastTasks": [ { "text": "Собрать бриф", "days": 2 } ]
        }
      ]
    }
  ]
}
```

Резервных копий/версионирования нет — это простое key-value хранилище. Если нужна история изменений
или бэкапы, дайте знать, можно добавить.
