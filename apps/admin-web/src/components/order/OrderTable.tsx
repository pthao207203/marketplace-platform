import React from 'react';
import type { Order } from './sampleData'; 
import { useNavigate } from "react-router";

const PaymentIcon = ({ paid }: { paid: boolean }) => (
    <div className={`size-3 rounded-full mx-auto ${paid ? 'bg-orange-500' : 'border border-gray-400'}`}></div>
);

interface OrderTableProps {
  orders: Order[]; 
}

const OrderTable: React.FC<OrderTableProps> = ({ orders }) => {

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

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' VNĐ';
  };
  
  if (orders.length === 0) {
    return <div className="text-center py-10 text-gray-500">No orders found.</div>;
  }
  const navigate = useNavigate();
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-orange-200 dark:divide-orange-700">
        <thead className="bg-orange-50 dark:bg-white/[0.05]">   
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ORDER ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">CREATION DATE</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">COMPLETION DATE</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">STATUS</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">TOTAL</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">PAID</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">ACT</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-transparent dark:divide-gray-700">
          {orders.map((order) => (
            <tr key={order.Orderid} className="hover:bg-orange-50 dark:hover:bg-white/5 transition duration-150">
              
              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                <div className="flex items-start space-x-2">
                    
                    <div>
                        <div className="text-xs font-medium text-gray-700">#{order.Orderid}</div>
                        
                    </div>
                </div>
              </td> 

              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-700">{order.CreationDate}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-700">
                {order.Status === 'Delivered' ? order.CompletionDate || '10/02/2025' : ''}
                {order.Status === 'Returned' ? order.CompletionDate || '10/02/2025' : ''}
                {order.Status === 'Complaints' ? order.CompletionDate || '10/02/2025' : ''}
              </td>

              <td className="px-4 py-3 whitespace-nowrap text-sm">{getStatusBadge(order.Status)}</td>
              
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray">
                <div className="font-medium">{formatCurrency(order.TotalPrice)}</div>
                <div className="text-xs text-gray-700 dark:text-gray-700">{order.TotalItems} products</div>
              </td>
              
              <td className="px-4 py-3 whitespace-nowrap text-center align-middle">
                <div className="flex justify-center items-center h-full">
                  <PaymentIcon paid={order.PaymentStatus === 'Paid'} />
                </div>
              </td>
              
              <td className="px-4 py-3 whitespace-nowrap text-center align-middle">
                  <button className="bg-orange-500 text-white text-xs font-semibold py-1 px-3 rounded-lg hover:bg-orange-600 transition"
                  onClick={() => navigate(`/detailoforder/${order.Orderid}`)} >
                    See details
                  </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;