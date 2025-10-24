<template>
  <div class="products-manager">
    <div class="products-manager__header">
      <h1 class="products-manager__title">📊 Products Management - Demo Version</h1>
      <p class="products-manager__description">
        Manage your products with advanced search, sorting, and editing capabilities
      </p>
    </div>

    <div class="products-manager__controls">
      <div class="products-manager__search">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search products..."
          class="products-manager__search-input"
          @input="onSearch"
        />
        <i class="iconoir-search products-manager__search-icon" />
      </div>
      <Button
        type="primary"
        icon="iconoir-plus"
        @click="showAddModal = true"
      >
        Add Product
      </Button>
    </div>

    <div class="products-manager__table-container">
      <table class="products-manager__table">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              class="products-manager__header-cell"
              :class="{ 'products-manager__header-cell--sortable': column.sortable }"
              @click="sort(column.key)"
            >
              <div class="products-manager__header-content">
                <span>{{ column.name }}</span>
                <i
                  v-if="column.sortable"
                  class="products-manager__sort-icon"
                  :class="getSortIconClass(column.key)"
                />
              </div>
            </th>
            <th class="products-manager__header-cell products-manager__header-cell--actions">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="product in paginatedProducts"
            :key="product.id"
            class="products-manager__row"
            :class="{ 'products-manager__row--editing': editingId === product.id }"
          >
            <td class="products-manager__cell">{{ product.id }}</td>
            <td class="products-manager__cell">
              <input
                v-if="editingId === product.id"
                v-model="editForm.name"
                type="text"
                class="products-manager__input"
              />
              <span v-else>{{ product.name }}</span>
            </td>
            <td class="products-manager__cell">
              <input
                v-if="editingId === product.id"
                v-model.number="editForm.price"
                type="number"
                step="0.01"
                class="products-manager__input products-manager__input--price"
              />
              <span v-else class="products-manager__price">${{ product.price.toFixed(2) }}</span>
            </td>
            <td class="products-manager__cell">
              <select
                v-if="editingId === product.id"
                v-model="editForm.category"
                class="products-manager__select"
              >
                <option value="Electronics">Electronics</option>
                <option value="Accessories">Accessories</option>
                <option value="Software">Software</option>
                <option value="Hardware">Hardware</option>
              </select>
              <Badge
                v-else
                :color="getCategoryColor(product.category)"
              >
                {{ product.category }}
              </Badge>
            </td>
            <td class="products-manager__cell">
              <textarea
                v-if="editingId === product.id"
                v-model="editForm.description"
                class="products-manager__textarea"
              />
              <span v-else class="products-manager__description">{{ product.description }}</span>
            </td>
            <td class="products-manager__cell products-manager__cell--actions">
              <div class="products-manager__actions">
                <ButtonIcon
                  v-if="editingId !== product.id"
                  icon="iconoir-edit-pencil"
                  size="small"
                  @click="startEdit(product)"
                />
                <template v-else>
                  <ButtonIcon
                    icon="iconoir-check"
                    type="primary"
                    size="small"
                    @click="saveEdit(product.id)"
                  />
                  <ButtonIcon
                    icon="iconoir-cancel"
                    size="small"
                    @click="cancelEdit"
                  />
                </template>
                <ButtonIcon
                  icon="iconoir-trash"
                  type="danger"
                  size="small"
                  @click="deleteProduct(product.id)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredProducts.length === 0" class="products-manager__empty">
        <div class="products-manager__empty-content">
          <i class="iconoir-packages products-manager__empty-icon" />
          <h3>No products found</h3>
          <p v-if="searchQuery">No products match your search criteria.</p>
          <p v-else>Add your first product to get started.</p>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="products-manager__pagination">
        <Button
          size="small"
          :disabled="currentPage <= 1"
          @click="currentPage--"
        >
          Previous
        </Button>
        <span class="products-manager__page-info">
          Page {{ currentPage }} of {{ totalPages }} ({{ totalProducts }} items)
        </span>
        <Button
          size="small"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          Next
        </Button>
      </div>
    </div>

    <!-- Add Product Modal -->
    <Modal
      v-if="showAddModal"
      @close="showAddModal = false"
    >
      <template #title>Add New Product</template>
      <div class="products-manager__form">
        <div class="products-manager__form-group">
          <label class="products-manager__label">
            Name <span class="products-manager__required">*</span>
          </label>
          <input
            v-model="newProduct.name"
            type="text"
            class="products-manager__input"
            required
          />
        </div>
        <div class="products-manager__form-group">
          <label class="products-manager__label">
            Price <span class="products-manager__required">*</span>
          </label>
          <input
            v-model.number="newProduct.price"
            type="number"
            step="0.01"
            class="products-manager__input"
            required
          />
        </div>
        <div class="products-manager__form-group">
          <label class="products-manager__label">Category</label>
          <select v-model="newProduct.category" class="products-manager__select">
            <option value="Electronics">Electronics</option>
            <option value="Accessories">Accessories</option>
            <option value="Software">Software</option>
            <option value="Hardware">Hardware</option>
          </select>
        </div>
        <div class="products-manager__form-group">
          <label class="products-manager__label">Description</label>
          <textarea
            v-model="newProduct.description"
            class="products-manager__textarea"
          />
        </div>
        <div class="products-manager__form-actions">
          <Button
            type="secondary"
            @click="showAddModal = false"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            @click="addProduct"
          >
            Add Product
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Toast Messages -->
    <div v-if="message" class="products-manager__toast" :class="message.type">
      {{ message.text }}
    </div>
  </div>
</template>

<script>
import Button from '@baserow/modules/core/components/Button'
import ButtonIcon from '@baserow/modules/core/components/ButtonIcon'
import Modal from '@baserow/modules/core/components/Modal'
import Badge from '@baserow/modules/core/components/Badge'

export default {
  name: 'ProductsManager',
  components: {
    Button,
    ButtonIcon,
    Modal,
    Badge,
  },
  data() {
    return {
      products: [
        { id: 1, name: 'MacBook Pro 16"', price: 2399.99, category: 'Electronics', description: 'High-performance laptop with M2 Pro chip' },
        { id: 2, name: 'Magic Mouse', price: 79.99, category: 'Accessories', description: 'Wireless mouse with multi-touch surface' },
        { id: 3, name: 'Mechanical Keyboard', price: 149.99, category: 'Accessories', description: 'RGB mechanical keyboard with Cherry MX switches' },
        { id: 4, name: 'Adobe Creative Suite', price: 52.99, category: 'Software', description: 'Monthly subscription for creative software' },
        { id: 5, name: '4K Monitor', price: 399.99, category: 'Electronics', description: '27-inch 4K IPS display with USB-C connectivity' },
        { id: 6, name: 'External SSD', price: 199.99, category: 'Hardware', description: '1TB portable SSD with USB 3.2 Gen 2' },
        { id: 7, name: 'Wireless Headphones', price: 349.99, category: 'Electronics', description: 'Premium noise-cancelling wireless headphones' },
        { id: 8, name: 'Webcam HD', price: 89.99, category: 'Electronics', description: 'Full HD 1080p webcam with auto-focus' },
      ],
      searchQuery: '',
      showAddModal: false,
      editingId: null,
      sortField: 'id',
      sortOrder: 'asc',
      message: null,
      currentPage: 1,
      pageSize: 5,
      columns: [
        { key: 'id', name: 'ID', sortable: true },
        { key: 'name', name: 'Name', sortable: true },
        { key: 'price', name: 'Price', sortable: true },
        { key: 'category', name: 'Category', sortable: true },
        { key: 'description', name: 'Description', sortable: false },
      ],
      newProduct: {
        name: '',
        price: null,
        category: 'Electronics',
        description: ''
      },
      editForm: {
        name: '',
        price: null,
        category: 'Electronics',
        description: ''
      }
    }
  },
  computed: {
    filteredProducts() {
      let filtered = this.products
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        )
      }
      
      return filtered.sort((a, b) => {
        const aVal = a[this.sortField]
        const bVal = b[this.sortField]
        
        let comparison = 0
        if (aVal > bVal) comparison = 1
        if (aVal < bVal) comparison = -1
        
        return this.sortOrder === 'asc' ? comparison : -comparison
      })
    },
    paginatedProducts() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredProducts.slice(start, end)
    },
    totalProducts() {
      return this.filteredProducts.length
    },
    totalPages() {
      return Math.ceil(this.totalProducts / this.pageSize)
    }
  },
  watch: {
    filteredProducts() {
      if (this.currentPage > this.totalPages) {
        this.currentPage = 1
      }
    }
  },
  methods: {
    onSearch() {
      this.currentPage = 1
    },
    
    sort(field) {
      if (this.sortField === field) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortField = field
        this.sortOrder = 'asc'
      }
      this.currentPage = 1
    },
    
    getSortIconClass(field) {
      if (this.sortField !== field) {
        return 'iconoir-sort'
      }
      return this.sortOrder === 'asc' ? 'iconoir-sort-up' : 'iconoir-sort-down'
    },
    
    getCategoryColor(category) {
      const colors = {
        'Electronics': 'blue',
        'Accessories': 'green', 
        'Software': 'red',
        'Hardware': 'gray'
      }
      return colors[category] || 'gray'
    },
    
    addProduct() {
      if (!this.newProduct.name || !this.newProduct.price) {
        this.showMessage('Name and price are required', 'error')
        return
      }
      
      const product = {
        id: Math.max(...this.products.map(p => p.id)) + 1,
        name: this.newProduct.name,
        price: parseFloat(this.newProduct.price),
        category: this.newProduct.category,
        description: this.newProduct.description || ''
      }
      
      this.products.push(product)
      this.newProduct = { name: '', price: null, category: 'Electronics', description: '' }
      this.showAddModal = false
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
      this.editForm = { name: '', price: null, category: 'Electronics', description: '' }
    },
    
    deleteProduct(productId) {
      if (confirm('Are you sure you want to delete this product?')) {
        const index = this.products.findIndex(p => p.id === productId)
        if (index !== -1) {
          this.products.splice(index, 1)
          this.showMessage('Product deleted successfully!', 'success')
          if (this.paginatedProducts.length === 0 && this.currentPage > 1) {
            this.currentPage = 1
          }
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

<style lang="scss" scoped>
.products-manager {
  padding: 20px;
  background: #f7f7f7;
  min-height: 100vh;

  &__header {
    text-align: center;
    margin-bottom: 30px;
  }

  &__title {
    color: #202128;
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  &__description {
    color: #6a6b70;
    font-size: 16px;
  }

  &__controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 16px;
    }
  }

  &__search {
    position: relative;
    max-width: 400px;
    flex: 1;
  }

  &__search-input {
    width: 100%;
    padding: 10px 40px 10px 12px;
    border: 1px solid #e6e6e7;
    border-radius: 6px;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: #5190ef;
      box-shadow: 0 0 0 3px rgba(81, 144, 239, 0.1);
    }
  }

  &__search-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9c9c9f;
  }

  &__table-container {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
  }

  &__header-cell {
    background: #f7f7f7;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    border-bottom: 1px solid #e6e6e7;

    &--sortable {
      cursor: pointer;
      user-select: none;

      &:hover {
        background: #f0f0f0;
      }
    }

    &--actions {
      width: 120px;
      text-align: center;
    }
  }

  &__header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__sort-icon {
    color: #9c9c9f;
    font-size: 16px;
  }

  &__row {
    &:hover {
      background: #fafafa;
    }

    &--editing {
      background: #f0f4fc;
    }
  }

  &__cell {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;

    &--actions {
      text-align: center;
    }
  }

  &__input {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #e6e6e7;
    border-radius: 4px;
    font-size: 14px;

    &--price {
      width: 100px;
    }

    &:focus {
      outline: none;
      border-color: #5190ef;
      box-shadow: 0 0 0 2px rgba(81, 144, 239, 0.1);
    }
  }

  &__select {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #e6e6e7;
    border-radius: 4px;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: #5190ef;
    }
  }

  &__textarea {
    width: 100%;
    min-height: 60px;
    padding: 6px 8px;
    border: 1px solid #e6e6e7;
    border-radius: 4px;
    font-size: 14px;
    resize: vertical;

    &:focus {
      outline: none;
      border-color: #5190ef;
      box-shadow: 0 0 0 2px rgba(81, 144, 239, 0.1);
    }
  }

  &__price {
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }

  &__description {
    max-width: 300px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__actions {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  &__empty {
    text-align: center;
    padding: 60px 20px;
  }

  &__empty-content {
    max-width: 400px;
    margin: 0 auto;
  }

  &__empty-icon {
    font-size: 64px;
    color: #cdcecd;
    margin-bottom: 16px;
  }

  &__pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    gap: 16px;
    background: #fafafa;
    border-top: 1px solid #e6e6e7;
  }

  &__page-info {
    font-size: 14px;
    color: #6a6b70;
  }

  &__form {
    padding: 0;
  }

  &__form-group {
    margin-bottom: 20px;
  }

  &__label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    color: #393a40;
  }

  &__required {
    color: #ff7a6b;
  }

  &__form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #e6e6e7;
  }

  &__toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 1000;

    &.success {
      background: #12d452;
    }

    &.error {
      background: #ff7a6b;
    }
  }
}
</style>