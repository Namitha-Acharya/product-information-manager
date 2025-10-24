<template>
  <div class="products-table-page">
    <ProductsTable
      :table-id="tableId"
    />
  </div>
</template>

<script>
import ProductsTable from '../components/ProductsTable'

export default {
  name: 'ProductsTablePage',
  components: {
    ProductsTable,
  },
  computed: {
    tableId() {
      return this.$route.params.tableId
    },
  },
}
</script>

<style lang="scss" scoped>
.products-table-page {
  min-height: 100vh;
  background: #f7f7f7;
}
</style>