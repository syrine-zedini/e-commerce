import React, { useEffect, useState } from 'react';
import { Phone, MapPin, Calendar, Loader2, Trash2 } from 'lucide-react';
import { apiGet, apiDelete } from '@/lib/api';
import toast from 'react-hot-toast';

interface Customer {
  id: string; // use email or generated uuid as key
  nom: string;
  prenom: string;
  email: string;
  phone: string | null;
  address: string;
  createdAt: string;
  isActive: boolean;
}

interface Order {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  phone: string | null;
  adresse: string;
  total: number;
  status: string;
  created_at: string;
}

export const CustomerManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm] = useState('');
  const [statusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch orders from the API
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/commandes');
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Build unique customers list from orders
  useEffect(() => {
    const uniqueCustomersMap: Record<string, Customer> = {};
    orders.forEach(order => {
      const key = order.email; // using email as unique key
      if (!uniqueCustomersMap[key]) {
        uniqueCustomersMap[key] = {
          id: key,
          nom: order.nom,
          prenom: order.prenom,
          email: order.email,
          phone: order.phone,
          address: order.adresse,
          createdAt: order.created_at,
          isActive: true, // default, could come from another table if available
        };
      }
    });
    setCustomers(Object.values(uniqueCustomersMap));
  }, [orders]);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'active' && customer.isActive) ||
      (statusFilter === 'inactive' && !customer.isActive);
    return matchesSearch && matchesStatus;
  });

  const getCustomerOrders = (customerEmail: string) => {
    return orders.filter(order => order.email === customerEmail);
  };

  const getCustomerStats = (customerEmail: string) => {
    const customerOrders = getCustomerOrders(customerEmail);
    const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = customerOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    return { totalSpent, totalOrders, avgOrderValue };
  };

const handleDeleteCustomer = async (customerEmail: string) => {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce client et toutes ses commandes ?")) {
    return;
  }

  try {
    // Delete all orders for this customer
    try {
      await apiDelete(`/api/commandes?email=${encodeURIComponent(customerEmail)}`);
    } catch (orderError) {
      console.error("❌ Erreur lors de la suppression des commandes :", orderError);
      return;
    }

    // Remove customer locally (since customers list is derived from orders)
    setCustomers(prev => prev.filter(c => c.email !== customerEmail));
    setOrders(prev => prev.filter(o => o.email !== customerEmail));

    toast.success("✅ Client supprimé avec succès !");
  } catch (err) {
    console.error("❌ Erreur inattendue :", err);
    toast.error("❌ Une erreur est survenue");
  }
};

  if (loading) return   <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="w-12 h-12 text-app-primary animate-spin mb-4" />
      <p className="text-gray-600 text-lg font-medium">Chargement en cours...</p>
    </div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des clients</h1>
        <div className="text-sm text-gray-500">{filteredCustomers.length} client existant</div>
      </div>

      {/* Filters */}
      {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div> */}
          {/* <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div> */}
        {/* </div>
      </div> */}

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => {
          const stats = getCustomerStats(customer.email);
          return (
            <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {customer.nom[0]}{customer.prenom[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{customer.nom} {customer.prenom}</h3>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {customer.phone || '-'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {customer.address}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Joined {new Date(customer.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600"> Nombre de Commandes</p>
                  <p className="text-lg font-bold text-blue-900">{stats.totalOrders}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Montant total dépensé</p>
                  <p className="text-lg font-bold text-green-900">{stats.totalSpent.toFixed(2)} DT</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {/* <button
                    onClick={() => setSelectedCustomer(customer)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button> */}
              {/* <button
    onClick={() => toggleCustomerStatus(customer.id)}
    className={`p-2 rounded-lg transition-colors ${
      customer.isActive
        ? 'text-red-600 hover:bg-red-50'
        : 'text-green-600 hover:bg-green-50'
    }`}
    title={customer.isActive ? "Désactiver client" : "Activer client"}
  >
    {customer.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
  </button> */}

  <button
    onClick={() => handleDeleteCustomer(customer.email)}
    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    title="Supprimer client"
  >
    <Trash2 className="w-4 h-4" />
  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
