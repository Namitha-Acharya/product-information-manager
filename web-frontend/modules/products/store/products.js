import ProductsService from '../services/products'

export const state = () => ({
  rows: [],
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 50,
  searchQuery: '',
  filters: {},
  sortField: null,
  sortOrder: 'asc',
  table: null,
  editingRow: null,
})

export const mutations = {
  SET_LOADING(state, loading) {
    state.loading = loading
  },

  SET_ERROR(state, error) {
    state.error = error
  },

  SET_ROWS(state, { results, count }) {
    state.rows = results
    state.totalCount = count
  },

  ADD_ROW(state, row) {
    state.rows.unshift(row)
    state.totalCount += 1
  },

  UPDATE_ROW(state, updatedRow) {
    const index = state.rows.findIndex(row => row.id === updatedRow.id)
    if (index !== -1) {
      state.rows.splice(index, 1, updatedRow)
    }
  },

  DELETE_ROW(state, rowId) {
    const index = state.rows.findIndex(row => row.id === rowId)
    if (index !== -1) {
      state.rows.splice(index, 1)
      state.totalCount -= 1
    }
  },

  SET_SEARCH_QUERY(state, query) {
    state.searchQuery = query
  },

  SET_FILTERS(state, filters) {
    state.filters = filters
  },

  SET_SORT(state, { field, order }) {
    state.sortField = field
    state.sortOrder = order
  },

  SET_PAGE(state, page) {
    state.currentPage = page
  },

  SET_PAGE_SIZE(state, size) {
    state.pageSize = size
  },

  SET_TABLE(state, table) {
    state.table = table
  },

  SET_EDITING_ROW(state, rowId) {
    state.editingRow = rowId
  },

  CLEAR_EDITING_ROW(state) {
    state.editingRow = null
  },
}

export const actions = {
  async fetchRows({ commit, state }, { tableId, page = 1, forceRefresh = false }) {
    if (state.loading && !forceRefresh) return

    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      const params = {
        page,
        size: state.pageSize,
      }

      if (state.searchQuery) {
        params.search = state.searchQuery
      }

      if (state.sortField) {
        params.order_by = state.sortOrder === 'desc' ? `-${state.sortField}` : state.sortField
      }

      if (Object.keys(state.filters).length > 0) {
        params.filters = state.filters
      }

      const response = await this.$axios.$get(`/api/database/rows/table/${tableId}/`, { params })
      
      commit('SET_ROWS', response)
      commit('SET_PAGE', page)
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.error || 'Failed to fetch rows')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchTable({ commit }, tableId) {
    try {
      const table = await this.$axios.$get(`/api/database/tables/${tableId}/`)
      commit('SET_TABLE', table)
      return table
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.error || 'Failed to fetch table')
      throw error
    }
  },

  async createRow({ commit }, { tableId, data }) {
    try {
      const newRow = await this.$axios.$post(`/api/database/rows/table/${tableId}/`, data)
      commit('ADD_ROW', newRow)
      return newRow
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.error || 'Failed to create row')
      throw error
    }
  },

  async updateRow({ commit }, { tableId, rowId, data }) {
    try {
      const updatedRow = await this.$axios.$patch(`/api/database/rows/table/${tableId}/${rowId}/`, data)
      commit('UPDATE_ROW', updatedRow)
      return updatedRow
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.error || 'Failed to update row')
      throw error
    }
  },

  async deleteRow({ commit }, { tableId, rowId }) {
    try {
      await this.$axios.$delete(`/api/database/rows/table/${tableId}/${rowId}/`)
      commit('DELETE_ROW', rowId)
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.error || 'Failed to delete row')
      throw error
    }
  },

  setSearch({ commit, dispatch }, { query, tableId }) {
    commit('SET_SEARCH_QUERY', query)
    return dispatch('fetchRows', { tableId, page: 1, forceRefresh: true })
  },

  setFilters({ commit, dispatch }, { filters, tableId }) {
    commit('SET_FILTERS', filters)
    return dispatch('fetchRows', { tableId, page: 1, forceRefresh: true })
  },

  setSort({ commit, dispatch }, { field, order, tableId }) {
    commit('SET_SORT', { field, order })
    return dispatch('fetchRows', { tableId, page: 1, forceRefresh: true })
  },

  setPage({ commit, dispatch }, { page, tableId }) {
    return dispatch('fetchRows', { tableId, page })
  },

  startEditing({ commit }, rowId) {
    commit('SET_EDITING_ROW', rowId)
  },

  stopEditing({ commit }) {
    commit('CLEAR_EDITING_ROW')
  },
}

export const getters = {
  isLoading: (state) => state.loading,
  hasError: (state) => !!state.error,
  getRows: (state) => state.rows,
  getTotalCount: (state) => state.totalCount,
  getCurrentPage: (state) => state.currentPage,
  getPageSize: (state) => state.pageSize,
  getSearchQuery: (state) => state.searchQuery,
  getFilters: (state) => state.filters,
  getSortField: (state) => state.sortField,
  getSortOrder: (state) => state.sortOrder,
  getTable: (state) => state.table,
  getEditingRow: (state) => state.editingRow,
  isEditing: (state) => (rowId) => state.editingRow === rowId,
}