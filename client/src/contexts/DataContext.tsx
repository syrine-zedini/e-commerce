import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Order, Category, Promotion, KPI, Review, LoyaltyTransaction, Notification, WishlistItem, CartItem, SEOPage, ContentBlock, SystemSettings, Report } from '../types';

interface DataContextType {
  products: Product[];
  orders: Order[];
  categories: Category[];
  promotions: Promotion[];
  kpis: KPI;
  reviews: Review[];
  loyaltyTransactions: LoyaltyTransaction[];
  notifications: Notification[];
  wishlist: WishlistItem[];
  cart: CartItem[];
  seoPages: SEOPage[];
  contentBlocks: ContentBlock[];
  systemSettings: SystemSettings;
  reports: Report[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  addPromotion: (promotion: Omit<Promotion, 'id'>) => void;
  updatePromotion: (id: string, promotion: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
  markNotificationAsRead: (id: string) => void;
  addToWishlist: (userId: string, productId: string) => void;
  removeFromWishlist: (id: string) => void;
  addToCart: (productId: string, quantity: number) => void;
  updateCartItem: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt'>) => void;
  reorderFromHistory: (orderId: string) => void;
  updateSEOPage: (id: string, page: Partial<SEOPage>) => void;
  updateContentBlock: (id: string, block: Partial<ContentBlock>) => void;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  generateReport: (type: Report['type'], dateRange: { start: string; end: string }) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [seoPages, setSeoPages] = useState<SEOPage[]>([]);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    id: '1',
    siteName: 'E-Commerce Store',
    siteDescription: 'Your premier online shopping destination',
    contactEmail: 'contact@store.com',
    contactPhone: '+1-234-567-8900',
    address: '123 Commerce St, Business City, BC 12345',
    currency: 'USD',
    taxRate: 8.5,
    shippingRate: 9.99,
    freeShippingThreshold: 75,
    loyaltyPointsRate: 1,
    emailNotifications: true,
    smsNotifications: false,
  });
  const [reports, setReports] = useState<Report[]>([]);

  // Initialize mock data
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Premium Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 199.99,
        originalPrice: 249.99,
        stock: 25,
        image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'Electronics',
        subcategory: 'Audio',
        isOnSale: true,
        salePercentage: 20,
        createdAt: '2024-01-15T10:00:00Z',
        rating: 4.5,
        reviewCount: 128,
      },
      {
        id: '2',
        name: 'Smart Fitness Watch',
        description: 'Advanced fitness tracking with heart rate monitor',
        price: 299.99,
        stock: 15,
        image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'Electronics',
        subcategory: 'Wearables',
        isOnSale: false,
        createdAt: '2024-01-10T14:30:00Z',
        rating: 4.2,
        reviewCount: 89,
      },
      {
        id: '3',
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable organic cotton t-shirt in various colors',
        price: 29.99,
        stock: 5,
        image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'Clothing',
        subcategory: 'T-Shirts',
        isOnSale: false,
        createdAt: '2024-01-20T09:15:00Z',
        rating: 4.0,
        reviewCount: 45,
      },
    ];

    const mockOrders: Order[] = [
      {
        id: 'ORD-001',
        clientId: '2',
        clientName: 'John Doe',
        items: [
          {
            productId: '1',
            productName: 'Premium Wireless Headphones',
            quantity: 1,
            price: 199.99,
            image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
          },
        ],
        total: 199.99,
        status: 'shipped',
        createdAt: '2024-01-25T10:00:00Z',
        shippingAddress: '123 Main St, City, Country',
        trackingNumber: 'TRK123456789',
        paymentMethod: 'Credit Card',
      },
      {
        id: 'ORD-002',
        clientId: '2',
        clientName: 'John Doe',
        items: [
          {
            productId: '2',
            productName: 'Smart Fitness Watch',
            quantity: 1,
            price: 299.99,
            image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=400',
          },
        ],
        total: 299.99,
        status: 'pending',
        createdAt: '2024-01-26T15:30:00Z',
        shippingAddress: '123 Main St, City, Country',
        paymentMethod: 'PayPal',
      },
    ];

    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'Electronics',
        subcategories: ['Audio', 'Wearables', 'Smartphones', 'Laptops'],
      },
      {
        id: '2',
        name: 'Clothing',
        subcategories: ['T-Shirts', 'Jeans', 'Dresses', 'Shoes'],
      },
      {
        id: '3',
        name: 'Home & Garden',
        subcategories: ['Furniture', 'Decor', 'Kitchen', 'Garden'],
      },
    ];

    const mockPromotions: Promotion[] = [
      {
        id: '1',
        name: 'Winter Sale',
        type: 'percentage',
        value: 20,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-02-29T23:59:59Z',
        isActive: true,
        applicableProducts: ['1'],
      },
    ];

    const mockReviews: Review[] = [
      {
        id: '1',
        productId: '1',
        userId: '2',
        userName: 'John Doe',
        rating: 5,
        comment: 'Excellent sound quality and comfortable to wear!',
        createdAt: '2024-01-20T10:00:00Z',
      },
    ];

    const mockLoyaltyTransactions: LoyaltyTransaction[] = [
      {
        id: '1',
        userId: '2',
        points: 20,
        type: 'earned',
        description: 'Purchase reward - Order ORD-001',
        createdAt: '2024-01-25T10:00:00Z',
      },
    ];

    const mockNotifications: Notification[] = [
      {
        id: '1',
        userId: '2',
        title: 'Order Shipped',
        message: 'Your order ORD-001 has been shipped and is on its way!',
        type: 'order',
        isRead: false,
        createdAt: '2024-01-25T12:00:00Z',
      },
      {
        id: '2',
        userId: '2',
        title: 'New Promotion Available',
        message: 'Get 20% off on all electronics! Limited time offer.',
        type: 'promotion',
        isRead: false,
        createdAt: '2024-01-26T09:00:00Z',
      },
      {
        id: '3',
        userId: '2',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight from 2-4 AM.',
        type: 'system',
        isRead: true,
        createdAt: '2024-01-24T18:00:00Z',
      },
      {
        id: '4',
        userId: '2',
        title: 'Order Delivered',
        message: 'Your order ORD-002 has been delivered successfully!',
        type: 'order',
        isRead: true,
        createdAt: '2024-01-23T14:30:00Z',
      },
      {
        id: '5',
        userId: '2',
        title: 'Flash Sale Alert',
        message: 'Flash sale starts in 1 hour! Up to 50% off selected items.',
        type: 'promotion',
        isRead: false,
        createdAt: '2024-01-27T10:00:00Z',
      },
    ];

    const mockWishlist: WishlistItem[] = [
      {
        id: '1',
        userId: '2',
        productId: '2',
        product: mockProducts[1],
        createdAt: '2024-01-20T10:00:00Z',
      },
    ];

    const mockSEOPages: SEOPage[] = [
      {
        id: '1',
        slug: 'home',
        title: 'Welcome to Our Store - Best Products Online',
        metaDescription: 'Discover amazing products at unbeatable prices. Shop now for electronics, clothing, and more.',
        metaKeywords: 'ecommerce, online shopping, electronics, clothing, deals',
        content: '<h1>Welcome to Our Store</h1><p>Find the best products at amazing prices.</p>',
        isPublished: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    const mockContentBlocks: ContentBlock[] = [
      // Home Page Content
      {
        id: '1',
        pageId: '1',
        type: 'hero',
        title: 'Welcome to Our Premium Store',
        content: 'Discover amazing products at unbeatable prices. Shop the latest trends in electronics, fashion, and home goods with fast shipping and excellent customer service.',
        imageUrl: 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=1200',
        buttonText: 'Shop Now',
        buttonUrl: '/products',
        order: 1,
      },
      {
        id: '2',
        pageId: '1',
        type: 'features',
        title: 'Why Choose Us',
        content: 'We offer the best shopping experience with premium quality products, fast delivery, and exceptional customer service.',
        order: 2,
      },
      {
        id: '3',
        pageId: '1',
        type: 'cta',
        title: 'Start Shopping Today',
        content: 'Join thousands of satisfied customers and discover why we are the preferred choice for online shopping.',
        buttonText: 'Browse Products',
        buttonUrl: '/products',
        order: 3,
      },
      
      // About Page Content
      {
        id: '4',
        pageId: '2',
        type: 'hero',
        title: 'About Our Company',
        content: 'We are a leading e-commerce platform dedicated to providing high-quality products and exceptional customer service since 2020.',
        imageUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200',
        order: 1,
      },
      {
        id: '5',
        pageId: '2',
        type: 'text',
        title: 'Our Mission',
        content: 'Our mission is to make online shopping accessible, affordable, and enjoyable for everyone. We carefully curate our product selection to ensure quality and value for our customers.',
        order: 2,
      },
      {
        id: '6',
        pageId: '2',
        type: 'features',
        title: 'Our Values',
        content: 'Quality, integrity, customer satisfaction, and innovation drive everything we do.',
        order: 3,
      },
      {
        id: '7',
        pageId: '2',
        type: 'testimonials',
        title: 'What Our Customers Say',
        content: 'Excellent service and quality products. I have been shopping here for years and never been disappointed.',
        order: 4,
      },
      
      // Contact Page Content
      {
        id: '8',
        pageId: '3',
        type: 'hero',
        title: 'Get In Touch',
        content: 'We would love to hear from you. Contact us for any questions, concerns, or feedback.',
        imageUrl: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1200',
        order: 1,
      },
      {
        id: '9',
        pageId: '3',
        type: 'contact',
        title: 'Contact Form',
        content: 'Send us a message and we will get back to you within 24 hours.',
        buttonUrl: '/contact/submit',
        order: 2,
      },
      {
        id: '10',
        pageId: '3',
        type: 'text',
        title: 'Visit Our Store',
        content: 'You can also visit our physical store located at 123 Commerce Street, Business City. We are open Monday to Friday from 9 AM to 6 PM.',
        order: 3,
      },
      
      // Products Page Content
      {
        id: '11',
        pageId: '4',
        type: 'hero',
        title: 'Our Product Collection',
        content: 'Browse through our extensive collection of premium products across multiple categories.',
        imageUrl: 'https://images.pexels.com/photos/1005638/pexels-photo-1005638.jpeg?auto=compress&cs=tinysrgb&w=1200',
        buttonText: 'View All Products',
        buttonUrl: '/products/all',
        order: 1,
      },
      {
        id: '12',
        pageId: '4',
        type: 'features',
        title: 'Product Categories',
        content: 'Electronics, Fashion, Home & Garden, Sports, Books, and much more.',
        order: 2,
      },
      {
        id: '13',
        pageId: '4',
        type: 'gallery',
        title: 'Featured Products',
        content: 'Check out our most popular and trending products.',
        order: 3,
      },
      
      // Services Page Content
      {
        id: '14',
        pageId: '5',
        type: 'hero',
        title: 'Our Services',
        content: 'We provide comprehensive services to enhance your shopping experience.',
        imageUrl: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200',
        order: 1,
      },
      {
        id: '15',
        pageId: '5',
        type: 'features',
        title: 'What We Offer',
        content: 'Fast shipping, easy returns, 24/7 customer support, and warranty protection.',
        order: 2,
      },
      {
        id: '16',
        pageId: '5',
        type: 'text',
        title: 'Premium Support',
        content: 'Our dedicated customer support team is available 24/7 to assist you with any questions or concerns. We offer live chat, email support, and phone assistance.',
        order: 3,
      },
      {
        id: '17',
        pageId: '5',
        type: 'cta',
        title: 'Need Help?',
        content: 'Contact our support team for immediate assistance.',
        buttonText: 'Contact Support',
        buttonUrl: '/contact',
        order: 4,
      },
      
      // Blog Page Content
      {
        id: '18',
        pageId: '6',
        type: 'hero',
        title: 'Our Blog',
        content: 'Stay updated with the latest news, trends, and tips from our experts.',
        imageUrl: 'https://images.pexels.com/photos/261662/pexels-photo-261662.jpeg?auto=compress&cs=tinysrgb&w=1200',
        order: 1,
      },
      {
        id: '19',
        pageId: '6',
        type: 'text',
        title: 'Latest Articles',
        content: 'Discover helpful articles about product reviews, shopping tips, industry trends, and lifestyle advice from our team of experts.',
        order: 2,
      },
      {
        id: '20',
        pageId: '6',
        type: 'newsletter',
        title: 'Subscribe to Our Newsletter',
        content: 'Get the latest blog posts and exclusive offers delivered to your inbox.',
        buttonUrl: '/newsletter/subscribe',
        order: 3,
      },
      
      // FAQ Page Content
      {
        id: '21',
        pageId: '7',
        type: 'hero',
        title: 'Frequently Asked Questions',
        content: 'Find answers to the most common questions about our products and services.',
        imageUrl: 'https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg?auto=compress&cs=tinysrgb&w=1200',
        order: 1,
      },
      {
        id: '22',
        pageId: '7',
        type: 'text',
        title: 'Shipping & Delivery',
        content: 'We offer free shipping on orders over $75. Standard delivery takes 3-5 business days, while express delivery takes 1-2 business days.',
        order: 2,
      },
      {
        id: '23',
        pageId: '7',
        type: 'text',
        title: 'Returns & Exchanges',
        content: 'We accept returns within 30 days of purchase. Items must be in original condition with tags attached. Exchanges are processed within 5-7 business days.',
        order: 3,
      },
      {
        id: '24',
        pageId: '7',
        type: 'text',
        title: 'Payment Methods',
        content: 'We accept all major credit cards, PayPal, Apple Pay, Google Pay, and bank transfers. All transactions are secure and encrypted.',
        order: 4,
      },
      
      // Privacy Policy Page Content
      {
        id: '25',
        pageId: '8',
        type: 'hero',
        title: 'Privacy Policy',
        content: 'We are committed to protecting your privacy and personal information.',
        order: 1,
      },
      {
        id: '26',
        pageId: '8',
        type: 'text',
        title: 'Information We Collect',
        content: 'We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.',
        order: 2,
      },
      {
        id: '27',
        pageId: '8',
        type: 'text',
        title: 'How We Use Your Information',
        content: 'We use your information to process orders, provide customer service, send marketing communications (with your consent), and improve our services.',
        order: 3,
      },
      {
        id: '28',
        pageId: '8',
        type: 'text',
        title: 'Data Security',
        content: 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
        order: 4,
      },
      
      // Terms of Service Page Content
      {
        id: '29',
        pageId: '9',
        type: 'hero',
        title: 'Terms of Service',
        content: 'Please read these terms carefully before using our services.',
        order: 1,
      },
      {
        id: '30',
        pageId: '9',
        type: 'text',
        title: 'Acceptance of Terms',
        content: 'By accessing and using our website, you accept and agree to be bound by the terms and provision of this agreement.',
        order: 2,
      },
      {
        id: '31',
        pageId: '9',
        type: 'text',
        title: 'User Responsibilities',
        content: 'You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.',
        order: 3,
      },
      {
        id: '32',
        pageId: '9',
        type: 'text',
        title: 'Limitation of Liability',
        content: 'We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.',
        order: 4,
      },
      
      // Shipping Info Page Content
      {
        id: '33',
        pageId: '10',
        type: 'hero',
        title: 'Shipping Information',
        content: 'Learn about our shipping options, delivery times, and policies.',
        imageUrl: 'https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=1200',
        order: 1,
      },
      {
        id: '34',
        pageId: '10',
        type: 'features',
        title: 'Shipping Options',
        content: 'Standard shipping (3-5 days), Express shipping (1-2 days), Overnight delivery, International shipping available.',
        order: 2,
      },
      {
        id: '35',
        pageId: '10',
        type: 'text',
        title: 'Shipping Costs',
        content: 'Standard shipping is $9.99, Express shipping is $19.99, Overnight delivery is $29.99. Free shipping on orders over $75.',
        order: 3,
      },
      {
        id: '36',
        pageId: '10',
        type: 'text',
        title: 'International Shipping',
        content: 'We ship to over 50 countries worldwide. International shipping costs vary by destination and are calculated at checkout.',
        order: 4,
      },
      {
        id: '37',
        pageId: '10',
        type: 'cta',
        title: 'Track Your Order',
        content: 'Use your tracking number to monitor your shipment in real-time.',
        buttonText: 'Track Package',
        buttonUrl: '/tracking',
        order: 5,
      },
    ];

    setProducts(mockProducts);
    setOrders(mockOrders);
    setCategories(mockCategories);
    setPromotions(mockPromotions);
    setReviews(mockReviews);
    setLoyaltyTransactions(mockLoyaltyTransactions);
    setNotifications(mockNotifications);
    setWishlist(mockWishlist);
    setSeoPages(mockSEOPages);
    setContentBlocks(mockContentBlocks);
  }, []);

  const kpis: KPI = {
    totalSales: products.reduce((sum, product) => sum + (product.stock * product.price), 0),
    totalOrders: orders.length,
    revenue: orders.reduce((sum, order) => sum + order.total, 0),
    criticalStock: products.filter(product => product.stock <= 10).length,
  };

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, ...productData } : product
    ));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
  };

  const addPromotion = (promotionData: Omit<Promotion, 'id'>) => {
    const newPromotion: Promotion = {
      ...promotionData,
      id: Date.now().toString(),
    };
    setPromotions(prev => [...prev, newPromotion]);
  };

  const updatePromotion = (id: string, promotionData: Partial<Promotion>) => {
    setPromotions(prev => prev.map(promotion => 
      promotion.id === id ? { ...promotion, ...promotionData } : promotion
    ));
  };

  const deletePromotion = (id: string) => {
    setPromotions(prev => prev.filter(promotion => promotion.id !== id));
  };

  const addReview = (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...reviewData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setReviews(prev => [...prev, newReview]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };

  const addToWishlist = (userId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product && !wishlist.find(w => w.userId === userId && w.productId === productId)) {
      const newWishlistItem: WishlistItem = {
        id: Date.now().toString(),
        userId,
        productId,
        product,
        createdAt: new Date().toISOString(),
      };
      setWishlist(prev => [...prev, newWishlistItem]);
    }
  };

  const removeFromWishlist = (id: string) => {
    setWishlist(prev => prev.filter(item => item.id !== id));
  };

  const addToCart = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const existingItem = cart.find(item => item.productId === productId);
      if (existingItem) {
        updateCartItem(existingItem.id, existingItem.quantity + quantity);
      } else {
        const newCartItem: CartItem = {
          id: Date.now().toString(),
          productId,
          product,
          quantity,
          addedAt: new Date().toISOString(),
        };
        setCart(prev => [...prev, newCartItem]);
      }
    }
  };

  const updateCartItem = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(prev => prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const createOrder = (orderData: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setOrders(prev => [...prev, newOrder]);
    clearCart();
  };

  const reorderFromHistory = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      // Clear current cart and add all items from the order
      clearCart();
      order.items.forEach(item => {
        addToCart(item.productId, item.quantity);
      });
    }
  };

  const updateSEOPage = (id: string, pageData: Partial<SEOPage>) => {
    setSeoPages(prev => prev.map(page => 
      page.id === id ? { ...page, ...pageData, updatedAt: new Date().toISOString() } : page
    ));
  };

  const updateContentBlock = (id: string, blockData: Partial<ContentBlock>) => {
    setContentBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, ...blockData } : block
    ));
  };

  const updateSystemSettings = (settingsData: Partial<SystemSettings>) => {
    setSystemSettings(prev => ({ ...prev, ...settingsData }));
  };

  const generateReport = (type: Report['type'], dateRange: { start: string; end: string }) => {
    const newReport: Report = {
      id: Date.now().toString(),
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      dateRange,
      data: {}, // In a real app, this would contain the actual report data
      generatedAt: new Date().toISOString(),
    };
    setReports(prev => [...prev, newReport]);
  };

  return (
    <DataContext.Provider value={{
      products,
      orders,
      categories,
      promotions,
      kpis,
      reviews,
      loyaltyTransactions,
      notifications,
      wishlist,
      cart,
      seoPages,
      contentBlocks,
      systemSettings,
      reports,
      addProduct,
      updateProduct,
      deleteProduct,
      updateOrderStatus,
      addPromotion,
      updatePromotion,
      deletePromotion,
      addReview,
      markNotificationAsRead,
      addToWishlist,
      removeFromWishlist,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      createOrder,
      reorderFromHistory,
      updateSEOPage,
      updateContentBlock,
      updateSystemSettings,
      generateReport,
    }}>
      {children}
    </DataContext.Provider>
  );
};