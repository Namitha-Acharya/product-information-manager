const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3002;

// Configuration
const BASEROW_API_URL = 'https://pim.offineeds.com/api/database/rows/table/251/';
const BASEROW_FIELDS_URL = 'https://pim.offineeds.com/api/database/fields/table/251/';
const BASEROW_CATEGORIES_URL = 'https://pim.offineeds.com/api/database/rows/table/700/';
const BASEROW_TOKEN = '2tLFFPlRQX7cnuvaxTfJ2qVi6aJSecX0';
const CACHE_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 200; // Max page size for Baserow API

// In-memory cache
let productsCache = {
  data: [],
  fields: [],
  categories: [],
  lastUpdated: null,
  isRefreshing: false
};

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Helper: Fetch all products from Baserow with parallel loading
async function fetchAllProducts() {
  try {
    console.log('🔄 Starting to fetch products from Baserow...');

    // First, get total count
    const initialResponse = await fetch(`${BASEROW_API_URL}?size=1&page=1`, {
      headers: {
        'Authorization': `Token ${BASEROW_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!initialResponse.ok) {
      throw new Error(`API Error: ${initialResponse.status} ${initialResponse.statusText}`);
    }

    const initialData = await initialResponse.json();
    const totalCount = initialData.count || 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    console.log(`📊 Total products: ${totalCount}, Pages: ${totalPages}`);

    // Fetch pages in parallel batches
    const batchSize = 5;
    let allProducts = [];

    for (let i = 0; i < totalPages; i += batchSize) {
      const batch = [];
      for (let j = 0; j < batchSize && (i + j) < totalPages; j++) {
        const pageNum = i + j + 1;
        batch.push(
          fetch(`${BASEROW_API_URL}?size=${PAGE_SIZE}&page=${pageNum}`, {
            headers: {
              'Authorization': `Token ${BASEROW_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }).then(res => res.json())
        );
      }

      const batchResults = await Promise.all(batch);
      batchResults.forEach(data => {
        allProducts = allProducts.concat(data.results || []);
      });

      console.log(`📦 Loaded ${allProducts.length}/${totalCount} products`);
    }

    console.log(`✅ Successfully fetched ${allProducts.length} products`);
    return allProducts;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    throw error;
  }
}

// Helper: Fetch table fields
async function fetchFields() {
  try {
    console.log('🔄 Fetching table fields...');
    const response = await fetch(BASEROW_FIELDS_URL, {
      headers: {
        'Authorization': `Token ${BASEROW_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Fields API Error: ${response.status}`);
    }

    const fields = await response.json();
    console.log(`✅ Fetched ${fields.length} fields`);
    return fields;
  } catch (error) {
    console.error('❌ Error fetching fields:', error);
    throw error;
  }
}

// Helper: Fetch all categories
async function fetchCategories() {
  try {
    console.log('🔄 Fetching categories...');
    const response = await fetch(`${BASEROW_CATEGORIES_URL}?size=200`, {
      headers: {
        'Authorization': `Token ${BASEROW_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Categories API Error: ${response.status}`);
    }

    const data = await response.json();
    const categories = (data.results || []).map(cat => ({
      id: cat.id,
      name: cat.field_7350,
      category_code: cat.field_7328,
      parent_code: cat.field_7360,
      magento_parent_id: cat.field_7362
    })).filter(cat => cat.name && cat.category_code);

    console.log(`✅ Fetched ${categories.length} categories`);
    return categories;
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    throw error;
  }
}

// Helper: Refresh cache
async function refreshCache() {
  if (productsCache.isRefreshing) {
    console.log('⏳ Cache refresh already in progress, skipping...');
    return;
  }

  try {
    productsCache.isRefreshing = true;
    console.log('🔄 Refreshing cache...');

    const [products, fields, categories] = await Promise.all([
      fetchAllProducts(),
      fetchFields(),
      fetchCategories()
    ]);

    productsCache.data = products;
    productsCache.fields = fields;
    productsCache.categories = categories;
    productsCache.lastUpdated = new Date();
    productsCache.isRefreshing = false;

    console.log(`✅ Cache refreshed successfully at ${productsCache.lastUpdated.toISOString()}`);
    console.log(`   - Products: ${productsCache.data.length}`);
    console.log(`   - Fields: ${productsCache.fields.length}`);
    console.log(`   - Categories: ${productsCache.categories.length}`);
  } catch (error) {
    productsCache.isRefreshing = false;
    console.error('❌ Error refreshing cache:', error);
  }
}

// Initialize cache on startup
refreshCache();

// Set up periodic cache refresh
setInterval(refreshCache, CACHE_REFRESH_INTERVAL);

// ===== API ENDPOINTS =====

// GET /api/products - Get all products (instant from cache)
app.get('/api/products', (req, res) => {
  const { category } = req.query;

  let products = productsCache.data;

  // Filter by category if provided
  if (category) {
    products = products.filter(product => {
      const categoryField = product.field_5154; // category link field
      return categoryField && categoryField.some(cat => cat.id === parseInt(category));
    });
  }

  res.json({
    results: products,
    count: products.length,
    cached: true,
    lastUpdated: productsCache.lastUpdated
  });
});

// GET /api/fields - Get table fields (instant from cache)
app.get('/api/fields', (req, res) => {
  res.json({
    fields: productsCache.fields,
    cached: true,
    lastUpdated: productsCache.lastUpdated
  });
});

// GET /api/categories - Get all categories (instant from cache)
app.get('/api/categories', (req, res) => {
  res.json({
    results: productsCache.categories,
    count: productsCache.categories.length,
    cached: true,
    lastUpdated: productsCache.lastUpdated
  });
});

// GET /api/products/:id - Get single product
app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = productsCache.data.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({
    product,
    cached: true,
    lastUpdated: productsCache.lastUpdated
  });
});

// POST /api/products - Create new product
app.post('/api/products', async (req, res) => {
  try {
    console.log('➕ Creating new product...');

    const response = await fetch(BASEROW_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${BASEROW_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Create failed: ${response.status} - ${error}`);
    }

    const newProduct = await response.json();

    // Add to cache immediately
    productsCache.data.unshift(newProduct);

    console.log(`✅ Created product ${newProduct.id}`);
    res.status(201).json({
      product: newProduct,
      message: 'Product created and added to cache'
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/products/:id - Update product
app.patch('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`✏️ Updating product ${productId}...`);

    const response = await fetch(`${BASEROW_API_URL}${productId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Token ${BASEROW_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Update failed: ${response.status} - ${error}`);
    }

    const updatedProduct = await response.json();

    // Update in cache immediately
    const index = productsCache.data.findIndex(p => p.id === parseInt(productId));
    if (index !== -1) {
      productsCache.data[index] = updatedProduct;
    }

    console.log(`✅ Updated product ${productId}`);
    res.json({
      product: updatedProduct,
      message: 'Product updated in cache'
    });
  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/products/:id - Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`🗑️ Deleting product ${productId}...`);

    const response = await fetch(`${BASEROW_API_URL}${productId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${BASEROW_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Delete failed: ${response.status} - ${error}`);
    }

    // Remove from cache immediately
    productsCache.data = productsCache.data.filter(p => p.id !== parseInt(productId));

    console.log(`✅ Deleted product ${productId}`);
    res.json({
      message: 'Product deleted and removed from cache'
    });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cache/refresh - Manually trigger cache refresh
app.post('/api/cache/refresh', async (req, res) => {
  console.log('🔄 Manual cache refresh triggered');
  refreshCache();
  res.json({
    message: 'Cache refresh started',
    isRefreshing: productsCache.isRefreshing
  });
});

// GET /api/cache/status - Get cache status
app.get('/api/cache/status', (req, res) => {
  res.json({
    productsCount: productsCache.data.length,
    fieldsCount: productsCache.fields.length,
    categoriesCount: productsCache.categories.length,
    lastUpdated: productsCache.lastUpdated,
    isRefreshing: productsCache.isRefreshing,
    cacheAge: productsCache.lastUpdated
      ? Math.floor((Date.now() - productsCache.lastUpdated.getTime()) / 1000)
      : null
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Baserow Cache API Server                 ║
║   Port: ${PORT}                             ║
║   Cache Refresh: Every ${CACHE_REFRESH_INTERVAL / 60000} minutes       ║
╚════════════════════════════════════════════╝

Endpoints:
  GET    /api/products           - Get all products (cached)
  GET    /api/products/:id       - Get single product
  POST   /api/products           - Create product
  PATCH  /api/products/:id       - Update product
  DELETE /api/products/:id       - Delete product
  GET    /api/fields             - Get table fields
  GET    /api/categories         - Get all categories (cached)
  POST   /api/cache/refresh      - Manually refresh cache
  GET    /api/cache/status       - Get cache status
  GET    /health                 - Health check

Frontend should connect to: http://localhost:${PORT}
  `);
});
