<template>
  <div class="add-product-form">
    <form @submit.prevent="onSubmit">
      <div
        v-for="field in editableFields"
        :key="field.id"
        class="add-product-form__field"
      >
        <label class="add-product-form__label">
          {{ field.name }}
          <span v-if="field.required" class="add-product-form__required">*</span>
        </label>
        
        <!-- Text Field -->
        <input
          v-if="field.type === 'text'"
          v-model="formData[field.name]"
          type="text"
          class="add-product-form__input"
          :required="field.required"
        >

        <!-- Long Text Field -->
        <textarea
          v-else-if="field.type === 'long_text'"
          v-model="formData[field.name]"
          class="add-product-form__textarea"
          :required="field.required"
        />

        <!-- Number Field -->
        <input
          v-else-if="field.type === 'number'"
          v-model.number="formData[field.name]"
          type="number"
          class="add-product-form__input"
          :required="field.required"
        >

        <!-- Boolean Field -->
        <label
          v-else-if="field.type === 'boolean'"
          class="add-product-form__checkbox-label"
        >
          <input
            v-model="formData[field.name]"
            type="checkbox"
            class="add-product-form__checkbox"
          >
          <span>{{ field.name }}</span>
        </label>

        <!-- Date Field -->
        <input
          v-else-if="field.type === 'date'"
          v-model="formData[field.name]"
          type="date"
          class="add-product-form__input"
          :required="field.required"
        >

        <!-- Select Field -->
        <select
          v-else-if="field.type === 'single_select'"
          v-model="formData[field.name]"
          class="add-product-form__select"
          :required="field.required"
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

        <!-- URL Field -->
        <input
          v-else-if="field.type === 'url'"
          v-model="formData[field.name]"
          type="url"
          class="add-product-form__input"
          :required="field.required"
        >

        <!-- Email Field -->
        <input
          v-else-if="field.type === 'email'"
          v-model="formData[field.name]"
          type="email"
          class="add-product-form__input"
          :required="field.required"
        >

        <!-- Default Text Input -->
        <input
          v-else
          v-model="formData[field.name]"
          type="text"
          class="add-product-form__input"
          :required="field.required"
        >
      </div>

      <div class="add-product-form__actions">
        <Button
          type="secondary"
          @click="$emit('cancel')"
        >
          Cancel
        </Button>
        <Button
          type="primary"
          :loading="loading"
          :disabled="loading"
        >
          Add Product
        </Button>
      </div>
    </form>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Button from '@baserow/modules/core/components/Button'

export default {
  name: 'AddProductForm',
  components: {
    Button,
  },
  props: {
    tableId: {
      type: [String, Number],
      required: true,
    },
  },
  data() {
    return {
      formData: {},
      loading: false,
    }
  },
  computed: {
    ...mapGetters('products', ['getTable']),
    
    table() {
      return this.getTable
    },

    editableFields() {
      if (!this.table?.fields) return []
      
      // Filter out system fields and non-editable fields
      return this.table.fields.filter(field => 
        !['id', 'created_on', 'updated_on'].includes(field.name) &&
        !field.read_only
      )
    },
  },

  created() {
    this.initializeForm()
  },

  methods: {
    initializeForm() {
      // Initialize form data with default values
      this.formData = {}
      this.editableFields.forEach(field => {
        switch (field.type) {
          case 'boolean':
            this.formData[field.name] = false
            break
          case 'number':
            this.formData[field.name] = null
            break
          default:
            this.formData[field.name] = ''
        }
      })
    },

    async onSubmit() {
      this.loading = true
      
      try {
        // Clean up form data - remove empty values
        const cleanData = {}
        Object.keys(this.formData).forEach(key => {
          const value = this.formData[key]
          if (value !== null && value !== undefined && value !== '') {
            cleanData[key] = value
          }
        })

        await this.$store.dispatch('products/createRow', {
          tableId: this.tableId,
          data: cleanData,
        })

        this.$store.dispatch('toast/success', {
          title: 'Success',
          message: 'Product added successfully!',
        })

        this.$emit('success')
      } catch (error) {
        console.error('Failed to create product:', error)
        this.$store.dispatch('toast/error', {
          title: 'Error',
          message: error.response?.data?.error || 'Failed to add product. Please try again.',
        })
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.add-product-form {
  padding: 24px;
  max-width: 600px;

  &__field {
    margin-bottom: 20px;
  }

  &__label {
    display: block;
    font-weight: 600;
    color: #393a40;
    margin-bottom: 6px;
  }

  &__required {
    color: #ff7a6b;
  }

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
  }

  &__checkbox {
    width: auto;
    margin-right: 8px;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px solid #e6e6e7;
  }
}
</style>