import React, { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { BaserowService, Product } from '../services/baserowApi';
import './CreateProduct.css';

interface CreateProductProps {
  onBack: () => void;
  onSave: () => void;
}

const CreateProduct: React.FC<CreateProductProps> = ({ onBack, onSave }) => {
  const [formData, setFormData] = useState({
    // Website & Product Type
    website: '',
    productType: '',
    
    // SKU Details
    finalSKUCode: '',
    productCode: '',
    standardCode: '',
    colorName: '',
    category: '',
    colorCode: '',
    subCategory: '',
    skuCodeWithColor: '',
    categoryCode: '',
    productName: '',
    
    // Vendor Details
    brandName: '',
    vendorName: '',
    vendorCode: '',
    vendorLocation: '',
    brandLogic: '',
    vendorLogic: '',
    vendorTimeline: '',
    stockAvailability: '',
    
    // Contact Information
    firstName: '',
    lastName: '',
    emailId: '',
    vendorGSTNumber: '',
    dispatchTimeline: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    sizeChart: 'NO',
    
    // Website Pricing
    pricingCategory: '',
    productTypes: '',
    buyingPrice: '',
    marginSLB: '',
    wp: '',
    pb1: '',
    mrp: '',
    gst: '',
    discount: '',
    hsnCode: '',
    
    // Tier Pricing
    moq: '',
    tier1: '',
    price1: '',
    tier2: '',
    price2: '',
    tier3: '',
    price3: '',
    tier4: '',
    price4: '',
    tier5: '',
    price5: '',
    
    // Dimension/Shipping Details
    productLength: '',
    shippingLength: '',
    productHeight: '',
    shippingHeight: '',
    productWidth: '',
    shippingWidth: '',
    productVolumetricWeight: '',
    shippingVolumetricWeight: '',
    stockShipAvailability: '',
    brownEnvelope: '',
    airShipping: '',
    frontendDimensions: '',
    
    // Images
    photoShootAvailable: 'No',
    videoAvailable: 'NO',
    photoShootRequired: 'No',
    tcgsVideoAvailability: 'Not Required',
    customizationImagesAvailable: 'No',
    imageUpload: '',
    urlField: '',
    videoUpload: '',
    fileUpload: '',
    
    // Buzz Customization
    customisationOptions: '',
    noOfPrintableSides: '',
    printableAreaLength: '',
    printableAreaBreadth: '',
    ownBox: '',
    countryOfOrigin: 'India',
    status: 'Not Checked',
    customizationPart: 'Not Done'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields based on mockups
    if (!formData.website) {
      newErrors.website = 'Website is required';
    }
    if (!formData.productType) {
      newErrors.productType = 'Product type is required';
    }
    if (!formData.finalSKUCode.trim()) {
      newErrors.finalSKUCode = 'Final SKU Code is required';
    }
    if (!formData.colorName) {
      newErrors.colorName = 'Color name is required';
    }
    if (!formData.brandName) {
      newErrors.brandName = 'Brand name is required';
    }
    if (!formData.vendorName) {
      newErrors.vendorName = 'Vendor name is required';
    }
    if (!formData.pricingCategory) {
      newErrors.pricingCategory = 'Pricing category is required';
    }
    if (!formData.customizationPart) {
      newErrors.customizationPart = 'Customization part is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Create a basic product structure - extend this based on your API requirements
      const product: Omit<Product, 'id'> = {
        sku: `TEMP-${Date.now()}`, // Generate temporary SKU
        name: `${formData.firstName} ${formData.lastName} Product`, // Use contact name as product name for now
        description: `Product created for ${formData.emailId}`,
        price: Number(formData.mrp) || 0,
        quantity: 0, // Default quantity
        categories: formData.pricingCategory,
        // Map the new fields to existing product structure
        vendor_code: formData.vendorGSTNumber,
        brand: formData.firstName + ' ' + formData.lastName,
        delivery_timeline: formData.dispatchTimeline,
        tier_price: formData.buyingPrice || '',
        sample_price: Number(formData.wp) || undefined,
      };

      await BaserowService.createProduct(product);
      onSave();
    } catch (error) {
      console.error('Failed to create product:', error);
      // Handle error - could show a toast notification
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onBack();
  };

  return (
    <div className="create-product">
      <div className="top-nav">
        <div className="nav-left">
          <div className="logo">✱ logo</div>
        </div>
        <div className="nav-center">
          <span className="nav-link active">Products</span>
          <span className="nav-link">🔍 Search products...</span>
          <span className="nav-link">Help</span>
        </div>
      </div>

      <div className="main-layout">
        <div className="left-sidebar">
          <nav className="sidebar-nav">
            <ul className="nav-menu">
              <li className="nav-item">
                <button className="nav-button active">
                  <span className="nav-icon">➕</span>
                  Add Products
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-button">
                  <span className="nav-icon">📁</span>
                  Add Categories
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div className="create-product-content">
          <div className="header">
            <button onClick={onBack} className="back-btn">
              <ArrowLeft size={20} />
            </button>
            <h1>Create New Product</h1>
          </div>

        <form onSubmit={handleSubmit} className="product-form">
          {/* Section 1: Website & Product Type */}
          <div className="form-section compact">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="website">Website <span className="required">*</span></label>
                <select
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className={errors.website ? 'error' : ''}
                >
                  <option value="">-Select-</option>
                  <option value="Main Website">Main Website</option>
                  <option value="Secondary Website">Secondary Website</option>
                  <option value="B2B Portal">B2B Portal</option>
                </select>
                {errors.website && <span className="error-text">{errors.website}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="productType">Product Type <span className="required">*</span></label>
                <select
                  id="productType"
                  name="productType"
                  value={formData.productType}
                  onChange={handleInputChange}
                  className={errors.productType ? 'error' : ''}
                >
                  <option value="">-Select-</option>
                  <option value="Simple">Simple</option>
                  <option value="Variable">Variable</option>
                  <option value="Grouped">Grouped</option>
                  <option value="External">External</option>
                </select>
                {errors.productType && <span className="error-text">{errors.productType}</span>}
              </div>

              <div className="form-group"></div>
            </div>
          </div>

          {/* Section 2: Product & SKU Details */}
          <div className="form-section">
            <h3 className="section-title">Product & SKU Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="finalSKUCode">Final SKU Code <span className="required">*</span></label>
                <input
                  type="text"
                  id="finalSKUCode"
                  name="finalSKUCode"
                  value={formData.finalSKUCode}
                  onChange={handleInputChange}
                  className={errors.finalSKUCode ? 'error' : ''}
                />
                {errors.finalSKUCode && <span className="error-text">{errors.finalSKUCode}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="productCode">Product Code</label>
                <input
                  type="text"
                  id="productCode"
                  name="productCode"
                  value={formData.productCode}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="standardCode">Standard Code</label>
                <input
                  type="text"
                  id="standardCode"
                  name="standardCode"
                  value={formData.standardCode}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="colorName">Color Name <span className="required">*</span></label>
                <select
                  id="colorName"
                  name="colorName"
                  value={formData.colorName}
                  onChange={handleInputChange}
                  className={errors.colorName ? 'error' : ''}
                >
                  <option value="">-Select-</option>
                  <option value="Red">Red</option>
                  <option value="Blue">Blue</option>
                  <option value="Green">Green</option>
                  <option value="Black">Black</option>
                  <option value="White">White</option>
                </select>
                {errors.colorName && <span className="error-text">{errors.colorName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="">-Select-</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Home">Home</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="colorCode">Color Code</label>
                <input
                  type="text"
                  id="colorCode"
                  name="colorCode"
                  value={formData.colorCode}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="subCategory">Sub Category</label>
                <select
                  id="subCategory"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleInputChange}
                >
                  <option value="">-Select-</option>
                  <option value="Subcategory 1">Subcategory 1</option>
                  <option value="Subcategory 2">Subcategory 2</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="skuCodeWithColor">SKU Code With Color</label>
                <input
                  type="text"
                  id="skuCodeWithColor"
                  name="skuCodeWithColor"
                  value={formData.skuCodeWithColor}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="categoryCode">Category Code</label>
                <input
                  type="text"
                  id="categoryCode"
                  name="categoryCode"
                  value={formData.categoryCode}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="productName">Product Name</label>
                <input
                  type="text"
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group"></div>
              <div className="form-group"></div>
            </div>
          </div>

          {/* Section 3: Vendor Details */}
          <div className="form-section compact">
            <h3 className="section-title">Vendor Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="brandName">Brand Name <span className="required">*</span></label>
                <select
                  id="brandName"
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleInputChange}
                  className={errors.brandName ? 'error' : ''}
                >
                  <option value="">-Select-</option>
                  <option value="Brand 1">Brand 1</option>
                  <option value="Brand 2">Brand 2</option>
                </select>
                {errors.brandName && <span className="error-text">{errors.brandName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="vendorName">Vendor Name <span className="required">*</span></label>
                <select
                  id="vendorName"
                  name="vendorName"
                  value={formData.vendorName}
                  onChange={handleInputChange}
                  className={errors.vendorName ? 'error' : ''}
                >
                  <option value="">-Select-</option>
                  <option value="Vendor 1">Vendor 1</option>
                  <option value="Vendor 2">Vendor 2</option>
                </select>
                {errors.vendorName && <span className="error-text">{errors.vendorName}</span>}
              </div>

              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="vendorCode">Vendor Code</label>
                <input
                  type="text"
                  id="vendorCode"
                  name="vendorCode"
                  value={formData.vendorCode}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="vendorLocation">Vendor Location</label>
                <input
                  type="text"
                  id="vendorLocation"
                  name="vendorLocation"
                  value={formData.vendorLocation}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="brandLogic">Brand Logic</label>
                <select
                  id="brandLogic"
                  name="brandLogic"
                  value={formData.brandLogic}
                  onChange={handleInputChange}
                >
                  <option value="">-Select-</option>
                  <option value="Logic 1">Logic 1</option>
                  <option value="Logic 2">Logic 2</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="vendorLogic">Vendor Logic</label>
                <select
                  id="vendorLogic"
                  name="vendorLogic"
                  value={formData.vendorLogic}
                  onChange={handleInputChange}
                >
                  <option value="">Non-Blr</option>
                  <option value="Blr">Blr</option>
                </select>
              </div>

              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="vendorTimeline">Vendor Timeline</label>
                <input
                  type="text"
                  id="vendorTimeline"
                  name="vendorTimeline"
                  value={formData.vendorTimeline}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="stockAvailability">Stock Availability</label>
                <select
                  id="stockAvailability"
                  name="stockAvailability"
                  value={formData.stockAvailability}
                  onChange={handleInputChange}
                >
                  <option value="">-Select-</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Pre-order">Pre-order</option>
                </select>
              </div>

              <div className="form-group"></div>
            </div>
          </div>

          {/* Section 4: Contact Information & Address */}
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Contact Person Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="emailId">Email ID</label>
                <input
                  type="email"
                  id="emailId"
                  name="emailId"
                  value={formData.emailId}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="vendorGSTNumber">Vendor GST Number</label>
                <input
                  type="text"
                  id="vendorGSTNumber"
                  name="vendorGSTNumber"
                  placeholder="######"
                  value={formData.vendorGSTNumber}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dispatchTimeline">Dispatch Timeline</label>
                <select
                  id="dispatchTimeline"
                  name="dispatchTimeline"
                  value={formData.dispatchTimeline}
                  onChange={handleInputChange}
                >
                  <option value="">-Select-</option>
                  <option value="1-2 days">1-2 days</option>
                  <option value="3-5 days">3-5 days</option>
                  <option value="5-7 days">5-7 days</option>
                </select>
              </div>

              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="addressLine1">Vendor Address</label>
                <input
                  type="text"
                  id="addressLine1"
                  name="addressLine1"
                  placeholder="Address Line 1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <input
                  type="text"
                  id="addressLine2"
                  name="addressLine2"
                  placeholder="Address Line 2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  id="city"
                  name="city"
                  placeholder="City / District"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  id="state"
                  name="state"
                  placeholder="State / Province"
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  placeholder="Postal Code"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                >
                  <option value="">-Select-</option>
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                </select>
              </div>

              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sizeChart">Size Chart</label>
                <select
                  id="sizeChart"
                  name="sizeChart"
                  value={formData.sizeChart}
                  onChange={handleInputChange}
                >
                  <option value="NO">NO</option>
                  <option value="YES">YES</option>
                </select>
              </div>

              <div className="form-group"></div>
              <div className="form-group"></div>
            </div>
          </div>

          {/* Section 5: Website Pricing */}
          <div className="form-section">
            <h3 className="section-title">Website Pricing</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pricingCategory">Pricing Category <span className="required">*</span></label>
                <select
                  id="pricingCategory"
                  name="pricingCategory"
                  value={formData.pricingCategory}
                  onChange={handleInputChange}
                  className={errors.pricingCategory ? 'error' : ''}
                >
                  <option value="">-Select-</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                </select>
                {errors.pricingCategory && <span className="error-text">{errors.pricingCategory}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="mrp">MRP</label>
                <input
                  type="number"
                  id="mrp"
                  name="mrp"
                  placeholder="######"
                  step="0.01"
                  value={formData.mrp}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="productTypes">Product Types</label>
                <select
                  id="productTypes"
                  name="productTypes"
                  value={formData.productTypes}
                  onChange={handleInputChange}
                >
                  <option value="">-Select-</option>
                  <option value="Physical">Physical</option>
                  <option value="Digital">Digital</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="gst">GST</label>
                <input
                  type="text"
                  id="gst"
                  name="gst"
                  placeholder="###### ##"
                  value={formData.gst}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="buyingPrice">Buying Price</label>
                <input
                  type="number"
                  id="buyingPrice"
                  name="buyingPrice"
                  placeholder="######"
                  step="0.01"
                  value={formData.buyingPrice}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="discount">Discount</label>
                <div className="input-with-symbol">
                  <input
                    type="number"
                    id="discount"
                    name="discount"
                    step="0.01"
                    value={formData.discount}
                    onChange={handleInputChange}
                  />
                  <span className="input-symbol">%</span>
                </div>
              </div>

              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="marginSLB">Margin SLB</label>
                <input
                  type="number"
                  id="marginSLB"
                  name="marginSLB"
                  placeholder="######"
                  step="0.01"
                  value={formData.marginSLB}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="hsnCode">HSN Code</label>
                <input
                  type="text"
                  id="hsnCode"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="wp">WP</label>
                <div className="input-with-symbol">
                  <span className="input-symbol-left">₹</span>
                  <input
                    type="number"
                    id="wp"
                    name="wp"
                    placeholder="##,##,###.##"
                    step="0.01"
                    value={formData.wp}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group"></div>
              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pb1">PB1</label>
                <div className="input-with-symbol">
                  <span className="input-symbol-left">₹</span>
                  <input
                    type="number"
                    id="pb1"
                    name="pb1"
                    placeholder="##,##,###.##"
                    step="0.01"
                    value={formData.pb1}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group"></div>
              <div className="form-group"></div>
            </div>
          </div>

          {/* Section 6: Tier Pricing */}
          <div className="form-section compact">
            <h3 className="section-title">Tier Pricing</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="moq">MOQ</label>
                <input
                  type="number"
                  id="moq"
                  name="moq"
                  value={formData.moq}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group"></div>
              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tier1">Tier 1</label>
                <input
                  type="number"
                  id="tier1"
                  name="tier1"
                  placeholder="######"
                  value={formData.tier1}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group"></div>
              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price1">Price 1</label>
                <div className="input-with-symbol">
                  <span className="input-symbol-left">₹</span>
                  <input
                    type="number"
                    id="price1"
                    name="price1"
                    placeholder="##,##,###.##"
                    step="0.01"
                    value={formData.price1}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group"></div>
              <div className="form-group"></div>
            </div>
          </div>

          {/* Section 7: Buzz Customization */}
          <div className="form-section compact">
            <h3 className="section-title">Buzz Customization</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="customisationOptions">Customisation Options</label>
                <select
                  id="customisationOptions"
                  name="customisationOptions"
                  value={formData.customisationOptions}
                  onChange={handleInputChange}
                >
                  <option value="">-Select-</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="noOfPrintableSides">No Of Printable Sides</label>
                <select
                  id="noOfPrintableSides"
                  name="noOfPrintableSides"
                  value={formData.noOfPrintableSides}
                  onChange={handleInputChange}
                >
                  <option value="">-Select-</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </div>

              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ownBox">Own Box</label>
                <select
                  id="ownBox"
                  name="ownBox"
                  value={formData.ownBox}
                  onChange={handleInputChange}
                >
                  <option value="">-Select-</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="countryOfOrigin">Country of Origin</label>
                <input
                  type="text"
                  id="countryOfOrigin"
                  name="countryOfOrigin"
                  value={formData.countryOfOrigin}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Status <span className="required">*</span></label>
                <div className="checkbox-group">
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="Not Checked"
                      checked={formData.status === 'Not Checked'}
                      onChange={handleInputChange}
                    />
                    Not Checked
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="status"
                      value="Checked"
                      checked={formData.status === 'Checked'}
                      onChange={handleInputChange}
                    />
                    Checked
                  </label>
                </div>
              </div>

              <div className="form-group"></div>
              <div className="form-group"></div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="customizationPart">Customization Part <span className="required">*</span></label>
                <div className="checkbox-group">
                  <label>
                    <input
                      type="radio"
                      name="customizationPart"
                      value="Done"
                      checked={formData.customizationPart === 'Done'}
                      onChange={handleInputChange}
                    />
                    Done
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="customizationPart"
                      value="Not Done"
                      checked={formData.customizationPart === 'Not Done'}
                      onChange={handleInputChange}
                      className={errors.customizationPart ? 'error' : ''}
                    />
                    Not Done
                  </label>
                </div>
                {errors.customizationPart && <span className="error-text">{errors.customizationPart}</span>}
              </div>

              <div className="form-group"></div>
              <div className="form-group"></div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="btn-cancel">
              <X size={16} />
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-save">
              {loading ? 'Saving...' : '✓ Save Product'}
            </button>
          </div>
        </form>
        </div>
      </div>

      <div className="footer">
        <div className="footer-links">
          <span>⚙️ Settings</span>
          <span>About Us</span>
          <span>Support</span>
          <span>Legal</span>
        </div>
        <div className="social-links">
          <span>🐦</span>
          <span>📧</span>
          <span>💼</span>
          <span>📱</span>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;