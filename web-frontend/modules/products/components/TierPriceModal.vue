<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>Tier Prices - {{ productSku }}</h2>
        <button @click="closeModal" class="btn-close">✕</button>
      </div>

      <div class="modal-body">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <p>Loading tier prices...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button @click="loadTierPrices" class="btn-retry">Retry</button>
        </div>

        <!-- Tier Prices Table -->
        <div v-else class="tier-prices-container">
          <div class="tier-prices-header">
            <button @click="addNewTier" class="btn-add-tier">+ Add Tier Price</button>
          </div>

          <table v-if="tierPrices.length > 0" class="tier-prices-table">
            <thead>
              <tr>
                <th>Website</th>
                <th>Group or Catalog</th>
                <th>Quantity <span class="required">*</span></th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(tier, index) in tierPrices" :key="tier.id || `new-${index}`"
                  :class="{ 'new-row': !tier.id }">
                <!-- Website Column -->
                <td>
                  <select
                    v-model="tier.field_7389"
                    class="tier-select"
                    @change="updateTier(tier)"
                  >
                    <option v-for="option in websiteOptions" :key="option.id" :value="parseInt(option.id)">
                      {{ option.name }}
                    </option>
                  </select>
                </td>

                <!-- Customer Group Column -->
                <td>
                  <SearchableGroupDropdown
                    v-model="tier.field_7386"
                    :options="customerGroupOptions"
                    @change="updateTier(tier)"
                  />
                </td>

                <!-- Quantity Column -->
                <td>
                  <input
                    v-model="tier.field_7387"
                    type="number"
                    class="tier-input"
                    placeholder="Qty"
                    min="1"
                    @blur="updateTier(tier)"
                  >
                </td>

                <!-- Price Column -->
                <td>
                  <div class="price-field">
                    <select
                      v-model="tier.price_type"
                      class="tier-select price-type"
                      @change="updateTier(tier)"
                    >
                      <option v-for="option in priceTypeOptions" :key="option.id" :value="option.id">
                        {{ option.name }}
                      </option>
                    </select>
                    <input
                      v-model="tier.field_7388"
                      type="text"
                      class="tier-input price-value"
                      placeholder="Price"
                      @blur="updateTier(tier)"
                    >
                  </div>
                </td>

                <!-- Actions Column -->
                <td class="actions-cell">
                  <div class="tier-actions">
                    <template v-if="!tier.id">
                      <button @click="saveTier(tier)" class="btn-save" title="Save">💾</button>
                      <button @click="cancelEdit" class="btn-cancel" title="Cancel">❌</button>
                    </template>
                    <template v-else>
                      <button @click="deleteTier(tier)" class="btn-delete" title="Delete">🗑️</button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-else class="no-tiers">
            <p>No tier prices found for this product.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SearchableGroupDropdown from './SearchableGroupDropdown'

export default {
  name: 'TierPriceModal',
  components: {
    SearchableGroupDropdown
  },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    productId: {
      type: Number,
      required: true
    },
    productSku: {
      type: String,
      required: true
    },
    productImage: {
      type: String,
      default: ''
    },
    productName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      tierPrices: [],
      loading: false,
      error: null,
      baserowApiUrl: 'https://pim.offineeds.com/api/database/rows/table/704/',
      baserowToken: '2tLFFPlRQX7cnuvaxTfJ2qVi6aJSecX0',
      // Dropdown options based on Magento standards
      websiteOptions: [
        { id: '1', name: 'Main Website[INR]' },
        { id: '0', name: 'All Websites' }
      ],
      customerGroupOptions: [
        {
          label: 'Customer Groups',
          items: [
            { id: 0, name: 'ALL GROUPS' },
            { id: 1, name: 'NOT LOGGED IN' },
            { id: 2, name: 'Wholesale' },
            { id: 3, name: 'Retailer' },
            { id: 4, name: 'HR Group' },
            { id: 5, name: 'Trainers & Coaches' },
            { id: 6, name: 'Koch Group' },
            { id: 9, name: 'Global' }
          ]
        },
        {
          label: 'Shared Catalogs',
          items: [
            { id: 100, name: 'Default (General)' }
          ]
        }
      ],
      priceTypeOptions: [
        { id: 'fixed', name: 'Fixed' },
        { id: 'discount', name: 'Discount' }
      ]
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.loadTierPrices()
      }
    }
  },
  methods: {
    async loadTierPrices() {
      this.loading = true
      this.error = null

      try {
        console.log(`🔄 Loading tier prices for product ID ${this.productId} (SKU: ${this.productSku})`)

        // Fetch tier prices for this product by filtering on SKU link
        const response = await fetch(
          `${this.baserowApiUrl}?size=200&filter__field_7383__link_row_has=${this.productId}`,
          {
            headers: {
              'Authorization': `Token ${this.baserowToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        this.tierPrices = (data.results || []).map(tier => ({
          ...tier,
          price_type: 'fixed' // Add price_type for UI display
        }))

        console.log(`✅ Loaded ${this.tierPrices.length} tier prices`)

      } catch (err) {
        this.error = `Failed to load tier prices: ${err.message}`
        console.error('❌ Error loading tier prices:', err)
      } finally {
        this.loading = false
      }
    },

    getWebsiteName(websiteId) {
      const website = this.websiteOptions.find(w => w.id === String(websiteId))
      return website ? website.name : websiteId
    },

    getCustomerGroupName(groupId) {
      const group = this.customerGroupOptions.find(g => g.id === String(groupId))
      return group ? group.name : groupId
    },

    addNewTier() {
      // Add a new empty tier at the beginning
      this.tierPrices.unshift({
        id: null,
        field_7387: '',
        field_7388: '',
        field_7386: 9,
        field_7389: 1,
        price_type: 'fixed'
      })
    },

    cancelEdit() {
      // Remove new unsaved tiers
      this.tierPrices = this.tierPrices.filter(t => t.id !== null)
    },

    async updateTier(tier) {
      // Only update existing tiers (not new ones)
      if (!tier.id) return

      try {
        const payload = {
          field_7383: [this.productId], // SKU link
          field_7387: parseInt(tier.field_7387),
          field_7388: tier.field_7388,
          field_7386: parseInt(tier.field_7386),
          field_7389: parseInt(tier.field_7389)
        }

        console.log(`💾 Updating tier ${tier.id}`)
        const response = await fetch(`${this.baserowApiUrl}${tier.id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${this.baserowToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          throw new Error(`Update failed: ${response.status}`)
        }

        const updated = await response.json()
        const index = this.tierPrices.findIndex(t => t.id === tier.id)
        if (index !== -1) {
          this.$set(this.tierPrices, index, updated)
          // Re-add price_type for UI
          this.tierPrices[index].price_type = tier.price_type || 'fixed'
        }
        console.log(`✅ Updated tier ${tier.id}`)

      } catch (err) {
        console.error('❌ Error updating tier:', err)
        alert(`Failed to update tier price: ${err.message}`)
      }
    },

    async saveTier(tier) {
      try {
        const payload = {
          field_7383: [this.productId], // SKU link
          field_7387: parseInt(tier.field_7387),
          field_7388: tier.field_7388,
          field_7386: parseInt(tier.field_7386),
          field_7389: parseInt(tier.field_7389)
        }

        // Create new tier
        console.log(`➕ Creating new tier`)
        const response = await fetch(this.baserowApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${this.baserowToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          throw new Error(`Create failed: ${response.status}`)
        }

        const created = await response.json()
        // Replace the temp tier with the created one
        const index = this.tierPrices.findIndex(t => t.id === null)
        if (index !== -1) {
          this.$set(this.tierPrices, index, created)
          // Add price_type for UI
          this.tierPrices[index].price_type = 'fixed'
        }
        console.log(`✅ Created tier ${created.id}`)

      } catch (err) {
        console.error('❌ Error saving tier:', err)
        alert(`Failed to save tier price: ${err.message}`)
      }
    },

    async deleteTier(tier) {
      if (!confirm(`Are you sure you want to delete this tier price (Qty: ${tier.field_7387})?`)) {
        return
      }

      try {
        console.log(`🗑️ Deleting tier ${tier.id}`)
        const response = await fetch(`${this.baserowApiUrl}${tier.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${this.baserowToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Delete failed: ${response.status}`)
        }

        this.tierPrices = this.tierPrices.filter(t => t.id !== tier.id)
        console.log(`✅ Deleted tier ${tier.id}`)

      } catch (err) {
        console.error('❌ Error deleting tier:', err)
        alert(`Failed to delete tier price: ${err.message}`)
      }
    },

    closeModal() {
      this.cancelEdit()
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 95%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-close:hover {
  background: #e9ecef;
}

.modal-body {
  padding: 20px;
  overflow: auto;
  flex: 1;
}

.loading-state, .error-state {
  text-align: center;
  padding: 40px 20px;
}

.error-state {
  color: #d32f2f;
}

.btn-retry {
  margin-top: 10px;
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-retry:hover {
  background: #d32f2f;
}

.tier-prices-header {
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-end;
}

.btn-add-tier {
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-add-tier:hover {
  background: #45a049;
}

.tier-prices-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.tier-prices-table th,
.tier-prices-table td {
  border: 1px solid #e0e0e0;
  padding: 10px;
  text-align: left;
}

.tier-prices-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.tier-prices-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.tier-prices-table tr:hover {
  background-color: #f0f0f0;
}

.tier-prices-table tr.editing {
  background-color: #e3f2fd !important;
}

.tier-prices-table tr.new-row {
  background-color: #fff3e0 !important;
}

.tier-input {
  width: 100%;
  padding: 6px 8px;
  border: 2px solid #2196f3;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
}

.tier-input:focus {
  outline: none;
  border-color: #1976d2;
}

.tier-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-edit, .btn-delete, .btn-save, .btn-cancel {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 16px;
  transition: background 0.2s;
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

.no-tiers {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.tier-prices-container {
  min-height: 200px;
}

.tier-select {
  width: 100%;
  padding: 6px 8px;
  border: 2px solid #2196f3;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  background-color: white;
}

.tier-select:focus {
  outline: none;
  border-color: #1976d2;
}

.price-field {
  display: flex;
  gap: 8px;
  align-items: center;
}

.price-field .tier-select.price-type {
  width: 100px;
  flex-shrink: 0;
}

.price-field .tier-input.price-value {
  flex: 1;
}

.price-display {
  display: flex;
  align-items: center;
  gap: 4px;
}

.currency-symbol {
  font-weight: 600;
  color: #666;
}

.required {
  color: #f44336;
  font-weight: bold;
}

.actions-cell {
  width: 80px;
  text-align: center;
}
</style>
