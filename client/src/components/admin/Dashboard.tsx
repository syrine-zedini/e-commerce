import React, { useEffect, useMemo, useState } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { DollarSign, ShoppingCart, Package } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { apiGet, fetchAllProducts as fetchAllProductsApi } from '@/lib/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Product {
  id: number;
  name: string;
  form?: string | null;  // repurposed to store stock quantity
  stock_status?: string;
  category_id: number;
  created_at: string;
}

interface Commande {
  id: string;
  statut: string;
  total: number;
  produits: any[];
  created_at: string;
  nom?: string;
  prenom?: string;
  email?: string;
  phone?: string;
}

interface DashboardProps {
  onOrderClick?: (orderId: string) => void;
}

type StatusConfig = {
  label: string;
  className: string;
};

const getStatusConfig = (status: string): StatusConfig => {
  switch (status) {
    case 'pending':
      return {
        label: 'En attente',
        className: 'bg-yellow-100 text-yellow-800',
      };
    case 'preconfirmed':
      return {
        label: 'Pré-confirmé',
        className: 'bg-orange-100 text-orange-800',
      };
    case 'confirmed':
      return {
        label: 'Confirmé',
        className: 'bg-blue-100 text-blue-800',
      };
    case 'delivered':
      return {
        label: 'Livré',
        className: 'bg-green-100 text-green-800',
      };
    case 'cancelled':
      return {
        label: 'Annulé',
        className: 'bg-red-100 text-red-800',
      };
    default:
      return {
        label: status || 'Inconnu',
        className: 'bg-gray-100 text-gray-800',
      };
  }
};

export const Dashboard: React.FC<DashboardProps> = ({ onOrderClick }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Commande[]>([]);
  const [kpis, setKpis] = useState({
    revenue: 0,
    totalOrders: 0,
    criticalStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [prodData, orderData] = await Promise.all([
        fetchAllProductsApi('/api/products') as Promise<Product[]>,
        apiGet('/api/commandes?fields=id,statut,total,created_at,nom,prenom,email,phone') as Promise<Commande[]>,
      ]);

      setProducts(prodData);
      setOrders(orderData || []);

      const totalRevenue = orderData.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const totalOrders = orderData.length;
      const criticalStock = prodData.filter((product) => {
        const stockNum = product.form !== null && product.form !== undefined && product.form !== ""
          ? Number(product.form)
          : null;
        const isOutOfStockStock = stockNum !== null && stockNum <= 0;
        const isOutOfStockStatus = String(product.stock_status ?? "en stock").trim().toLowerCase() === "en rupture de stock";
        return isOutOfStockStock || isOutOfStockStatus;
      }).length;

      setKpis({ revenue: totalRevenue, totalOrders, criticalStock });
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      title: 'Revenu Total',
      value: `${kpis.revenue.toLocaleString()} DT`,
      icon: DollarSign,
      color: 'from-green-400 to-green-600',
    },
    {
      title: 'Commandes Totales',
      value: kpis.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'from-blue-400 to-blue-600',
    },
    {
      title: 'Produits',
      value: products.length.toString(),
      icon: Package,
      color: 'from-purple-400 to-purple-600',
    },
  ];

  const salesData = useMemo(
    () => ({
      labels: orders.map((order) => new Date(order.created_at).toLocaleDateString()),
      datasets: [
        {
          label: 'Ventes',
          data: orders.map((order) => Number(order.total || 0)),
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    }),
    [orders]
  );

  const orderStatusData = useMemo(
    () => ({
      labels: ['En attente', 'Pré-confirmé', 'Confirmé', 'Livré', 'Annulé'],
      datasets: [
        {
          data: [
            orders.filter((order) => order.statut === 'pending').length,
            orders.filter((order) => order.statut === 'preconfirmed').length,
            orders.filter((order) => order.statut === 'confirmed').length,
            orders.filter((order) => order.statut === 'delivered').length,
            orders.filter((order) => order.statut === 'cancelled').length,
          ],
          backgroundColor: [
            'rgba(250, 204, 21, 0.7)',
            'rgba(249, 115, 22, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(34, 197, 94, 0.7)',
            'rgba(239, 68, 68, 0.7)',
          ],
          borderColor: [
            'rgba(250, 204, 21, 1)',
            'rgba(249, 115, 22, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 2,
        },
      ],
    }),
    [orders]
  );

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 11,
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
          font: {
            size: 10,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 12,
          font: {
            size: 11,
          },
        },
      },
    },
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-6 lg:px-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-gray-900 sm:text-3xl">
            Tableau de bord
          </h1>
          <p className="mt-1 text-xs text-gray-500 sm:hidden">
            Vue générale de votre activité
          </p>
        </div>

        <div className="text-xs text-gray-500 sm:text-right sm:text-sm">
          Dernière mise à jour :
          <span className="block sm:inline sm:pl-1">
            {new Date().toLocaleString()}
          </span>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 xl:gap-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;

          return (
            <div
              key={index}
              className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5 lg:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-600 sm:text-sm">
                    {kpi.title}
                  </p>
                  <p className="mt-1 truncate text-xl font-bold text-gray-900 sm:mt-2 sm:text-2xl">
                    {loading ? '...' : kpi.value}
                  </p>
                </div>

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r sm:h-12 sm:w-12 ${kpi.color}`}
                >
                  <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphique des ventes */}
      <div className="grid grid-cols-1 gap-4 lg:gap-6">
        <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
              Tendance des ventes
            </h3>
            <p className="text-xs text-gray-500">
              {orders.length} commande{orders.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="h-[260px] w-full sm:h-[320px] lg:h-[380px]">
            <Line data={salesData} options={lineChartOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
          <h3 className="mb-4 text-base font-semibold text-gray-900 sm:text-lg">
            Statut des commandes
          </h3>

          <div className="h-[260px] w-full sm:h-[300px] lg:h-[340px]">
            <Doughnut data={orderStatusData} options={doughnutChartOptions} />
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-2 lg:p-6">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
              Commandes récentes
            </h3>
            <p className="text-xs text-gray-500">
              Les 5 dernières commandes
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {orders.slice(0, 5).length > 0 ? (
              orders.slice(0, 5).map((order) => {
                const status = getStatusConfig(order.statut);

                return (
                  <div
                    key={order.id}
                    className={`flex flex-col gap-3 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${
                      onOrderClick ? 'cursor-pointer transition-colors hover:bg-gray-100' : ''
                    }`}
                    onClick={() => onOrderClick && onOrderClick(order.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 sm:text-base">
                        {order.nom && order.prenom
                          ? `${order.nom} ${order.prenom}`
                          : order.email || `#${String(order.id).slice(0, 8).toUpperCase()}`}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {/* {order.email && (order.nom || order.prenom) ? order.email + ' · ' : ''} */}
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                      <p className="whitespace-nowrap text-sm font-semibold text-gray-900 sm:text-base">
                        {Number(order.total || 0).toLocaleString()} DT
                      </p>
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
                Aucune commande récente à afficher.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};