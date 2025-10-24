<template>
  <div class="products-page">
    <!-- Use the comprehensive ProductManagementTable component -->
    <ProductManagementTable />
  </div>
</template>

<script>
import ProductManagementTable from '../components/ProductManagementTable'

export default {
  name: 'Products',
  components: {
    ProductManagementTable,
  },
}
</script>

<style lang="scss" scoped>
.products-page {
  padding: 20px;
  min-height: 100vh;
}
</style>