import { describe, it, expect } from '@jest/globals';
import { 
  ProductSchema, 
  ProductVariantSchema, 
  CustomizationSchema,
  OrderSchema,
  PersonalInfoSchema
} from '@/lib/validationSchemas';

describe('validationSchemas', () => {
  describe('ProductSchema', () => {
    it('should validate a correct product', () => {
      const product = {
        name: 'Test T-Shirt',
        category: 'Apparel',
        price: 29.99,
        customizable: true,
        rating: 4.5
      };
      
      const result = ProductSchema.safeParse(product);
      expect(result.success).toBe(true);
    });

    it('should reject product without required fields', () => {
      const product = {
        name: 'Test'
      };
      
      const result = ProductSchema.safeParse(product);
      expect(result.success).toBe(false);
    });

    it('should reject negative price', () => {
      const product = {
        name: 'Test',
        category: 'Apparel',
        price: -10,
        customizable: false,
        rating: 5
      };
      
      const result = ProductSchema.safeParse(product);
      expect(result.success).toBe(false);
    });

    it('should reject rating above 5', () => {
      const product = {
        name: 'Test',
        category: 'Apparel',
        price: 10,
        customizable: false,
        rating: 6
      };
      
      const result = ProductSchema.safeParse(product);
      expect(result.success).toBe(false);
    });
  });

  describe('ProductVariantSchema', () => {
    it('should validate correct variant', () => {
      const variant = {
        view: 'FRONT',
        color: 'White',
        image_url: 'https://example.com/image.jpg'
      };
      
      const result = ProductVariantSchema.safeParse(variant);
      expect(result.success).toBe(true);
    });

    it('should reject invalid view', () => {
      const variant = {
        view: 'INVALID',
        color: 'White',
        image_url: 'https://example.com/image.jpg'
      };
      
      const result = ProductVariantSchema.safeParse(variant);
      expect(result.success).toBe(false);
    });
  });

  describe('CustomizationSchema', () => {
    it('should validate correct customization', () => {
      const customization = {
        productId: 1,
        color: 'White',
        customizations: {
          'design-1': {
            id: 'design-1',
            x: 0.5,
            y: 0.5,
            scale: 1,
            rotation: 0
          }
        },
        quantity: 1
      };
      
      const result = CustomizationSchema.safeParse(customization);
      expect(result.success).toBe(true);
    });

    it('should reject quantity below 1', () => {
      const customization = {
        productId: 1,
        color: 'White',
        customizations: {},
        quantity: 0
      };
      
      const result = CustomizationSchema.safeParse(customization);
      expect(result.success).toBe(false);
    });

    it('should reject quantity above 50', () => {
      const customization = {
        productId: 1,
        color: 'White',
        customizations: {},
        quantity: 100
      };
      
      const result = CustomizationSchema.safeParse(customization);
      expect(result.success).toBe(false);
    });

    it('should handle nullable URL fields', () => {
      const customization = {
        productId: 1,
        color: 'White',
        customizations: {
          'design-1': {
            id: 'design-1',
            x: 0.5,
            y: 0.5,
            scale: 1,
            rotation: 0,
            blobUrl: null,
            imageUrl: null
          }
        },
        quantity: 1
      };
      
      const result = CustomizationSchema.safeParse(customization);
      expect(result.success).toBe(true);
    });
  });

  describe('OrderSchema', () => {
    it('should validate correct order', () => {
      const order = {
        items: [
          {
            productId: 1,
            color: 'White',
            customizations: {},
            quantity: 2
          }
        ]
      };
      
      const result = OrderSchema.safeParse(order);
      expect(result.success).toBe(true);
    });

    it('should reject empty order', () => {
      const order = {
        items: []
      };
      
      const result = OrderSchema.safeParse(order);
      expect(result.success).toBe(false);
    });
  });

  describe('PersonalInfoSchema', () => {
    it('should validate correct personal info', () => {
      const info = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      };
      
      const result = PersonalInfoSchema.safeParse(info);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const info = {
        fullName: 'John Doe',
        email: 'invalid-email',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      };
      
      const result = PersonalInfoSchema.safeParse(info);
      expect(result.success).toBe(false);
    });

    it('should reject invalid phone', () => {
      const info = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: 'abc',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      };
      
      const result = PersonalInfoSchema.safeParse(info);
      expect(result.success).toBe(false);
    });
  });
});
