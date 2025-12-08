import React, { useState } from 'react';
import { Order, confirmOrder, cancelOrder } from '../../services/api.service';
import { Link } from 'react-router-dom';

const PaymentIcon = ({ paid }: { paid: boolean }) => (
    <div
        className={`size-3 rounded-full mx-auto ${
            paid ? 'bg-orange-500' : 'border border-gray-400'
        }`}
    ></div>
);

interface OrderTableProps {
    orders: Order[];
    onRefresh?: () => void; // Callback để refresh data sau khi confirm/cancel
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, onRefresh }) => {
    const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

    const getStatusBadge = (status: Order['status']) => {
        let color = '';
        let label = '';
        
        switch (status) {
            case 'Pending':
                color = 'bg-blue-100 text-blue-700';
                label = 'Chờ xác nhận';
                break;
            case 'Cancelled':
                color = 'bg-orange-100 text-orange-700';
                label = 'Đã hủy';
                break;
            case 'Delivering':
                color = 'bg-pink-100 text-pink-700';
                label = 'Đang giao';
                break;
            case 'Delivered':
                color = 'bg-green-100 text-green-700';
                label = 'Đã giao';
                break;
            case 'Returned':
                color = 'bg-purple-100 text-purple-700';
                label = 'Trả hàng';
                break;
            default:
                color = 'bg-gray-100 text-gray-700';
                label = status;
        }
        
        return (
            <span
                className={`px-[20px] py-[5px] rounded-full text-[16px] font-normal ${color}`}
            >
                {label}
            </span>
        );
    };

    const formatCurrency = (amount: number) => {
        // ⚠️ FIX: Handle undefined/null amount
        if (amount === undefined || amount === null || isNaN(amount)) {
            return '0 VNĐ';
        }
        return amount.toLocaleString('vi-VN') + ' VNĐ';
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    /*
    const handleConfirmOrder = async (orderId: string) => {
        if (!confirm('Bạn có chắc muốn xác nhận đơn hàng này?')) return;

        try {
            setProcessingOrderId(orderId);
            await confirmOrder(orderId);
            alert('Xác nhận đơn hàng thành công!');
            
            // Refresh data
            if (onRefresh) onRefresh();
        } catch (error: any) {
            console.error('Error confirming order:', error);
            alert(error.response?.data?.error?.message || 'Lỗi khi xác nhận đơn hàng');
        } finally {
            setProcessingOrderId(null);
        }
    };
    */

    /*
    const handleCancelOrder = async (orderId: string) => {
        const reason = prompt('Nhập lý do hủy đơn (tùy chọn):');
        if (reason === null) return; // User clicked Cancel

        try {
            setProcessingOrderId(orderId);
            await cancelOrder(orderId, reason);
            alert('Hủy đơn hàng thành công!');
            
            // Refresh data
            if (onRefresh) onRefresh();
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            alert(error.response?.data?.error?.message || 'Lỗi khi hủy đơn hàng');
        } finally {
            setProcessingOrderId(null);
        }
    };
    */

    if (orders.length === 0) {
        return (
            <div className="text-center py-10 text-[#441A02]">
                Không tìm thấy đơn hàng nào.
            </div>
        );
    }

    return (
        <div className="bg-none rounded-[16px] overflow-hidden text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
            <div className="w-full overflow-x-auto">
                <table className="w-full table-fixed">
                    {/* Header */}
                    <thead className="border-b-[10px] border-[#F9FAFB] bg-white">
                        <tr className="text-center">
                            <th className="w-3/12 py-[15px] font-bold">Order ID</th>
                            <th className="w-2/12 py-[15px] font-bold bg-[#FFF7F3]">Creation Date</th>
                            <th className="w-2/12 py-[15px] font-bold">Status</th>
                            <th className="w-3/12 py-[15px] font-bold bg-[#FFF7F3]">Total</th>
                            <th className="w-2/12 py-[15px] font-bold ">Paid</th>
                            {/* <th className="py-[15px] font-bold">Act</th> */}
                        </tr>
                    </thead>

                    <tbody>
                        {orders.map((order) => (
                            <tr
                                key={order.id}
                                className="hover:bg-[#8ECAE6]/30 bg-white"
                            >
                                <td className="p-[10px] text-center font-medium">
                                  <Link 
                                     to={`/listoforder/${order.id}`}
                                      className="text-[#611A02] hover:underline"
                                  >
                                      #{order.orderId}
                                  </Link>
                                  </td>

                                <td className="p-[10px] text-center">
                                    {formatDate(order.creationDate)}
                                </td>

                                {/* Status */}
                                <td className="p-[10px] text-center">
                                    {getStatusBadge(order.status)}
                                </td>

                                {/* Total */}
                                <td className="p-[10px] text-center">
                                    <div className="font-medium">
                                        {formatCurrency(order.totalPrice)}
                                    </div>
                                    <div className="text-[14px]">{order.totalItems} products</div>
                                </td>

                                {/* Paid */}
                                <td className="p-[10px] text-center">
                                    <PaymentIcon
                                        paid={order.paymentStatus === 'Paid'}
                                    />
                                </td>

                                {/* Actions */}
                                {/*
                                <td className="p-[10px] text-center">
                                    {order.canConfirm && (
                                        <button 
                                            onClick={() => handleConfirmOrder(order.id)}
                                            disabled={processingOrderId === order.id}
                                            className="bg-[#F25C05] text-white text-[16px] font-normal py-[5px] px-[20px] rounded-full hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {processingOrderId === order.id ? 'Processing...' : 'Accept'}
                                        </button>
                                    )}
                                </td>
                                */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderTable;
