import React, { useEffect, useState, useMemo } from "react"; 
import { useNavigate } from "react-router";
import { sampleOrders, type Order, type OrderItem } from "./sampleData";

function formatCurrency(amount?: number | null) {
  if (amount == null) return "-";
  return amount.toLocaleString("vi-VN") + ' ₫'; 
}

const InfoField = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="text-sm text-gray-500 mb-1">{label}</div>
    <div className="font-semibold text-gray-800">{value}</div>
  </div>
);

const getStatusBadge = (status: Order['Status']) => {
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
          {status === 'Pending' ? 'Pending' : status === 'Processing' ? 'Processing' : status}
        </span>
    );
};

export default function OrderDetail({ orderId }: { orderId?: string }) {
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    const found = sampleOrders.find((o) => o.Orderid === orderId) ?? null;
    
    setTimeout(() => {
      setOrder(found);
      setLoading(false);
    }, 300);
  }, [orderId]);

  const orderSummary = useMemo(() => {
    if (!order) return { TotalItems: 0, TotalPrice: 0 };

    const TotalItems = order.items.reduce((sum, item) => sum + item.Quantity, 0);
    return { TotalItems, TotalPrice: order.TotalPrice };
  }, [order]);

  if (loading) return <div className="p-8 text-center">Loading order data...</div>;

  if (!order) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="text-gray-700">Order not found #{orderId}</div>
        <button
          className="mt-3 inline-block bg-orange-200 text-orange-800 text-sm py-1 px-3 rounded hover:bg-orange-300"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
    );
  }

  const shouldShowCompletionDate = ['Delivered', 'Returned', 'Complaints'].includes(order.Status);
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{`#${order.Orderid}`}</h1>
        <button
          className="bg-orange-400 text-gray-800 text-sm font-semibold py-2 px-4 rounded hover:bg-orange-500 transition-colors"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>

      <div className="border-b pb-4 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">General information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
          <InfoField label="Status" value={getStatusBadge(order.Status)} />
          <InfoField label="Creation Date" value={order.CreationDate} />
          <InfoField 
              label="Completion Date" 
              value={shouldShowCompletionDate ? order.CompletionDate : '---'} 
          />
          <InfoField label="Payment Status" value={order.PaymentStatus} />
          <InfoField label="Customer ID" value={order.Userid} />
          <InfoField label="Customer name" value={order.Cusname} />  
          <InfoField label="Total Price" value={formatCurrency(order.TotalPrice)} />
          <InfoField label="Total Items" value={orderSummary.TotalItems} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Goods information</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-50 text-sm">
            <thead className="bg-orange-50">
              <tr>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-600">Product ID</th>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-600">Product Name</th>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-600">Shop ID</th>
                <th className="py-2 px-3 border-b text-left font-semibold text-gray-600">Shop Name</th>
                <th className="py-2 px-3 border-b text-center font-semibold text-gray-600">Quantity</th>
                <th className="py-2 px-3 border-b text-center font-semibold text-gray-600">Price (Unit)</th>
                <th className="py-2 px-3 border-b text-center font-semibold text-gray-600">Total Price (Item)</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="hover:bg-orange-50">
                  <td className="py-2 px-3 border-b">{item.Productid}</td>
                  <td className="py-2 px-3 border-b">{item.Productname}</td>
                  <td className="py-2 px-3 border-b">{item.Shopid}</td>
                  <td className="py-2 px-3 border-b">{item.Shopname}</td>
                  <td className="py-2 px-3 border-b text-center">{item.Quantity}</td>
                  <td className="py-2 px-3 border-b text-center">{formatCurrency(item.Price)}</td> 
                  <td className="py-2 px-3 border-b text-center">
                    {formatCurrency(item.ItemTotalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-bold">
                <tr>
                 <td className="py-2 px-3 text-left text-red-500" colSpan={4}>TOTAL ORDER SUMMARY</td>
                 <td className="py-2 px-3 text-center text-red-500 ">{orderSummary.TotalItems}</td> 
                 <td className="py-2 px-3 text-center text-red-500 ">---</td> 
                 <td className="py-2 px-3 text-center text-red-500 ">{formatCurrency(orderSummary.TotalPrice)}</td> 
               </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}