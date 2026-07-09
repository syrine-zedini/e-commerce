export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'client' | 'livreur' | 'admin_commercial';
  avatar?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  loyaltyPoints?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  image: string;
  image_path?: string;
  category: string;
  subcategory?: string;
  isOnSale: boolean;
  salePercentage?: number;
  createdAt: string;
  rating: number;
  reviewCount: number;
}

export interface Category {
  id: string;
  name: string;
  subcategories: string[];
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  shippingAddress: string;
  trackingNumber?: string;
  paymentMethod: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Promotion {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  applicableProducts: string[];
  productIds?: string[];
}

export interface KPI {
  totalSales: number;
  totalOrders: number;
  revenue: number;
  criticalStock: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  points: number;
  type: 'earned' | 'redeemed';
  description: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  addedAt: string;
}

export interface SEOPage {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  metaKeywords: string;
  content: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  updated_at?: string;
}

export interface ContentBlock {
  id: string;
  pageId: string;
  type: 'hero' | 'text' | 'image' | 'cta' | 'features' | 'testimonials' | 'contact' | 'gallery' | 'newsletter' | 'video';
  title: string;
  content: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  order: number;
}


export interface SystemSettings {
  id: string;
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  taxRate: number;
  shippingRate: number;
  freeShippingThreshold: number;
  gtmId?: string;
  fbPixelId?: string;
  loyaltyPointsRate: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface Report {
  id: string;
  type: 'sales' | 'products' | 'customers' | 'orders';
  title: string;
  dateRange: {
    start: string;
    end: string;
  };
  data: any;
  generatedAt: string;
}