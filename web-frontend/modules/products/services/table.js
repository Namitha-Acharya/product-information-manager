export default (client) => {
  return {
    get(tableId) {
      return client.get(`/database/tables/${tableId}/`)
    },
    getRows(tableId, params = {}) {
      return client.get(`/database/rows/table/${tableId}/`, { params })
    },
    createRow(tableId, values) {
      return client.post(`/database/rows/table/${tableId}/`, values)
    },
    updateRow(tableId, rowId, values) {
      return client.patch(`/database/rows/table/${tableId}/${rowId}/`, values)
    },
    deleteRow(tableId, rowId) {
      return client.delete(`/database/rows/table/${tableId}/${rowId}/`)
    }
  }
}