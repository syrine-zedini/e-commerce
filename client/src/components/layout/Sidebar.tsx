import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Truck,
  User,
  Heart,
  Landmark,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();

  const adminMenuItems = [
    { id: 'dashboard',       label: 'Tableau de bord',       icon: LayoutDashboard },
    { id: 'products',        label: 'Produits',               icon: Package },
    { id: 'categories',      label: 'Catégories',             icon: Package },
    { id: 'orders',          label: 'Commandes',              icon: ShoppingCart },
    { id: 'deleted-orders',  label: 'Commandes Restaurées',  icon: Trash2 },
    { id: 'promotions',      label: 'Promotions',             icon: Tag },
    { id: 'marques',         label: 'Marques',                icon: Landmark },
  ];

  const commercialMenuItems = [
    { id: 'dashboard',       label: 'Tableau de bord',       icon: LayoutDashboard },
    { id: 'products',        label: 'Produits',               icon: Package },
    { id: 'categories',      label: 'Catégories',             icon: Package },
    { id: 'orders',          label: 'Commandes',              icon: ShoppingCart },
    { id: 'deleted-orders',  label: 'Commandes Restaurées',  icon: Trash2 },
    { id: 'promotions',      label: 'Promotions',             icon: Tag },
    { id: 'marques',         label: 'Marques',                icon: Landmark },
  ];

  const clientMenuItems = [
    { id: 'profile',  label: 'Mon profil',     icon: User },
    { id: 'orders',   label: 'Mes commandes',  icon: ShoppingCart },
    { id: 'wishlist', label: 'Mes favoris',    icon: Heart },
  ];

  const livreurMenuItems = [
    { id: 'deliveries', label: 'Mes livraisons', icon: Truck },
    { id: 'profile',    label: 'Mon profil',      icon: User },
  ];

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':           return adminMenuItems;
      case 'admin_commercial':return commercialMenuItems;
      case 'client':          return clientMenuItems;
      case 'livreur':         return livreurMenuItems;
      default:                return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    // ✅ flex-shrink-0 : la sidebar garde sa largeur fixe et ne se cache pas
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="flex justify-center items-center px-6 py-5 border-b border-gray-100">
        <img
          src="/figmaAssets/logo YJPARA.jpeg"
          alt="Logo YJ PARA"
          className="h-14 w-auto object-contain"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 mb-1 ${
                isActive
                  ? 'bg-[#1D8EE6] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`}
              />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};