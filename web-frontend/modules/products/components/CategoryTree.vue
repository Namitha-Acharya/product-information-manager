<template>
  <div class="category-tree">
    <div class="tree-header">
      <h3>Categories</h3>
      <button v-if="selectedCategory" @click="clearFilter" class="clear-filter">
        Clear Filter
      </button>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>Loading categories...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadCategories">Retry</button>
    </div>
    
    <!-- Category Tree -->
    <div v-else class="tree-container">
      <div class="tree-node" v-for="category in rootCategories" :key="category.id">
        <CategoryNode
          :category="category"
          :children="getChildren(category.category_code)"
          :all-categories="categories"
          :selected-category="selectedCategory"
          :category-map="categoryMap"
          @category-selected="onCategorySelected"
        />
      </div>
    </div>
  </div>
</template>

<script>
import CategoryNode from './CategoryNode'

export default {
  name: 'CategoryTree',
  components: {
    CategoryNode,
  },
  data() {
    return {
      // API Configuration - using cache API for instant loading
      apiBaseUrl: 'http://localhost:3002/api',
      categories: [],
      loading: true,
      error: null,
      selectedCategory: null,
    }
  },
  computed: {
    rootCategories() {
      return this.categories.filter(cat => cat.parent_code === 'Root Catalog')
    },
    categoryMap() {
      const map = {}
      this.categories.forEach(cat => {
        map[cat.category_code] = cat
      })
      return map
    }
  },
  async mounted() {
    await this.loadCategories()
  },
  methods: {
    async loadCategories() {
      this.loading = true
      this.error = null

      try {
        console.log('🔄 Loading categories from cache API...')

        const response = await fetch(`${this.apiBaseUrl}/categories`, {
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        this.categories = data.results || []

        console.log(`✅ Loaded ${this.categories.length} categories instantly from cache API (cached: ${data.cached}, last updated: ${data.lastUpdated})`)
        console.log('📂 Root categories:', this.rootCategories.map(c => c.name))

      } catch (err) {
        this.error = `Failed to load categories: ${err.message}`
        console.error('❌ Error loading categories:', err)
      } finally {
        this.loading = false
      }
    },
    
    getChildren(parentCode) {
      return this.categories.filter(cat => cat.parent_code === parentCode)
    },
    
    onCategorySelected(category) {
      this.selectedCategory = category
      this.$emit('category-filter-changed', category)
    },
    
    clearFilter() {
      this.selectedCategory = null
      this.$emit('category-filter-changed', null)
    }
  }
}
</script>

<style scoped>
.category-tree {
  width: 220px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #e5e5e5;
  box-shadow: 2px 0 4px rgba(0,0,0,0.1);
  overflow-y: auto;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  padding: 8px 12px 6px 12px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.tree-header h3 {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: #333333;
  letter-spacing: -0.25px;
}

.clear-filter {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(231, 76, 60, 0.2);
}

.clear-filter:hover {
  background: #c0392b;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
}

.loading, .error {
  padding: 10px 12px;
  margin: 8px 12px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 11px;
}

.loading {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border: 1px solid #2196f3;
  color: #1976d2;
}

.error {
  background: linear-gradient(135deg, #ffebee 0%, #fce4ec 100%);
  border: 1px solid #f44336;
  color: #d32f2f;
}

.error button {
  background: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 10px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.error button:hover {
  background: #d32f2f;
  transform: translateY(-1px);
}

.tree-container {
  padding: 0 4px 8px 4px;
}

.tree-node {
  margin-bottom: 1px;
}
</style>