# Product Information Manager (PIM)

A React-based Product Information Manager that integrates with Baserow database for managing product catalogs.

## Features

### ✅ Implemented
- **Product Catalog View**: Browse products in a table with filters and search
- **Sidebar Filters**: Filter products by category
- **Search Functionality**: Search by product name, description, or SKU  
- **Create Product Form**: Add new products with comprehensive fields
- **Bulk Operations**: Select multiple products for batch deletion
- **Pagination**: Navigate through large product datasets
- **Responsive Design**: Works on desktop and mobile devices

### 🚀 Ready for Enhancement
- **Edit Product**: Update existing product information
- **Advanced Filters**: Sort by price, quantity, etc.
- **Product Images**: Upload and display product photos
- **Export Data**: CSV/Excel export functionality

## Setup Instructions

### 1. Install Dependencies
```bash
cd product-catalog
npm install
```

### 2. Configure Baserow Integration
Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` with your Baserow credentials:
```env
REACT_APP_BASEROW_URL=https://api.baserow.io
REACT_APP_BASEROW_TOKEN=your_baserow_api_token_here
REACT_APP_BASEROW_TABLE_ID=your_table_id_here
```

### 3. Baserow Setup
1. Create a Baserow account at https://baserow.io
2. Create a new database and table with these fields:
   - `name` (Text)
   - `description` (Long Text)  
   - `price` (Number)
   - `quantity` (Number)
   - `sku` (Text)
   - `weight` (Text - optional)
   - `dimensions` (Text - optional)
   - `material` (Text - optional)
   - `category` (Text)
   - `supplier` (Text - optional)

3. Generate an API token from your Baserow account settings
4. Get your table ID from the Baserow API documentation

### 4. Start Development Server
```bash
npm start
```

The application will be available at http://localhost:3000 (or 3001 if 3000 is occupied).

## Project Structure

```
src/
├── components/
│   ├── ProductCatalog.tsx    # Main product listing page
│   ├── ProductCatalog.css    # Styling for catalog page
│   ├── CreateProduct.tsx     # Add new product form
│   └── CreateProduct.css     # Styling for form page
├── services/
│   └── baserowApi.ts         # Baserow API integration
├── App.tsx                   # Main application component
└── App.css                   # Global styles
```

## API Integration

The application uses Baserow's REST API for:
- **GET /api/database/rows/table/{id}/**: Fetch products with pagination and filtering
- **POST /api/database/rows/table/{id}/**: Create new products
- **PATCH /api/database/rows/table/{id}/{row_id}/**: Update existing products
- **DELETE /api/database/rows/table/{id}/{row_id}/**: Delete products

## Demo Mode

If Baserow API is not configured or fails, the application falls back to mock data for demonstration purposes.

## Troubleshooting

### Common Issues
1. **Port already in use**: Try `PORT=3001 npm start`
2. **API errors**: Verify your Baserow token and table ID
3. **CORS issues**: Ensure your Baserow instance allows requests from localhost

### Development
- TypeScript is configured for type checking
- ESLint rules are applied for code quality
- Components use CSS Modules for scoped styling

## Next Steps

To enhance this application:
1. Add product image upload functionality
2. Implement edit product modal
3. Add advanced sorting and filtering
4. Include data export features
5. Add user authentication and role management
