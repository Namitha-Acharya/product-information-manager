<template>
  <div class="searchable-dropdown" ref="dropdown">
    <div class="dropdown-trigger" @click.stop="toggleDropdown">
      <span class="selected-value">{{ selectedLabel }}</span>
      <span class="dropdown-arrow">▼</span>
    </div>

    <div v-if="isOpen" class="dropdown-menu">
      <div class="search-box">
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Search..."
          class="search-input"
          @click.stop
          @keydown.esc="close"
        >
        <span class="search-icon">🔍</span>
      </div>

      <div class="options-container">
        <div v-if="filteredOptions.length === 0" class="no-results">
          No results found
        </div>

        <template v-for="group in filteredOptions">
          <div v-if="group.items.length > 0" :key="group.label" class="option-group">
            <div class="group-label">{{ group.label }}</div>
            <div
              v-for="option in group.items"
              :key="option.id"
              class="option-item"
              :class="{ 'selected': option.id === value }"
              @click="selectOption(option)"
            >
              {{ option.name }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SearchableGroupDropdown',
  props: {
    value: {
      type: [Number, String],
      required: true
    },
    options: {
      type: Array,
      required: true,
      // Format: [{ label: 'Group Name', items: [{ id, name }] }]
    }
  },
  data() {
    return {
      isOpen: false,
      searchQuery: ''
    }
  },
  computed: {
    selectedLabel() {
      for (const group of this.options) {
        const found = group.items.find(item => item.id === this.value)
        if (found) return found.name
      }
      return 'Select...'
    },
    filteredOptions() {
      if (!this.searchQuery.trim()) {
        return this.options
      }

      const query = this.searchQuery.toLowerCase()
      return this.options.map(group => ({
        label: group.label,
        items: group.items.filter(item =>
          item.name.toLowerCase().includes(query)
        )
      })).filter(group => group.items.length > 0)
    }
  },
  mounted() {
    // Use setTimeout to ensure event listener is added after current event loop
    setTimeout(() => {
      document.addEventListener('click', this.handleClickOutside, true)
    }, 0)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside, true)
  },
  methods: {
    handleClickOutside(event) {
      if (!this.isOpen) return

      const dropdown = this.$refs.dropdown
      if (dropdown && !dropdown.contains(event.target)) {
        this.close()
      }
    },
    toggleDropdown() {
      this.isOpen = !this.isOpen
      if (this.isOpen) {
        this.$nextTick(() => {
          if (this.$refs.searchInput) {
            this.$refs.searchInput.focus()
          }
        })
      }
    },
    close() {
      this.isOpen = false
      this.searchQuery = ''
    },
    selectOption(option) {
      this.$emit('input', option.id)
      this.$emit('change', option.id)
      this.close()
    }
  }
}
</script>

<style scoped>
.searchable-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-trigger {
  width: 100%;
  padding: 6px 8px;
  border: 2px solid #2196f3;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  background-color: white;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: border-color 0.2s;
}

.dropdown-trigger:hover {
  border-color: #1976d2;
}

.selected-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  margin-left: 8px;
  font-size: 10px;
  color: #666;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #2196f3;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 400px;
  min-width: 280px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-box {
  position: relative;
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
}

.search-input:focus {
  outline: none;
  border-color: #2196f3;
}

.search-icon {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #666;
  pointer-events: none;
}

.options-container {
  overflow-y: auto;
  max-height: 320px;
}

.option-group {
  padding: 8px 0;
}

.group-label {
  padding: 8px 12px 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
}

.option-group:first-child .group-label {
  border-top: none;
}

.option-item {
  padding: 8px 12px 8px 24px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.option-item:hover {
  background: #f0f0f0;
}

.option-item.selected {
  background: #e3f2fd;
  color: #1976d2;
  font-weight: 500;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: #666;
  font-size: 13px;
}
</style>
