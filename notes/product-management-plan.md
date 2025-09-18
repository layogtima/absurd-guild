# Product Management for Profile Page - Implementation Plan

## Current State Analysis

### Existing Structure

- Profile page currently handles:
  - Maker profile creation/editing
  - Profile links management
- Database already has `products` table (lines 108-124 in migration 0001)
- Products linked to users via `creator_id`
- Products have: title, slug, description, price, shopify integration, image_url, category

### Profile Page Structure

- Uses progressive enhancement patterns (URL params for UI state)
- Actions handle: createProfile, updateProfile, addLink, deleteLink
- Well-organized with separate sections for profile info and links

## Proposed Architecture

### 1. Component Strategy

Keep profile.tsx lean by extracting components:

```
app/components/profile/
├── ProductManagement.tsx        # Main product section container
├── ProductForm.tsx             # Add/edit product form
├── ProductList.tsx             # Display products with edit/delete
└── ProductCard.tsx             # Individual product display
```

### 2. Database Operations

Create new server functions in `app/lib/products.server.ts`:

- `getUserProducts(db, userId)` - Get all products for a user
- `createProduct(db, userId, productData)` - Create new product
- `updateProduct(db, userId, productId, productData)` - Update product
- `deleteProduct(db, userId, productId)` - Delete product

### 3. Profile Page Integration

Add to profile.tsx:

- New action handlers: "createProduct", "updateProduct", "deleteProduct"
- Include ProductManagement component in existing profile display
- Leverage existing URL param pattern for product editing

### 4. URL Structure

Follow existing patterns:

- `?add-product=true` - Show add product form
- `?edit-product={id}` - Show edit form for specific product
- Success/error messages via URL params

### 5. Progressive Enhancement

- Product management works without JS
- Forms submit to server actions
- UI state managed via URL parameters
- Success/error feedback via redirects

## Implementation Steps

1. **Create server functions** - products.server.ts
2. **Build components** - ProductManagement, ProductForm, ProductList, ProductCard
3. **Extend profile actions** - Add product CRUD to existing action function
4. **Update loader** - Include user products in profile data
5. **Integrate components** - Add ProductManagement to profile display
6. **Test and refine** - Ensure progressive enhancement works

## Benefits of This Approach

- **Minimal profile.tsx changes** - Just action handlers and component inclusion
- **Reusable components** - Product components can be used elsewhere
- **Consistent patterns** - Follows existing profile link management pattern
- **Progressive enhancement** - Works without JavaScript
- **Clean separation** - Business logic in server files, UI in components

## Considerations

- Products table already exists - no migration needed
- Shopify integration fields available for future e-commerce
- Price stored in paise (Indian currency subunit)
- Image handling strategy (upload vs URL input)
- Category/tagging system for products
