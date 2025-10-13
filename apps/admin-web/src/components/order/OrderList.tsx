import { useState, useEffect } from "react";
import axios from "../../services/axios";

type OrderStatus = "All" | "Pending" | "Processing" | "Cancelled" | "Delivering" | "Delivered" | "Returned" | "Complaints";

interface Order {
  _id: string;
  userId: {
    userName: string;
    userMail: string;
  } | null;
  shopId: {
    userName: string;
    userMail: string;
  } | null;
  productId: string;
  totalPrice: number;
  timePurchase: string;
  status?: string;
  paymentStatus?: string;
  totalItems?: number;
  completionDate?: string;
}

const PaymentIcon = ({ paid }: { paid: boolean }) => (
  <div className={`size-3 rounded-full mx-auto ${paid ? 'bg-orange-500' : 'border border-gray-400'}`}></div>
);

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>("All");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/admin/orders');
        if (response.data.success) {
          setOrders(response.data.data.orders);
        } else {
          setError('Failed to fetch orders');
        }
      } catch (err) {
        setError('Error fetching orders');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadge = (status?: string) => {
    let colorClasses = 'bg-gray-200 text-gray-800';
    switch (status) {
      case 'Pending':
        colorClasses = 'bg-blue-100 text-blue-700';
        break;
      case 'Processing':
        colorClasses = 'bg-yellow-100 text-yellow-700';
        break;
      case 'Cancelled':
        colorClasses = 'bg-orange-100 text-orange-700';
        break;
      case 'Delivering':
        colorClasses = 'bg-pink-100 text-pink-700';
        break;
      case 'Delivered':
        colorClasses = 'bg-green-100 text-green-700';
        break;
      case 'Returned':
        colorClasses = 'bg-purple-100 text-purple-700';
        break;
      case 'Complaints':
        colorClasses = 'bg-red-100 text-red-700';
        break;
    }
    return (
      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${colorClasses}`}>
        {status || 'Unknown'}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' VNĐ';
  };

  const filteredOrders = currentStatus === "All"
    ? orders
    : orders.filter(order => order.status === currentStatus);

  const statusFilters: { status: OrderStatus; label: string }[] = [
    { status: "All", label: `All (${orders.length})` },
    { status: "Pending", label: `Pending (${orders.filter(o => o.status === "Pending").length})` },
    { status: "Processing", label: `Processing (${orders.filter(o => o.status === "Processing").length})` },
    { status: "Cancelled", label: `Cancelled (${orders.filter(o => o.status === "Cancelled").length})` },
    { status: "Delivering", label: `Delivering (${orders.filter(o => o.status === "Delivering").length})` },
    { status: "Delivered", label: `Delivered (${orders.filter(o => o.status === "Delivered").length})` },
    { status: "Returned", label: `Returned (${orders.filter(o => o.status === "Returned").length})` },
    { status: "Complaints", label: `Complaints (${orders.filter(o => o.status === "Complaints").length})` },
  ];

  if (loading) {
    return <div className="text-center py-10">Loading orders...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray/90 mb-4">
          List of orders
        </h3>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-300 dark:border-gray-700">
          {statusFilters.map((filter) => (
            <button
              key={filter.status}
              onClick={() => setCurrentStatus(filter.status)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                currentStatus === filter.status
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-gray-700 hover:border-orange-700 dark:text-gray-700 dark:hover:border-orange-500"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-white/[0.05]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ORDER ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">CUSTOMER</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">SHOP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">CREATION DATE</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">COMPLETION DATE</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">STATUS</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">TOTAL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">PAID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ACT</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-transparent dark:divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition duration-150">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {order.userId ? (
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{order.userId.userName}</div>
                          <div className="text-xs text-gray-500">{order.userId.userMail}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {order.shopId ? (
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{order.shopId.userName}</div>
                          <div className="text-xs text-gray-500">{order.shopId.userMail}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-700">
                      {new Date(order.timePurchase).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-700">
                      {order.completionDate ? new Date(order.completionDate).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray">
                      <div className="font-medium">{formatCurrency(order.totalPrice)}</div>
                      <div className="text-xs text-gray-700 dark:text-gray-700">{order.totalItems || 1} products</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center align-middle">
                      <div className="flex justify-center items-center h-full">
                        <PaymentIcon paid={order.paymentStatus === 'Paid'} />
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center align-middle">
                      {order.status === 'Complaints' && (
                        <button className="bg-orange-500 text-white text-xs font-semibold py-1 px-3 rounded-lg hover:bg-orange-600 transition">
                          Accept
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
