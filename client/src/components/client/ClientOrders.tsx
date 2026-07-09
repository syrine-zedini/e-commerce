import React, { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { convertImageUrl, onImgError } from "@/lib/imageUtils";
import { Clock, CheckCircle, Truck, XCircle } from "lucide-react";

interface Product {
  id: number;
  name: string;
  imageUrl?: string;
  image_path?: string;
  quantity: number;
}

interface Order {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  phone?: string;
  adresse: string;
  ville: string;
  code_postal: string;
  total: number;
  produits: Product[];
  statut: string;
  created_at: string;
  paiement_mode: string;
  frais_livraison: number;
}

export const ClientOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);

  // Load session
  useEffect(() => {
    const storedSession = localStorage.getItem("clientSession");
    if (storedSession) {
      setClient(JSON.parse(storedSession));
    }
  }, []);

  // Fetch orders for that client
  useEffect(() => {
    const fetchOrders = async () => {
      if (!client?.id) return;
      setLoading(true);

      try {
        const data = await apiGet(`/api/commandes?id=${client.id}`);
        setOrders(data as Order[]);
      } catch (error) {
        console.error("Erreur fetching commandes:", error);
        setOrders([]);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [client]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "en_attente":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-purple-600" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (!client)
    return <p className="text-center mt-8 text-gray-500">Veuillez vous connecter pour voir vos commandes.</p>;

  if (loading) return <p className="text-center mt-8 text-gray-500">Chargement de vos commandes...</p>;
  if (!orders.length) return <p className="text-center mt-8 text-gray-500">Aucune commande trouvée.</p>;

  return (
    <div className="overflow-x-auto mt-6">
      <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">
        Mes Commandes
      </h2>

      <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Produits</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Total (DT)</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Frais Livraison</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Mode Paiement</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.created_at} className="border-t border-gray-200">
              <td className="px-6 py-4 text-sm text-gray-900">
                {new Date(order.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 flex items-center space-x-2">
                {getStatusIcon(order.statut)}
                <span className="capitalize">{order.statut}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  {order.produits.map((product, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                      {product.image_path && (
                        <img
                          src={convertImageUrl(product.image_path)}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                          onError={onImgError}
                        />
                      )}
                      <span className="text-sm text-gray-900">
                        {product.name} x{product.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{order.total}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{order.frais_livraison}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{order.paiement_mode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
