# Products Module

A custom Baserow module for managing products data with advanced filtering, sorting, search, and inline editing capabilities.

## Features

- **Table Display**: View products from any Baserow table
- **Search**: Real-time search across all table fields
- **Sorting**: Click column headers to sort data
- **Filtering**: Advanced filtering capabilities
- **Inline Editing**: Edit cells directly in the table
- **CRUD Operations**: Create, read, update, and delete products
- **Pagination**: Handle large datasets efficiently
- **Responsive Design**: Works on desktop and mobile devices

## Components

### ProductsTable.vue
Main table component that displays products data with all interactive features.

**Props:**
- `tableId` (String|Number): ID of the Baserow table to display

**Events:**
- `add-product`: Emitted when the add product button is clicked

### ProductsCell.vue
Handles individual cell display and editing based on field types.

**Props:**
- `field` (Object): Baserow field configuration
- `row` (Object): Row data
- `editing` (Boolean): Whether the cell is in edit mode

**Events:**
- `update`: Emitted when cell value is updated
- `cancel`: Emitted when edit is cancelled

### AddProductForm.vue
Modal form for creating new products.

**Props:**
- `tableId` (String|Number): ID of the target table

**Events:**
- `success`: Emitted when product is created successfully
- `cancel`: Emitted when form is cancelled

## Usage

1. **Access the Products Module**
   Navigate to `/products` in your Baserow instance.

2. **Select a Table**
   Choose a table from the dropdown to display its data.

3. **Search and Filter**
   Use the search bar to find specific products.

4. **Edit Data**
   Click the edit icon on any row to enable inline editing.

5. **Add New Products**
   Click the "Add Product" button to open the creation form.

## Supported Field Types

- Text
- Long Text
- Number
- Boolean
- Date
- Single Select
- URL
- Email

## API Endpoints Used

- `GET /api/database/rows/table/{tableId}/` - Fetch rows
- `POST /api/database/rows/table/{tableId}/` - Create row
- `PATCH /api/database/rows/table/{tableId}/{rowId}/` - Update row
- `DELETE /api/database/rows/table/{tableId}/{rowId}/` - Delete row
- `GET /api/database/tables/{tableId}/` - Get table info

## Store Structure

The module uses Vuex for state management with the following structure:

```javascript
state: {
  rows: [],              // Table rows
  loading: false,        // Loading state
  error: null,          // Error messages
  totalCount: 0,        // Total number of rows
  currentPage: 1,       // Current pagination page
  pageSize: 50,         // Rows per page
  searchQuery: '',      // Current search query
  filters: {},          // Applied filters
  sortField: null,      // Current sort field
  sortOrder: 'asc',     // Sort direction
  table: null,          // Table metadata
  editingRow: null,     // ID of row being edited
}
```

## Installation

The module is automatically loaded when Baserow starts. It's registered in the base configuration at `config/nuxt.config.base.js`.

## Routes

- `/products` - Main products page with table selection
- `/products/:tableId` - Direct access to a specific table

## Development

To extend or modify the products module:

1. **Add New Field Types**: Extend `ProductsCell.vue` with new field type handlers
2. **Custom Filters**: Add filter components and integrate with the store
3. **Bulk Operations**: Extend the table component with selection and bulk actions
4. **Export Features**: Add CSV/Excel export functionality

## Troubleshooting

- **Module not loading**: Check that it's properly registered in `nuxt.config.base.js`
- **API errors**: Verify table permissions and API endpoint availability
- **Styling issues**: Check that SCSS imports are correct and base styles are loaded