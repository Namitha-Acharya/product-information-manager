import axios from 'axios'

/**
 * Token-based API service for Baserow
 * Uses database tokens for authentication instead of session cookies
 */
class TokenAuthService {
  constructor(baseURL = 'http://localhost/api', token = null) {
    this.baseURL = baseURL
    this.token = token
    
    // Create axios instance with token authentication
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    // Add token to requests if available
    if (this.token) {
      this.setToken(this.token)
    }
  }
  
  setToken(token) {
    this.token = token
    if (token) {
      // Database tokens in Baserow use 'Token' prefix for API authentication
      this.client.defaults.headers.Authorization = `Token ${token}`
      // Also try with common alternatives if the above doesn't work
      // this.client.defaults.headers.Authorization = `Bearer ${token}`
    } else {
      delete this.client.defaults.headers.Authorization
    }
  }
  
  // Table operations - create mock table structure since database tokens can't access table metadata
  async getTable(tableId) {
    // Try to get field schema first, fallback to mock structure if needed
    try {
      // Try multiple endpoints to get field schema with database tokens
      let tableSchema = null
      
      // Try different API endpoints that might work with database tokens
      const endpointsToTry = [
        `/database/fields/table/${tableId}/`, // Correct endpoint from Baserow docs
        `/database/tables/${tableId}/`,
        `/database/tables/${tableId}/fields/`
      ]
      
      for (const endpoint of endpointsToTry) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint}`)
          const schemaResponse = await this.client.get(endpoint)
          tableSchema = schemaResponse.data
          console.log(`✅ Successfully got schema from endpoint: ${endpoint}`)
          break
        } catch (schemaError) {
          console.log(`❌ Failed endpoint ${endpoint}:`, schemaError.response?.status, schemaError.response?.data?.detail || schemaError.message)
        }
      }
      
      // Get sample rows for field inference
      const response = await this.client.get(`/database/rows/table/${tableId}/`, { 
        params: { size: 50 } // Get more rows to better detect select field options
      })
      
      if (response.data.results && response.data.results.length > 0) {
        const rows = response.data.results
        const firstRow = rows[0]
        
        if (tableSchema) {
          // Handle different response formats
          let fields = []
          
          if (Array.isArray(tableSchema)) {
            // If response is array of fields (from /api/database/fields/table/{id}/)
            fields = tableSchema.map(field => ({
              ...field,
              display_name: this.getFieldDisplayName(field.name, firstRow[field.name])
            }))
          } else if (tableSchema.fields) {
            // If response has fields property (from /database/tables/{id}/)
            fields = tableSchema.fields.map(field => ({
              ...field,
              display_name: this.getFieldDisplayName(field.name, firstRow[field.name])
            }))
          }
          
          if (fields.length > 0) {
            console.log('🎉 Successfully using real field schema with select options!')
            return {
              id: tableId,
              name: tableSchema.name || `Table ${tableId}`,
              fields: fields
            }
          }
        }
        
        console.log('📝 Using fallback field detection from row data')
        // Fallback: analyze rows to detect field options (including unused options by fetching more data)
        const fieldOptions = {}
        
        // Try to get even more rows to find all possible select options
        try {
          const moreRowsResponse = await this.client.get(`/database/rows/table/${tableId}/`, { 
            params: { size: 200 } // Get many more rows to find unused select options
          })
          const allRows = moreRowsResponse.data.results || rows
          
          // For each field, collect unique values to detect select fields
          Object.keys(firstRow).forEach(fieldName => {
            const uniqueValues = new Set()
            allRows.forEach(row => {
              if (row[fieldName] !== null && row[fieldName] !== undefined && row[fieldName] !== '') {
                uniqueValues.add(row[fieldName])
              }
            })
            fieldOptions[fieldName] = Array.from(uniqueValues)
          })
        } catch (err) {
          // If getting more rows fails, use what we have
          Object.keys(firstRow).forEach(fieldName => {
            const uniqueValues = new Set()
            rows.forEach(row => {
              if (row[fieldName] !== null && row[fieldName] !== undefined && row[fieldName] !== '') {
                uniqueValues.add(row[fieldName])
              }
            })
            fieldOptions[fieldName] = Array.from(uniqueValues)
          })
        }
        
        const fields = Object.keys(firstRow).map((key, index) => {
          const field = {
            id: index + 1,
            name: key,
            display_name: this.getFieldDisplayName(key, firstRow[key]),
            type: this.inferFieldType(key, firstRow[key], fieldOptions[key]),
            read_only: key === 'id' || key === 'order'
          }
          
          // Add select options for select fields
          if (field.type === 'single_select' && fieldOptions[key] && fieldOptions[key].length > 0) {
            field.select_options = fieldOptions[key].map((value, idx) => ({
              id: idx + 1,
              value: value,
              color: this.getSelectOptionColor(idx) // Assign colors to options
            }))
          }
          
          return field
        })
        
        return {
          id: tableId,
          name: `Table ${tableId}`,
          fields: fields
        }
      } else {
        // Empty table
        return {
          id: tableId,
          name: `Table ${tableId}`,
          fields: [
            { id: 1, name: 'id', type: 'number', read_only: true }
          ]
        }
      }
    } catch (error) {
      throw new Error(`Cannot access table ${tableId}: ${error.response?.data?.detail || error.message}`)
    }
  }
  
  // Helper method to assign colors to select options
  getSelectOptionColor(index) {
    const colors = [
      '#5190ef', '#ff7a6b', '#f2a900', '#34c759', 
      '#ff9500', '#007aff', '#5856d6', '#ff2d92',
      '#8e8e93', '#30d158', '#64d2ff', '#bf5af2'
    ]
    return colors[index % colors.length]
  }
  
  // Helper method to generate meaningful field display names
  getFieldDisplayName(fieldKey, value) {
    // Comprehensive field mappings for all e-commerce/product fields
    const fieldMappings = {
      'id': 'ID',
      'order': 'Order',
      'field_6898': 'Product ID',
      'field_6899': 'SKU',
      'field_6900': 'Variant',
      'field_6901': 'Category',
      'field_6902': 'Product Type',
      'field_6903': 'Brand',
      'field_6904': 'Base Type',
      'field_6905': 'Display Name',
      'field_6906': 'Meta Title',
      'field_6907': 'Meta Keywords',
      'field_6908': 'Weight',
      'field_6909': 'Status',
      'field_6910': 'Required Options',
      'field_6911': 'Visibility',
      'field_6912': 'Price',
      'field_6913': 'Special Price',
      'field_6914': 'Special From Date',
      'field_6915': 'Special To Date',
      'field_6916': 'URL Key',
      'field_6917': 'Name',
      'field_6918': 'Short Description',
      'field_6919': 'Description',
      'field_6920': 'Image',
      'field_6921': 'Small Image',
      'field_6922': 'Thumbnail',
      'field_6923': 'Swatch Image',
      'field_6924': 'Base Image',
      'field_6925': 'Gallery',
      'field_6926': 'Image Label',
      'field_6927': 'Small Image Label',
      'field_6928': 'Created At',
      'field_6929': 'Updated At',
      'field_6930': 'Special Price From',
      'field_6931': 'Special Price To',
      'field_6932': 'Page Layout',
      'field_6933': 'Options Container',
      'field_6934': 'MSRP Display',
      'field_6935': 'Country of Manufacture',
      'field_6936': 'Gift Wrapping Available',
      'field_6937': 'Gift Wrapping Price',
      'field_6938': 'Gift Message Available',
      'field_6939': 'News From Date',
      'field_6940': 'News To Date',
      'field_6941': 'Custom Design',
      'field_6942': 'Custom Design From',
      'field_6943': 'Custom Design To',
      'field_6944': 'Custom Layout Update',
      'field_6945': 'Custom Attributes',
      'field_6946': 'Cost',
      'field_6947': 'Special Cost',
      'field_6948': 'Tax Class',
      'field_6949': 'Qty Increment',
      'field_6950': 'Min Qty',
      'field_6951': 'Use Config Min Qty',
      'field_6952': 'Min Sale Qty',
      'field_6953': 'Max Sale Qty',
      'field_6954': 'Max Qty',
      'field_6955': 'Is In Stock',
      'field_6956': 'Stock Status',
      'field_6957': 'Backorders',
      'field_6958': 'Use Config Backorders',
      'field_6959': 'Enable Qty Increments',
      'field_6960': 'Use Config Enable Qty Inc',
      'field_6961': 'Manage Stock',
      'field_6962': 'Use Config Manage Stock',
      'field_6963': 'Use Config Qty Increments',
      'field_6964': 'Use Config Min Sale Qty',
      'field_6965': 'Use Config Max Sale Qty',
      'field_6966': 'Notify Stock Qty',
      'field_6967': 'Use Config Notify Stock Qty',
      'field_6968': 'Stock Availability',
      'field_6969': 'Additional Info',
      'field_6970': 'Related Products',
      'field_6971': 'Cross Sell Products',
      'field_6972': 'Up Sell Products',
      'field_6973': 'Customer Group Prices',
      'field_6974': 'Tier Prices',
      'field_6975': 'Media Gallery',
      'field_6976': 'Media Gallery Labels',
      'field_6977': 'Media Gallery Values',
      'field_6978': 'Custom Options',
      'field_6979': 'Stock Status Text',
      'field_6980': 'Bundle Price Type',
      'field_6981': 'Bundle Price View',
      'field_6982': 'Bundle SKU Type',
      'field_6983': 'Bundle Weight Type',
      'field_6984': 'Bundle Shipment Type',
      'field_6985': 'Downloadable',
      'field_6986': 'Download Link',
      'field_6987': 'Download Sample',
      'field_6988': 'Download Sample Title',
      'field_6989': 'Download Sample URL',
      'field_6990': 'Download Sample File',
      'field_6991': 'Download Sample Type',
      'field_6992': 'Links Purchased Separately',
      'field_6993': 'Links Title',
      'field_6994': 'Samples Title',
      'field_6995': 'Links Exist',
      'field_6996': 'Samples Exist',
      'field_6997': 'Has Options',
      'field_6998': 'Associated Products',
      'field_6999': 'Associated Product Labels',
      'field_7000': 'Associated Product Position',
      'field_7001': 'Required Associated Products',
      'field_7002': 'Category Path',
      'field_7003': 'Category Names',
      'field_7004': 'Root Category',
      'field_7005': 'Parent Category',
      'field_7006': 'Category Position',
      'field_7007': 'Product Type 2'
    }
    
    // Return mapped name if available, otherwise create a readable version
    if (fieldMappings[fieldKey]) {
      return fieldMappings[fieldKey]
    }
    
    // For unknown fields, create a readable name from the field key
    if (fieldKey.startsWith('field_')) {
      const fieldNum = fieldKey.replace('field_', '')
      
      // Try to infer from value content for better naming
      if (typeof value === 'string' && value) {
        if (value.match(/^\d+$/)) return `Product Field ${fieldNum}`
        if (value.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return `Image Field ${fieldNum}`
        if (value.match(/^\d+\.\d+$/)) return `Price Field ${fieldNum}`
        if (value.match(/^\d{4}-\d{2}-\d{2}/)) return `Date Field ${fieldNum}`
        if (value.match(/^(true|false|yes|no|1|0)$/i)) return `Flag Field ${fieldNum}`
        if (value.length > 100) return `Text Field ${fieldNum}`
        if (value.includes(',')) return `List Field ${fieldNum}`
      } else if (typeof value === 'number') {
        return `Numeric Field ${fieldNum}`
      } else if (typeof value === 'boolean') {
        return `Boolean Field ${fieldNum}`
      }
      
      return `Custom Field ${fieldNum}`
    }
    
    // Convert snake_case to Title Case
    return fieldKey.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Helper method to infer field type from value and patterns
  inferFieldType(fieldName, value, uniqueValues = []) {
    if (value === null || value === undefined) return 'text'
    
    // Special handling for known select fields
    if (fieldName === 'field_7007' || fieldName === 'field_6902') { // Product Type 2 and Product Type
      return 'single_select'
    }
    
    // Detect select fields based on unique values pattern
    if (uniqueValues && uniqueValues.length > 1 && uniqueValues.length <= 20) {
      // If field has limited unique values (2-20), likely a select field
      const allStringValues = uniqueValues.every(val => typeof val === 'string' && val.length < 50)
      if (allStringValues) {
        return 'single_select'
      }
    }
    
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'string') {
      // Simple heuristics to guess field types
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) return 'date'
      if (value.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'file'
      if (value.length > 100) return 'long_text'
      return 'text'
    }
    return 'text'
  }
  
  async getRows(tableId, params = {}) {
    const response = await this.client.get(`/database/rows/table/${tableId}/`, { params })
    return response.data
  }
  
  async createRow(tableId, data) {
    const response = await this.client.post(`/database/rows/table/${tableId}/`, data)
    return response.data
  }
  
  async updateRow(tableId, rowId, data) {
    const response = await this.client.patch(`/database/rows/table/${tableId}/${rowId}/`, data)
    return response.data
  }
  
  async deleteRow(tableId, rowId) {
    await this.client.delete(`/database/rows/table/${tableId}/${rowId}/`)
  }
  
  // Test connection using rows endpoint since it works with database tokens
  async testConnection(tableId = null) {
    try {
      // Use the rows endpoint to test the database token (this works!)
      if (tableId) {
        const response = await this.client.get(`/database/rows/table/${tableId}/`, { 
          params: { size: 1 } // Just get 1 row to test connection
        })
        return { success: true, data: response.data }
      } else {
        // Fallback - shouldn't happen but just in case
        return { success: false, error: 'Table ID required for database token authentication' }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      }
    }
  }
}

export default TokenAuthService