// src/components/tables/BasicTables/OrderTable.tsx
import { useEffect, useState } from "react";
import axios from "../../../services/axios";

interface Order {
  _id: string;
  userId: {
    userName: string;
    userMail: string;
  };
  shopId: {
    userName: string;
    userMail: string;
  };
  totalPrice: number;
  timePurchase: string;
}

interface OrderResponse {
  success: boolean;
  data: {
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export default function OrderTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get<OrderResponse>('/admin/orders');
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

  if (loading) {
    return <div>Loading orders...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-2 text-left dark:bg-meta-4">
            <th className="px-4 py-4 font-medium text-black dark:text-white">
              Order ID
            </th>
            <th className="px-4 py-4 font-medium text-black dark:text-white">
              Customer
            </th>
            <th className="px-4 py-4 font-medium text-black dark:text-white">
              Shop
            </th>
            <th className="px-4 py-4 font-medium text-black dark:text-white">
              Total Price
            </th>
            <th className="px-4 py-4 font-medium text-black dark:text-white">
              Purchase Date
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                {order._id}
              </td>
              <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                <span className="font-medium">{order.userId.userName}</span>
                <br />
                <span className="text-sm text-gray-500">{order.userId.userMail}</span>
              </td>
              <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                <span className="font-medium">{order.shopId.userName}</span>
                <br />
                <span className="text-sm text-gray-500">{order.shopId.userMail}</span>
              </td>
              <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                ${order.totalPrice.toLocaleString()}
              </td>
              <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                {new Date(order.timePurchase).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
