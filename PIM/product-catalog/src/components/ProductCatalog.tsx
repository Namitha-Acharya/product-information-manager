import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Plus, Trash2, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { BaserowService, Product } from '../services/baserowApi';
import './ProductCatalog.css';


interface ProductCatalogProps {
  onCreateProduct: () => void;
}

type SortDirection = 'asc' | 'desc' | null;
type SortField = keyof Product | null;

interface ColumnFilter {
  field: keyof Product;
  value: string;
  operator: 'contains' | 'equals' | 'greater' | 'less';
}

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({ onCreateProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: null });
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});

  const loadFilterOptions = async () => {
    try {
      // Load unique values for key filterable fields
      const fieldsToLoad: (keyof Product)[] = ['categories', 'brand', 'type', 'enable_product', 'visibility'];
      const options: Record<string, string[]> = {};
      
      await Promise.all(
        fieldsToLoad.map(async (field) => {
          try {
            const values = await BaserowService.getUniqueFieldValues(field);
            options[field] = values;
          } catch (error) {
            console.error(`Failed to load filter options for ${field}:`, error);
            options[field] = [];
          }
        })
      );
      
      setFilterOptions(options);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, selectedCategory, itemsPerPage, sortConfig, columnFilters]);

  // Load filter options on component mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, itemsPerPage, sortConfig, columnFilters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading products - current page:', currentPage, 'items per page:', itemsPerPage);
      
      // Build filters from column filters and category selection
      const filters: any = {};
      
      // Add category filter from sidebar (if any)
      if (selectedCategory) {
        filters.category = selectedCategory;
      }
      
      // Add column filters
      columnFilters.forEach(filter => {
        if (filter.field === 'categories') {
          // Handle category column filter
          filters.category = filter.value;
        } else {
          // Handle other column filters - we'll need to extend the API for this
          filters[filter.field] = filter.value;
        }
      });
      
      const response = await BaserowService.getProducts(
        currentPage,
        itemsPerPage,
        searchTerm,
        filters,
        sortConfig.field || undefined,
        sortConfig.direction || undefined
      );
      
      console.log('✅ Products loaded:', response.results.length, 'of', response.count);
      setProducts(response.results);
      setTotalProducts(response.count);
      
    } catch (error) {
      console.error('❌ Failed to load products:', error);
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  // Note: Client-side filtering temporarily disabled - using server-side pagination for now




  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id!));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) return;
    
    try {
      await BaserowService.deleteProducts(selectedProducts);
      setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      console.error('Failed to delete products:', error);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSearchTerm('');
    setCurrentPage(1);
    setColumnFilters([]);
    setSortConfig({ field: null, direction: null });
    setShowFilterRow(false);
  };

  const handleSort = (field: keyof Product) => {
    setSortConfig(prev => {
      if (prev.field === field) {
        // Cycle through: asc -> desc -> null
        if (prev.direction === 'asc') {
          return { field, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { field: null, direction: null };
        }
      }
      return { field, direction: 'asc' };
    });
  };

  const handleColumnFilter = (field: keyof Product, value: string, operator: 'contains' | 'equals' | 'greater' | 'less' = 'contains') => {
    setColumnFilters(prev => {
      const existingIndex = prev.findIndex(f => f.field === field);
      if (value === '') {
        // Remove filter if value is empty
        return prev.filter(f => f.field !== field);
      }
      
      const newFilter = { field, value, operator };
      if (existingIndex >= 0) {
        // Update existing filter
        const updated = [...prev];
        updated[existingIndex] = newFilter;
        return updated;
      } else {
        // Add new filter
        return [...prev, newFilter];
      }
    });
  };

  const removeColumnFilter = (field: keyof Product) => {
    setColumnFilters(prev => prev.filter(f => f.field !== field));
  };

  const getSortIcon = (field: keyof Product) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown size={14} className="sort-icon" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp size={14} className="sort-icon active" />;
    }
    if (sortConfig.direction === 'desc') {
      return <ArrowDown size={14} className="sort-icon active" />;
    }
    return <ArrowUpDown size={14} className="sort-icon" />;
  };

  const getColumnFilter = (field: keyof Product) => {
    return columnFilters.find(f => f.field === field)?.value || '';
  };

  const shouldUseDropdown = (field: keyof Product) => {
    return filterOptions[field] && filterOptions[field].length > 0;
  };

  // Define columns configuration
  const columns = [
    { field: 'sku' as keyof Product, label: 'SKU' },
    { field: 'name' as keyof Product, label: 'Product Name' },
    { field: 'categories' as keyof Product, label: 'Category' },
    { field: 'image' as keyof Product, label: 'Image', sortable: false },
    { field: 'description' as keyof Product, label: 'Description' },
    { field: 'short_description' as keyof Product, label: 'Short Description' },
    { field: 'price' as keyof Product, label: 'Price' },
    { field: 'tier_price' as keyof Product, label: 'Tier Price' },
    { field: 'tier_price_global' as keyof Product, label: 'Tier Price (Global)' },
    { field: 'sample_price' as keyof Product, label: 'Sample Price' },
    { field: 'vendor_code' as keyof Product, label: 'Vendor Code' },
    { field: 'brand' as keyof Product, label: 'Brand' },
    { field: 'enable_product' as keyof Product, label: 'Enable Product' },
    { field: 'color' as keyof Product, label: 'Color' },
    { field: 'hidden_from_category' as keyof Product, label: 'Hidden From Category' },
    { field: 'type' as keyof Product, label: 'Type' },
    { field: 'attribute_set' as keyof Product, label: 'Attribute Set' },
    { field: 'tax_class' as keyof Product, label: 'Tax Class' },
    { field: 'visibility' as keyof Product, label: 'Visibility' },
    { field: 'websites' as keyof Product, label: 'Websites' },
    { field: 'delivery_timeline' as keyof Product, label: 'Dispatch Timeline' },
    { field: 'offineeds_delivery_timeline' as keyof Product, label: 'Dispatch Timeline (Offineeds)' },
    { field: 'usual_delivery_times' as keyof Product, label: 'Dispatch Timeline (Usual)' },
    { field: 'dimensions' as keyof Product, label: 'Dimensions' },
    { field: 'features' as keyof Product, label: 'Features' },
    { field: 'product_visibility' as keyof Product, label: 'Product Visibility' },
    { field: 'special_features' as keyof Product, label: 'Special Features' },
    { field: 'product_in_box' as keyof Product, label: 'Product In Box' },
    { field: 'customization' as keyof Product, label: 'Customization' },
    { field: 'material' as keyof Product, label: 'Material' },
    { field: 'is_customizable_product' as keyof Product, label: 'Is Customizable Product?' },
    { field: 'customization_type' as keyof Product, label: 'Customization Type' },
    { field: 'kit_height' as keyof Product, label: 'Kit Height' },
    { field: 'kit_length' as keyof Product, label: 'Kit Length' },
    { field: 'kit_width' as keyof Product, label: 'Kit Width' },
  ];

  return (
    <div className="product-catalog">
      <div className="sidebar">
        {/* Left sidebar - currently blank */}
      </div>

      <div className="main-content">
        <div className="header">
          <h1>Product Catalog</h1>
          <div className="header-actions">
            <button
              onClick={onCreateProduct}
              className="btn btn-primary"
            >
              <Plus size={16} />
              Add New Product
            </button>
            {selectedProducts.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="btn btn-danger"
              >
                <Trash2 size={16} />
                Delete ({selectedProducts.length})
              </button>
            )}
          </div>
        </div>

        <div className="toolbar">
          <div className="search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search products by name, description, or SKU"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="toolbar-actions">
            <button 
              className={`btn btn-outline ${showFilterRow ? 'active' : ''}`}
              onClick={() => setShowFilterRow(!showFilterRow)}
            >
              <Filter size={16} />
              {showFilterRow ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button className="btn btn-outline" onClick={handleClearFilters}>
              <X size={16} />
              Clear All
            </button>
          </div>
        </div>

        <div className="product-table">
          <table>
            <thead>
              <tr className="header-row">
                <th className="checkbox-header">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                {columns.map(column => (
                  <th key={column.field} className="sortable-header">
                    <div className="header-content">
                      <span className="header-label">{column.label}</span>
                      {column.sortable !== false && (
                        <button 
                          className="sort-button"
                          onClick={() => handleSort(column.field)}
                          title={`Sort by ${column.label}`}
                        >
                          {getSortIcon(column.field)}
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="actions-header">Actions</th>
              </tr>
              {showFilterRow && (
                <tr className="filter-row">
                  <th className="checkbox-filter"></th>
                  {columns.map(column => (
                    <th key={`filter-${column.field}`} className="filter-cell">
                      <div className="filter-input-container">
                        {shouldUseDropdown(column.field) ? (
                          <select
                            value={getColumnFilter(column.field)}
                            onChange={(e) => handleColumnFilter(column.field, e.target.value)}
                            className="filter-input"
                          >
                            <option value="">{`All ${column.label}`}</option>
                            {filterOptions[column.field]?.map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder={`Filter ${column.label}...`}
                            value={getColumnFilter(column.field)}
                            onChange={(e) => handleColumnFilter(column.field, e.target.value)}
                            className="filter-input"
                          />
                        )}
                        {getColumnFilter(column.field) && (
                          <button 
                            className="clear-filter-btn"
                            onClick={() => removeColumnFilter(column.field)}
                            title="Clear filter"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="actions-filter"></th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 2} className="loading">Loading...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="no-data">No products found. Try adjusting your filters.</td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id}>
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id!)}
                        onChange={() => handleSelectProduct(product.id!)}
                      />
                    </td>
                    {columns.map(column => (
                      <td key={`${product.id}-${column.field}`} className={column.field === 'image' ? 'image-cell' : column.field.includes('description') ? 'description' : ''}>
                        {column.field === 'image' ? (
                          product.image ? (
                            <img src={product.image} alt={product.name} className="product-thumbnail" />
                          ) : (
                            <div className="no-image">No Image</div>
                          )
                        ) : column.field === 'price' || column.field === 'sample_price' ? (
                          typeof product[column.field] === 'number' ? `₹${(product[column.field] as number).toFixed(2)}` : (product[column.field] || '-')
                        ) : (
                          String(product[column.field] || '')
                        )}
                      </td>
                    ))}
                    <td className="actions-cell">
                      <button className="btn-icon">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <div className="pagination-info">
            <div className="items-per-page">
              <span className="items-label">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="items-dropdown"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="items-label">per page</span>
            </div>
            <span>Displaying {Math.min(itemsPerPage, products.length)} of {totalProducts} products</span>
            {totalProducts > 0 && (
              <span className="page-info">({Math.ceil(totalProducts / itemsPerPage)} pages total)</span>
            )}
          </div>
          <div className="pagination-controls">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="pagination-btn pagination-btn-compact"
              title="First page"
            >
              ««
            </button>
            
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="pagination-btn"
            >
              Previous
            </button>
            
            <div className="page-selector">
              <span className="page-label">Page</span>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="page-dropdown"
              >
                {Array.from({ length: Math.ceil(totalProducts / itemsPerPage) }, (_, i) => i + 1).map(page => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                ))}
              </select>
              <span className="page-total">of {Math.ceil(totalProducts / itemsPerPage)}</span>
            </div>
            
            <button
              disabled={currentPage * itemsPerPage >= totalProducts}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="pagination-btn"
            >
              Next
            </button>
            
            <button
              disabled={currentPage * itemsPerPage >= totalProducts}
              onClick={() => setCurrentPage(Math.ceil(totalProducts / itemsPerPage))}
              className="pagination-btn pagination-btn-compact"
              title="Last page"
            >
              »»
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCatalog;