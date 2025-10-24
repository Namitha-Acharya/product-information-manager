<template>
  <div class="product-management">
    <!-- Header with Product Management Title -->
    <div class="page-header">
      <h1 class="page-title">Product Management</h1>
    </div>

    <div class="layout-container">
      <!-- Category Tree Sidebar -->
      <CategoryTree @category-filter-changed="onCategoryFilterChanged" />

      <!-- Main Content Area -->
      <div class="main-content">
        <div class="header">
          <!-- Toolbar with View Controls -->
          <div class="toolbar">
            <div class="toolbar-left">
              <button class="toolbar-btn" @click="toggleFilters" :class="{ active: showFilters }" title="Filter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
                <span>Filter</span>
              </button>
              <button class="toolbar-btn" @click="refreshData" :disabled="loading" title="Refresh data from API">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
                <span>{{ loading ? 'Loading...' : 'Refresh' }}</span>
              </button>
            </div>

            <div class="toolbar-right">
              <div class="search-container">
                <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  v-model="searchTerm"
                  type="text"
                  placeholder="Search..."
                  class="search-input"
                  @input="onSearchChange"
                >
              </div>
              <button @click="showAddModal = true" class="btn-add">➕ Add New Product</button>
            </div>
          </div>

          <!-- Filters Panel (shown when filter button is active) -->
          <div v-if="showFilters" class="filters-panel">
            <div class="filter-group">
              <label class="filter-label">Brand</label>
              <select v-model="selectedBrand" @change="applyFilters" class="filter-select">
                <option value="">All Brands</option>
                <option v-for="brand in availableBrands" :key="brand" :value="brand">
                  {{ brand }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Type</label>
              <select v-model="selectedType" @change="applyFilters" class="filter-select">
                <option value="">All Types</option>
                <option v-for="type in availableTypes" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>

            <button @click="clearFilters" class="btn-clear-filters">Clear all filters</button>
          </div>
    </div>

    <!-- Tabs Navigation -->
    <div v-if="!loading || products.length > 0" class="tabs-container">
      <div class="tabs-header">
        <button
          @click="activeTab = 'overview'"
          :class="['tab-button', { active: activeTab === 'overview' }]">
          Overview
        </button>
        <!-- Future tabs can be added here -->
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="tab-pane">
          <!-- Products Table -->
          <div v-if="products.length > 0" class="table-wrapper">
      <div class="table-container">
        <table class="products-table">
          <thead>
            <tr>
              <th class="actions-col">Actions</th>
              <th v-for="(field, index) in visibleFields"
                  :key="index"
                  :title="`field_${field.id}`"
                  class="sortable-header"
                  @click="sortBy(`field_${field.id}`)">
                {{ formatFieldName(field.name) }}
                <span v-if="sortField === `field_${field.id}`" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
            </tr>
            <!-- Column Filters Row -->
            <tr class="filter-row">
              <th class="actions-col"></th>
              <th v-for="(field, index) in visibleFields" :key="`filter-${index}`">
                <input
                  v-model="columnFilters[`field_${field.id}`]"
                  type="text"
                  :placeholder="`Filter ${formatFieldName(field.name)}...`"
                  class="column-filter-input"
                  @input="applyColumnFilters"
                  @click.stop
                >
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(product, productIndex) in paginatedProducts"
                :key="product.id || productIndex"
                :class="{ editing: editingProductId === product.id, 'clickable-row': editingProductId !== product.id }"
                @click="editingProductId !== product.id && showTierPrices(product)">
              <td class="actions-col" @click.stop>
                <div class="row-actions">
                  <button @click="startEditProduct(product)" class="btn-edit" title="Edit">✏️</button>
                  <button @click="confirmDelete(product)" class="btn-delete" title="Delete">🗑️</button>
                  <button v-if="editingProductId === product.id" @click="saveProduct" class="btn-save" title="Save">💾</button>
                  <button v-if="editingProductId === product.id" @click="cancelEdit" class="btn-cancel" title="Cancel">❌</button>
                </div>
              </td>
              <td v-for="(field, fieldIndex) in visibleFields" :key="fieldIndex"
                  :class="{ editable: editingProductId === product.id && !isReadOnlyField(`field_${field.id}`) }"
                  @click="startCellEdit(product.id, `field_${field.id}`)">

                <!-- Editing Mode -->
                <template v-if="editingProductId === product.id && !isReadOnlyField(`field_${field.id}`)">
                  <input v-if="field.type === 'text' || field.type === 'number'"
                         v-model="editingProduct[`field_${field.id}`]"
                         :type="field.type === 'number' ? 'number' : 'text'"
                         class="field-input"
                         @keyup.enter="saveProduct"
                         @keyup.esc="cancelEdit">
                  <select v-else-if="field.type === 'single_select'"
                          v-model="editingProduct[`field_${field.id}`]"
                          class="field-select"
                          @click.stop>
                    <option value="">- Select Option -</option>
                    <template v-if="field.select_options && field.select_options.length > 0">
                      <option v-for="option in field.select_options" :key="option.id" :value="option.id">
                        {{ option.value }}
                      </option>
                    </template>
                    <template v-else>
                      <option disabled>Loading options...</option>
                    </template>
                  </select>
                  <select v-else-if="field.type === 'multiple_select'"
                          v-model="editingProduct[`field_${field.id}`]"
                          class="field-select"
                          multiple
                          @click.stop>
                    <template v-if="field.select_options && field.select_options.length > 0">
                      <option v-for="option in field.select_options" :key="option.id" :value="option.id">
                        {{ option.value }}
                      </option>
                    </template>
                    <template v-else>
                      <option disabled>Loading options...</option>
                    </template>
                  </select>
                  <textarea v-else-if="field.type === 'long_text'"
                            v-model="editingProduct[`field_${field.id}`]"
                            class="field-textarea"
                            @click.stop
                            @keyup.enter="saveProduct"
                            @keyup.esc="cancelEdit"></textarea>
                  <input v-else
                         v-model="editingProduct[`field_${field.id}`]"
                         type="text"
                         class="field-input"
                         @click.stop
                         @keyup.enter="saveProduct"
                         @keyup.esc="cancelEdit">
                </template>

                <!-- Display Mode -->
                <template v-else>
                  <!-- Handle file/image fields -->
                  <img v-if="(field.name.toLowerCase() === 'image' || field.type === 'file') && getImageUrl(product[`field_${field.id}`])"
                       :src="getImageUrl(product[`field_${field.id}`])"
                       alt="Product Image"
                       class="product-image"
                       @error="$event.target.style.display='none'">
                  <span v-else-if="field.type === 'single_select' && getSelectValue(product[`field_${field.id}`])"
                        class="select-value"
                        :style="{ backgroundColor: getSelectColor(product[`field_${field.id}`]), color: 'white' }">
                    {{ getSelectValue(product[`field_${field.id}`]) }}
                  </span>
                  <div v-else-if="field.type === 'multiple_select' && product[`field_${field.id}`] && Array.isArray(product[`field_${field.id}`]) && product[`field_${field.id}`].length > 0"
                       class="multiple-select-display">
                    <span v-for="item in product[`field_${field.id}`]" :key="item.id"
                          class="select-value"
                          :style="{ backgroundColor: item.color, color: 'white' }">
                      {{ item.value }}
                    </span>
                  </div>
                  <span v-else-if="field.name === 'id'" class="id-field">{{ product.id }}</span>
                  <span v-else-if="field.type === 'boolean'" class="boolean-field">
                    {{ product[`field_${field.id}`] ? '✓' : '✗' }}
                  </span>
                  <span v-else class="field-value">{{ formatFieldValue(product[`field_${field.id}`], field) }}</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls (outside scrolling area) -->
      <div class="pagination-controls">
        <div class="pagination-info">
          Showing {{ paginationStart }} to {{ paginationEnd }} of {{ filteredProducts.length }} products
        </div>
        <div class="pagination-buttons">
          <button @click="goToPage(1)" :disabled="currentPaginationPage === 1" class="pagination-btn">First</button>
          <button @click="goToPage(currentPaginationPage - 1)" :disabled="currentPaginationPage === 1" class="pagination-btn">Previous</button>
          <span class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page)"
              :class="['pagination-btn', 'page-number', { active: page === currentPaginationPage }]">
              {{ page }}
            </button>
          </span>
          <button @click="goToPage(currentPaginationPage + 1)" :disabled="currentPaginationPage === totalPages" class="pagination-btn">Next</button>
          <button @click="goToPage(totalPages)" :disabled="currentPaginationPage === totalPages" class="pagination-btn">Last</button>
        </div>
      </div>
    </div>

          <!-- No Data State -->
          <div v-else class="state-message">
            <p>No products found.</p>
          </div>
        </div>
        <!-- End Overview Tab -->
      </div>
      <!-- End Tab Content -->
    </div>
    <!-- End Tabs Container -->

    <!-- Loading State -->
    <div v-if="loading && products.length === 0" class="state-message">
      <div class="loading-container">
        <p class="loading-text">{{ loadingMessage || 'Loading products...' }}</p>
        <div v-if="loadingProgress > 0" class="progress-bar">
          <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
        </div>
        <p v-if="loadingProgress > 0" class="progress-text">{{ Math.round(loadingProgress) }}%</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="state-message error">
      <p>{{ error }}</p>
      <button @click="loadData">Retry</button>
    </div>
      </div> <!-- Close main-content -->
    </div> <!-- Close layout-container -->

    <!-- Add Product Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Add New Product</h2>
          <button @click="closeAddModal" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="add-product-form">
            <!-- Website & Product Type Section -->
            <div class="form-section">
              <h3 class="section-title">Website & Product Type</h3>
              <div class="form-row-3col">
                <div class="form-field">
                  <label class="required-label">Website</label>
                  <select v-model="newProduct.website" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Offineeds">Offineeds</option>
                    <option value="TCGS">TCGS</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="required-label">Product Type</label>
                  <select v-model="newProduct.productType" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Simple">Simple</option>
                    <option value="Configurable">Configurable</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Bundle">Bundle</option>
                  </select>
                </div>
                <div class="form-field"></div>
              </div>
            </div>

            <!-- SKU Details Section -->
            <div class="form-section">
              <h3 class="section-title">SKU Details</h3>
              <div class="form-row-3col">
                <div class="form-field">
                  <label class="required-label">Final SKU Code</label>
                  <input v-model="newProduct.finalSkuCode" type="text" class="form-input">
                </div>
                <div class="form-field">
                  <label>Standard Code</label>
                  <input v-model="newProduct.standardCode" type="text" class="form-input">
                </div>
                <div class="form-field">
                  <label>Product Code</label>
                  <input v-model="newProduct.productCode" type="text" class="form-input">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Category</label>
                  <input v-model="newProduct.category" type="text" class="form-input">
                </div>
                <div class="form-field">
                  <label>Sub Category</label>
                  <input v-model="newProduct.subCategory" type="text" class="form-input">
                </div>
                <div class="form-field">
                  <label>Category Code</label>
                  <input v-model="newProduct.categoryCode" type="text" class="form-input">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Product Name</label>
                  <input v-model="newProduct.productName" type="text" class="form-input">
                </div>
                <div class="form-field">
                  <label class="required-label">Color Name</label>
                  <select v-model="newProduct.colorName" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Red">Red</option>
                    <option value="Blue">Blue</option>
                    <option value="Green">Green</option>
                    <option value="Black">Black</option>
                    <option value="White">White</option>
                    <option value="Yellow">Yellow</option>
                    <option value="Orange">Orange</option>
                    <option value="Purple">Purple</option>
                    <option value="Pink">Pink</option>
                    <option value="Brown">Brown</option>
                    <option value="Grey">Grey</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Multi Color">Multi Color</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Color Code</label>
                  <input v-model="newProduct.colorCode" type="text" class="form-input">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>SKU Code With Color</label>
                  <input v-model="newProduct.skuCodeWithColor" type="text" class="form-input">
                </div>
                <div class="form-field"></div>
                <div class="form-field"></div>
              </div>
            </div>

            <!-- Vendor Details Section -->
            <div class="form-section">
              <h3 class="section-title">Vendor Details</h3>
              <div class="form-row-3col">
                <div class="form-field">
                  <label class="required-label">Brand Name</label>
                  <select v-model="newProduct.brandName" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Generic">Generic</option>
                    <option value="Premium Brand">Premium Brand</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="required-label">Vendor Name</label>
                  <select v-model="newProduct.vendorName" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Vendor A">Vendor A</option>
                    <option value="Vendor B">Vendor B</option>
                    <option value="Vendor C">Vendor C</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Vendor Code</label>
                  <input v-model="newProduct.vendorCode" type="text" class="form-input">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Vendor Location</label>
                  <input v-model="newProduct.vendorLocation" type="text" class="form-input">
                </div>
                <div class="form-field">
                  <label>Brand Logic</label>
                  <input v-model="newProduct.brandLogic" type="text" class="form-input">
                </div>
                <div class="form-field">
                  <label>Vendor Logic</label>
                  <input v-model="newProduct.vendorLogic" type="text" class="form-input">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Vendor Timeline</label>
                  <input v-model="newProduct.vendorTimeline" type="text" class="form-input">
                </div>
                <div class="form-field">
                  <label>Stock Availability</label>
                  <select v-model="newProduct.stockAvailability" class="form-select">
                    <option value="">-Select-</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Made to Order">Made to Order</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Contact Person Name</label>
                  <input v-model="newProduct.contactPersonName" type="text" class="form-input">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Email ID</label>
                  <input v-model="newProduct.emailId" type="email" class="form-input">
                </div>
                <div class="form-field">
                  <label>Vendor GST Number</label>
                  <input v-model="newProduct.vendorGstNumber" type="text" class="form-input">
                </div>
                <div class="form-field">
                  <label>Vendor Address</label>
                  <input v-model="newProduct.vendorAddress" type="text" class="form-input">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Dispatch Timeline</label>
                  <input v-model="newProduct.dispatchTimeline" type="text" class="form-input">
                </div>
                <div class="form-field">
                  <label>Size Chart</label>
                  <input v-model="newProduct.sizeChart" type="text" class="form-input">
                </div>
                <div class="form-field"></div>
              </div>
            </div>

            <!-- Website Pricing Section -->
            <div class="form-section">
              <h3 class="section-title">Website Pricing</h3>
              <div class="form-row-3col">
                <div class="form-field">
                  <label class="required-label">Pricing Category</label>
                  <select v-model="newProduct.pricingCategory" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Premium">Premium</option>
                    <option value="Standard">Standard</option>
                    <option value="Economy">Economy</option>
                    <option value="Budget">Budget</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Product Types</label>
                  <input v-model="newProduct.productTypes" type="text" class="form-input">
                </div>
                <div class="form-field">
                  <label>Buying Price</label>
                  <input v-model="newProduct.buyingPrice" type="number" class="form-input" step="0.01">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Margin SLB</label>
                  <input v-model="newProduct.marginSlb" type="number" class="form-input" step="0.01">
                </div>
                <div class="form-field">
                  <label>MRP</label>
                  <input v-model="newProduct.mrp" type="number" class="form-input" step="0.01">
                </div>
                <div class="form-field">
                  <label>GST (%)</label>
                  <input v-model="newProduct.gst" type="number" class="form-input" step="0.01">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>WP</label>
                  <input v-model="newProduct.wp" type="number" class="form-input" step="0.01">
                </div>
                <div class="form-field">
                  <label>Discount</label>
                  <input v-model="newProduct.discount" type="number" class="form-input" step="0.01">
                </div>
                <div class="form-field">
                  <label>PB1</label>
                  <input v-model="newProduct.pb1" type="number" class="form-input" step="0.01">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>HSN Code</label>
                  <input v-model="newProduct.hsnCode" type="text" class="form-input">
                </div>
                <div class="form-field">
                  <label>PB2</label>
                  <input v-model="newProduct.pb2" type="number" class="form-input" step="0.01">
                </div>
                <div class="form-field">
                  <label>FP</label>
                  <input v-model="newProduct.fp" type="number" class="form-input" step="0.01">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Buy Sample Applicable</label>
                  <select v-model="newProduct.buySampleApplicable" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Sample Price</label>
                  <input v-model="newProduct.samplePrice" type="number" class="form-input" step="0.01">
                </div>
                <div class="form-field"></div>
              </div>
            </div>

            <!-- Tier Pricing Section -->
            <div class="form-section">
              <h3 class="section-title">Tier Pricing</h3>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>MOQ</label>
                  <input v-model="newProduct.moq" type="number" class="form-input">
                </div>
                <div class="form-field">
                  <label>Tier 1</label>
                  <input v-model="newProduct.tier1" type="number" class="form-input">
                </div>
                <div class="form-field">
                  <label>Price 1</label>
                  <input v-model="newProduct.price1" type="number" class="form-input" step="0.01">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Tier 2</label>
                  <input v-model="newProduct.tier2" type="number" class="form-input">
                </div>
                <div class="form-field">
                  <label>Price 2</label>
                  <input v-model="newProduct.price2" type="number" class="form-input" step="0.01">
                </div>
                <div class="form-field">
                  <label>Tier 3</label>
                  <input v-model="newProduct.tier3" type="number" class="form-input">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Price 3</label>
                  <input v-model="newProduct.price3" type="number" class="form-input" step="0.01">
                </div>
                <div class="form-field">
                  <label>Tier 4</label>
                  <input v-model="newProduct.tier4" type="number" class="form-input">
                </div>
                <div class="form-field">
                  <label>Price 4</label>
                  <input v-model="newProduct.price4" type="number" class="form-input" step="0.01">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Tier 5</label>
                  <input v-model="newProduct.tier5" type="number" class="form-input">
                </div>
                <div class="form-field">
                  <label>Price 5</label>
                  <input v-model="newProduct.price5" type="number" class="form-input" step="0.01">
                </div>
                <div class="form-field"></div>
              </div>
            </div>

            <!-- Dimension / Shipping Details Section -->
            <div class="form-section">
              <h3 class="section-title">Dimension / Shipping Details</h3>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Product Length (cm)</label>
                  <input v-model="newProduct.productLength" type="number" class="form-input" step="0.01">
                </div>
                <div class="form-field">
                  <label>Product Width (cm)</label>
                  <input v-model="newProduct.productWidth" type="number" class="form-input" step="0.01">
                </div>
                <div class="form-field">
                  <label>Product Height (cm)</label>
                  <input v-model="newProduct.productHeight" type="number" class="form-input" step="0.01">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Product Weight (kg)</label>
                  <input v-model="newProduct.productWeight" type="number" class="form-input" step="0.01">
                </div>
                <div class="form-field">
                  <label>Shipping Length (cm)</label>
                  <input v-model="newProduct.shippingLength" type="number" class="form-input" step="0.01">
                </div>
                <div class="form-field">
                  <label>Shipping Width (cm)</label>
                  <input v-model="newProduct.shippingWidth" type="number" class="form-input" step="0.01">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Shipping Height (cm)</label>
                  <input v-model="newProduct.shippingHeight" type="number" class="form-input" step="0.01">
                </div>
                <div class="form-field">
                  <label>Shipping Weight (kg)</label>
                  <input v-model="newProduct.shippingWeight" type="number" class="form-input" step="0.01">
                </div>
                <div class="form-field">
                  <label>Volumetric Weight</label>
                  <input v-model="newProduct.volumetricWeight" type="number" class="form-input" step="0.01">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Stock & Ship Availability</label>
                  <select v-model="newProduct.stockShipAvailability" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Available">Available</option>
                    <option value="Not Available">Not Available</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Brown Envelope</label>
                  <select v-model="newProduct.brownEnvelope" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Air Shipping</label>
                  <select v-model="newProduct.airShipping" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Images Section -->
            <div class="form-section">
              <h3 class="section-title">Images</h3>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Photo Shoot Available</label>
                  <select v-model="newProduct.photoShootAvailable" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Video Available</label>
                  <select v-model="newProduct.videoAvailable" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Photo Shoot Required</label>
                  <select v-model="newProduct.photoShootRequired" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>TCGS Video Availability</label>
                  <select v-model="newProduct.tcgsVideoAvailability" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Customization Images Available</label>
                  <select v-model="newProduct.customizationImagesAvailable" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Image URL</label>
                  <input v-model="newProduct.imageUrl" type="text" class="form-input">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Video URL</label>
                  <input v-model="newProduct.videoUrl" type="text" class="form-input">
                </div>
                <div class="form-field">
                  <label>File Upload</label>
                  <input type="file" class="form-input" @change="handleFileUpload">
                </div>
                <div class="form-field"></div>
              </div>
            </div>

            <!-- Buzz Customization Section -->
            <div class="form-section">
              <h3 class="section-title">Buzz Customization</h3>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Customisation Options</label>
                  <input v-model="newProduct.customisationOptions" type="text" class="form-input">
                </div>
                <div class="form-field">
                  <label>No Of Printable Sides</label>
                  <input v-model="newProduct.noOfPrintableSides" type="number" class="form-input">
                </div>
                <div class="form-field">
                  <label>Printable Area</label>
                  <input v-model="newProduct.printableArea" type="text" class="form-input">
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label>Own Box</label>
                  <select v-model="newProduct.ownBox" class="form-select">
                    <option value="">-Select-</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Country of Origin</label>
                  <input v-model="newProduct.countryOfOrigin" type="text" class="form-input">
                </div>
                <div class="form-field">
                  <label class="required-label">Status</label>
                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input v-model="newProduct.statusActive" type="checkbox" class="form-checkbox">
                      Active
                    </label>
                    <label class="checkbox-label">
                      <input v-model="newProduct.statusInactive" type="checkbox" class="form-checkbox">
                      Inactive
                    </label>
                  </div>
                </div>
              </div>
              <div class="form-row-3col">
                <div class="form-field">
                  <label class="required-label">Customization Part</label>
                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input v-model="newProduct.customizationAvailable" type="checkbox" class="form-checkbox">
                      Available
                    </label>
                    <label class="checkbox-label">
                      <input v-model="newProduct.customizationNotAvailable" type="checkbox" class="form-checkbox">
                      Not Available
                    </label>
                  </div>
                </div>
                <div class="form-field"></div>
                <div class="form-field"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="createProduct" class="btn-create" :disabled="creating">
            {{ creating ? 'Creating...' : 'Create Product' }}
          </button>
          <button @click="closeAddModal" class="btn-cancel">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Tier Price Modal -->
    <TierPriceModal
      :show="showTierPriceModal"
      :product-id="selectedProductForTierPrice"
      :product-sku="selectedProductSku"
      @close="showTierPriceModal = false"
    />
  </div>
</template>

<script>
import CategoryTree from './CategoryTree'
import TierPriceModal from './TierPriceModal'

export default {
  name: 'ProductManagementTable',
  components: {
    CategoryTree,
    TierPriceModal,
  },
  data() {
    return {
      // API Configuration - using cache API for instant loading
      apiBaseUrl: 'http://localhost:3002/api',
      products: [],
      tableFields: [],
      loading: true,
      error: null,
      currentPage: 1,
      pageSize: 50,
      totalCount: 0,
      hasMore: false,
      editingProductId: null,
      editingProduct: {},
      showAddModal: false,
      newProduct: {},
      creating: false,
      selectedCategory: null,
      // Search and filter properties
      searchTerm: '',
      selectedBrand: '',
      selectedType: '',
      sortField: '',
      sortDirection: 'asc',
      showFilters: false,
      showSortMenu: false,
      // Pagination for filtered results
      currentPaginationPage: 1,
      paginationPageSize: 50,
      // Loading progress
      loadingProgress: 0,
      loadingMessage: '',
      // Tabs
      activeTab: 'overview',
      // Column filters
      columnFilters: {},
      // Tier Price Modal
      showTierPriceModal: false,
      selectedProductForTierPrice: null,
      selectedProductSku: ''
    }
  },
  
  computed: {
    visibleFields() {
      // Define the specific fields in the exact order from the images
      const fieldOrder = [
        'id', 'image', 'sku', 'name', 'vendor_code', 'brands', 'mgs_brand',
        'color', 'hidden_from_category', 'type', 'attribute_set_id', 'price',
        'visibility', 'website_ids', 'delivery_timeline', 'offineeds_delivery_timeline',
        'usual_delivery_times', 'dimensions', 'special_features', 'customisation',
        'material', 'kit_height', 'kit_lenght', 'kit_width'
      ]
      
      const filteredFields = this.tableFields.filter(field => {
        const fieldNameLower = field.name.toLowerCase()
        const fieldNameOriginal = field.name
        
        // Check exact matches and variations
        return fieldOrder.includes(fieldNameLower) || 
               fieldOrder.includes(fieldNameOriginal) ||
               fieldOrder.includes(fieldNameLower.replace(/\s+/g, '_')) ||
               fieldOrder.includes(fieldNameOriginal.replace(/\s+/g, '_'))
      })
      
      // Sort fields according to the specified order
      const sortedFields = filteredFields.sort((a, b) => {
        const aIndex = fieldOrder.findIndex(name => 
          name === a.name.toLowerCase() || name === a.name
        )
        const bIndex = fieldOrder.findIndex(name => 
          name === b.name.toLowerCase() || name === b.name
        )
        return aIndex - bIndex
      })
      
      // Debug the visible fields to ensure select_options are preserved
      // Debug the visible fields to ensure select_options are preserved
      console.log('🔍 Total visible fields found:', sortedFields.length)
      console.log('🔍 Visible fields with select options:', sortedFields.filter(f => f.type === 'single_select' || f.type === 'multiple_select').map(f => ({
        name: f.name,
        type: f.type,
        hasOptions: !!(f.select_options && f.select_options.length > 0),
        optionsCount: f.select_options ? f.select_options.length : 0,
        firstOptions: f.select_options ? f.select_options.slice(0, 3).map(o => o.value) : []
      })))
      console.log('🔍 Field names in visible fields:', sortedFields.map(f => f.name))
      
      return sortedFields
    },
    editableFields() {
      return this.visibleFields.filter(field => !this.isReadOnlyField(`field_${field.id}`))
    },
    
    filteredProducts() {
      let filtered = [...this.products]

      // Apply search filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase()
        filtered = filtered.filter(product => {
          return this.visibleFields.some(field => {
            const fieldKey = `field_${field.id}`
            const value = product[fieldKey]
            if (value) {
              return String(value).toLowerCase().includes(searchLower)
            }
            return false
          })
        })
      }

      // Apply column filters
      Object.keys(this.columnFilters).forEach(fieldKey => {
        const filterValue = this.columnFilters[fieldKey]
        if (filterValue && filterValue.trim()) {
          const filterLower = filterValue.toLowerCase().trim()
          filtered = filtered.filter(product => {
            const value = product[fieldKey]
            if (!value) return false

            // Handle single_select object format {id, value, color}
            if (typeof value === 'object' && !Array.isArray(value) && value.value) {
              return String(value.value).toLowerCase().includes(filterLower)
            }
            // Handle multiple_select array format
            if (Array.isArray(value)) {
              return value.some(item => {
                if (item && item.value) {
                  return String(item.value).toLowerCase().includes(filterLower)
                }
                return String(item).toLowerCase().includes(filterLower)
              })
            }
            // Handle text/number values
            return String(value).toLowerCase().includes(filterLower)
          })
        }
      })

      // Apply brand filter
      if (this.selectedBrand) {
        filtered = filtered.filter(product => {
          const brandsField = this.getBrandField()
          if (brandsField) {
            const brandValue = product[`field_${brandsField.id}`]
            if (!brandValue) return false

            // Handle single_select object format {id, value, color}
            if (typeof brandValue === 'object' && brandValue.value) {
              return brandValue.value.toLowerCase() === this.selectedBrand.toLowerCase()
            }
            // Handle array format (multiple_select or legacy)
            if (Array.isArray(brandValue) && brandValue.length > 0) {
              return brandValue.some(item =>
                item.value && item.value.toLowerCase() === this.selectedBrand.toLowerCase()
              )
            }
            // Handle text values
            return String(brandValue).toLowerCase() === this.selectedBrand.toLowerCase()
          }
          return false
        })
      }

      // Apply type filter
      if (this.selectedType) {
        filtered = filtered.filter(product => {
          const typeField = this.getTypeField()
          if (typeField) {
            const typeValue = product[`field_${typeField.id}`]
            return typeValue && String(typeValue).toLowerCase().includes(this.selectedType.toLowerCase())
          }
          return false
        })
      }
      
      // Apply sorting
      if (this.sortField) {
        filtered.sort((a, b) => {
          const aValue = a[this.sortField] || ''
          const bValue = b[this.sortField] || ''
          
          // Handle numeric values
          const aNum = parseFloat(aValue)
          const bNum = parseFloat(bValue)
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return this.sortDirection === 'asc' ? aNum - bNum : bNum - aNum
          }
          
          // Handle string values
          const aStr = String(aValue).toLowerCase()
          const bStr = String(bValue).toLowerCase()
          if (this.sortDirection === 'asc') {
            return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
          } else {
            return aStr > bStr ? -1 : aStr < bStr ? 1 : 0
          }
        })
      }
      
      return filtered
    },
    
    availableBrands() {
      const brandsField = this.getBrandField()
      if (!brandsField) return []
      
      const brands = new Set()
      this.products.forEach(product => {
        const brandValue = product[`field_${brandsField.id}`]
        if (brandValue && String(brandValue).trim()) {
          brands.add(String(brandValue).trim())
        }
      })
      return Array.from(brands).sort()
    },
    
    availableTypes() {
      const typeField = this.getTypeField()
      if (!typeField) return []

      const types = new Set()
      this.products.forEach(product => {
        const typeValue = product[`field_${typeField.id}`]
        if (typeValue && String(typeValue).trim()) {
          types.add(String(typeValue).trim())
        }
      })
      return Array.from(types).sort()
    },

    // Pagination computed properties
    paginatedProducts() {
      const start = (this.currentPaginationPage - 1) * this.paginationPageSize
      const end = start + this.paginationPageSize
      return this.filteredProducts.slice(start, end)
    },

    totalPages() {
      return Math.ceil(this.filteredProducts.length / this.paginationPageSize)
    },

    paginationStart() {
      if (this.filteredProducts.length === 0) return 0
      return (this.currentPaginationPage - 1) * this.paginationPageSize + 1
    },

    paginationEnd() {
      const end = this.currentPaginationPage * this.paginationPageSize
      return Math.min(end, this.filteredProducts.length)
    },

    visiblePages() {
      const pages = []
      const maxVisible = 5
      let start = Math.max(1, this.currentPaginationPage - 2)
      let end = Math.min(this.totalPages, start + maxVisible - 1)

      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1)
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      return pages
    }
  },
  
  watch: {
    searchTerm() {
      this.currentPaginationPage = 1
    },
    selectedBrand() {
      this.currentPaginationPage = 1
    },
    selectedType() {
      this.currentPaginationPage = 1
    }
  },

  async mounted() {
    console.log('🚀 ProductManagementTable MOUNTED')
    await this.loadFields()
    await this.loadData()
  },
  
  methods: {
    onCategoryFilterChanged(category) {
      console.log(`🏷️ Category filter changed:`, category ? `"${category.name}" (ID: ${category.id})` : 'null')
      this.selectedCategory = category
      this.currentPage = 1
      this.products = []
      this.loadData()
    },
    
    async loadFields() {
      try {
        const response = await fetch(`${this.apiBaseUrl}/fields`, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to load fields: ${response.status}`)
        }

        const data = await response.json()
        this.tableFields = data.fields || data
        console.log(`✅ Loaded ${this.tableFields.length} fields from cache API:`, this.tableFields.slice(0, 5).map(f => f.name))
        
        // Debug select fields
        const selectFields = this.tableFields.filter(f => f.type === 'single_select' || f.type === 'multiple_select')
        console.log('🔍 Select fields with options:', selectFields.map(f => ({
          name: f.name,
          type: f.type,
          optionsCount: f.select_options ? f.select_options.length : 0,
          hasOptions: !!(f.select_options && f.select_options.length > 0)
        })))
        
      } catch (err) {
        console.error('❌ Error loading fields:', err)
        this.error = `Failed to load table fields: ${err.message}`
      }
    },
    
    async loadData(forceRefresh = false) {
      this.loading = true
      this.error = null
      this.loadingMessage = 'Loading products...'
      this.loadingProgress = 0

      try {
        // Build the URL with optional category filter
        let url = `${this.apiBaseUrl}/products`
        if (this.selectedCategory) {
          url += `?category=${this.selectedCategory.id}`
          console.log(`🔄 Loading products for category "${this.selectedCategory.name}" from cache API`)
        } else {
          console.log(`🔄 Loading all products from cache API`)
        }

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        this.products = data.results || []
        this.totalCount = data.count || this.products.length
        this.currentPaginationPage = 1

        console.log(`✅ Loaded ${this.products.length} products instantly from cache API (cached: ${data.cached}, last updated: ${data.lastUpdated})`)

      } catch (err) {
        this.error = `Failed to load products: ${err.message}`
        console.error('❌ Error loading products:', err)
      } finally {
        this.loading = false
        this.loadingProgress = 0
        this.loadingMessage = ''
      }
    },

    
    
    formatFieldName(fieldName) {
      // Handle special cases first
      const specialCases = {
        'id': 'ID',
        'sku': 'SKU',
        'mgs_brand': 'Brand (Manufacturer)',
        'brands': 'Brand',
        'attribute_set_id': 'Attribute Set',
        'website_ids': 'Websites',
        'delivery_timeline': 'Dispatch Timeline (Delivery Timeline)',
        'offineeds_delivery_timeline': 'Dispatch Timeline (Offineeds Delivery Timeline)',
        'usual_delivery_times': 'Dispatch Timeline (Usual Delivery Times)',
        'special_features': 'Special Features',
        'hidden_from_category': 'Hidden From Category',
        'kit_height': 'Kit Height',
        'kit_lenght': 'Kit Length',
        'kit_width': 'Kit Width',
        'product_visibility': 'Product Visibility'
      }
      
      if (specialCases[fieldName.toLowerCase()]) {
        return specialCases[fieldName.toLowerCase()]
      }
      
      // Default formatting: replace underscores with spaces and capitalize each word
      return fieldName
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    },
    
    getFieldDisplayName(fieldName) {
      return fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    },
    
    isReadOnlyField(fieldName) {
      return fieldName === 'field_6898' || fieldName === 'id' || fieldName === 'order'
    },
    
    formatFieldValue(value, field = null) {
      if (value === null || value === undefined || value === '') return '-'
      
      // Handle select fields properly
      if (field && field.type === 'single_select') {
        // New format: object with {id, value, color}
        if (value && typeof value === 'object' && value.value) {
          return value.value
        }
        // Legacy format: array with objects
        if (Array.isArray(value) && value.length > 0) {
          return value[0].value
        }
        return '-'
      }
      
      if (field && field.type === 'multiple_select') {
        if (Array.isArray(value) && value.length > 0) {
          return value.map(item => item.value).join(', ')
        }
        return '-'
      }
      
      // Handle other object types (but not select fields)
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Don't stringify select field objects that we couldn't handle above
        if (field && (field.type === 'single_select' || field.type === 'multiple_select')) {
          return '-'
        }
        return JSON.stringify(value)
      }
      
      return String(value)
    },
    
    getSelectValue(selectField) {
      // Handle single select object format {id, value, color}
      if (selectField && typeof selectField === 'object' && selectField.value) {
        return selectField.value
      }
      // Handle array format (for multiple select or legacy format)
      if (Array.isArray(selectField) && selectField.length > 0) {
        return selectField[0].value
      }
      return null
    },
    
    getSelectColor(selectField) {
      // Handle single select object format {id, value, color}
      if (selectField && typeof selectField === 'object' && selectField.color) {
        return selectField.color
      }
      // Handle array format (for multiple select or legacy format)
      if (Array.isArray(selectField) && selectField.length > 0) {
        return selectField[0].color || '#666'
      }
      return '#666'
    },
    
    formatSelectDisplay(fieldValue, field) {
      // Handle single select fields
      if (field.type === 'single_select') {
        if (Array.isArray(fieldValue) && fieldValue.length > 0) {
          return fieldValue[0].value
        }
        return '-'
      }

      // Handle multiple select fields
      if (field.type === 'multiple_select') {
        if (Array.isArray(fieldValue) && fieldValue.length > 0) {
          return fieldValue.map(item => item.value).join(', ')
        }
        return '-'
      }

      return fieldValue
    },

    getImageUrl(fileField) {
      // Handle Baserow file field format
      // File fields can be: array of file objects, single file object, or URL string
      if (!fileField) return null

      // If it's already a URL string
      if (typeof fileField === 'string') {
        return fileField
      }

      // If it's an array of file objects, get the first one
      if (Array.isArray(fileField) && fileField.length > 0) {
        const file = fileField[0]
        return file.url || file.thumbnails?.tiny?.url || file.thumbnails?.small?.url || null
      }

      // If it's a single file object
      if (typeof fileField === 'object' && fileField.url) {
        return fileField.url || fileField.thumbnails?.tiny?.url || fileField.thumbnails?.small?.url || null
      }

      return null
    },
    
    startEditProduct(product) {
      this.editingProductId = product.id
      this.editingProduct = { ...product }
      
      console.log('👷 Starting edit for product:', product.id)
      console.log('🔍 Available fields for editing:', this.visibleFields.map(f => ({
        name: f.name,
        type: f.type,
        hasOptions: !!(f.select_options && f.select_options.length > 0),
        optionsCount: f.select_options ? f.select_options.length : 0
      })))
      
      // Convert select fields to their IDs for editing
      this.visibleFields.forEach(field => {
        if (field.type === 'single_select') {
          const fieldValue = product[`field_${field.id}`]
          // Handle new object format {id, value, color}
          if (fieldValue && typeof fieldValue === 'object' && fieldValue.id) {
            this.editingProduct[`field_${field.id}`] = fieldValue.id
          }
          // Handle legacy array format
          else if (Array.isArray(fieldValue) && fieldValue.length > 0) {
            this.editingProduct[`field_${field.id}`] = fieldValue[0].id
          } else {
            this.editingProduct[`field_${field.id}`] = ''
          }
        } else if (field.type === 'multiple_select') {
          const fieldValue = product[`field_${field.id}`]
          if (Array.isArray(fieldValue)) {
            this.editingProduct[`field_${field.id}`] = fieldValue.map(item => item.id)
          } else {
            this.editingProduct[`field_${field.id}`] = []
          }
        }
      })
    },
    
    startCellEdit(productId, fieldName) {
      if (this.editingProductId !== productId || this.isReadOnlyField(fieldName)) return
      
      this.$nextTick(() => {
        const input = document.querySelector(`tr:nth-child(${this.products.findIndex(p => p.id === productId) + 1}) .field-input, .field-select, .field-textarea`)
        if (input) input.focus()
      })
    },
    
    cancelEdit() {
      this.editingProductId = null
      this.editingProduct = {}
    },
    
    async saveProduct() {
      if (!this.editingProductId) return

      try {
        // Prepare payload with proper field conversion for select fields
        const updatePayload = { ...this.editingProduct }

        // Only include fields that have actually changed or are being edited
        const changedFields = {}

        this.visibleFields.forEach(field => {
          const fieldKey = `field_${field.id}`
          if (updatePayload[fieldKey] !== undefined && updatePayload[fieldKey] !== null) {
            if (field.type === 'single_select') {
              if (updatePayload[fieldKey] === '' || updatePayload[fieldKey] === null) {
                changedFields[fieldKey] = null
              } else {
                changedFields[fieldKey] = parseInt(updatePayload[fieldKey])
              }
            } else if (field.type === 'multiple_select') {
              if (Array.isArray(updatePayload[fieldKey])) {
                changedFields[fieldKey] = updatePayload[fieldKey].map(id => parseInt(id))
              } else if (updatePayload[fieldKey]) {
                changedFields[fieldKey] = [parseInt(updatePayload[fieldKey])]
              } else {
                changedFields[fieldKey] = []
              }
            } else {
              // For text, number, boolean fields
              changedFields[fieldKey] = updatePayload[fieldKey]
            }
          }
        })

        console.log('💾 Saving product with payload:', {
          productId: this.editingProductId,
          payload: changedFields,
          originalProduct: this.products.find(p => p.id === this.editingProductId)
        })

        const response = await fetch(`${this.apiBaseUrl}/products/${this.editingProductId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(changedFields)
        })

        if (!response.ok) {
          throw new Error(`Update failed: ${response.status} ${response.statusText}`)
        }

        const responseData = await response.json()
        const updatedProduct = responseData.product || responseData
        const productIndex = this.products.findIndex(p => p.id === this.editingProductId)
        if (productIndex !== -1) {
          this.$set(this.products, productIndex, updatedProduct)
        }

        console.log(`✅ Updated product ${this.editingProductId} (cache updated automatically)`)
        this.cancelEdit()

      } catch (err) {
        console.error('❌ Error updating product:', err)

        // Try to get more detailed error information
        if (err.response) {
          const errorText = await err.response.text()
          console.error('❌ API Error Response:', errorText)
          alert(`Failed to update product: ${err.message}\n\nAPI Response: ${errorText}`)
        } else {
          alert(`Failed to update product: ${err.message}`)
        }
      }
    },
    
    async confirmDelete(product) {
      const productName = product.field_6905 || product.field_6899 || `Product ${product.id}`
      if (!confirm(`Are you sure you want to delete product "${productName}"?`)) {
        return
      }

      try {
        const response = await fetch(`${this.apiBaseUrl}/products/${product.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Delete failed: ${response.status} ${response.statusText}`)
        }

        this.products = this.products.filter(p => p.id !== product.id)
        this.totalCount--

        console.log(`✅ Deleted product ${product.id} (cache updated automatically)`)

      } catch (err) {
        console.error('❌ Error deleting product:', err)
        alert(`Failed to delete product: ${err.message}`)
      }
    },
    
    closeAddModal() {
      this.showAddModal = false
      this.newProduct = {}
    },
    
    async createProduct() {
      this.creating = true

      try {
        // Validate required fields
        const requiredFields = {
          website: 'Website',
          productType: 'Product Type',
          finalSkuCode: 'Final SKU Code',
          colorName: 'Color Name',
          brandName: 'Brand Name',
          vendorName: 'Vendor Name',
          pricingCategory: 'Pricing Category',
          statusActive: 'Status',
          customizationAvailable: 'Customization Part'
        }

        const missingFields = []
        for (const [key, label] of Object.entries(requiredFields)) {
          if (key === 'statusActive' || key === 'customizationAvailable') {
            // Checkboxes can be false, so we skip validation
            continue
          }
          if (!this.newProduct[key] || this.newProduct[key].trim() === '') {
            missingFields.push(label)
          }
        }

        if (missingFields.length > 0) {
          alert(`Please fill in all required fields:\n- ${missingFields.join('\n- ')}`)
          return
        }

        // For now, create a simple payload with the form data
        // TODO: Map these to actual Baserow field IDs based on the field definitions
        const createPayload = {
          // This is a placeholder - we'll need to map to actual field IDs
          ...this.newProduct
        }

        console.log('📝 Creating product with payload:', createPayload)

        const response = await fetch(`${this.apiBaseUrl}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createPayload)
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Create failed: ${response.status} ${response.statusText}\n${errorText}`)
        }

        const responseData = await response.json()
        const createdProduct = responseData.product || responseData
        this.products.unshift(createdProduct)
        this.totalCount++

        console.log(`✅ Created product ${createdProduct.id} (cache updated automatically)`)
        this.closeAddModal()

      } catch (err) {
        console.error('❌ Error creating product:', err)
        alert(`Failed to create product: ${err.message}`)
      } finally {
        this.creating = false
      }
    },
    
    // Search and Filter Methods
    onSearchChange() {
      // Debounce search to avoid excessive filtering
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        // Search is handled by the computed property
      }, 300)
    },
    
    applyFilters() {
      // Filters are handled by the computed property
    },
    
    clearFilters() {
      this.searchTerm = ''
      this.selectedBrand = ''
      this.selectedType = ''
      this.sortField = ''
      this.sortDirection = 'asc'
      this.columnFilters = {}
    },

    applyColumnFilters() {
      // Reset to first page when column filters change
      this.currentPaginationPage = 1
    },
    
    sortBy(field) {
      if (this.sortField === field) {
        // Toggle direction if same field
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
      } else {
        // New field, start with ascending
        this.sortField = field
        this.sortDirection = 'asc'
      }
    },
    
    getBrandField() {
      return this.visibleFields.find(field => 
        field.name.toLowerCase().includes('brand') || 
        field.name.toLowerCase().includes('mgs_brand')
      )
    },
    
    getTypeField() {
      return this.visibleFields.find(field =>
        field.name.toLowerCase().includes('type')
      )
    },

    toggleSortMenu() {
      this.showSortMenu = !this.showSortMenu
    },

    toggleFilters() {
      this.showFilters = !this.showFilters
    },

    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPaginationPage = page
      }
    },

    async refreshData() {
      console.log('🔄 Manual refresh requested - triggering cache API refresh')

      try {
        // Trigger cache refresh on the cache API
        const response = await fetch(`${this.apiBaseUrl}/cache/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          console.log('✅ Cache API refresh triggered')
          // Wait a moment for the cache to refresh, then reload data
          setTimeout(() => {
            this.loadData()
          }, 1000)
        } else {
          console.warn('⚠️ Failed to trigger cache refresh, loading data anyway')
          this.loadData()
        }
      } catch (err) {
        console.error('❌ Error triggering cache refresh:', err)
        this.loadData()
      }
    },

    showTierPrices(product) {
      // Find the SKU field - it's field_4718 based on the field order
      const skuField = this.visibleFields.find(f => f.name.toLowerCase() === 'sku')
      const sku = skuField ? product[`field_${skuField.id}`] : product.field_4718 || 'Unknown SKU'

      this.selectedProductForTierPrice = product.id
      this.selectedProductSku = sku
      this.showTierPriceModal = true

      console.log(`💰 Opening tier prices for product ${product.id} (SKU: ${sku})`)
    },

    handleFileUpload(event) {
      const file = event.target.files[0]
      if (file) {
        console.log('📁 File selected for upload:', file.name)
        // TODO: Implement file upload to Baserow
        // For now, just store the file reference
        this.newProduct.uploadedFile = file
      }
    }
  }
}
</script>

<style scoped>
.product-management {
  max-width: 100%;
  margin: 0 auto;
  padding: 0;
}

/* Page Header */
.page-header {
  background: #ffffff;
  border-bottom: 1px solid #e8e8e8;
  padding: 10px 20px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.header {
  margin-bottom: 0;
  border-bottom: none;
  padding-bottom: 0;
}

/* Toolbar Styles */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #ffffff;
  border-bottom: 1px solid #e8e8e8;
  gap: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  padding-right: 12px;
  border-right: 1px solid #e8e8e8;
  margin-right: 4px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #595959;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.toolbar-btn:hover {
  background: #f5f5f5;
  border-color: #b3b3b3;
}

.toolbar-btn:active,
.toolbar-btn.active {
  background: #e8e8e8;
  border-color: #4096ff;
  color: #4096ff;
}

.toolbar-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: #8c8c8c;
  pointer-events: none;
}

.search-input {
  padding: 6px 12px 6px 34px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  width: 280px;
  transition: all 0.2s ease;
  background: #ffffff;
}

.search-input:focus {
  outline: none;
  border-color: #4096ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.search-input::placeholder {
  color: #bfbfbf;
}

/* Filters Panel */
.filters-panel {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #595959;
  white-space: nowrap;
}

.filter-select {
  padding: 5px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  background: #ffffff;
  min-width: 150px;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #4096ff;
}

.btn-clear-filters {
  padding: 5px 12px;
  background: transparent;
  color: #ff4d4f;
  border: 1px solid #ff4d4f;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-clear-filters:hover {
  background: #ff4d4f;
  color: white;
}

.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.info {
  font-weight: 600;
  color: #666;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-add {
  background: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-add:hover {
  background: #45a049;
}

.btn-load, .btn-load-all {
  background: #2196f3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-load:hover, .btn-load-all:hover {
  background: #1976d2;
}

.btn-load-all {
  background: #ff9800;
}

.btn-load-all:hover {
  background: #f57c00;
}

.btn-load-all:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.state-message {
  padding: 40px;
  text-align: center;
  background: #f5f5f5;
  border-radius: 8px;
  margin: 20px 0;
}

.state-message.error {
  background: #ffebee;
  border: 1px solid #f44336;
  color: #c62828;
}

.loading-container {
  max-width: 500px;
  margin: 0 auto;
}

.loading-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.progress-bar {
  width: 100%;
  height: 30px;
  background: #e0e0e0;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);
  transition: width 0.3s ease;
  border-radius: 15px;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: #4caf50;
  margin-top: 10px;
}

.table-wrapper {
  border: 1px solid #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.table-container {
  overflow: auto;
  max-height: calc(100vh - 280px); /* Optimize for full viewport */
  flex: 1;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 2000px; /* Ensure horizontal scroll for focused columns */
  font-size: 12px;
}

.products-table th,
.products-table td {
  border: 1px solid #e0e0e0;
  padding: 4px 6px;
  text-align: left;
  white-space: nowrap;
  min-width: 80px;
  font-size: 11px;
  line-height: 1.3;
}

.products-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
  font-size: 11px;
  padding: 6px;
}

/* Filter Row Styles */
.filter-row th {
  background-color: #fafafa;
  border-bottom: 2px solid #d9d9d9;
  padding: 4px;
}

.column-filter-input {
  width: 100%;
  padding: 3px 6px;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  font-size: 10px;
  font-family: inherit;
  background: #ffffff;
  transition: all 0.2s ease;
}

.column-filter-input:focus {
  outline: none;
  border-color: #4096ff;
  box-shadow: 0 0 0 2px rgba(64, 150, 255, 0.1);
}

.column-filter-input::placeholder {
  color: #bfbfbf;
  font-size: 10px;
}

.actions-col {
  min-width: 120px !important;
  position: sticky;
  left: 0;
  background: white;
  z-index: 5;
}

.products-table th.actions-col {
  z-index: 15;
  background: #f5f5f5;
}

.row-actions {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}

.btn-edit, .btn-delete, .btn-save, .btn-cancel {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 13px;
}

.btn-edit:hover {
  background: #e3f2fd;
}

.btn-delete:hover {
  background: #ffebee;
}

.btn-save:hover {
  background: #e8f5e9;
}

.btn-cancel:hover {
  background: #fafafa;
}

.products-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.products-table tr:hover {
  background-color: #f0f0f0;
}

.products-table tr.clickable-row {
  cursor: pointer;
}

.products-table tr.clickable-row:hover {
  background-color: #e8f4fd;
}

.products-table tr.editing {
  background-color: #e3f2fd !important;
  cursor: default;
}

.editable {
  cursor: pointer;
}

.editable:hover {
  background-color: #e8f4fd !important;
}

.field-input, .field-select, .field-textarea {
  width: 100%;
  border: 2px solid #2196f3;
  border-radius: 3px;
  padding: 4px;
  font-size: inherit;
  font-family: inherit;
  background: white;
}

.field-input:focus, .field-select:focus, .field-textarea:focus {
  outline: none;
  border-color: #1976d2;
}

.field-textarea {
  resize: vertical;
  min-height: 60px;
}

.select-value {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
  margin: 1px;
}

.multiple-select-display {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.id-field {
  font-weight: 600;
  color: #666;
}

.product-image {
  max-width: 40px;
  max-height: 40px;
  object-fit: cover;
  border-radius: 3px;
  border: 1px solid #ddd;
}

.boolean-field {
  font-size: 16px;
  font-weight: 600;
}

.boolean-field:contains('✓') {
  color: #4caf50;
}

.boolean-field:contains('✗') {
  color: #f44336;
}

.field-value {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 95vw;
  max-height: 95vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 1400px;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
}

.modal-body {
  padding: 20px;
  overflow: auto;
  flex: 1;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

/* Add Product Form Styles */
.add-product-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 16px;
  background: #fafafa;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  padding-bottom: 8px;
  border-bottom: 2px solid #2196f3;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 12px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-row-3col {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 12px;
}

.form-row-3col:last-child {
  margin-bottom: 0;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.form-field label {
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
  font-size: 13px;
}

.required-label::after {
  content: ' *';
  color: #f44336;
  font-weight: 700;
}

.checkbox-group {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  cursor: pointer;
}

.form-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.form-input, .form-select, .form-textarea {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #ddd;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-create {
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-create:hover {
  background: #45a049;
}

.btn-create:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-cancel {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

/* Layout Styles */
.layout-container {
  display: flex;
  height: 100vh;
}

.main-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.category-filter-info {
  margin: 10px 0;
  padding: 8px 12px;
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 4px;
  font-size: 14px;
}

.category-filter-info strong {
  color: #1976d2;
}

.filter-info {
  color: #6c757d;
  font-size: 12px;
  margin-left: 10px;
}

/* Sortable Header Styles */
.sortable-header {
  cursor: pointer;
  user-select: none;
  position: relative;
  transition: background-color 0.2s ease;
}

.sortable-header:hover {
  background-color: #f8f9fa;
}

.sort-indicator {
  margin-left: 5px;
  font-size: 12px;
  color: #007bff;
  font-weight: bold;
}

/* Pagination Styles */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-top: 1px solid #e8e8e8;
  flex-shrink: 0;
  z-index: 10;
}

.pagination-info {
  font-size: 11px;
  color: #595959;
  font-weight: 500;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 2px;
}

.pagination-btn {
  padding: 4px 8px;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  font-size: 11px;
  color: #595959;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.pagination-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #4096ff;
  color: #4096ff;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.pagination-btn.active {
  background: #4096ff;
  border-color: #4096ff;
  color: white;
}

.page-numbers {
  display: flex;
  gap: 1px;
  margin: 0 2px;
}

.pagination-btn.page-number {
  min-width: 24px;
  padding: 4px 6px;
  text-align: center;
}

/* Tabs Styles */
.tabs-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tabs-header {
  display: flex;
  gap: 2px;
  background: #f5f5f5;
  border-bottom: 2px solid #e8e8e8;
  padding: 0 16px;
}

.tab-button {
  padding: 12px 24px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 14px;
  font-weight: 500;
  color: #595959;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  top: 2px;
}

.tab-button:hover {
  color: #1a1a1a;
  background: rgba(64, 150, 255, 0.05);
}

.tab-button.active {
  color: #4096ff;
  border-bottom-color: #4096ff;
  background: #ffffff;
  font-weight: 600;
}

.tab-content {
  flex: 1;
  overflow: hidden;
  background: #ffffff;
}

.tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>