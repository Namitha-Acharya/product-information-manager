import axios from 'axios';

// Baserow API configuration
const BASEROW_URL = process.env.REACT_APP_BASEROW_URL || 'https://api.baserow.io';
const API_TOKEN = process.env.REACT_APP_BASEROW_TOKEN || '';
const TABLE_ID = process.env.REACT_APP_BASEROW_TABLE_ID || '';

const api = axios.create({
  baseURL: `${BASEROW_URL}/api/database/rows/table/${TABLE_ID}`,
  headers: {
    'Authorization': `Token ${API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Raw interface for Baserow API response (Table 518)
export interface BaserowProduct {
  id?: number;
  field_5372?: string; // sku
  field_5305?: string; // name
  field_5117?: string; // base_image (Image)
  field_5173?: string; // description
  field_5174?: string; // short_description
  field_5248?: string; // price
  field_5249?: string; // tier_price
  field_5250?: string; // tier_price_global
  field_5251?: string; // sample_price
  field_5186?: string; // vendor_code
  field_5001?: any; // brand (BuildBox)
  field_5325?: any; // enable_product
  field_5011?: any; // color
  field_5188?: boolean; // hidden_from_category
  field_5088?: any; // type
  field_5031?: any; // attribute_set/printing_method
  field_5006?: any; // tax_class
  field_5385?: any; // visibility
  field_5290?: string; // dimensions/kit_height
  field_5296?: string; // kit_width
  field_5309?: string; // kit_length/height
  field_5167?: string; // weight
  field_5216?: any; // product_visibility
  field_5172?: string; // product_name_alt
  field_5143?: any; // customization
  field_5090?: any; // is_customizable_product
  field_5262?: any; // customization_type
  field_5181?: string; // quantity
  field_10480?: any; // categories
  field_5311?: string; // small_image
  field_5345?: string; // thumbnail_image
  field_5180?: string; // is_in_stock
  field_5368?: string; // created_at
  field_5026?: string; // updated_at
  [key: string]: any; // For additional fields
}

// Clean interface for UI components
export interface Product {
  id?: number;
  sku: string;
  name: string;
  image?: string;
  description: string;
  short_description?: string;
  price: number;
  tier_price?: string;
  tier_price_global?: string;
  sample_price?: number;
  vendor_code?: string;
  brand?: string;
  enable_product?: string;
  color?: string;
  hidden_from_category?: string;
  type?: string;
  attribute_set?: string;
  tax_class?: string;
  visibility?: string;
  websites?: string;
  delivery_timeline?: string;
  offineeds_delivery_timeline?: string;
  usual_delivery_times?: string;
  dimensions?: string;
  features?: string;
  product_visibility?: string;
  special_features?: string;
  product_in_box?: string;
  customization?: string;
  material?: string;
  is_customizable_product?: string;
  customization_type?: string;
  kit_height?: string;
  kit_length?: string;
  kit_width?: string;
  quantity: number;
  categories: string;
  base_image?: string;
  small_image?: string;
  thumbnail_image?: string;
  is_in_stock?: string;
  created_at?: string;
  updated_at?: string;
}

// Category interfaces
export interface BaserowCategory {
  id: number;
  field_4898: string; // category_code
  field_4920: string; // name
  field_4930: string; // parent_code
  field_4915: string; // is_active
  field_4935?: any[];  // Products (link_row)
  [key: string]: any;
}

export interface Category {
  id: number;
  code: string;
  name: string;
  parentCode: string;
  isActive: boolean;
  productCount: number;
  subcategories: Category[];
}

export class BaserowService {
  // Helper method to extract image URL from Baserow image field
  static extractImageUrl(imageField: any): string {
    if (!imageField) return '';
    
    // If it's already a string URL, return it
    if (typeof imageField === 'string') return imageField;
    
    // If it's an array of file objects, get the first one
    if (Array.isArray(imageField) && imageField.length > 0) {
      const firstImage = imageField[0];
      return firstImage.url || firstImage.file || '';
    }
    
    // If it's a single file object
    if (typeof imageField === 'object' && imageField.url) {
      return imageField.url;
    }
    
    return '';
  }

  // Convert Baserow field format to clean Product format
  static convertBaserowToProduct(baserowProduct: BaserowProduct): Product {
    // Helper function to extract value from Baserow option fields
    const extractOptionValue = (field: any): string => {
      if (!field) return '';
      if (typeof field === 'string') return field;
      if (field.value) return field.value;
      return '';
    };

    // Helper function to extract category names from link fields
    const extractCategories = (field: any): string => {
      if (!field || !Array.isArray(field)) return '';
      return field.map(item => item.value || '').join(', ');
    };

    return {
      id: baserowProduct.id,
      sku: baserowProduct.field_5372 || '',
      name: baserowProduct.field_5305 || '',
      image: BaserowService.extractImageUrl(baserowProduct.field_5117),
      description: baserowProduct.field_5173 || '',
      short_description: baserowProduct.field_5174 || '',
      price: parseFloat(baserowProduct.field_5248 || '0') || 0,
      tier_price: baserowProduct.field_5249 || '',
      tier_price_global: baserowProduct.field_5250 || '',
      sample_price: parseFloat(baserowProduct.field_5251 || '0') || undefined,
      vendor_code: baserowProduct.field_5186 || '',
      brand: extractCategories(baserowProduct.field_5001) || '',
      enable_product: extractOptionValue(baserowProduct.field_5325),
      color: extractOptionValue(baserowProduct.field_5011),
      hidden_from_category: baserowProduct.field_5188 ? 'Yes' : 'No',
      type: extractOptionValue(baserowProduct.field_5088),
      attribute_set: extractCategories(baserowProduct.field_5031),
      tax_class: extractOptionValue(baserowProduct.field_5006),
      visibility: extractOptionValue(baserowProduct.field_5385),
      websites: extractCategories(baserowProduct.field_5001),
      delivery_timeline: baserowProduct.field_5290 || '',
      offineeds_delivery_timeline: baserowProduct.field_5296 || '',
      usual_delivery_times: baserowProduct.field_5309 || '',
      dimensions: baserowProduct.field_5167 || '',
      features: extractCategories(baserowProduct.field_5031),
      product_visibility: extractOptionValue(baserowProduct.field_5216),
      special_features: extractCategories(baserowProduct.field_5031),
      product_in_box: baserowProduct.field_5172 || '',
      customization: extractOptionValue(baserowProduct.field_5143),
      material: extractOptionValue(baserowProduct.field_5011),
      is_customizable_product: extractOptionValue(baserowProduct.field_5090),
      customization_type: extractOptionValue(baserowProduct.field_5262),
      kit_height: baserowProduct.field_5290 || '',
      kit_length: baserowProduct.field_5296 || '',
      kit_width: baserowProduct.field_5309 || '',
      quantity: parseFloat(baserowProduct.field_5181 || '0') || 0,
      categories: extractCategories(baserowProduct.field_10480),
      base_image: baserowProduct.field_5117 || '',
      small_image: baserowProduct.field_5311 || '',
      thumbnail_image: baserowProduct.field_5345 || '',
      is_in_stock: baserowProduct.field_5180 || '',
      created_at: baserowProduct.field_5368 || '',
      updated_at: baserowProduct.field_5026 || '',
    };
  }

  // Map clean field names to Baserow field names for sorting
  static getBaserowFieldName(cleanFieldName: string): string {
    const fieldMapping: Record<string, string> = {
      'sku': 'field_5372',
      'name': 'field_5305',
      'description': 'field_5173',
      'short_description': 'field_5174',
      'price': 'field_5248',
      'tier_price': 'field_5249',
      'tier_price_global': 'field_5250',
      'sample_price': 'field_5251',
      'vendor_code': 'field_5186',
      'brand': 'field_5001',
      'enable_product': 'field_5325',
      'color': 'field_5011',
      'hidden_from_category': 'field_5188',
      'type': 'field_5088',
      'attribute_set': 'field_5031',
      'tax_class': 'field_5006',
      'visibility': 'field_5385',
      'websites': 'field_5001',
      'dimensions': 'field_5167',
      'quantity': 'field_5181',
      'categories': 'field_10480',
      'is_in_stock': 'field_5180',
      'created_at': 'field_5368',
      'updated_at': 'field_5026'
    };
    return fieldMapping[cleanFieldName] || cleanFieldName;
  }

  // Get all products with optional pagination, filters, and sorting
  static async getProducts(page = 1, size = 10, search = '', filters: any = {}, sortField?: string, sortDirection?: 'asc' | 'desc') {
    try {
      const params: any = {
        page,
        size,
      };

      if (search) {
        params.search = search;
      }

      // Add filters dynamically
      Object.keys(filters).forEach(filterKey => {
        const filterValue = filters[filterKey];
        if (filterValue && filterValue.trim() !== '') {
          if (filterKey === 'category') {
            // Handle category filter
            params[`filter__field_10480__contains`] = filterValue;
          } else {
            // Handle other field filters
            const baserowFieldName = this.getBaserowFieldName(filterKey);
            if (baserowFieldName) {
              // Check if this is an option field
              if (this.isOptionField(filterKey as keyof Product)) {
                // For option fields, filter by the exact value in the option object
                params[`filter__${baserowFieldName}__value__equal`] = filterValue;
              } else {
                // For regular fields, use contains filter
                params[`filter__${baserowFieldName}__contains`] = filterValue;
              }
            }
          }
        }
      });

      // Add sorting if provided
      if (sortField && sortDirection) {
        const baserowFieldName = this.getBaserowFieldName(sortField);
        params.order_by = sortDirection === 'desc' ? `-${baserowFieldName}` : baserowFieldName;
      }

      const response = await api.get('/', { params });
      
      // Convert all products to clean format
      const products = response.data.results.map((product: BaserowProduct) => 
        this.convertBaserowToProduct(product)
      );

      return {
        results: products,
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Create a new product
  static async createProduct(product: Omit<Product, 'id'>) {
    try {
      const response = await api.post('/', product);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Update a product
  static async updateProduct(id: number, product: Partial<Product>) {
    try {
      const response = await api.patch(`/${id}/`, product);
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Delete a product
  static async deleteProduct(id: number) {
    try {
      await api.delete(`/${id}/`);
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Delete multiple products
  static async deleteProducts(ids: number[]) {
    try {
      const deletePromises = ids.map(id => this.deleteProduct(id));
      await Promise.all(deletePromises);
      return true;
    } catch (error) {
      console.error('Error deleting products:', error);
      throw error;
    }
  }

  // Get unique categories for filter dropdown (legacy method - use getCategoriesWithSubcategories instead)
  static async getCategories() {
    // This would need to be implemented based on Baserow's field options API
    // For now, return common categories
    return [
      'Electronics',
      'Apparel',
      'Home Goods',
      'Books & Media',
      'Sports & Outdoors',
      'Cameras',
      'Audio',
      'Winter Sports',
      'Living Room Furniture',
      'Womens Clothing',
      'Magazines',
      'Childrens Books'
    ];
  }

  // Convert Baserow category to clean format
  static convertBaserowToCategory(baserowCategory: BaserowCategory): Category {
    return {
      id: baserowCategory.id,
      code: baserowCategory.field_4898 || '',
      name: baserowCategory.field_4920 || '',
      parentCode: baserowCategory.field_4930 || '',
      isActive: baserowCategory.field_4915 === '1',
      productCount: 0, // Will be calculated separately
      subcategories: []
    };
  }

  // Get all categories from Baserow categories table
  static async getAllCategories(): Promise<BaserowCategory[]> {
    try {
      const categoriesApi = axios.create({
        baseURL: `${BASEROW_URL}/api/database/rows/table/517`,
        headers: {
          'Authorization': `Token ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      let allCategories: BaserowCategory[] = [];
      let currentPage = 1;
      let hasMore = true;
      const pageSize = 200;

      while (hasMore) {
        const response = await categoriesApi.get('/', {
          params: {
            page: currentPage,
            size: pageSize
          }
        });

        allCategories = [...allCategories, ...response.data.results];
        hasMore = response.data.next !== null;
        currentPage++;
      }

      return allCategories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Get product counts for categories by analyzing products
  static async getCategoryProductCounts(): Promise<Map<string, number>> {
    try {
      // Load all products to count category assignments
      let allProducts: BaserowProduct[] = [];
      let currentPage = 1;
      let hasMore = true;
      const pageSize = 200;

      while (hasMore) {
        const response = await api.get('/', {
          params: {
            page: currentPage,
            size: pageSize
          }
        });

        allProducts = [...allProducts, ...response.data.results];
        hasMore = response.data.next !== null;
        currentPage++;
      }

      // Count products per category
      const categoryProductCounts = new Map<string, number>();

      allProducts.forEach(product => {
        // Count from link_row categories (field_10480)
        if (product.field_10480 && Array.isArray(product.field_10480)) {
          product.field_10480.forEach((linkCat: any) => {
            if (linkCat.value) {
              const count = categoryProductCounts.get(linkCat.value) || 0;
              categoryProductCounts.set(linkCat.value, count + 1);
            }
          });
        }
      });

      return categoryProductCounts;
    } catch (error) {
      console.error('Error getting category product counts:', error);
      return new Map();
    }
  }

  // Get categories with subcategories and product counts for navigation
  // Get unique values for filter dropdowns
  static async getUniqueFieldValues(fieldName: keyof Product): Promise<string[]> {
    try {
      // Get all products (without pagination) to extract unique values
      const response = await api.get('/', { params: { size: 1000 } });
      const products = response.data.results;
      
      // Get the corresponding Baserow field name
      const baserowFieldName = this.getBaserowFieldName(fieldName);
      
      // Check if this is an option field by examining the data structure
      const isOptionField = this.isOptionField(fieldName);
      
      if (isOptionField) {
        // For option fields, extract the 'value' from the option objects
        const values = products
          .map((product: BaserowProduct) => {
            const fieldValue = product[baserowFieldName as keyof BaserowProduct];
            if (fieldValue && typeof fieldValue === 'object' && fieldValue.value) {
              return fieldValue.value;
            }
            return null;
          })
          .filter((value: any) => value && value.toString().trim() !== '');
        
        const uniqueValues = Array.from(new Set(values)).sort() as string[];
        return uniqueValues;
      } else {
        // For regular fields, use the converted products
        const convertedProducts = products.map((product: BaserowProduct) => 
          this.convertBaserowToProduct(product)
        );
        
        const values = convertedProducts
          .map((product: Product) => product[fieldName])
          .filter((value: any) => value && value.toString().trim() !== '')
          .map((value: any) => value.toString().trim());
        
        const uniqueValues = Array.from(new Set(values)).sort() as string[];
        return uniqueValues;
      }
    } catch (error) {
      console.error(`Error fetching unique values for ${fieldName}:`, error);
      return [];
    }
  }

  // Helper method to determine if a field is an option field
  static isOptionField(fieldName: keyof Product): boolean {
    const optionFields: (keyof Product)[] = [
      'enable_product',
      'color', 
      'type',
      'tax_class',
      'visibility',
      'product_visibility',
      'customization',
      'is_customizable_product',
      'customization_type'
    ];
    return optionFields.includes(fieldName);
  }

  static async getCategoriesWithSubcategories() {
    try {
      console.log('🔄 Fetching categories from Baserow...');
      
      // First load just categories for fast UI response
      const allBaserowCategories = await this.getAllCategories();
      console.log('✅ Fetched', allBaserowCategories.length, 'categories');
      
      // Skip product counts for now to improve performance
      // TODO: Implement lazy loading of product counts or server-side aggregation
      const productCounts = new Map<string, number>();

      // Convert to clean format and add product counts
      const cleanCategories = allBaserowCategories
        .filter(cat => cat.field_4915 === '1') // Only active categories
        .map(cat => {
          const cleanCat = this.convertBaserowToCategory(cat);
          cleanCat.productCount = productCounts.get(cleanCat.code) || 0;
          return cleanCat;
        });

      console.log('🔧 Active categories:', cleanCategories.length);

      // Filter for main categories (root level categories)
      const mainCategories = cleanCategories.filter(cat => {
        // Only include categories that are either:
        // 1. Direct children of root_catalog_main_by_category, OR
        // 2. The special root_catalog_buildbox category, OR
        // 3. Categories without clear parent structure (but exclude other root catalogs)
        return (
          cat.parentCode === 'root_catalog_main_by_category' ||
          cat.code === 'root_catalog_buildbox' ||
          (!cat.parentCode.startsWith('root_catalog') && cat.parentCode !== '')
        );
      });

      console.log('🎯 Main categories to display:', mainCategories.length);
      console.log('Main categories:', mainCategories.map(cat => `${cat.name} (${cat.code}) - parent: ${cat.parentCode} - products: ${cat.productCount}`));

      // Remove any potential duplicates by code
      const uniqueMainCategories = mainCategories.filter((category, index, self) => 
        index === self.findIndex(c => c.code === category.code)
      );

      // Sort by name only since we don't have product counts
      uniqueMainCategories.sort((a, b) => a.name.localeCompare(b.name));

      // Convert to the expected CategoryTree format
      const categoriesWithSubcategories = uniqueMainCategories.map(category => {
        // Find subcategories without product counts for now
        const subcategoriesWithCounts = cleanCategories
          .filter(sub => sub.parentCode === category.code)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(sub => ({
            name: sub.name,
            code: sub.code,
            productCount: 0 // Temporarily set to 0 for performance
          }));

        // Set product count to 0 for now (can be lazy loaded later)
        const totalProductCount = 0;

        return {
          name: category.name,
          code: category.code,
          productCount: totalProductCount,
          subcategories: subcategoriesWithCounts.map(sub => sub.name),
          subcategoriesWithCounts: subcategoriesWithCounts
        };
      });

      console.log('🏷️ Final category structure:');
      categoriesWithSubcategories.forEach(cat => {
        console.log(`  - ${cat.name}: ${cat.productCount} products, ${cat.subcategories.length} subcategories`);
      });

      return categoriesWithSubcategories.length > 0 ? categoriesWithSubcategories : [
        {
          name: 'All Categories',
          code: '',
          productCount: 0,
          subcategories: []
        }
      ];
    } catch (error) {
      console.error('Error fetching categories with subcategories:', error);
      // Fallback
      return [
        {
          name: 'All Categories', 
          code: '',
          productCount: 0,
          subcategories: []
        }
      ];
    }
  }
}