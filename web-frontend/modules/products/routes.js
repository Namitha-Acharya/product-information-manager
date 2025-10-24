import path from 'path'

export const routes = [
  {
    name: 'products',
    path: '/products',
    component: path.resolve(__dirname, 'pages/Products.vue'),
  },
  {
    name: 'products-demo',
    path: '/products/demo',
    component: path.resolve(__dirname, 'components/ProductsManager.vue'),
  },
  {
    name: 'products-simple',
    path: '/products/simple',
    component: path.resolve(__dirname, 'components/SimpleProductsTable.vue'),
  },
]