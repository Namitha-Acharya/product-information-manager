<template>
  <div class="products-data-table">
    <div class="products-data-table__header">
      <h1 class="products-data-table__title">🔗 Products Management - Data Table Version</h1>
      <p class="products-data-table__description">
        Connect to your Baserow Products table and manage data with real-time updates
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !rows.length" class="products-data-table__loading">
      <div class="products-data-table__selector-content">
        <h2>🔄 Connecting to Products Table</h2>
        <p>Loading products from table 734...</p>
      </div>
    </div>

    <!-- Table Selection (Hidden by default) -->
    <div class="products-data-table__table-selector" v-if="showTableSelector">
      <div class="products-data-table__selector-content">
        <h2>Select Your Products Table</h2>
        <p>Choose the Baserow table containing your products data:</p>
        
        <!-- Manual Table ID Input -->
        <div class="products-data-table__input-group">
          <label class="products-data-table__label">Table ID:</label>
          <input
            v-model="tableIdInput"
            type="number"
            placeholder="Enter your Products table ID (e.g., 123)"
            class="products-data-table__input"
          />
          <Button
            type="primary"
            @click="connectToTable"
            :disabled="!tableIdInput"
          >
            Connect to Table
          </Button>
        </div>
        
        <!-- Instructions -->
        <div class="products-data-table__instructions">
          <h3>How to find your Table ID:</h3>
          <ol>
            <li>Go to your Baserow workspace</li>
            <li>Open your Products table</li>
            <li>Check the URL - it should contain the table ID like: <code>/table/123</code></li>
            <li>Enter that number above</li>
          </ol>
        </div>
      </div>
    </div>

    <!-- Data Table Interface -->
    <div v-if="!showTableSelector && !showTokenInput" class="products-data-table__main">
      <!-- Controls -->
      <div class="products-data-table__controls">
        <div class="products-data-table__search">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search products..."
            class="products-data-table__search-input"
            @input="onSearch"
          />
          <i class="iconoir-search products-data-table__search-icon" />
        </div>
        <div class="products-data-table__actions">
          <Button
            type="secondary"
            icon="iconoir-refresh"
            @click="fetchTableData"
            :loading="loading"
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon="iconoir-plus"
            @click="showAddModal = true"
          >
            Add Product
          </Button>
          <Button
            type="secondary"
            @click="showTableSelector = true"
          >
            Change Table
          </Button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="products-data-table__loading">
        <div class="products-data-table__spinner"></div>
        <p>Loading products from table {{ selectedTableId }}...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="products-data-table__error">
        <Alert type="error">
          {{ error }}
        </Alert>
        <Button type="secondary" @click="fetchTableData">
          Retry
        </Button>
      </div>


      <!-- Table -->
      <div v-if="tableFields.length" class="products-data-table__table-container">
        <table class="products-data-table__table">
          <thead>
            <tr>
              <th class="products-data-table__header-cell products-data-table__header-cell--actions">
                Actions
              </th>
              <th
                v-for="field in visibleFields"
                :key="field.id"
                class="products-data-table__header-cell"
                :class="{ 'products-data-table__header-cell--sortable': isSortable(field) }"
                @click="sort(field.name)"
              >
                <div class="products-data-table__header-content">
                  <span>{{ field.display_name || field.name }}</span>
                  <i
                    v-if="isSortable(field)"
                    class="products-data-table__sort-icon"
                    :class="getSortIconClass(field.name)"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows.slice(0, 10)"
              :key="row.id"
              class="products-data-table__row"
              :class="{ 'products-data-table__row--editing': editingId === row.id }"
            >
              <td class="products-data-table__cell products-data-table__cell--actions">
                <div class="products-data-table__row-actions">
                  <ButtonIcon
                    v-if="editingId !== row.id"
                    icon="iconoir-edit-pencil"
                    size="small"
                    @click="startEdit(row.id)"
                  />
                  <template v-else>
                    <ButtonIcon
                      icon="iconoir-check"
                      type="primary"
                      size="small"
                      @click="saveEdit(row.id)"
                    />
                    <ButtonIcon
                      icon="iconoir-cancel"
                      size="small"
                      @click="cancelEdit"
                    />
                  </template>
                  <ButtonIcon
                    icon="iconoir-trash"
                    type="secondary"
                    size="small"
                    @click="deleteRow(row.id)"
                  />
                </div>
              </td>
              <td
                v-for="field in visibleFields"
                :key="`${row.id}-${field.id}`"
                class="products-data-table__cell"
              >
                <ProductsCell
                  :field="field"
                  :row="row"
                  :editing="editingId === row.id"
                  @update="onUpdateCell"
                />
              </td>
            </tr>
          </tbody>
        </table>



        <!-- Empty State -->
        <div v-if="filteredRows.length === 0" class="products-data-table__empty">
          <div class="products-data-table__empty-content">
            <i class="iconoir-packages products-data-table__empty-icon" />
            <h3>No products found</h3>
            <p v-if="searchQuery">No products match your search criteria.</p>
            <p v-else>This table appears to be empty. Add your first product to get started.</p>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="products-data-table__pagination">
          <Button
            size="small"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            Previous
          </Button>
          
          <!-- Page Selection -->
          <div class="products-data-table__page-selection">
            <span class="products-data-table__page-label">Go to page:</span>
            <select
              v-model="currentPage"
              class="products-data-table__page-select"
              @change="onPageChange"
            >
              <option
                v-for="page in totalPages"
                :key="page"
                :value="page"
              >
                {{ page }}
              </option>
            </select>
            <span class="products-data-table__page-info">
              of {{ totalPages }} ({{ totalRows }} items)
            </span>
          </div>
          
          <Button
            size="small"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            Next
          </Button>
        </div>
      </div>
    </div>

    <!-- Add Product Modal -->
    <Modal
      v-if="showAddModal"
      @close="showAddModal = false"
    >
      <template #title>Add New Product</template>
      <div class="products-data-table__form">
        <div
          v-for="field in editableFields"
          :key="field.id"
          class="products-data-table__form-group"
        >
          <label class="products-data-table__label">
            {{ field.name }}
            <span v-if="field.required" class="products-data-table__required">*</span>
          </label>
          <ProductsFormField
            :field="field"
            v-model="newProductData[field.name]"
          />
        </div>
        <div class="products-data-table__form-actions">
          <Button
            type="secondary"
            @click="showAddModal = false"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            @click="addProduct"
            :loading="saving"
          >
            Add Product
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Toast Messages -->
    <div v-if="message" class="products-data-table__toast" :class="message.type">
      {{ message.text }}
    </div>
  </div>
</template>

<script>
import Button from '@baserow/modules/core/components/Button'
import ButtonIcon from '@baserow/modules/core/components/ButtonIcon'
import Modal from '@baserow/modules/core/components/Modal'
import Alert from '@baserow/modules/core/components/Alert'
import ProductsCell from './ProductsCell'
import ProductsFormField from './ProductsFormField'
import ProductsTableService from '../services/table'
import TokenAuthService from '../services/tokenAuth'

export default {
  name: 'ProductsDataTable',
  components: {
    Button,
    ButtonIcon,
    Modal,
    Alert,
    ProductsCell,
    ProductsFormField,
  },
  data() {
    return {
      selectedTableId: 734, // Connect directly to table ID 734
      tableIdInput: '734',
      apiToken: 'BuYwkmQrRVV3jB5fuXxiqTTNPzBa1c3C', // Replace with your actual database token
      tokenAuthService: null, // Token-based auth service instance
      rows: [],
      tableFields: [],
      searchQuery: '',
      loading: false,
      saving: false,
      error: null,
      showAddModal: false,
      editingId: null,
      sortField: 'id',
      sortOrder: 'asc',
      message: null,
      currentPage: 1,
      pageSize: 10,
      newProductData: {},
      originalRowData: {},
      showTableSelector: false, // Hide table selector by default
      showTokenInput: false, // Hide token input - auto-connect
    }
  },
  computed: {
    visibleFields() {
      // Show all fields except ID, Product ID, and other system fields
      const filteredFields = this.tableFields.filter(field => 
        !['id', 'order', 'field_6898'].includes(field.name) && // Hide ID, order, and Product ID columns
        field.type !== 'formula' // Skip computed fields for display
      ) // Show all fields - no limit
      
      // Custom ordering: Move Product Type 2 (field_7007) next to Product Type (field_6902)
      const reorderedFields = []
      let productType2Field = null
      
      for (const field of filteredFields) {
        if (field.name === 'field_7007') {
          // Store Product Type 2 field to insert later
          productType2Field = field
        } else {
          reorderedFields.push(field)
          // If we just added Product Type field, insert Product Type 2 next
          if (field.name === 'field_6902' && productType2Field) {
            reorderedFields.push(productType2Field)
            productType2Field = null // Mark as inserted
          }
        }
      }
      
      // If Product Type 2 wasn't inserted yet (Product Type field not found), add it at the end
      if (productType2Field) {
        reorderedFields.push(productType2Field)
      }
      
      return reorderedFields
    },
    
    editableFields() {
      return this.tableFields.filter(field => 
        !['id', 'created_on', 'updated_on'].includes(field.name) &&
        !field.read_only &&
        field.type !== 'formula'
      )
    },

    filteredRows() {
      console.log('🔧 filteredRows computed - input:', {
        rowsLength: this.rows.length,
        searchQuery: this.searchQuery,
        sortField: this.sortField,
        visibleFieldsLength: this.visibleFields.length
      })
      
      let filtered = this.rows
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(row => {
          return this.visibleFields.some(field => {
            const value = row[field.name]
            return value && value.toString().toLowerCase().includes(query)
          })
        })
        console.log('🔧 After search filter:', filtered.length)
      }
      
      // Sort
      const sorted = filtered.sort((a, b) => {
        const aVal = a[this.sortField] || ''
        const bVal = b[this.sortField] || ''
        
        let comparison = 0
        if (aVal > bVal) comparison = 1
        if (aVal < bVal) comparison = -1
        
        return this.sortOrder === 'asc' ? comparison : -comparison
      })
      
      console.log('🔧 filteredRows result:', sorted.length)
      return sorted
    },

    paginatedRows() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredRows.slice(start, end)
    },

    totalRows() {
      return this.filteredRows.length
    },

    totalPages() {
      return Math.ceil(this.totalRows / this.pageSize)
    }
  },

  watch: {
    filteredRows() {
      if (this.currentPage > this.totalPages && this.totalPages > 0) {
        this.currentPage = 1
      }
    }
  },

  async mounted() {
    // Auto-connect on page load
    console.log('🚀 ProductsDataTable mounted - starting autoConnect')
    console.log('🔍 Component state:', { 
      loading: this.loading, 
      rows: this.rows?.length || 0,
      apiToken: this.apiToken ? 'SET' : 'NOT SET'
    })
    
    try {
      // Test direct API call first
      console.log('🧪 Testing direct API call...')
      const testResponse = await fetch(`http://localhost/api/database/rows/table/734/?size=5`, {
        headers: {
          'Authorization': `Token ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })
      const testData = await testResponse.json()
      console.log('🧪 Direct API test result:', testData)
      
      await this.autoConnect()
      console.log('✅ AutoConnect completed')
      console.log('🔍 Final state:', { 
        loading: this.loading, 
        rows: this.rows?.length || 0,
        error: this.error
      })
    } catch (error) {
      console.error('❌ AutoConnect failed:', error)
    }
  },

  methods: {
    async autoConnect() {
      // Auto-connect on page load with hardcoded token
      console.log('🔧 AutoConnect started with token:', this.apiToken ? this.apiToken.substring(0, 10) + '...' : 'NO TOKEN')
      
      if (!this.apiToken || this.apiToken === 'YOUR_DATABASE_TOKEN_HERE') {
        this.error = 'Please set your database token in the component code. See console for instructions.'
        console.error('🚨 SETUP REQUIRED: Please replace YOUR_DATABASE_TOKEN_HERE with your actual Baserow database token in ProductsDataTable.vue')
        console.info('📝 Steps to get your token:')
        console.info('1. Go to http://localhost and log in to Baserow')
        console.info('2. Navigate to Settings > API tokens')
        console.info('3. Create a new database token with permissions for your workspace')
        console.info('4. Copy the token and replace YOUR_DATABASE_TOKEN_HERE in the component')
        return
      }
      
      try {
        this.loading = true
        this.error = null
        
        console.log('🔧 Creating TokenAuthService...')
        // Create token auth service
        this.tokenAuthService = new TokenAuthService('http://localhost/api', this.apiToken)
        
        console.log('🧪 Testing connection to table', this.selectedTableId)
        // Test the connection first
        const connectionTest = await this.tokenAuthService.testConnection(this.selectedTableId)
        console.log('🧪 Connection test result:', connectionTest)
        if (!connectionTest.success) {
          throw new Error(connectionTest.error)
        }
        
        console.log('✅ Connection successful, loading table structure...')
        // Load table structure and data from table 734
        await this.fetchTableStructure()
        console.log('✅ Table structure loaded, loading data...')
        await this.fetchTableData()
        console.log('✅ Data loaded successfully!')
        console.log('🔍 Sample row data:', this.rows[0])
        console.log('🔍 Visible fields:', this.visibleFields.map(f => f.name))
        console.log('🔍 Field names in data:', Object.keys(this.rows[0] || {}))
        console.log('🔍 Field names expected:', this.tableFields.map(f => f.name))
        
        this.showMessage(`✅ Connected to products table ${this.selectedTableId}!`, 'success')
        console.log('🎉 Auto-connect completed successfully!')
      } catch (error) {
        console.error('❌ Failed to auto-connect:', error)
        this.error = `❌ Failed to connect: ${error.message || 'Please check your token and permissions.'}`
      } finally {
        this.loading = false
      }
    },

    async connectWithToken() {
      if (!this.apiToken) return
      
      try {
        this.loading = true
        this.error = null
        
        // Create token auth service
        this.tokenAuthService = new TokenAuthService('http://localhost/api', this.apiToken)
        
        // Test the connection first
        const connectionTest = await this.tokenAuthService.testConnection(this.selectedTableId)
        if (!connectionTest.success) {
          throw new Error(connectionTest.error)
        }
        
        // Load table structure and data from table 734
        await this.fetchTableStructure()
        await this.fetchTableData()
        
        // Hide token input and show main interface
        this.showTokenInput = false
        this.showMessage(`Connected to products table ${this.selectedTableId}!`, 'success')
      } catch (error) {
        console.error('Failed to connect with token:', error)
        this.error = `Failed to connect: ${error.message || 'Please check your token and permissions.'}`
      } finally {
        this.loading = false
      }
    },

    async initializeData() {
      // This method is now called after token authentication
      try {
        this.loading = true
        await this.fetchTableStructure()
        await this.fetchTableData()
        this.showMessage(`Connected to products table ${this.selectedTableId}!`, 'success')
      } catch (error) {
        console.error('Failed to connect to table 734:', error)
        this.error = `Failed to connect to table ${this.selectedTableId}: ${error.message || 'Please check if the table exists and you have access to it.'}`
      } finally {
        this.loading = false
      }
    },

    loadDemoData() {
      // Load some demo data if no table is available
      this.tableFields = [
        { id: 1, name: 'name', type: 'text' },
        { id: 2, name: 'price', type: 'number' },
        { id: 3, name: 'category', type: 'single_select', select_options: [
          { id: 1, value: 'Electronics' },
          { id: 2, value: 'Accessories' },
          { id: 3, value: 'Software' }
        ]},
        { id: 4, name: 'description', type: 'long_text' },
        { id: 5, name: 'in_stock', type: 'boolean' }
      ]
      
      this.rows = [
        { id: 1, name: 'Sample Product 1', price: 99.99, category: 'Electronics', description: 'Demo product 1', in_stock: true },
        { id: 2, name: 'Sample Product 2', price: 149.99, category: 'Accessories', description: 'Demo product 2', in_stock: false },
        { id: 3, name: 'Sample Product 3', price: 299.99, category: 'Software', description: 'Demo product 3', in_stock: true }
      ]
      
      this.initializeNewProductData()
      this.showMessage('Demo data loaded. Click "Change Table" to connect to a real Baserow table.', 'info')
    },
    async connectToTable() {
      if (!this.tableIdInput) return
      
      this.selectedTableId = parseInt(this.tableIdInput)
      this.loading = true
      this.error = null

      try {
        // Fetch table structure
        await this.fetchTableStructure()
        // Fetch table data
        await this.fetchTableData()
        
        this.showTableSelector = false // Hide table selector after successful connection
        this.showMessage('Successfully connected to table!', 'success')
      } catch (error) {
        this.error = `Failed to connect to table: ${error.message || 'Unknown error'}`
        this.selectedTableId = null
      } finally {
        this.loading = false
      }
    },

    async fetchTableStructure() {
      try {
        // Use token auth service if available, otherwise fallback to Baserow client
        let data
        if (this.tokenAuthService) {
          data = await this.tokenAuthService.getTable(this.selectedTableId)
        } else {
          const response = await ProductsTableService(this.$client).get(this.selectedTableId)
          data = response.data
        }
        this.tableFields = data.fields || []
        this.initializeNewProductData()
      } catch (error) {
        console.error('Table structure fetch error:', error)
        throw new Error('Could not fetch table structure. Please check the table ID and permissions.')
      }
    },

    async fetchTableData() {
      if (!this.selectedTableId) return

      this.loading = true
      this.error = null

      try {
        const params = {
          size: 200, // Fetch more data for client-side operations
        }

        let data
        if (this.tokenAuthService) {
          data = await this.tokenAuthService.getRows(this.selectedTableId, params)
        } else {
          const response = await ProductsTableService(this.$client).getRows(this.selectedTableId, params)
          data = response.data
        }
        // Transform the row data to use field names instead of field IDs
        const rawRows = data.results || []
        this.rows = this.transformRowData(rawRows)
        
        console.log('🔄 Data loaded:', {
          rawRowsCount: rawRows.length,
          transformedRowsCount: this.rows.length,
          firstRow: this.rows[0],
          visibleFieldsCount: this.visibleFields.length,
          firstRowKeys: this.rows[0] ? Object.keys(this.rows[0]) : [],
          visibleFieldNames: this.visibleFields.map(f => f.name)
        })
        
        if (this.rows.length === 0) {
          this.showMessage('Table is empty. Add some products to get started!', 'info')
        }
      } catch (error) {
        console.error('Table data fetch error:', error)
        this.error = `Failed to fetch data: ${error.response?.data?.error || error.message}`
      } finally {
        this.loading = false
      }
    },

    initializeNewProductData() {
      this.newProductData = {}
      this.editableFields.forEach(field => {
        switch (field.type) {
          case 'boolean':
            this.newProductData[field.name] = false
            break
          case 'number':
            this.newProductData[field.name] = null
            break
          default:
            this.newProductData[field.name] = ''
        }
      })
    },

    disconnectTable() {
      this.selectedTableId = 1 // Reset to default
      this.tableIdInput = ''
      this.rows = []
      this.tableFields = []
      this.error = null
      this.currentPage = 1
      this.showTableSelector = true // Show table selector when disconnecting
    },

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

    isSortable(field) {
      return !['file', 'multiple_collaborators', 'formula'].includes(field.type)
    },

    async addProduct() {
      this.saving = true
      try {
        const cleanData = {}
        Object.keys(this.newProductData).forEach(key => {
          const value = this.newProductData[key]
          if (value !== null && value !== undefined && value !== '') {
            cleanData[key] = value
          }
        })

        let data
        if (this.tokenAuthService) {
          data = await this.tokenAuthService.createRow(this.selectedTableId, cleanData)
        } else {
          const response = await ProductsTableService(this.$client).createRow(this.selectedTableId, cleanData)
          data = response.data
        }
        this.rows.unshift(data)
        this.showAddModal = false
        this.initializeNewProductData()
        this.showMessage('Product added successfully!', 'success')
      } catch (error) {
        this.showMessage(`Failed to add product: ${error.response?.data?.error || error.message}`, 'error')
      } finally {
        this.saving = false
      }
    },

    startEdit(rowId) {
      this.editingId = rowId
      const row = this.rows.find(r => r.id === rowId)
      this.originalRowData = { ...row }
    },

    async saveEdit(rowId) {
      try {
        const row = this.rows.find(r => r.id === rowId)
        let updatedRow
        if (this.tokenAuthService) {
          updatedRow = await this.tokenAuthService.updateRow(this.selectedTableId, rowId, row)
          updatedRow = updatedRow || row
        } else {
          const response = await ProductsTableService(this.$client).updateRow(this.selectedTableId, rowId, row)
          updatedRow = response.data || row
        }
        
        const index = this.rows.findIndex(r => r.id === rowId)
        this.rows.splice(index, 1, updatedRow)
        
        this.cancelEdit()
        this.showMessage('Product updated successfully!', 'success')
      } catch (error) {
        // Revert changes on error
        const index = this.rows.findIndex(r => r.id === rowId)
        this.rows.splice(index, 1, this.originalRowData)
        this.showMessage(`Failed to update product: ${error.response?.data?.error || error.message}`, 'error')
        this.cancelEdit()
      }
    },

    cancelEdit() {
      this.editingId = null
      this.originalRowData = {}
    },

    async deleteRow(rowId) {
      if (!confirm('Are you sure you want to delete this product?')) return

      try {
        if (this.tokenAuthService) {
          await this.tokenAuthService.deleteRow(this.selectedTableId, rowId)
        } else {
          await ProductsTableService(this.$client).deleteRow(this.selectedTableId, rowId)
        }
        const index = this.rows.findIndex(r => r.id === rowId)
        this.rows.splice(index, 1)
        this.showMessage('Product deleted successfully!', 'success')
      } catch (error) {
        this.showMessage(`Failed to delete product: ${error.response?.data?.error || error.message}`, 'error')
      }
    },

    async onUpdateCell({ field, row, value }) {
      // Update local data immediately for better UX
      row[field.name] = value
    },

    showMessage(text, type = 'success') {
      this.message = { text, type }
      setTimeout(() => {
        this.message = null
      }, 5000)
    },

    transformRowData(rawRows) {
      // Simple pass-through - just ensure we have the data structure we expect
      console.log('🔧 transformRowData called with:', rawRows.length, 'rows')
      if (rawRows.length > 0) {
        console.log('🔧 First raw row keys:', Object.keys(rawRows[0]))
      }
      return rawRows
    },

    onPageChange() {
      // Method to handle page selection change
      // The currentPage is already updated via v-model, so we just need to ensure data is updated
      // The computed property 'paginatedRows' will automatically update based on currentPage
    }
  }
}
</script>

<style lang="scss" scoped>
.products-data-table {
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
    max-width: 600px;
    margin: 0 auto;
  }

  &__table-selector {
    background: white;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    max-width: 600px;
    margin: 0 auto;
  }

  &__selector-content {
    text-align: center;

    h2 {
      color: #202128;
      margin-bottom: 16px;
    }

    p {
      color: #6a6b70;
      margin-bottom: 24px;
    }
  }

  &__input-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 32px;

    @media (min-width: 480px) {
      flex-direction: row;
      align-items: end;
    }
  }

  &__label {
    font-weight: 600;
    color: #393a40;
    margin-bottom: 6px;
    display: block;
    text-align: left;
  }

  &__input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #e6e6e7;
    border-radius: 8px;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: #5190ef;
      box-shadow: 0 0 0 3px rgba(81, 144, 239, 0.1);
    }
  }

  &__instructions {
    background: #f0f4fc;
    border-radius: 8px;
    padding: 20px;
    text-align: left;

    h3 {
      color: #202128;
      margin-bottom: 12px;
      font-size: 16px;
    }

    ol {
      color: #6a6b70;
      line-height: 1.6;

      li {
        margin-bottom: 6px;
      }
    }

    code {
      background: #e6e6e7;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
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
    max-width: 300px;
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

  &__actions {
    display: flex;
    gap: 12px;

    @media (max-width: 768px) {
      flex-wrap: wrap;
      justify-content: center;
    }
  }

  &__loading {
    text-align: center;
    padding: 60px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);

    p {
      color: #6a6b70;
      margin-top: 16px;
    }
  }

  &__spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f0f0f0;
    border-top: 4px solid #5190ef;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }

  &__error {
    text-align: center;
    padding: 40px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  // Rest of the styles similar to ProductsManager but with data-table prefix
  &__table-container {
    background: white;
    border-radius: 8px;
    overflow-x: auto; // Enable horizontal scrolling for many columns
    overflow-y: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    max-width: 100%;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    min-width: 800px; // Ensure minimum width for readability
  }

  &__header-cell {
    background: #f7f7f7;
    padding: 8px 12px; // Reduce vertical padding for more compact display
    text-align: left;
    font-weight: 600;
    font-size: 13px; // Slightly smaller font for better fit
    border-bottom: 1px solid #e6e6e7;
    min-width: 120px; // Minimum width for readability
    white-space: nowrap; // Prevent header text wrapping

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
    padding: 8px 12px; // Compact padding
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px; // Smaller font for better fit
    min-width: 120px; // Minimum width for readability
    max-width: 200px; // Maximum width to prevent excessive stretching
    word-wrap: break-word; // Allow long text to wrap
    overflow: hidden; // Hide overflow
    text-overflow: ellipsis; // Show ellipsis for long text

    &--actions {
      text-align: center;
    }
  }

  &__row-actions {
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

  &__page-selection {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__page-label {
    font-size: 14px;
    color: #6a6b70;
  }

  &__page-select {
    padding: 4px 8px;
    border: 1px solid #e6e6e7;
    border-radius: 4px;
    background: white;
    font-size: 14px;
    color: #202128;
    min-width: 60px;

    &:focus {
      outline: none;
      border-color: #5190ef;
      box-shadow: 0 0 0 2px rgba(81, 144, 239, 0.1);
    }
  }

  &__form {
    padding: 0;
  }

  &__form-group {
    margin-bottom: 20px;
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

    &.info {
      background: #5190ef;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>