import { z } from 'zod';

// Personal information validation schemas
export const PersonalInfoSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long'),
  
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number is too long')
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'),
  
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(100, 'Address must be less than 100 characters'),
  
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'City can only contain letters, spaces, hyphens, and apostrophes'),
  
  state: z
    .string()
    .min(2, 'State must be at least 2 characters')
    .max(50, 'State must be less than 50 characters'),
  
  zipCode: z
    .string()
    .min(3, 'ZIP code must be at least 3 characters')
    .max(10, 'ZIP code must be less than 10 characters')
    .regex(/^[a-zA-Z0-9\s\-]+$/, 'ZIP code can only contain letters, numbers, spaces, and hyphens'),
  
  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(50, 'Country must be less than 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Country can only contain letters, spaces, hyphens, and apostrophes'),
  
  orderNotes: z
    .string()
    .max(500, 'Order notes must be less than 500 characters')
    .optional()
    .transform(val => val?.trim() || '')
});

// Product customization validation
export const CustomizationSchema = z.object({
  productId: z.number().int().positive('Product ID must be a positive integer'),
  color: z.string().min(1, 'Color is required').max(20, 'Color name is too long'),
  customizations: z.record(z.string(), z.object({
    id: z.string(),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    scale: z.number().min(0.1).max(3),
    rotation: z.number().min(-180).max(180),
    blobUrl: z.string().url().nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
  })),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(50, 'Quantity cannot exceed 50'),
});

// Order validation schema
export const OrderSchema = z.object({
  items: z.array(CustomizationSchema).min(1, 'Order must contain at least one item'),
  personalInfo: PersonalInfoSchema,
  paymentMethod: z.enum(['credit_card', 'paypal', 'stripe']),
  shippingMethod: z.enum(['standard', 'express', 'overnight']),
  totalPrice: z.number().positive('Total price must be positive').max(10000, 'Order total is too high'),
});

// Product creation validation (for admin)
export const ProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(100, 'Product name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-'\.]+$/, 'Product name contains invalid characters'),
  
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must be less than 50 characters'),
  
  price: z
    .number()
    .positive('Price must be positive')
    .max(9999.99, 'Price cannot exceed $9,999.99'),
  
  image: z
    .string()
    .url('Please provide a valid image URL')
    .max(500, 'Image URL is too long'),
  
  customizable: z
    .boolean()
    .default(false),
  
  rating: z
    .number()
    .min(0, 'Rating must be at least 0')
    .max(5, 'Rating cannot exceed 5')
    .default(5),
  
  tag: z
    .string()
    .max(50, 'Tag must be less than 50 characters')
    .optional(),
});

// Product variant validation
export const ProductVariantSchema = z.object({
  productId: z.number().int().positive('Product ID must be a positive integer'),
  view: z.enum(['FRONT', 'BACK', 'LEFT', 'RIGHT']),
  color: z
    .string()
    .min(1, 'Color is required')
    .max(20, 'Color name is too long'),
  imageUrl: z
    .string()
    .url('Please provide a valid image URL')
    .max(500, 'Image URL is too long')
    .optional(),
});

// Design area validation
export const DesignAreaSchema = z.object({
  productId: z.number().int().positive('Product ID must be a positive integer'),
  view: z.enum(['FRONT', 'BACK', 'LEFT', 'RIGHT']),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0.1).max(1),
  height: z.number().min(0.1).max(1),
});

// User registration validation
export const UserRegistrationSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long'),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Login validation
export const LoginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address'),
  
  password: z
    .string()
    .min(1, 'Password is required'),
});

// Export types
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type Customization = z.infer<typeof CustomizationSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type DesignArea = z.infer<typeof DesignAreaSchema>;
export type UserRegistration = z.infer<typeof UserRegistrationSchema>;
export type Login = z.infer<typeof LoginSchema>;