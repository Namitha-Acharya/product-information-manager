<template>
  <div class="products-form-field">
    <!-- Text Field -->
    <input
      v-if="field.type === 'text'"
      :value="value"
      type="text"
      class="products-form-field__input"
      @input="$emit('input', $event.target.value)"
    />

    <!-- Long Text Field -->
    <textarea
      v-else-if="field.type === 'long_text'"
      :value="value"
      class="products-form-field__textarea"
      @input="$emit('input', $event.target.value)"
    />

    <!-- Number Field -->
    <input
      v-else-if="field.type === 'number'"
      :value="value"
      type="number"
      step="0.01"
      class="products-form-field__input"
      @input="$emit('input', parseFloat($event.target.value) || null)"
    />

    <!-- Boolean Field -->
    <label
      v-else-if="field.type === 'boolean'"
      class="products-form-field__checkbox-label"
    >
      <input
        :checked="value"
        type="checkbox"
        class="products-form-field__checkbox"
        @change="$emit('input', $event.target.checked)"
      />
      <span>{{ field.name }}</span>
    </label>

    <!-- Date Field -->
    <input
      v-else-if="field.type === 'date'"
      :value="formatDateForInput(value)"
      type="date"
      class="products-form-field__input"
      @input="$emit('input', $event.target.value)"
    />

    <!-- Single Select Field -->
    <select
      v-else-if="field.type === 'single_select'"
      :value="value"
      class="products-form-field__select"
      @change="$emit('input', $event.target.value)"
    >
      <option value="">Select {{ field.name.toLowerCase() }}...</option>
      <option
        v-for="option in field.select_options"
        :key="option.id"
        :value="option.value"
      >
        {{ option.value }}
      </option>
    </select>

    <!-- URL Field -->
    <input
      v-else-if="field.type === 'url'"
      :value="value"
      type="url"
      class="products-form-field__input"
      placeholder="https://..."
      @input="$emit('input', $event.target.value)"
    />

    <!-- Email Field -->
    <input
      v-else-if="field.type === 'email'"
      :value="value"
      type="email"
      class="products-form-field__input"
      placeholder="example@domain.com"
      @input="$emit('input', $event.target.value)"
    />

    <!-- Phone Number Field -->
    <input
      v-else-if="field.type === 'phone_number'"
      :value="value"
      type="tel"
      class="products-form-field__input"
      @input="$emit('input', $event.target.value)"
    />

    <!-- Rating Field -->
    <input
      v-else-if="field.type === 'rating'"
      :value="value"
      type="number"
      min="1"
      :max="field.max_value || 5"
      class="products-form-field__input"
      @input="$emit('input', parseInt($event.target.value) || null)"
    />

    <!-- Default Text Input -->
    <input
      v-else
      :value="value"
      type="text"
      class="products-form-field__input"
      @input="$emit('input', $event.target.value)"
    />

    <!-- Field Helper Text -->
    <div v-if="field.description" class="products-form-field__helper">
      {{ field.description }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductsFormField',
  props: {
    field: {
      type: Object,
      required: true,
    },
    value: {
      type: [String, Number, Boolean, Date],
      default: null,
    },
  },
  methods: {
    formatDateForInput(dateValue) {
      if (!dateValue) return ''
      
      try {
        const date = new Date(dateValue)
        return date.toISOString().split('T')[0]
      } catch (error) {
        return ''
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.products-form-field {
  &__input,
  &__textarea,
  &__select {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #e6e6e7;
    border-radius: 8px;
    font-size: 14px;
    background: white;
    transition: border-color 0.2s ease;

    &:focus {
      outline: none;
      border-color: #5190ef;
      box-shadow: 0 0 0 3px rgba(81, 144, 239, 0.1);
    }

    &:disabled {
      background: #f7f7f7;
      color: #9c9c9f;
      cursor: not-allowed;
    }
  }

  &__textarea {
    min-height: 100px;
    resize: vertical;
    font-family: inherit;
  }

  &__checkbox-label {
    display: flex;
    align-items: center;
    font-weight: normal;
    cursor: pointer;
    gap: 8px;
  }

  &__checkbox {
    width: auto;
    margin: 0;
  }

  &__helper {
    font-size: 12px;
    color: #6a6b70;
    margin-top: 4px;
    line-height: 1.4;
  }
}
</style>