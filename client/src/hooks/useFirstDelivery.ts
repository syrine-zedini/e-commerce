import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface Locality {
  locality_id: number;
  locality_name: string;
  delegation_name: string;
  governorate_name: string;
}

export interface FirstDeliveryOrder {
  barCode: string;
  link: string;
  status?: string;
}

export interface OrderStatus {
  state: string;
  barCode: string;
}

export function useFirstDelivery() {
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderStatuses, setOrderStatuses] = useState<Map<string, string>>(new Map());

  // Fetch localities on mount
  const fetchLocalities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/first-delivery/localities');
      if (!response.ok) throw new Error('Failed to fetch localities');
      const data = await response.json();
      setLocalities(data);
      return data;
    } catch (error: any) {
      console.error('Error fetching localities:', error);
      toast.error('Erreur: Impossible de charger les localités');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create order on First Delivery
  const createOrder = useCallback(async (orderId: string, localityId: number) => {
    try {
      setLoading(true);
      const response = await fetch('/api/first-delivery/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, localityId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const data: FirstDeliveryOrder = await response.json();
      toast.success(`Commande créée! Code: ${data.barCode}`);
      
      // Start polling for this order
      startPollingOrder(data.barCode);
      
      return data;
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(`Erreur: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get order status
  const getStatus = useCallback(async (barCode: string) => {
    try {
      const response = await fetch(`/api/first-delivery/status/${barCode}`);
      if (!response.ok) throw new Error('Failed to fetch status');
      const data: OrderStatus = await response.json();
      
      // Update local state
      setOrderStatuses(prev => new Map(prev).set(barCode, data.state));
      
      return data;
    } catch (error: any) {
      console.error('Error fetching status:', error);
      return null;
    }
  }, []);

  // Poll order status in real-time
  const startPollingOrder = useCallback((barCode: string) => {
    // Initial fetch
    getStatus(barCode);

    // Poll every 10 seconds for real-time updates
    const intervalId = setInterval(async () => {
      const status = await getStatus(barCode);
      if (status) {
        // Emit custom event for real-time UI updates
        window.dispatchEvent(
          new CustomEvent('firstDeliveryStatusUpdate', {
            detail: { barCode, status: status.state },
          })
        );
      }
    }, 10000); // 10 seconds for real-time feedback

    // Store interval ID for cleanup
    (window as any).firstDeliveryPollingIntervals = (window as any).firstDeliveryPollingIntervals || {};
    (window as any).firstDeliveryPollingIntervals[barCode] = intervalId;

    return () => clearInterval(intervalId);
  }, [getStatus]);

  // Stop polling order
  const stopPollingOrder = useCallback((barCode: string) => {
    const intervals = (window as any).firstDeliveryPollingIntervals;
    if (intervals && intervals[barCode]) {
      clearInterval(intervals[barCode]);
      delete intervals[barCode];
    }
  }, []);

  // Listen for real-time status updates
  useEffect(() => {
    const handleStatusUpdate = (event: any) => {
      const { barCode, status } = event.detail;
      setOrderStatuses(prev => new Map(prev).set(barCode, status));
      
      // Show toast notification for status changes
      const statusMessages: { [key: string]: string } = {
        'En attente': '⏳ Commande en attente',
        'En transit': '🚚 Commande en transit',
        'Livré': '✅ Commande livrée',
        'Annulé': '❌ Commande annulée',
        'Retourné': '↩️ Commande retournée',
      };
      
      if (statusMessages[status]) {
        toast.success(statusMessages[status]);
      }
    };

    window.addEventListener('firstDeliveryStatusUpdate', handleStatusUpdate);
    return () => window.removeEventListener('firstDeliveryStatusUpdate', handleStatusUpdate);
  }, []);

  return {
    localities,
    loading,
    orderStatuses,
    fetchLocalities,
    createOrder,
    getStatus,
    startPollingOrder,
    stopPollingOrder,
  };
}
