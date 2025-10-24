<template>
  <div style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <h1 style="color: #202128; margin-bottom: 20px;">Products Management</h1>
    
    <!-- Search -->
    <div style="margin-bottom: 20px;">
      <input 
        v-model="searchQuery"
        type="text" 
        placeholder="Search products..."
        style="width: 300px; padding: 8px 12px; border: 1px solid #e6e6e7; border-radius: 6px; font-size: 14px;"
        @input="onSearch"
      />
    </div>

    <!-- Add Button -->
    <button 
      @click="showAddForm = !showAddForm"
      style="background: #5190ef; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; margin-bottom: 20px;"
    >
      {{ showAddForm ? 'Cancel' : 'Add Product' }}
    </button>

    <!-- Add Form -->
    <div v-if="showAddForm" style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3>Add New Product</h3>
      <form @submit.prevent="addProduct">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Name:</label>
          <input v-model="newProduct.name" type="text" required style="width: 100%; max-width: 300px; padding: 8px 12px; border: 1px solid #e6e6e7; border-radius: 6px;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Price:</label>
          <input v-model.number="newProduct.price" type="number" step="0.01" style="width: 100%; max-width: 300px; padding: 8px 12px; border: 1px solid #e6e6e7; border-radius: 6px;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Description:</label>
          <textarea v-model="newProduct.description" style="width: 100%; max-width: 300px; padding: 8px 12px; border: 1px solid #e6e6e7; border-radius: 6px; min-height: 80px;"></textarea>
        </div>
        <button type="submit" style="background: #12d452; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
          Add Product
        </button>
      </form>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="text-align: center; padding: 40px; color: #6a6b70;">
      Loading products...
    </div>

    <!-- Products Table -->
    <div v-else style="overflow-x: auto; border: 1px solid #e6e6e7; border-radius: 8px; background: white;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f7f7f7;">
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e6e6e7; cursor: pointer;" @click="sort('id')">
              ID {{ sortField === 'id' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
            </th>
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e6e6e7; cursor: pointer;" @click="sort('name')">
              Name {{ sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
            </th>
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e6e6e7; cursor: pointer;" @click="sort('price')">
              Price {{ sortField === 'price' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
            </th>
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e6e6e7;">Description</th>
            <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e6e6e7;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filteredProducts" :key="product.id" style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 12px;">{{ product.id }}</td>
            <td style="padding: 12px;">
              <input 
                v-if="editingId === product.id" 
                v-model="editForm.name" 
                style="width: 100%; padding: 4px 8px; border: 1px solid #e6e6e7; border-radius: 4px;"
              />
              <span v-else>{{ product.name }}</span>
            </td>
            <td style="padding: 12px;">
              <input 
                v-if="editingId === product.id" 
                v-model.number="editForm.price" 
                type="number" 
                step="0.01"
                style="width: 100px; padding: 4px 8px; border: 1px solid #e6e6e7; border-radius: 4px;"
              />
              <span v-else>${{ product.price }}</span>
            </td>
            <td style="padding: 12px;">
              <textarea 
                v-if="editingId === product.id" 
                v-model="editForm.description" 
                style="width: 100%; min-height: 60px; padding: 4px 8px; border: 1px solid #e6e6e7; border-radius: 4px;"
              ></textarea>
              <span v-else>{{ product.description }}</span>
            </td>
            <td style="padding: 12px; text-align: center;">
              <button 
                v-if="editingId !== product.id"
                @click="startEdit(product)"
                style="background: #5190ef; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 8px;"
              >
                Edit
              </button>
              <template v-else>
                <button 
                  @click="saveEdit(product.id)"
                  style="background: #12d452; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 8px;"
                >
                  Save
                </button>
                <button 
                  @click="cancelEdit"
                  style="background: #9c9c9f; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 8px;"
                >
                  Cancel
                </button>
              </template>
              <button 
                @click="deleteProduct(product.id)"
                style="background: #ff7a6b; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredProducts.length === 0" style="text-align: center; padding: 40px; color: #6a6b70;">
        <h3>No products found</h3>
        <p>{{ searchQuery ? 'No products match your search.' : 'Add your first product to get started.' }}</p>
      </div>
    </div>

    <!-- Status Message -->
    <div v-if="message" :style="`margin-top: 20px; padding: 12px; border-radius: 6px; ${message.type === 'error' ? 'background: #ffebee; color: #c62828;' : 'background: #e8f5e8; color: #2e7d32;'}`">
      {{ message.text }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductsSimple',
  data() {
    return {
      products: [
        { id: 1, name: 'Laptop', price: 999.99, description: 'High-performance laptop for work and gaming' },
        { id: 2, name: 'Mouse', price: 29.99, description: 'Wireless optical mouse with ergonomic design' },
        { id: 3, name: 'Keyboard', price: 79.99, description: 'Mechanical keyboard with RGB backlighting' },
      ],
      searchQuery: '',
      loading: false,
      showAddForm: false,
      editingId: null,
      sortField: 'id',
      sortOrder: 'asc',
      message: null,
      newProduct: {
        name: '',
        price: null,
        description: ''
      },
      editForm: {
        name: '',
        price: null,
        description: ''
      }
    }
  },
  computed: {
    filteredProducts() {
      let filtered = this.products
      
      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
        )
      }
      
      // Sort
      return filtered.sort((a, b) => {
        const aVal = a[this.sortField]
        const bVal = b[this.sortField]
        
        let comparison = 0
        if (aVal > bVal) comparison = 1
        if (aVal < bVal) comparison = -1
        
        return this.sortOrder === 'asc' ? comparison : -comparison
      })
    }
  },
  methods: {
    onSearch() {
      // Debounce search if needed
    },
    
    sort(field) {
      if (this.sortField === field) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortField = field
        this.sortOrder = 'asc'
      }
    },
    
    addProduct() {
      if (!this.newProduct.name) {
        this.showMessage('Product name is required', 'error')
        return
      }
      
      const product = {
        id: Math.max(...this.products.map(p => p.id)) + 1,
        name: this.newProduct.name,
        price: this.newProduct.price || 0,
        description: this.newProduct.description || ''
      }
      
      this.products.unshift(product)
      this.newProduct = { name: '', price: null, description: '' }
      this.showAddForm = false
      this.showMessage('Product added successfully!', 'success')
    },
    
    startEdit(product) {
      this.editingId = product.id
      this.editForm = { ...product }
    },
    
    saveEdit(productId) {
      const index = this.products.findIndex(p => p.id === productId)
      if (index !== -1) {
        this.products.splice(index, 1, { ...this.editForm })
        this.cancelEdit()
        this.showMessage('Product updated successfully!', 'success')
      }
    },
    
    cancelEdit() {
      this.editingId = null
      this.editForm = { name: '', price: null, description: '' }
    },
    
    deleteProduct(productId) {
      if (confirm('Are you sure you want to delete this product?')) {
        const index = this.products.findIndex(p => p.id === productId)
        if (index !== -1) {
          this.products.splice(index, 1)
          this.showMessage('Product deleted successfully!', 'success')
        }
      }
    },
    
    showMessage(text, type = 'success') {
      this.message = { text, type }
      setTimeout(() => {
        this.message = null
      }, 3000)
    }
  }
}
</script>