# Products Table Setup Guide

This guide will help you set up a Products table in Baserow and connect it to the Products Management UI.

## Step 1: Create a Products Table in Baserow

1. **Login to Baserow**
   - Navigate to `http://localhost:3001`
   - Create an account or login with existing credentials

2. **Create a New Database**
   - Click "Create database"
   - Name it "E-commerce" or "Products Database"

3. **Create Products Table**
   - Click "Create table"
   - Name it "Products"

4. **Add Fields to Your Products Table**
   
   Create these fields (click the + button to add fields):
   
   | Field Name | Field Type | Description |
   |-----------|------------|-------------|
   | `name` | Text | Product name |
   | `price` | Number | Product price |
   | `category` | Single Select | Product category |
   | `description` | Long Text | Product description |
   | `sku` | Text | Stock keeping unit |
   | `in_stock` | Boolean | Is product in stock |
   | `launch_date` | Date | Product launch date |
   | `website` | URL | Product webpage |
   | `rating` | Rating | Customer rating (1-5) |

5. **Configure Single Select Options for Category**
   - Electronics
   - Accessories  
   - Software
   - Hardware
   - Clothing
   - Books

6. **Add Sample Data**
   
   Add some sample products:
   
   ```
   MacBook Pro M2 | 2399.99 | Electronics | High-performance laptop | MBP-M2-16 | ✓ | 2023-01-15 | https://apple.com | 5
   Wireless Mouse | 79.99 | Accessories | Ergonomic wireless mouse | WM-001 | ✓ | 2022-06-01 | https://example.com | 4
   Design Software | 299.00 | Software | Professional design suite | DS-PRO | ✓ | 2023-03-10 | https://designsuite.com | 5
   ```

## Step 2: Find Your Table ID

1. **Navigate to Your Products Table**
   - Open your Products table in Baserow
   
2. **Get Table ID from URL**
   - Look at the browser URL
   - It should look like: `http://localhost:3001/database/123/table/456`
   - The number after `/table/` is your Table ID (e.g., `456`)

## Step 3: Connect to Products Management UI

1. **Open Products Management**
   - Navigate to `http://localhost:3001/products`
   
2. **Enter Your Table ID**
   - In the "Table ID" field, enter the ID you found in Step 2
   - Click "Connect to Table"

3. **Start Managing Products**
   - Your products data will load automatically
   - Use search, sorting, and editing features
   - Add new products with the "Add Product" button

## Features Available

### ✅ Real-time Data Operations
- **Search**: Filter products by any field
- **Sort**: Click column headers to sort data
- **Edit**: Click edit button to modify products inline  
- **Add**: Create new products with dynamic form
- **Delete**: Remove products with confirmation

### ✅ Field Type Support
- **Text**: Product names, SKUs, descriptions
- **Number**: Prices, quantities, ratings
- **Boolean**: In stock status, featured flags
- **Date**: Launch dates, expiry dates
- **Single Select**: Categories, statuses, brands
- **URL**: Product pages, documentation links
- **Email**: Supplier contacts

### ✅ Advanced Features
- **Pagination**: Handle large product catalogs
- **Real-time Updates**: Changes reflect immediately
- **Error Handling**: Graceful error messages
- **Responsive Design**: Works on all devices

## Troubleshooting

### Connection Issues
- **"Failed to connect to table"**: Check table ID and permissions
- **"Forbidden"**: Ensure you're logged into Baserow
- **"Table not found"**: Verify the table ID is correct

### Data Issues
- **Empty table**: Add some products in Baserow first
- **Missing fields**: Ensure your table has the expected fields
- **Permission errors**: Check you have edit access to the table

## API Endpoints Used

The Products UI uses these Baserow API endpoints:

- `GET /api/database/tables/{tableId}/` - Get table structure
- `GET /api/database/rows/table/{tableId}/` - Fetch products
- `POST /api/database/rows/table/{tableId}/` - Create product
- `PATCH /api/database/rows/table/{tableId}/{rowId}/` - Update product
- `DELETE /api/database/rows/table/{tableId}/{rowId}/` - Delete product

## Next Steps

1. **Create Your Products Table** following the field structure above
2. **Add Sample Data** to test the functionality
3. **Connect via Products UI** using your table ID
4. **Customize Fields** based on your specific needs
5. **Import Existing Data** if you have products in other systems

## Demo Mode

If you want to see the UI in action without setting up a table:
- Visit `http://localhost:3001/products/demo`
- This shows the UI with sample data for demonstration

---

**Need Help?** The Products Management UI is now fully integrated with Baserow's API and provides a powerful interface for managing your product catalog!