<template>
  <div class="products-table">
    <!-- Search and Filter Controls -->
    <div class="products-table__controls">
      <div class="products-table__search">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search products..."
          class="products-table__search-input"
          @input="onSearchInput"
        >
        <i class="iconoir-search products-table__search-icon" />
      </div>
      
      <div class="products-table__actions">
        <Button
          type="primary"
          size="small"
          icon="iconoir-plus"
          @click="onAddProduct"
        >
          Add Product
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="products-table__loading">
      <div class="loading-spinner"></div>
      <p>Loading products...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="products-table__error">
      <Alert type="error">
        {{ error }}
      </Alert>
    </div>

    <!-- Table -->
    <div v-else class="products-table__container">
      <table class="products-table__table">
        <thead>
          <tr>
            <th
              v-for="field in tableFields"
              :key="field.id"
              class="products-table__header"
              :class="{ 'products-table__header--sortable': isSortable(field) }"
              @click="onSort(field)"
            >
              <div class="products-table__header-content">
                <span>{{ field.name }}</span>
                <i
                  v-if="isSortable(field)"
                  class="products-table__sort-icon"
                  :class="getSortIconClass(field)"
                />
              </div>
            </th>
            <th class="products-table__header products-table__header--actions">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            class="products-table__row"
            :class="{ 'products-table__row--editing': isEditing(row.id) }"
          >
            <td
              v-for="field in tableFields"
              :key="`${row.id}-${field.id}`"
              class="products-table__cell"
            >
              <ProductsCell
                :field="field"
                :row="row"
                :editing="isEditing(row.id)"
                @update="onUpdateCell"
              />
            </td>
            <td class="products-table__cell products-table__cell--actions">
              <div class="products-table__row-actions">
                <ButtonIcon
                  v-if="!isEditing(row.id)"
                  icon="iconoir-edit-pencil"
                  size="small"
                  @click="onEditRow(row.id)"
                />
                <template v-else>
                  <ButtonIcon
                    icon="iconoir-check"
                    type="primary"
                    size="small"
                    @click="onSaveRow(row.id)"
                  />
                  <ButtonIcon
                    icon="iconoir-cancel"
                    type="secondary"
                    size="small"
                    @click="onCancelEdit(row.id)"
                  />
                </template>
                <ButtonIcon
                  icon="iconoir-trash"
                  type="danger"
                  size="small"
                  @click="onDeleteRow(row.id)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalCount > pageSize" class="products-table__pagination">
        <Button
          :disabled="currentPage <= 1"
          size="small"
          type="secondary"
          @click="onPreviousPage"
        >
          Previous
        </Button>
        
        <span class="products-table__page-info">
          Page {{ currentPage }} of {{ totalPages }}
          ({{ totalCount }} total items)
        </span>

        <Button
          :disabled="currentPage >= totalPages"
          size="small"
          type="secondary"
          @click="onNextPage"
        >
          Next
        </Button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import Button from '@baserow/modules/core/components/Button'
import ButtonIcon from '@baserow/modules/core/components/ButtonIcon'
import Alert from '@baserow/modules/core/components/Alert'
import ProductsCell from './ProductsCell'

export default {
  name: 'ProductsTable',
  components: {
    Button,
    ButtonIcon,
    Alert,
    ProductsCell,
  },
  props: {
    tableId: {
      type: [String, Number],
      required: true,
    },
  },
  data() {
    return {
      searchQuery: '',
      searchTimeout: null,
    }
  },
  computed: {
    ...mapState('products', [
      'loading',
      'error',
      'totalCount',
      'currentPage',
      'pageSize',
      'sortField',
      'sortOrder',
      'table',
    ]),
    ...mapGetters('products', [
      'getRows',
      'isEditing',
    ]),
    rows() {
      return this.getRows
    },
    tableFields() {
      return this.table?.fields || []
    },
    totalPages() {
      return Math.ceil(this.totalCount / this.pageSize)
    },
  },
  async created() {
    await this.initializeTable()
  },
  methods: {
    ...mapActions('products', [
      'fetchRows',
      'fetchTable',
      'updateRow',
      'deleteRow',
      'createRow',
      'setSearch',
      'setSort',
      'setPage',
      'startEditing',
      'stopEditing',
    ]),
    
    async initializeTable() {
      try {
        await this.fetchTable(this.tableId)
        await this.fetchRows({ tableId: this.tableId, page: 1 })
      } catch (error) {
        console.error('Failed to initialize table:', error)
      }
    },

    onSearchInput() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.setSearch({ query: this.searchQuery, tableId: this.tableId })
      }, 500)
    },

    onSort(field) {
      if (!this.isSortable(field)) return
      
      const newOrder = this.sortField === field.name && this.sortOrder === 'asc' ? 'desc' : 'asc'
      this.setSort({ field: field.name, order: newOrder, tableId: this.tableId })
    },

    onEditRow(rowId) {
      this.startEditing(rowId)
    },

    onSaveRow(rowId) {
      this.stopEditing()
    },

    onCancelEdit(rowId) {
      this.stopEditing()
    },

    async onUpdateCell({ field, row, value }) {
      try {
        const data = { [field.name]: value }
        await this.updateRow({ tableId: this.tableId, rowId: row.id, data })
      } catch (error) {
        console.error('Failed to update cell:', error)
      }
    },

    async onDeleteRow(rowId) {
      if (confirm('Are you sure you want to delete this product?')) {
        try {
          await this.deleteRow({ tableId: this.tableId, rowId })
        } catch (error) {
          console.error('Failed to delete row:', error)
        }
      }
    },

    onAddProduct() {
      // This would open a modal or redirect to a create form
      this.$emit('add-product')
    },

    onPreviousPage() {
      if (this.currentPage > 1) {
        this.setPage({ page: this.currentPage - 1, tableId: this.tableId })
      }
    },

    onNextPage() {
      if (this.currentPage < this.totalPages) {
        this.setPage({ page: this.currentPage + 1, tableId: this.tableId })
      }
    },

    isSortable(field) {
      // Most field types are sortable, some exceptions might apply
      return !['file', 'multiple_collaborators'].includes(field.type)
    },

    getSortIconClass(field) {
      if (this.sortField !== field.name) {
        return 'iconoir-sort'
      }
      return this.sortOrder === 'asc' ? 'iconoir-sort-up' : 'iconoir-sort-down'
    },
  },
}
</script>

<style lang="scss" scoped>
.products-table {
  padding: 20px;

  &__controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 16px;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  &__search {
    position: relative;
    max-width: 400px;
    flex: 1;

    @media (max-width: 768px) {
      max-width: none;
    }
  }

  &__search-input {
    width: 100%;
    padding: 8px 12px 8px 40px;
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
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9c9c9f;
    font-size: 16px;
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #6a6b70;
  }

  &__error {
    margin-bottom: 20px;
  }

  &__container {
    border: 1px solid #e6e6e7;
    border-radius: 8px;
    overflow: hidden;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    background: white;
  }

  &__header {
    background: #f7f7f7;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    border-bottom: 1px solid #e6e6e7;

    &--sortable {
      cursor: pointer;

      &:hover {
        background: #f0f0f0;
      }
    }

    &--actions {
      width: 120px;
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
    vertical-align: top;

    &--actions {
      text-align: center;
    }
  }

  &__row-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: #fafafa;
    border-top: 1px solid #e6e6e7;
    gap: 16px;
  }

  &__page-info {
    font-size: 14px;
    color: #6a6b70;
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #5190ef;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>