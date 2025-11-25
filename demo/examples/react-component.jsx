/**
 * Example: React Component with Multiple Selectors
 * Demonstrates various selector types in a single component
 */

import React, { useState } from 'react';

function ProductCard({ product }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="product-card" id={`product-${product.id}`} data-product-id={product.id}>
      <div className="product-header">
        <img 
          src={product.image} 
          alt={product.name}
          className="product-image"
          data-testid="product-image"
        />
        <button 
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={() => setIsFavorite(!isFavorite)}
          aria-label="Toggle favorite"
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
      
      <div className="product-body">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-price">
          <span className="price-amount">${product.price}</span>
          {product.originalPrice && (
            <span className="price-original">${product.originalPrice}</span>
          )}
        </div>
      </div>

      <div className="product-footer">
        <div className="quantity-selector">
          <button 
            className="quantity-btn decrease"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            data-action="decrease"
          >
            −
          </button>
          <input 
            type="number" 
            className="quantity-input"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            min="1"
            data-testid="quantity-input"
          />
          <button 
            className="quantity-btn increase"
            onClick={() => setQuantity(quantity + 1)}
            data-action="increase"
          >
            +
          </button>
        </div>
        
        <button 
          className="add-to-cart-btn primary"
          onClick={() => console.log('Add to cart', product.id, quantity)}
          disabled={!product.inStock}
        >
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;

