# Baserow Cache API

A high-performance caching layer for Baserow that dramatically improves load times.

## Features

- **Instant Product Loading**: All ~4000 products served from memory cache instantly
- **Instant Category Loading**: All ~176 categories served from memory cache instantly
- **Auto-Refresh**: Cache refreshes every 5 minutes automatically
- **CRUD Operations**: All create/update/delete operations update cache immediately
- **Parallel Loading**: Fetches data from Baserow in parallel for fast initial load
- **RESTful API**: Clean REST endpoints for frontend integration

## How It Works

```
┌─────────────┐         ┌──────────────┐         ┌──────────┐
│   Frontend  │────────>│  Cache API   │────────>│ Baserow  │
│  (Instant)  │<────────│  (Port 3002) │<────────│   API    │
└─────────────┘         └──────────────┘         └──────────┘
                              Cache
                         Refresh: 5 min
```

1. **Cache API loads all data** from Baserow on startup (~30 seconds)
2. **Frontend gets instant responses** from in-memory cache
3. **Cache refreshes every 5 minutes** automatically
4. **Create/Update/Delete** operations update both Baserow and cache immediately

## Installation

```bash
cd /Users/namithaacharya/baserow/cache-api
npm install
```

## Running the Server

```bash
npm start
```

Server will start on **http://localhost:3002**

## API Endpoints

### Products

- `GET /api/products` - Get all products (instant from cache)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Fields

- `GET /api/fields` - Get table fields (instant from cache)

### Categories

- `GET /api/categories` - Get all categories (instant from cache)

### Cache Management

- `GET /api/cache/status` - Get cache status (age, count, etc.)
- `POST /api/cache/refresh` - Manually trigger cache refresh

### Health

- `GET /health` - Health check endpoint

## Response Format

### GET /api/products
```json
{
  "results": [...products...],
  "count": 4200,
  "cached": true,
  "lastUpdated": "2025-10-15T06:15:00.000Z"
}
```

### GET /api/cache/status
```json
{
  "productsCount": 4286,
  "fieldsCount": 569,
  "categoriesCount": 176,
  "lastUpdated": "2025-10-15T06:15:00.000Z",
  "isRefreshing": false,
  "cacheAge": 120
}
```

## Configuration

Edit `server.js` to customize:

```javascript
const PORT = 3002;  // Server port
const CACHE_REFRESH_INTERVAL = 5 * 60 * 1000;  // 5 minutes
const PAGE_SIZE = 200;  // Baserow API page size
```

## Performance Benefits

| Operation | Without Cache | With Cache |
|-----------|--------------|------------|
| Load 4000 products | 30-60 seconds | < 100ms |
| Filter products | 30-60 seconds | < 10ms |
| Get single product | ~500ms | < 1ms |

## Integration with Frontend

Update your frontend to use the cache API instead of direct Baserow API:

```javascript
// Old (direct Baserow):
const url = 'https://pim.offineeds.com/api/database/rows/table/251/'

// New (via cache):
const url = 'http://localhost:3002/api/products'
```

All other code remains the same - the API is compatible!

## Logs

The server provides detailed logs:

```
🔄 Starting to fetch products from Baserow...
📊 Total products: 4200, Pages: 21
📦 Loaded 1000/4200 products
📦 Loaded 2000/4200 products
...
✅ Successfully fetched 4200 products
✅ Cache refreshed successfully at 2025-10-15T06:15:00.000Z
```

## Production Deployment

For production, consider:

1. **PM2** for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name baserow-cache
   pm2 save
   pm2 startup
   ```

2. **Environment Variables**:
   Create `.env` file for configuration

3. **Logging**:
   Add proper logging library (winston, pino)

4. **Monitoring**:
   Set up monitoring alerts for cache refresh failures
