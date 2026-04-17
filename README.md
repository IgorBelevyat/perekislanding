# Hlorka Market — Технічна Документація

**Проект:** market.hlorka.ua
**Тип:** Landing page з e-commerce функціональністю
**Продукт:** Перекис водню 50% (пергідроль) для очищення басейнів, комплекти аксесуарів

---

## 1. Стек Технологій

### Frontend
| Технологія | Версія | Призначення |
|---|---|---|
| **React** | 18.3 | UI-бібліотека |
| **Vite** | 6.0 | Збірка та dev-сервер |
| **TailwindCSS** | 3.4 | Утилітарні CSS-класи |
| **Vanilla CSS** | — | Кастомні стилі компонентів |

### Backend
| Технологія | Версія | Призначення |
|---|---|---|
| **Node.js** | 20 (Alpine) | Рантайм |
| **TypeScript** | 5.7 | Типізація |
| **Express** | 4.21 | HTTP-фреймворк |
| **Prisma** | 6.4 | ORM для PostgreSQL |
| **ioredis** | 5.4 | Клієнт Redis |
| **Zod** | 3.24 | Валідація даних |
| **Helmet** | 8.0 | Security headers |

### Інфраструктура
| Технологія | Версія | Призначення |
|---|---|---|
| **Docker Compose** | 3.8 | Оркестрація контейнерів |
| **Nginx** | Alpine | Reverse proxy, SPA routing, gzip |
| **PostgreSQL** | 16 Alpine | Основна БД |
| **Redis** | 7 Alpine | Кешування, rate limiting, idempotency |

---

## 2. Архітектура

```mermaid
graph TB
    subgraph "Docker Compose"
        FE["Frontend<br/>Nginx :80"]
        BE["Backend<br/>Express :4000"]
        PG["PostgreSQL<br/>:5432"]
        RD["Redis<br/>:6379"]
    end

    subgraph "Зовнішні сервіси"
        CRM["RetailCRM"]
        MS["МійСклад"]
        NP["Нова Пошта API"]
        LP["LiqPay"]
        GTM["Google Tag Manager"]
    end

    User -->|HTTPS| FE
    FE -->|"/api/*" proxy| BE
    BE --> PG
    BE --> RD
    BE -->|"REST API"| CRM
    BE -->|"REST API"| MS
    BE -->|"REST API"| NP
    BE -->|"Signature-based"| LP
    User -->|"dataLayer.push"| GTM
```

### Потік даних

```mermaid
sequenceDiagram
    participant U as Користувач
    participant FE as Frontend
    participant BE as Backend
    participant CRM as RetailCRM
    participant MS as МійСклад
    participant NP as Нова Пошта
    participant LP as LiqPay

    Note over FE,MS: Завантаження сторінки
    FE->>BE: GET /api/products
    BE->>CRM: GET /store/products (ціни)
    BE->>MS: GET /entity/product (фото, наявність)
    BE-->>FE: Товари + ціни + фото

    Note over U,NP: Оформлення замовлення
    U->>FE: Вибір міста НП
    FE->>BE: GET /api/np/cities?q=...
    BE->>NP: POST /v2.0/json (Address.searchSettlements)
    BE-->>FE: Список міст

    U->>FE: Вибір відділення
    FE->>BE: GET /api/np/warehouses?cityRef=...
    BE->>NP: POST /v2.0/json (Address.getWarehouses)
    BE-->>FE: Список відділень

    Note over U,LP: Checkout
    FE->>BE: POST /api/quote (розрахунок)
    BE-->>FE: quoteId + snapshot цін

    FE->>BE: POST /api/checkout (оформлення)

    alt Оплата при отриманні (COD/Cashless)
        BE->>CRM: POST /orders/create
        BE-->>FE: orderId + orderNumber
    else Онлайн-оплата (LiqPay)
        BE-->>FE: orderId + paymentUrl
        FE->>LP: Redirect на LiqPay checkout
        LP->>BE: POST /api/payments/liqpay/callback
        BE->>CRM: POST /orders/create
    end
```

---

## 3. Зовнішні Інтеграції

### 3.1 RetailCRM

**Призначення:** CRM-система для управління замовленнями, клієнтами, цінами.

| Параметр | Значення |
|---|---|
| Base URL | `RETAILCRM_URL` (напр. `https://hlorka.retailcrm.ua`) |
| Авторизація | API Key через query parameter `apiKey` |
| Формат | `application/x-www-form-urlencoded` (create), JSON (read) |
| Timeout | 10 сек (read), 15 сек (write) |

#### Ендпоінти RetailCRM що використовуються:

| Метод | Шлях | Опис | Частота |
|---|---|---|---|
| `GET` | `/api/v5/store/products` | Отримання товарів та цін | Кеш 2 хв, stale 1 год |
| `POST` | `/api/v5/orders/create` | Створення замовлення | При кожному checkout |

#### Структура order payload в CRM:

```typescript
{
  site: string,                    // Код сайту (CRM_SITE_CODE)
  order: {
    externalId: string,            // UUID замовлення
    number: string,                // 8-значний номер
    customerComment?: string,      // Коментарі (набір, безготівковий)
    firstName: string,
    lastName: string,
    phone: string,                 // +380XXXXXXXXX
    email?: string,
    items: [{
      externalId: string,          // "{orderId}-{index}"
      offer: { externalId: string }, // ID товару в CRM
      productName: string,
      quantity: number,
      initialPrice: number,
      priceType?: { code: string }, // "base", "OPT", "SINGLE" тощо
      properties: [{
        code: "row_id" | "bundle_type",
        name: string,
        value: string
      }]
    }],
    delivery: {
      code: string,                // "nova-poshta-nova-poshta" / "courier" / "self-delivery"
      address?: {
        city: string,              // Назва міста
        street?: string,           // Назва відділення (для НП) або вулиця (для кур'єра)
        building?: string,         // Номер будинку (кур'єр)
        block?: string,            // Під'їзд (кур'єр)
        flat?: string,             // Квартира (кур'єр)
      }
    },
    payments: [{
      type: string                 // "e-money" / "nalozh" / "bank-transfer"
    }]
  }
}
```

> [!WARNING]
> **Проблемний момент: Інтеграція Nova Poshta з CRM**
> Повна інтеграція НП з CRM (передача `pickuppointId`, `tariff`, `extraData`, geo-IDs від `dev.state13.xyz`) **наразі відключена** через невирішені проблеми з маппінгом відділень. Тимчасово місто і відділення передаються **як текст** через `address.city` та `address.street`. Чекаємо інструкцій від інтеграторів CRM.
>
> Повна інтеграція підготовлена в [`crmGeo.ts`](backend/src/lib/integrations/novaposhta/crmGeo.ts) і може бути відновлена після уточнень.

---

### 3.2 МійСклад (MoySklad)

**Призначення:** Складський облік та **основне джерело цін**. Використовується для отримання цін, фото товарів та статусу наявності.

> [!IMPORTANT]
> **Ціни тягнуться з МійСклад, НЕ з RetailCRM!** МійСклад → основне джерело цін. RetailCRM → fallback, якщо МійСклад недоступний. Між ними існує **перевірка консистентності цін** (`checkPriceConsistency`) — оскільки ціни з МійСклад вивантажуються в CRM із затримкою, замовлення може бути заблоковано, якщо базова ціна в МійСклад ≠ базовій ціні в CRM.

| Параметр | Значення |
|---|---|
| Base URL | `https://api.moysklad.ru/api/remap/1.2` |
| Авторизація | Bearer Token (`MOYSKLAD_TOKEN`) |
| Timeout | 10 сек |

#### Ендпоінти MoySklad що використовуються:

| Метод | Шлях | Опис | Кеш |
|---|---|---|---|
| `GET` | `/entity/product/{id}` | Атрибути, **ціни**, наявність | 5 хв, stale 1 год |
| `GET` | `/entity/product/{id}/images` | Фото товару | 6 год (Redis) |
| `GET` | `downloadHref` (з images) | Завантаження зображення | 6 год (base64 в Redis) |

#### Ланцюг отримання цін (пріоритет):

```
1. МійСклад (primary) → salePrices → map UUID → CRM price code
2. RetailCRM (fallback) → offer.prices → map by priceType
3. Mock prices (last resort) → hardcoded у коді
```

#### Маппінг цінових типів МійСклад → CRM:

| МійСклад UUID (env) | CRM price code (env) | Опис |
|---|---|---|
| `MOYSKLAD_PRICE_ROZNICA` | `PRICE_TYPE_BASE` | Роздрібна ціна |
| `MOYSKLAD_PRICE_TEST_LIFE` | `PRICE_TYPE_NASEZON` | Ціна «На Сезон» |
| `MOYSKLAD_PRICE_AKCIA` | `PRICE_TYPE_OPTIMAL` | Ціна «Оптимальний» |
| `MOYSKLAD_PRICE_OPT` | `PRICE_TYPE_PRO` | Оптова ціна |

> [!NOTE]
> МійСклад зберігає ціни в **копійках** (×100). Код ділить на 100: `sp.value / 100`.

#### Перевірка консистентності цін:

Функція `checkPriceConsistency()` порівнює базову ціну перекису в МійСклад та RetailCRM.
- Якщо ціни **різні** → `consistent: false` → замовлення може бути заблоковано
- Якщо RetailCRM або МійСклад недоступні → `consistent: true` (benefit of the doubt)
- Це захист від ситуацій, коли ціна змінилась в МійСклад, але ще не синхронізувалась в CRM

#### Маппінг CRM Offer ID → MoySklad Product ID:

```
OFFER_ID_PEROXIDE    → MOYSKLAD_ID_PEROXIDE
OFFER_ID_TEST_STRIPS → MOYSKLAD_ID_TEST_STRIPS
OFFER_ID_MEASURING_CUP → MOYSKLAD_ID_MEASURING_CUP
```

> [!NOTE]
> **Проблемний момент: 429 Rate Limiting**
> МійСклад обмежує кількість одночасних запитів. У пікові моменти бекенд отримує `429 Too Many Requests`. Система кешу коректно обробляє це через **stale-while-revalidate** — віддає застарілі дані з кешу замість помилки.
>
> **Проблемний момент: assortmentId filter**
> В fallback-перевірці залишків використовується некоректний фільтр `assortmentId` (помилка 412). Це відомий баг, що не впливає на функціональність — основний потік даних працює через кеш продуктів.

---

### 3.3 Нова Пошта

**Призначення:** Сервіс доставки. API використовується для пошуку міст та відділень.

| Параметр | Значення |
|---|---|
| Base URL | `https://api.novaposhta.ua/v2.0/json/` |
| Авторизація | API Key в тілі запиту (`NP_API_KEY`) |
| Формат | JSON |

#### Ендпоінти НП що використовуються:

| Метод моделі | Опис | Кеш |
|---|---|---|
| `Address.searchSettlements` | Пошук міст за текстом | 12 год |
| `Address.getWarehouses` | Список відділень міста | 6 год |

#### Типи даних з фронтенду:

```typescript
// Вибір міста
interface CitySelection {
  cityRef: string;     // DeliveryCity (UUID НП)
  cityName: string;    // MainDescription ("Київ")
}

// Вибір відділення
interface WarehouseSelection {
  warehouseRef: string;   // Ref (UUID НП)
  warehouseName: string;  // Description ("Відділення №1: вул. Пирогівський шлях, 135")
}
```

---

### 3.4 LiqPay

**Призначення:** Онлайн-оплата. Використовується redirect-based flow.

| Параметр | Значення |
|---|---|
| Checkout URL | `https://www.liqpay.ua/api/3/checkout` |
| Callback URL | `POST /api/payments/liqpay/callback` |
| Result URL | `{SITE_URL}/?orderId={id}&orderNumber={num}` |
| Авторизація | Public key + Private key (signature) |

#### Потік оплати:

```
1. Backend формує data + signature → LiqPay checkout URL
2. Користувач оплачує на LiqPay
3. LiqPay → POST /api/payments/liqpay/callback (data + signature)
4. Backend верифікує підпис → оновлює статус → push в CRM
5. Redirect на SITE_URL → Frontend polling GET /api/payments/order/:id
```

#### Безпека платежів (детально):

| Крок | Механізм |
|---|---|
| **Підпис запиту** | `base64(sha1(private_key + data + private_key))` |
| **Верифікація callback** | Обчислення очікуваного підпису і порівняння з отриманим |
| **Anti-tampering** | Перевірка `amount === order.total` (сума в callback = сума замовлення) |
| **Ідемпотентність** | Якщо `paymentStatus` вже `PAID` або `FAILED` — повторний callback ігнорується |
| **Логування** | Всі callback-и записуються в `IntegrationLog` |

#### Статуси LiqPay:

| Статус | Результат | Дія |
|---|---|---|
| `success`, `sandbox`, `wait_compensation` | Оплата пройшла | `paymentStatus → PAID`, `status → CONFIRMED`, push в CRM |
| `failure`, `error`, `reversed` | Оплата не пройшла | `paymentStatus → FAILED`, `status → CANCELLED` |
| Інші | Проміжний статус | Логування, без змін |

---

### 3.5 Google Tag Manager (GTM)

**Призначення:** Аналітика та реклама. Всі події передаються через `window.dataLayer.push()`.

> [!IMPORTANT]
> GA4 напряму **НЕ використовується**. Папка `backend/src/lib/integrations/ga4` — це легасі код. Вся аналітика йде виключно через GTM (`VITE_GTM_ID`).

#### Конфігурація:
- Frontend `.env`: `VITE_GTM_ID=GTM-XXXXXXX`
- GTM контейнер вбудовується в `index.html` через Vite build-time env

#### Таблиця подій GTM:

| Подія | Поля | Формат | Опис |
|---|---|---|---|
| `add_to_cart` | `ecommerce.currency` | `"UAH"` (string) | Валюта |
| | `ecommerce.value` | `number` | Сума (price × quantity) |
| | `ecommerce.items[].item_id` | `string` | ID товару (CRM offer ID) |
| | `ecommerce.items[].item_name` | `string` | Назва товару |
| | `ecommerce.items[].price` | `number` | Ціна за одиницю |
| | `ecommerce.items[].quantity` | `number` | Кількість |
| | `ecommerce.items[].item_category` | `"Bundle"` \| `"Product"` | Тип (набір чи окремий товар) |
| `remove_from_cart` | *Ідентичні поля як `add_to_cart`* | — | Видалення з кошика |
| `begin_checkout` | `ecommerce.currency` | `"UAH"` | Валюта |
| | `ecommerce.value` | `number` | Загальна сума кошика |
| | `ecommerce.items[]` | *масив як в `add_to_cart`* | Всі товари кошика |
| `purchase` | `ecommerce.transaction_id` | `string` | Номер замовлення (8 цифр) або UUID |
| | `ecommerce.value` | `number` | Сума замовлення |
| | `ecommerce.currency` | `"UAH"` | Валюта |
| | `ecommerce.shipping` | `0` (number) | Вартість доставки (завжди 0) |
| | `ecommerce.tax` | `0` (number) | Податок (завжди 0) |
| | `ecommerce.items[]` | *масив як в `add_to_cart`* | Товари замовлення |
| `calculator_used` | `volume_m3` | `number` | Об'єм басейну в м³ |
| | `recommended_canisters` | `number` | Рекомендовано каністр |
| `click_telegram` | — | — | Клік на Telegram (Header, Footer) |
| `click_phone` | — | — | Клік на телефон (Header, Footer) |

Кожна подія автоматично доповнюється:
- `page_location` — поточний URL
- `page_referrer` — реферер
- `page_title` — заголовок сторінки

#### Місця виклику подій:

| Подія | Компонент | Тригер |
|---|---|---|
| `add_to_cart` | `CartContext.jsx` | Додавання товару/набору в кошик |
| `remove_from_cart` | `CartContext.jsx` | Видалення товару, зменшення кількості, видалення набору |
| `begin_checkout` | `CartContext.jsx` | Натискання "Оформити замовлення" |
| `purchase` | `CartContext.jsx` | Успішне оформлення (COD/cashless — одразу, online — після LiqPay polling) |
| `calculator_used` | `CalculatorBlock.jsx` | Розрахунок об'єму та каністр |
| `click_telegram` | `Header.jsx`, `TrustBlock.jsx` | Клік на посилання Telegram |
| `click_phone` | `Header.jsx`, `TrustBlock.jsx` | Клік на номер телефону |

#### Cookie Consent (Google Consent Mode v2):

Компонент `CookieBanner.jsx` реалізує Google Consent Mode через `window.gtag`:

| Дія користувача | Consent стан | Деталі |
|---|---|---|
| **Прийняти cookies** | `gtag('consent', 'update', {...})` | `ad_storage: granted`, `analytics_storage: granted`, `ad_user_data: granted`, `ad_personalization: granted` |
| **Відхилити cookies** | Залишається default `denied` | Зберігається в `localStorage` як `cookie_consent: denied` |
| **Не відповів** | Default `denied` | Банер показується до вибору |

> [!NOTE]
> Consent стан зберігається в `localStorage('cookie_consent')`. Банер не показується повторно після вибору.

---

## 4. Google Merchant XML Feed

**URL:** `https://market.hlorka.ua/api/feed.xml`
**Формат:** RSS 2.0 з Google namespace (`xmlns:g`)
**Кеш:** 24 години (Redis), stale через 12 годин

### Що включено:
Тільки **Перекис водню** (один товар). Тест-смужки та мірний стакан **виключені** з фіду.

### Теги:

| Тег | Джерело | Опис |
|---|---|---|
| `g:id` | `OFFER_ID_PEROXIDE` | ID товару з RetailCRM |
| `g:title` | RetailCRM `offer.name` | Назва товару |
| `g:description` | Hardcoded | Опис товару українською |
| `g:link` | `https://market.hlorka.ua/` | Посилання на сторінку |
| `g:image_link` | MoySklad proxy | Фото товару через `/api/moysklad/product-image/{offerId}` |
| `g:availability` | MoySklad + логіка | `in stock` / `out of stock` / `preorder` / `backorder` |
| `g:price` | RetailCRM | `"{value} UAH"` |
| `g:condition` | — | Завжди `new` |
| `g:brand` | Hardcoded | `Інтер-Синтез` |

---

## 5. API Reference

### 5.1 Продукти

#### `GET /api/products`

Отримує товари з цінами (з RetailCRM) та наявністю (з МійСклад).

**Query:** `?offerIds=id1,id2,id3` (опціонально)

**Response:**
```json
[{
  "offerId": "337674164",
  "name": "Перекис водню медичний 50%",
  "prices": { "base": 548, "OPT": 450 },
  "currency": "UAH",
  "inStock": true,
  "imageUrl": "/api/moysklad/product-image/337674164"
}]
```

---

#### `GET /api/bundles`

Повертає конфігурацію наборів з бази даних.

**Response:**
```json
[{
  "id": "uuid",
  "slug": "pro",
  "name": "PRO запас",
  "baseOfferId": "337674164",
  "addonOfferIds": ["654654647", "564654656"],
  "rules": { /* qty rules */ }
}]
```

---

### 5.2 Нова Пошта

#### `GET /api/np/cities?q={query}`

Пошук міст. Rate limit: 120 req/10 хв.

#### `GET /api/np/warehouses?cityRef={ref}&q={query}`

Пошук відділень в місті.

---

### 5.3 Quote (Калькулятор / Кошик)

#### `POST /api/quote`

Серверний розрахунок ціни. Створює snapshot для checkout.

**Request body — калькулятор:**
```json
{
  "bundleId": "uuid",
  "calcInput": { "L": 8, "W": 4, "H": 1.5 },
  "k": 0.5,
  "includeAddons": true
}
```

**Request body — кошик:**
```json
{
  "customItems": [{
    "offerId": "337674164",
    "qty": 6,
    "isBundleItem": true,
    "bundleId": "pro",
    "bundleTitle": "PRO запас"
  }]
}
```

**Response:**
```json
{
  "quoteId": "uuid",
  "items": [{ "offerId": "...", "name": "...", "qty": 6, "unitPrice": 548, "total": 3288 }],
  "totals": { "subtotal": 3290, "total": 3290 },
  "expiresAt": "2026-04-17T20:10:00Z"
}
```

> [!NOTE]
> Quote діє **30 хвилин**. Після цього потрібен перерахунок.

---

### 5.4 Checkout

#### `POST /api/checkout`

Оформлення замовлення. Вимагає `Idempotency-Key` header (UUID).

**Request:**
```json
{
  "quoteId": "uuid",
  "customerExternalId": "uuid",
  "customer": {
    "firstName": "Іван",
    "lastName": "Петренко",
    "phone": "+380983208976",
    "email": "ivan@test.com",
    "companyName": "ТОВ Приклад",   // лише для cashless
    "edrpou": "12345678"             // лише для cashless
  },
  "delivery": {
    "type": "nova_poshta",
    "cityRef": "8d5a980d-391c-11dd-90d9-001a92567626",
    "cityName": "Київ",
    "warehouseRef": "1ec09d88-e1c2-11e3-8c4a-0050568002cf",
    "warehouseName": "Відділення №1: вул. Пирогівський шлях, 135"
  },
  "paymentMethod": "cod"
}
```

**Validation (Zod):**
- `phone` — нормалізація: `0XXXXXXXXX` → `+380XXXXXXXXX`, `380...` → `+380...`
- `delivery` — discriminated union по `type`:
  - `nova_poshta`: `cityRef`, `warehouseRef`, `cityName`, `warehouseName`
  - `courier`: `city`, `street`, `house`, `entrance?`, `apartment?`
  - `pickup`: без додаткових полів
- Бізнес-правила:
  - При `pickup` — `cod` недоступний
  - При `cashless` — обов'язкові `companyName` та `edrpou`

**Response (COD/Cashless):**
```json
{
  "orderId": "uuid",
  "orderNumber": "62265929",
  "retailcrmOrderId": "324589",
  "status": "CONFIRMED",
  "payment": { "type": "cod" }
}
```

**Response (Online):**
```json
{
  "orderId": "uuid",
  "orderNumber": "62265929",
  "status": "AWAITING_PAYMENT",
  "payment": {
    "type": "online",
    "paymentUrl": "https://www.liqpay.ua/api/3/checkout?data=...&signature=..."
  }
}
```

---

### 5.5 Payments

#### `POST /api/payments/liqpay/callback`

Callback від LiqPay. Деталі в розділі "LiqPay" вище.

#### `GET /api/payments/order/:orderId`

Перевірка статусу оплати (для polling з фронтенду після redirect з LiqPay).

**Response:**
```json
{
  "orderId": "uuid",
  "status": "CONFIRMED",
  "paymentStatus": "PAID",
  "paymentMethod": "ONLINE"
}
```

---

### 5.6 MoySklad Proxy

#### `GET /api/moysklad/product-image/:offerId`

Проксі фото товарів з МійСклад (МС вимагає Bearer auth, тому фронтенд не може напряму).

- Кеш: 6 годин в Redis (base64-encoded bytes)
- Content-Type: `image/jpeg`
- Обмеження: тільки `OFFER_ID_PEROXIDE`

---

### 5.7 Feed

#### `GET /api/feed.xml`

Google Merchant XML feed. Деталі в розділі "XML Feed" вище.

---

### 5.8 Health

#### `GET /api/health`

Healthcheck (використовується Docker healthcheck).

---

## 6. База Даних (PostgreSQL + Prisma)

### ERD

```mermaid
erDiagram
    BundleMap {
        uuid id PK
        string slug UK "basic, optimal, pro"
        string name "Назва набору"
        string base_offer_id "CRM offer ID"
        jsonb addon_offer_ids "string[]"
        jsonb rules "Правила кількості"
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    Quote {
        uuid id PK
        uuid bundle_id FK
        jsonb calc_input "L/W/H або V"
        jsonb items_snapshot "Snapshot товарів"
        jsonb totals_snapshot "subtotal, total"
        string pricing_version "retailcrm@timestamp"
        datetime expires_at "TTL 30 хв"
        enum status "ACTIVE/USED/EXPIRED"
        datetime created_at
    }

    Order {
        uuid id PK
        uuid quote_id FK
        string retailcrm_order_id "CRM ID"
        jsonb customer "name, phone, email"
        jsonb delivery "type, cityRef, etc"
        jsonb items_snapshot "Snapshot"
        decimal total "10,2"
        enum payment_method "ONLINE/COD/CASHLESS"
        enum payment_status "PENDING/PAID/FAILED/COD"
        enum status "CREATED/AWAITING_PAYMENT/CONFIRMED/CANCELLED"
        string idempotency_key UK
        datetime created_at
        datetime updated_at
    }

    IntegrationLog {
        uuid id PK
        enum provider "RETAILCRM/NOVAPOSHTA/LIQPAY/GA4"
        string action "create_order/callback/..."
        jsonb request_meta "Без секретів"
        jsonb response_meta
        enum status "SUCCESS/ERROR"
        string error_message
        datetime created_at
    }

    BundleMap ||--o{ Quote : "has"
    Quote ||--o{ Order : "has"
```

### Індекси:
- `Quote`: `(status, expiresAt)` — для швидкого пошуку активних/протухлих
- `Order`: `(retailcrmOrderId)` — для lookup CRM замовлень
- `Order`: `(paymentStatus)` — для outbox worker
- `IntegrationLog`: `(provider, action, createdAt)` — для аудиту

---

## 7. Redis — Кешування

### Стратегія: Stale-While-Revalidate

```
1) Cache HIT (primary TTL)    → return cached (швидко)
2) Cache MISS / expired       → call API
   2a) API success             → store data, return fresh
   2b) API FAIL + stale exists → return stale (надійність)
   2c) API FAIL + no stale     → error (або mock fallback)
```

### Ключі Redis:

| Ключ | TTL Primary | TTL Stale | Опис |
|---|---|---|---|
| `rc:offer:{offerId}` | 2 хв | 1 год | Ціни RetailCRM |
| `ms:product:{msId}` | 5 хв | 1 год | Дані товару МійСклад |
| `ms:img:{offerId}` | 6 год | — | Зображення (base64) |
| `np:cities:q:{query}` | 12 год | — | Пошук міст НП |
| `np:warehouses:city:{ref}` | 6 год | — | Відділення НП |
| `np:warehouses:city:{ref}:q:{q}` | 1 год | — | Пошук відділень |
| `rl:{ip}:{route}` | 10 хв | — | Rate limiting |
| `idem:checkout:{key}` | 24 год | — | Ідемпотентність |
| `rc:xml_feed` | 24 год | 12 год | XML feed |

### Конфігурація Redis:
- `maxmemory`: 128 MB
- `maxmemory-policy`: `allkeys-lru` (LRU eviction)
- Persistence: `appendonly yes`

---

## 8. Безпека

### 8.1 Rate Limiting (Redis-based, sliding window)

| Маршрут | Ліміт | Вікно |
|---|---|---|
| `/api/checkout` | 10 запитів | 10 хвилин |
| `/api/quote` | 60 запитів | 10 хвилин |
| `/api/np/*` | 120 запитів | 10 хвилин |

Fail-open: якщо Redis недоступний — запит пропускається.

### 8.2 Idempotency (Checkout)

- Header: `Idempotency-Key: {UUID v4}`
- При повторному запиті з тим самим ключем → повертається кешований результат
- TTL: 24 години
- Формат UUID перевіряється regex

### 8.3 Zod Validation

Всі вхідні дані проходять через Zod-схеми:
- `quoteRequestSchema` — параметри калькулятора/кошика
- `checkoutRequestSchema` — дані замовлення, доставки, покупця
- `npSchema` — параметри пошуку НП

### 8.4 Security Headers (Helmet)

- `X-Frame-Options: SAMEORIGIN` — захист від clickjacking
- `X-Content-Type-Options: nosniff` — запобігання MIME sniffing
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### 8.5 Logger — Маскування чутливих даних

Логгер автоматично маскує поля: `phone`, `email`, `password`, `apiKey`, `secret`, `token`, `signature`. Приклад: `+38098***76`.

### 8.6 LiqPay Signature Verification

Дивіться розділ "LiqPay" → "Безпека платежів".

---

## 9. CRM Outbox Worker

Фонова задача для надійної доставки замовлень у CRM.

- **Інтервал:** кожні 3 хвилини
- **Механізм:** знаходить замовлення де `retailcrmOrderId IS NULL`, `status != CANCELLED`
- **Фільтр для online:** тільки якщо `paymentStatus = PAID`
- **Обмеження:** макс 10 замовлень за цикл, пауза 500 мс між запитами
- **Вікно:** тільки замовлення за останні 7 днів

---

## 10. Nginx

Файл: [`data/nginx/default.conf`](data/nginx/default.conf)

| Параметр | Значення |
|---|---|
| Listen | `:80` |
| SPA routing | `try_files $uri $uri/ /index.html` |
| API proxy | `/api/` → `http://backend:4000` |
| Static cache | JS/CSS/шрифти/зображення — 30 днів, `immutable` |
| Gzip | Увімкнено для text/css/json/js/xml/svg |
| Body limit | 10 MB |
| Proxy timeout | connect 10s, send/read 30s |
| Security | X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy |

> [!NOTE]
> Nginx працює **всередині frontend Docker контейнера**, обслуговуючи статику і проксюючи API-запити до бекенд-контейнера через Docker DNS (`http://backend:4000`).

---

## 11. Docker

### Контейнери:

| Сервіс | Образ | Порт хосту | Внутрішній порт |
|---|---|---|---|
| `frontend` | `node:20-alpine` (build) → `nginx:alpine` (run) | `127.0.0.1:3000` | 80 |
| `backend` | `node:20-alpine` (build) → `node:20-alpine` (run) | `127.0.0.1:4000` | 4000 |
| `postgres` | `postgres:16-alpine` | — | 5432 |
| `redis` | `redis:7-alpine` | — | 6379 |

### Multi-stage Build

**Backend Dockerfile:**
1. **Builder:** `npm ci` → `prisma generate` → `tsc`
2. **Runner:** `npm ci --production` → копіює Prisma client + `dist/`
3. CMD: `node dist/server.js`

**Frontend Dockerfile:**
1. **Builder:** `npm ci` → `vite build` (з `VITE_GTM_ID` як build arg)
2. **Runner:** `nginx:alpine` → копіює `dist/` в `/usr/share/nginx/html`

### Healthcheck:

Backend: `wget --spider http://127.0.0.1:4000/api/health` кожні 30 сек.

### Volumes:

| Маунт | Призначення |
|---|---|
| `./data/postgres` | Дані PostgreSQL |
| `./data/redis` | Persist Redis |
| `./data/nginx/default.conf` | Конфіг Nginx |

---

## 12. Environment Variables

### Root `.env` (Docker Compose)

Файл `.env` в корені проекту. Docker Compose підставляє змінні в `docker-compose.yml`.

| Змінна | Тип | Опис |
|---|---|---|
| **PostgreSQL** | | |
| `POSTGRES_USER` | string | Username БД |
| `POSTGRES_PASSWORD` | string | Пароль БД |
| `POSTGRES_DB` | string | Назва БД |
| **Server** | | |
| `NODE_ENV` | `development` \| `production` | Режим |
| `DATABASE_URL` | URL | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | URL | `redis://host:6379` |
| **RetailCRM** | | |
| `RETAILCRM_URL` | URL | Base URL CRM (`https://hlorka.retailcrm.ua`) |
| `RETAILCRM_API_KEY` | string | API-ключ CRM |
| `CRM_SITE_CODE` | string | Код сайту в CRM |
| `SITE_URL` | URL | Зовнішній URL сайту (`https://market.hlorka.ua`) |
| **Nova Poshta** | | |
| `NP_API_KEY` | string | API-ключ НП |
| `CRM_NP_INTEGRATION_CODE` | string | Код НП інтеграції в CRM (default: `newpost_new_0`) |
| **LiqPay** | | |
| `LIQPAY_PUBLIC_KEY` | string | Публічний ключ LiqPay |
| `LIQPAY_PRIVATE_KEY` | string | Приватний ключ LiqPay |
| **GTM** | | |
| `VITE_GTM_ID` | string | GTM Container ID (напр. `GTM-XXXXXXX`) |
| **Offer IDs (RetailCRM)** | | |
| `OFFER_ID_PEROXIDE` | string | ID пропозиції перекису |
| `OFFER_ID_TEST_STRIPS` | string | ID тест-смужок |
| `OFFER_ID_MEASURING_CUP` | string | ID мірного стакана |
| **Price Types (RetailCRM)** | | |
| `PRICE_TYPE_BASE` | string | Базова ціна |
| `PRICE_TYPE_NASEZON` | string | Ціна "На сезон" |
| `PRICE_TYPE_OPTIMAL` | string | Ціна "Оптимальний" |
| `PRICE_TYPE_PRO` | string | Ціна "PRO" |
| **CRM Payment Types** | | |
| `CRM_PAYMENT_TYPE_ONLINE` | string | Код онлайн-оплати (default: `liqpay`) |
| `CRM_PAYMENT_TYPE_COD` | string | Код наложеного платежу (default: `cash-on-delivery`) |
| `CRM_PAYMENT_TYPE_CASHLESS` | string | Код безготівкової оплати (default: `bank-transfer`) |
| **CRM Delivery Types** | | |
| `CRM_DELIVERY_TYPE_NP` | string | Код доставки НП (default: `novaposhta`) |
| `CRM_DELIVERY_TYPE_COURIER` | string | Код кур'єрської доставки (default: `courier`) |
| `CRM_DELIVERY_TYPE_PICKUP` | string | Код самовивозу (default: `pickup`) |
| **МійСклад** | | |
| `MOYSKLAD_TOKEN` | string | Bearer token МійСклад |
| `MOYSKLAD_ID_PEROXIDE` | UUID | MoySklad product ID перекису |
| `MOYSKLAD_ID_TEST_STRIPS` | UUID | MoySklad product ID тест-смужок |
| `MOYSKLAD_ID_MEASURING_CUP` | UUID | MoySklad product ID стакана |
| `MOYSKLAD_PRICE_ROZNICA` | UUID | ID типу ціни "Роздріб" в МС |
| `MOYSKLAD_PRICE_TEST_LIFE` | UUID | ID типу ціни "Test Life" в МС |
| `MOYSKLAD_PRICE_AKCIA` | UUID | ID типу ціни "Акція" в МС |
| `MOYSKLAD_PRICE_OPT` | UUID | ID типу ціни "Опт" в МС |

### Frontend `.env`

| Змінна | Тип | Опис |
|---|---|---|
| `VITE_GTM_ID` | string | GTM Container ID |

> [!IMPORTANT]
> `VITE_GTM_ID` передається як **Docker build argument** через `docker-compose.yml`. Він вбудовується у фронтенд на етапі збірки і не може бути змінений без перебілду.

---

## 13. Інструкція з Розгортання

### Вимоги:
- Docker + Docker Compose
- Git
- Зовнішній reverse proxy (Caddy/Nginx) з HTTPS (опціонально)

### Кроки:

```bash
# 1. Клонувати репозиторій
git clone <repo-url>
cd perekislanding

# 2. Створити .env файл в корені
cp .env.example .env
# Заповнити всі змінні (див. розділ "Environment Variables")

# 3. Побудувати та запустити контейнери
docker compose up -d --build

# 4. Виконати міграції бази даних
docker compose exec backend npx prisma migrate deploy

# 5. Засіяти початкові дані (набори)
docker compose exec backend npx tsx prisma/seed.ts

# 6. Перевірити здоров'я
curl http://localhost:3000/api/health
```

### Оновлення:

```bash
# Оновити код
git pull

# Перебудувати та перезапустити
docker compose up -d --build

# Якщо є нові міграції
docker compose exec backend npx prisma migrate deploy
```

### Моніторинг:

```bash
# Логи бекенду
docker compose logs -f backend

# Логи всіх сервісів
docker compose logs -f

# Статус контейнерів
docker compose ps
```

### Очищення Redis кешу (при необхідності):

```bash
docker compose exec redis redis-cli FLUSHALL
```

---

## 14. Відомі Проблеми та TODO

| # | Проблема | Статус | Деталі |
|---|---|---|---|
| 1 | НП відділення не підтягується в CRM | ⏳ Чекає інтеграторів | Тимчасово передається текстом |
| 2 | МійСклад 429 Rate Limiting | ✅ Обробляється | Stale-while-revalidate |
| 3 | МійСклад `assortmentId` filter error | ⚠️ Відомий баг | Не впливає на функціональність |
| 4 | GA4 легасі папка на бекенді | ℹ️ Інформація | Не використовується, все через GTM |

---

## 15. Структура Проекту

```
perekislanding/
├── .env                           # Env змінні (Docker Compose root)
├── docker-compose.yml             # Оркестрація контейнерів
├── data/
│   ├── nginx/default.conf         # Конфіг Nginx
│   ├── postgres/                  # Persistent DB data
│   └── redis/                     # Persistent Redis data
├── backend/
│   ├── .env                       # Backend-specific env (dev)
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma          # Схема БД
│   │   ├── migrations/            # Міграції
│   │   └── seed.ts                # Початкові дані
│   └── src/
│       ├── app.ts                 # Express app setup
│       ├── server.ts              # Startup + outbox worker
│       ├── routes/
│       │   ├── quote.ts           # POST /api/quote
│       │   ├── checkout.ts        # POST /api/checkout
│       │   ├── payments.ts        # POST /api/payments/liqpay/callback
│       │   ├── np.ts              # GET /api/np/cities, /warehouses
│       │   ├── products.ts        # GET /api/products
│       │   ├── bundles.ts         # GET /api/bundles
│       │   ├── orders.ts          # GET /api/orders/history
│       │   ├── moysklad.ts        # GET /api/moysklad/product-image
│       │   ├── feed.ts            # GET /api/feed.xml
│       │   └── health.ts          # GET /api/health
│       ├── middleware/
│       │   └── errorHandler.ts
│       └── lib/
│           ├── config/
│           │   ├── env.ts         # Zod-validated env
│           │   └── constants.ts   # TTLs, rate limits, calc
│           ├── cache/
│           │   ├── redis.ts       # Stale-while-revalidate
│           │   └── keys.ts        # Cache key builders
│           ├── db/
│           │   └── prisma.ts      # Prisma client
│           ├── domain/
│           │   ├── checkout/
│           │   │   ├── createCheckout.ts
│           │   │   └── crmSync.ts     # CRM payload + outbox
│           │   └── pricing/
│           │       └── buildQuote.ts
│           ├── integrations/
│           │   ├── retailcrm/
│           │   │   ├── client.ts      # CRM API client
│           │   │   ├── prices.ts      # Ціни з кешем
│           │   │   └── types.ts
│           │   ├── novaposhta/
│           │   │   ├── client.ts      # NP API client
│           │   │   └── crmGeo.ts      # state13 geo IDs
│           │   ├── liqpay/
│           │   │   ├── client.ts      # Формування оплати
│           │   │   ├── verify.ts      # SHA1 підпис
│           │   │   └── types.ts
│           │   └── moysklad/
│           │       ├── client.ts      # MS API client
│           │       └── products.ts    # Offer → MS ID mapping
│           ├── security/
│           │   ├── logger.ts          # Маскування + форматування
│           │   ├── rateLimit.ts       # Redis-based rate limiter
│           │   └── idempotency.ts     # Checkout idempotency
│           └── validation/
│               ├── checkout.schema.ts # Zod: checkout
│               ├── quote.schema.ts    # Zod: quote
│               └── np.schema.ts       # Zod: NP
└── frontend/
    ├── .env                        # VITE_GTM_ID
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── Src/
    │   ├── App.jsx
    │   └── main.jsx
    ├── Blocks/                     # Page sections
    │   ├── HeroBlock/
    │   ├── ProductBlock/
    │   ├── CalculatorBlock/
    │   ├── BundlesBlock/
    │   ├── ComparisonBlock/
    │   ├── HowToUseBlock/
    │   ├── SafetyBlock/
    │   ├── TrustBlock/
    │   ├── ReviewsBlock/
    │   ├── FaqBlock/
    │   ├── ProblemBlock/
    │   └── FinalCtaBlock/
    ├── Common components/
    │   ├── Checkout/CheckoutModal.jsx
    │   ├── CartModal/
    │   ├── StickyCartBar/
    │   ├── OrderResult/
    │   └── LegalModal/
    ├── Stores/
    │   └── CartContext.jsx         # Cart state + GTM events
    └── utils/
        └── analytics.js           # GTM dataLayer wrapper
```
