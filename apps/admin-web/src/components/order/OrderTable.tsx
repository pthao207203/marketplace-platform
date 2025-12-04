import React from 'react';
import type { Order } from './sampleData';

const PaymentIcon = ({ paid }: { paid: boolean }) => (
    <div
        className={`size-3 rounded-full mx-auto ${
            paid ? 'bg-orange-500' : 'border border-gray-400'
        }`}
    ></div>
);

interface OrderTableProps {
    orders: Order[];
}

const OrderTable: React.FC<OrderTableProps> = ({ orders }) => {
    const getStatusBadge = (status: Order['Status']) => {
        let color = '';
        switch (status) {
            case 'Pending':
                color = 'bg-blue-100 text-blue-700';
                break;
            case 'Processing':
                color = 'bg-yellow-100 text-yellow-700';
                break;
            case 'Cancelled':
                color = 'bg-orange-100 text-orange-700';
                break;
            case 'Delivering':
                color = 'bg-pink-100 text-pink-700';
                break;
            case 'Delivered':
                color = 'bg-green-100 text-green-700';
                break;
            case 'Returned':
                color = 'bg-purple-100 text-purple-700';
                break;
            case 'Complaints':
                color = 'bg-red-100 text-red-700';
                break;
        }
        return (
            <span
                className={`px-[20px] py-[5px] rounded-full text-[16px] font-normal ${color}`}
            >
                {status}
            </span>
        );
    };

    const formatCurrency = (amount: number) =>
        amount.toLocaleString('vi-VN') + ' VNĐ';

    if (orders.length === 0) {
        return (
            <div className="text-center py-10 text-[#441A02]">
                No orders found.
            </div>
        );
    }

    return (
        <div className="bg-none rounded-[16px] overflow-hidden text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
            <div className="w-full overflow-x-auto">
                <table className="w-full table-auto">

                    {/* Header */}
                    <thead className="border-b-[10px] border-[#F9FAFB] bg-white">
                        <tr className="text-center">
                            <th className="py-[15px] font-bold">Order ID</th>
                            <th className="py-[15px] font-bold bg-[#FFF7F3]">Creation Date</th>
                            <th className="py-[15px] font-bold">Completion Date</th>
                            <th className="py-[15px] font-bold bg-[#FFF7F3]">Status</th>
                            <th className="py-[15px] font-bold">Total</th>
                            <th className="py-[15px] font-bold bg-[#FFF7F3]">Paid</th>
                            <th className="py-[15px] font-bold">Act</th>
                        </tr>
                    </thead>

                    <tbody>
                        {orders.map((order) => (
                            <tr
                                key={order.Orderid}
                                className="hover:bg-[#8ECAE6]/30 bg-white"
                            >
                                <td className="p-[10px] text-center font-medium">
                                    #{order.Orderid}
                                </td>

                                <td className="p-[10px] text-center">
                                    {order.CreationDate}
                                </td>

                                {/* Completion Date */}
                                <td className="p-[10px] text-center">
                                    {(order.Status === 'Delivered' ||
                                        order.Status === 'Returned' ||
                                        order.Status === 'Complaints') &&
                                        (order.CompletionDate || '10/02/2025')}
                                </td>

                                {/* Status */}
                                <td className="p-[10px] text-center">
                                    {getStatusBadge(order.Status)}
                                </td>

                                {/* Total */}
                                <td className="p-[10px] text-center">
                                    <div className="font-medium">
                                        {formatCurrency(order.TotalPrice)}
                                    </div>
                                    <div className="text-[14px]">{order.TotalItems} products</div>
                                </td>

                                {/* Paid */}
                                <td className="p-[10px] text-center">
                                    <PaymentIcon
                                        paid={order.PaymentStatus === 'Paid'}
                                    />
                                </td>

                                {/* Actions */}
                                <td className="p-[10px] text-center">
                                    {order.CanConfirm && (
                                        <button className="bg-[#F25C05] text-white text-[16px] font-normal py-[5px] px-[20px] rounded-full hover:bg-orange-600 transition">
                                            Accept
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderTable;
