import path from 'path'
import { routes } from './routes'

export default function ProductsModule(moduleOptions) {
  // Register the module routes
  this.extendRoutes((nuxtRoutes) => {
    nuxtRoutes.push(...routes)
  })

  // Add store modules
  this.options.store = true

  // Register plugin
  this.addPlugin({
    src: path.resolve(__dirname, 'plugin.js'),
    fileName: 'products.js',
  })

  // Note: CSS is included in individual components instead of globally
}