export default (client) => {
  return {
    /**
     * Fetches all rows from a specific table with optional filters, search, and sorting
     */
    getRows(tableId, params = {}) {
      const config = {
        params: {
          size: params.size || 200,
          page: params.page || 1,
          ...params,
        },
      }
      
      if (params.search) {
        config.params.search = params.search
      }
      
      if (params.filters) {
        Object.assign(config.params, params.filters)
      }
      
      if (params.order_by) {
        config.params.order_by = params.order_by
      }

      return client.get(`/api/database/rows/table/${tableId}/`, config)
    },

    /**
     * Creates a new row in the specified table
     */
    createRow(tableId, data) {
      return client.post(`/api/database/rows/table/${tableId}/`, data)
    },

    /**
     * Updates a specific row in the table
     */
    updateRow(tableId, rowId, data) {
      return client.patch(`/api/database/rows/table/${tableId}/${rowId}/`, data)
    },

    /**
     * Deletes a specific row from the table
     */
    deleteRow(tableId, rowId) {
      return client.delete(`/api/database/rows/table/${tableId}/${rowId}/`)
    },

    /**
     * Gets table structure/fields information
     */
    getTable(tableId) {
      return client.get(`/api/database/tables/${tableId}/`)
    },

    /**
     * Gets all tables in a database
     */
    getTables(databaseId) {
      return client.get(`/api/database/tables/database/${databaseId}/`)
    },
  }
}