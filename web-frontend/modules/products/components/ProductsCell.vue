<template>
  <div class="products-cell">
    <!-- Text Fields -->
    <template v-if="isTextField">
      <input
        v-if="editing"
        v-model="localValue"
        type="text"
        class="products-cell__input"
        @blur="onBlur"
        @keyup.enter="onBlur"
        @keyup.escape="onCancel"
      >
      <span v-else class="products-cell__value">
        {{ displayValue }}
      </span>
    </template>

    <!-- Number Fields -->
    <template v-else-if="isNumberField">
      <input
        v-if="editing"
        v-model.number="localValue"
        type="number"
        class="products-cell__input"
        @blur="onBlur"
        @keyup.enter="onBlur"
        @keyup.escape="onCancel"
      >
      <span v-else class="products-cell__value products-cell__value--number">
        {{ displayValue }}
      </span>
    </template>

    <!-- Boolean Fields -->
    <template v-else-if="isBooleanField">
      <input
        v-if="editing"
        v-model="localValue"
        type="checkbox"
        class="products-cell__checkbox"
        @change="onBlur"
      >
      <span v-else class="products-cell__value">
        <i :class="localValue ? 'iconoir-check' : 'iconoir-cancel'" />
        {{ localValue ? 'Yes' : 'No' }}
      </span>
    </template>

    <!-- Date Fields -->
    <template v-else-if="isDateField">
      <input
        v-if="editing"
        v-model="localValue"
        type="date"
        class="products-cell__input"
        @blur="onBlur"
        @keyup.enter="onBlur"
        @keyup.escape="onCancel"
      >
      <span v-else class="products-cell__value">
        {{ formatDate(localValue) }}
      </span>
    </template>

    <!-- Select Fields -->
    <template v-else-if="isSelectField">
      <select
        v-if="editing"
        v-model="localValue"
        class="products-cell__select"
        @change="onBlur"
      >
        <option value="">Select...</option>
        <option
          v-for="option in field.select_options"
          :key="option.id"
          :value="option.value"
        >
          {{ option.value }}
        </option>
      </select>
      <span v-else class="products-cell__value">
        <span
          v-if="selectedOption"
          class="products-cell__select-badge"
          :style="{ backgroundColor: selectedOption.color }"
        >
          {{ selectedOption.value }}
        </span>
        <span v-else>-</span>
      </span>
    </template>

    <!-- Long Text Fields -->
    <template v-else-if="isLongTextField">
      <textarea
        v-if="editing"
        v-model="localValue"
        class="products-cell__textarea"
        @blur="onBlur"
        @keyup.escape="onCancel"
      />
      <div v-else class="products-cell__value products-cell__value--long-text">
        {{ displayValue }}
      </div>
    </template>

    <!-- URL Fields -->
    <template v-else-if="isURLField">
      <input
        v-if="editing"
        v-model="localValue"
        type="url"
        class="products-cell__input"
        @blur="onBlur"
        @keyup.enter="onBlur"
        @keyup.escape="onCancel"
      >
      <div v-else class="products-cell__value">
        <a
          v-if="localValue"
          :href="localValue"
          target="_blank"
          rel="noopener noreferrer"
          class="products-cell__link"
        >
          {{ displayValue }}
        </a>
        <span v-else>-</span>
      </div>
    </template>

    <!-- Email Fields -->
    <template v-else-if="isEmailField">
      <input
        v-if="editing"
        v-model="localValue"
        type="email"
        class="products-cell__input"
        @blur="onBlur"
        @keyup.enter="onBlur"
        @keyup.escape="onCancel"
      >
      <div v-else class="products-cell__value">
        <a
          v-if="localValue"
          :href="`mailto:${localValue}`"
          class="products-cell__link"
        >
          {{ localValue }}
        </a>
        <span v-else>-</span>
      </div>
    </template>

    <!-- Default/Fallback -->
    <template v-else>
      <input
        v-if="editing"
        v-model="localValue"
        type="text"
        class="products-cell__input"
        @blur="onBlur"
        @keyup.enter="onBlur"
        @keyup.escape="onCancel"
      >
      <span v-else class="products-cell__value">
        {{ displayValue }}
      </span>
    </template>
  </div>
</template>

<script>
export default {
  name: 'ProductsCell',
  props: {
    field: {
      type: Object,
      required: true,
    },
    row: {
      type: Object,
      required: true,
    },
    editing: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      localValue: null,
      originalValue: null,
    }
  },
  computed: {
    fieldValue() {
      const rawValue = this.row[this.field.name]
      // Handle Baserow's select field format: [{"id":3043,"value":"simple","color":"darker-yellow"}]
      if (this.isSelectField && Array.isArray(rawValue) && rawValue.length > 0) {
        return rawValue[0].value // Extract the string value from the first option
      }
      return rawValue
    },
    
    displayValue() {
      if (this.localValue === null || this.localValue === undefined || this.localValue === '') {
        return '-'
      }
      
      if (this.isLongTextField && this.localValue.length > 100) {
        return this.localValue.substring(0, 100) + '...'
      }
      
      return this.localValue
    },

    isTextField() {
      return this.field.type === 'text'
    },

    isLongTextField() {
      return this.field.type === 'long_text'
    },

    isNumberField() {
      return this.field.type === 'number'
    },

    isBooleanField() {
      return this.field.type === 'boolean'
    },

    isDateField() {
      return this.field.type === 'date'
    },

    isSelectField() {
      return this.field.type === 'single_select'
    },

    isURLField() {
      return this.field.type === 'url'
    },

    isEmailField() {
      return this.field.type === 'email'
    },

    selectedOption() {
      if (!this.isSelectField || !this.localValue) return null
      
      // First try to find in field's select_options
      const fieldOption = this.field.select_options?.find(option => option.value === this.localValue)
      if (fieldOption) return fieldOption
      
      // If not found, check if the raw value has color info (from Baserow API response)
      const rawValue = this.row[this.field.name]
      if (Array.isArray(rawValue) && rawValue.length > 0) {
        const apiOption = rawValue[0]
        if (apiOption.value === this.localValue) {
          return {
            id: apiOption.id,
            value: apiOption.value,
            color: apiOption.color || '#6a6b70' // Fallback color
          }
        }
      }
      
      return null
    },
  },

  watch: {
    fieldValue: {
      immediate: true,
      handler(newValue) {
        this.localValue = newValue
        this.originalValue = newValue
      },
    },
    
    editing(isEditing) {
      if (isEditing) {
        this.originalValue = this.localValue
        this.$nextTick(() => {
          const input = this.$el.querySelector('input, textarea, select')
          if (input) {
            input.focus()
          }
        })
      }
    },
  },

  methods: {
    onBlur() {
      if (this.localValue !== this.originalValue) {
        this.$emit('update', {
          field: this.field,
          row: this.row,
          value: this.localValue,
        })
      }
    },

    onCancel() {
      this.localValue = this.originalValue
      this.$emit('cancel')
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString()
      } catch (error) {
        return dateString
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.products-cell {
  min-height: 20px;

  &__value {
    display: block;
    min-height: 20px;
    word-break: break-word;

    &--number {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    &--long-text {
      max-height: 60px;
      overflow: hidden;
      line-height: 1.4;
    }
  }

  &__input,
  &__select {
    width: 100%;
    padding: 4px 8px;
    border: 1px solid #e6e6e7;
    border-radius: 4px;
    font-size: 14px;
    background: white;

    &:focus {
      outline: none;
      border-color: #5190ef;
      box-shadow: 0 0 0 2px rgba(81, 144, 239, 0.1);
    }
  }

  &__textarea {
    width: 100%;
    min-height: 60px;
    padding: 8px;
    border: 1px solid #e6e6e7;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    background: white;

    &:focus {
      outline: none;
      border-color: #5190ef;
      box-shadow: 0 0 0 2px rgba(81, 144, 239, 0.1);
    }
  }

  &__checkbox {
    width: auto;
    margin-right: 8px;
  }

  &__select-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    color: white;
    background: #6a6b70;
  }

  &__link {
    color: #5190ef;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>