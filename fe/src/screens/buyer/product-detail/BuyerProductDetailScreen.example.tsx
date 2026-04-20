/**
 * Buyer Product Detail Screen Examples
 * Usage examples for the Buyer Product Detail & Pre-order Screen
 */

import React from 'react';
import { BuyerProductDetailScreen } from './BuyerProductDetailScreen';

/**
 * Example 1: Basic Product Detail
 * Shows product detail with default data
 */
export const BasicProductDetailExample: React.FC = () => {
  return (
    <BuyerProductDetailScreen
      productId="1"
      onBack={() => console.log('Navigate back')}
    />
  );
};

/**
 * Example 2: Product Detail Without Back Button
 * Shows product detail without navigation
 */
export const ProductDetailWithoutBackExample: React.FC = () => {
  return <BuyerProductDetailScreen productId="1" />;
};

/**
 * Example 3: Different Product
 * Shows product detail with different product ID
 */
export const DifferentProductExample: React.FC = () => {
  return (
    <BuyerProductDetailScreen
      productId="2"
      onBack={() => console.log('Navigate back')}
    />
  );
};

/**
 * Example 4: With Custom Navigation Handler
 * Shows product detail with custom back navigation
 */
export const CustomNavigationExample: React.FC = () => {
  const handleBack = () => {
    console.log('Custom back navigation');
    // Custom navigation logic here
    window.history.back();
  };

  return <BuyerProductDetailScreen productId="1" onBack={handleBack} />;
};

/**
 * Example 5: Embedded in Parent Component
 * Shows how to embed product detail in a parent component
 */
export const EmbeddedProductDetailExample: React.FC = () => {
  const [showDetail, setShowDetail] = React.useState(false);

  if (!showDetail) {
    return (
      <div style={{ padding: '16px' }}>
        <button
          onClick={() => setShowDetail(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#0068FF',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Xem chi tiết sản phẩm
        </button>
      </div>
    );
  }

  return <BuyerProductDetailScreen productId="1" onBack={() => setShowDetail(false)} />;
};

export default {
  BasicProductDetailExample,
  ProductDetailWithoutBackExample,
  DifferentProductExample,
  CustomNavigationExample,
  EmbeddedProductDetailExample,
};
