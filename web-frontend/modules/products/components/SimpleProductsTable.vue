<template>
  <div class="simple-products-table">
    <h1>Products Management</h1>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>Loading products...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadData">Retry</button>
    </div>
    
    <!-- Success State -->
    <div v-else-if="products.length > 0" class="success">
      <div class="header-info">
        <p><strong>✅ Loaded {{ products.length }} of {{ totalCount }} products</strong></p>
        <div class="actions">
          <button v-if="hasMore && !loading" @click="loadMore" class="load-more">Load More</button>
          <button @click="loadAll" class="load-all" :disabled="loading">Load All {{ totalCount }}</button>
        </div>
      </div>
      
      <table class="products-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>SKU</th>
            <th>Product Type</th>
            <th>Product Type 2</th>
            <th>Display Name</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>{{ product.id }}</td>
            <td @click="startEdit(product.id, 'field_6899')" class="editable">
              <input v-if="isEditing(product.id, 'field_6899')" 
                     v-model="editingValue" 
                     @blur="saveEdit(product, 'field_6899')"
                     @keyup.enter="saveEdit(product, 'field_6899')"
                     @keyup.esc="cancelEdit"
                     class="edit-input">
              <span v-else>{{ product.field_6899 || '-' }}</span>
            </td>
            <td @click="startEdit(product.id, 'field_6902')" class="editable">
              <input v-if="isEditing(product.id, 'field_6902')" 
                     v-model="editingValue" 
                     @blur="saveEdit(product, 'field_6902')"
                     @keyup.enter="saveEdit(product, 'field_6902')"
                     @keyup.esc="cancelEdit"
                     class="edit-input">
              <span v-else>{{ product.field_6902 || '-' }}</span>
            </td>
            <td>
              <span v-if="getProductType2(product)" :style="{ 
                backgroundColor: getProductType2(product).color, 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '12px', 
                fontSize: '12px' 
              }">
                {{ getProductType2(product).value }}
              </span>
              <span v-else>-</span>
            </td>
            <td @click="startEdit(product.id, 'field_6905')" class="editable">
              <input v-if="isEditing(product.id, 'field_6905')" 
                     v-model="editingValue" 
                     @blur="saveEdit(product, 'field_6905')"
                     @keyup.enter="saveEdit(product, 'field_6905')"
                     @keyup.esc="cancelEdit"
                     class="edit-input">
              <span v-else>{{ product.field_6905 || '-' }}</span>
            </td>
            <td @click="startEdit(product.id, 'field_6912')" class="editable">
              <input v-if="isEditing(product.id, 'field_6912')" 
                     v-model="editingValue" 
                     @blur="saveEdit(product, 'field_6912')"
                     @keyup.enter="saveEdit(product, 'field_6912')"
                     @keyup.esc="cancelEdit"
                     class="edit-input">
              <span v-else>{{ product.field_6912 || '-' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- No Data State -->
    <div v-else class="no-data">
      <p>No products found.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SimpleProductsTable',
  data() {
    return {
      products: [],
      loading: true,
      error: null,
      currentPage: 1,
      pageSize: 100,
      totalCount: 0,
      hasMore: false,
      editingCell: null,
      editingValue: ''
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      this.error = null
      
      try {
        const response = await fetch(`https://pim.offineeds.com/api/database/rows/table/251/?size=${this.pageSize}&page=${this.currentPage}`, {
          headers: {
            'Authorization': 'Token 2tLFFPlRQX7cnuvaxTfJ2qVi6aJSecX0',
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (this.currentPage === 1) {
          this.products = data.results || []
        } else {
          this.products = [...this.products, ...(data.results || [])]
        }
        
        this.totalCount = data.count || 0
        this.hasMore = this.products.length < this.totalCount
        console.log(`✅ Loaded ${data.results?.length || 0} products (${this.products.length}/${this.totalCount})`)
        
      } catch (err) {
        this.error = `Failed to load products: ${err.message}`
        console.error('❌ Error loading products:', err)
      } finally {
        this.loading = false
      }
    },
    
    getProductType2(product) {
      const field7007 = product.field_7007
      if (Array.isArray(field7007) && field7007.length > 0) {
        return field7007[0] // Return first option object with {id, value, color}
      }
      return null
    },
    
    async loadMore() {
      this.currentPage++
      await this.loadData()
    },
    
    async loadAll() {
      this.loading = true
      try {
        const response = await fetch(`https://pim.offineeds.com/api/database/rows/table/251/?size=${this.totalCount}`, {
          headers: {
            'Authorization': 'Token 2tLFFPlRQX7cnuvaxTfJ2qVi6aJSecX0',
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        this.products = data.results || []
        this.hasMore = false
        console.log(`✅ Loaded all ${this.products.length} products`)
        
      } catch (err) {
        this.error = `Failed to load all products: ${err.message}`
        console.error('❌ Error loading all products:', err)
      } finally {
        this.loading = false
      }
    },
    
    isEditing(productId, field) {
      return this.editingCell === `${productId}_${field}`
    },
    
    startEdit(productId, field) {
      const product = this.products.find(p => p.id === productId)
      if (product) {
        this.editingCell = `${productId}_${field}`
        this.editingValue = product[field] || ''
        this.$nextTick(() => {
          const input = document.querySelector('.edit-input')
          if (input) input.focus()
        })
      }
    },
    
    cancelEdit() {
      this.editingCell = null
      this.editingValue = ''
    },
    
    async saveEdit(product, field) {
      if (this.editingValue === (product[field] || '')) {
        this.cancelEdit()
        return
      }
      
      try {
        const updateData = {
          [field]: this.editingValue
        }
        
        const response = await fetch(`https://pim.offineeds.com/api/database/rows/table/251/${product.id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': 'Token 2tLFFPlRQX7cnuvaxTfJ2qVi6aJSecX0',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        })
        
        if (!response.ok) {
          throw new Error(`Update failed: ${response.status} ${response.statusText}`)
        }
        
        const updatedProduct = await response.json()
        
        // Update the product in the local array
        const productIndex = this.products.findIndex(p => p.id === product.id)
        if (productIndex !== -1) {
          this.$set(this.products, productIndex, updatedProduct)
        }
        
        console.log(`✅ Updated product ${product.id} field ${field}`)
        this.cancelEdit()
        
      } catch (err) {
        console.error('❌ Error updating product:', err)
        alert(`Failed to update: ${err.message}`)
        this.cancelEdit()
      }
    }
  }
}
</script>

<style scoped>
.simple-products-table {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading, .error, .success, .no-data {
  padding: 15px;
  margin: 10px 0;
  border-radius: 4px;
}

.loading {
  background: #e3f2fd;
  border: 1px solid #2196f3;
}

.error {
  background: #ffebee;
  border: 1px solid #f44336;
}

.success {
  background: #e8f5e9;
  border: 1px solid #4caf50;
}

.header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.actions {
  display: flex;
  gap: 10px;
}

.load-more, .load-all {
  background: #2196f3;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.load-more:hover, .load-all:hover {
  background: #1976d2;
}

.load-all {
  background: #ff9800;
}

.load-all:hover {
  background: #f57c00;
}

.load-all:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.no-data {
  background: #fff3e0;
  border: 1px solid #ff9800;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.products-table th,
.products-table td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.products-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.products-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.products-table tr:hover {
  background-color: #f5f5f5;
}

button {
  background: #2196f3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #1976d2;
}

.editable {
  cursor: pointer;
  position: relative;
}

.editable:hover {
  background-color: #f0f0f0;
}

.edit-input {
  width: 100%;
  border: 2px solid #2196f3;
  border-radius: 3px;
  padding: 4px;
  font-size: inherit;
  font-family: inherit;
  background: white;
}

.edit-input:focus {
  outline: none;
  border-color: #1976d2;
}
</style>