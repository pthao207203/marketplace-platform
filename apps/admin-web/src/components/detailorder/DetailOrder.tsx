import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { getOrderById } from "../../services/api.service";

export default function DetailOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getOrderById(id);
        
        if (response.success) {
          setOrder(response.data.order);
        }
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError(err.response?.data?.error?.message || "Lỗi khi tải đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full h-full py-[20px] px-[30px] bg-white/60 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F25C05] mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full py-[20px] px-[30px] bg-white/60 min-h-screen">
        <div className="p-6 text-center text-red-500 text-xl bg-red-50 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full h-full py-[20px] px-[30px] bg-white/60 min-h-screen">
        <div className="p-6 text-center text-red-500 text-xl">
          Không tìm thấy đơn hàng!
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return "0 đ";
    return amount.toLocaleString("vi-VN") + " đ";
  };

  const getStatusInfo = (status: number) => {
    const statusMap: Record<number, { label: string; color: string }> = {
      1: { label: "Chờ xác nhận", color: "bg-blue-100 text-blue-700" },
      2: { label: "Đang giao", color: "bg-pink-100 text-pink-700" },
      3: { label: "Đã hủy", color: "bg-orange-100 text-orange-700" },
      4: { label: "Đã giao", color: "bg-green-100 text-green-700" },
      5: { label: "Trả hàng", color: "bg-purple-100 text-purple-700" },
    };
    return statusMap[status] || { label: "Unknown", color: "bg-gray-100 text-gray-700" };
  };

  const statusInfo = getStatusInfo(order.orderStatus);

  return (
    <div className="w-full min-h-screen py-[20px] px-[30px] bg-white/60">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            title="Xem danh sách đơn hàng"
            onClick={() => navigate("/listoforder")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-[22px] text-[#441A02]">
              Chi tiết đơn hàng #{order.orderId || order._id}
            </h1>
            <p className="text-[14px] text-[#A09CAB]">
              Ngày tạo: {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div>
          <span className={`px-[20px] py-[8px] rounded-full text-[16px] font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* ORDER INFO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Column */}
        <div className="bg-white rounded-[16px] p-6 border">
          <h2 className="font-bold text-[18px] mb-4 text-[#441A02]">Thông tin đơn hàng</h2>
          <div className="space-y-3">
            <InfoRow label="Mã đơn hàng" value={order.orderId || `ORD-${order._id.slice(-8)}`} />
            <InfoRow label="Ngày tạo" value={formatDate(order.createdAt)} />
            <InfoRow label="Ngày cập nhật" value={formatDate(order.updatedAt)} />
            <InfoRow 
              label="Ngày giao hàng" 
              value={order.deliveredAt ? formatDate(order.deliveredAt) : "Chưa giao"} 
            />
            <InfoRow 
              label="Trạng thái thanh toán" 
              value={order.orderPaymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"} 
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="bg-white rounded-[16px] p-6 border">
          <h2 className="font-bold text-[18px] mb-4 text-[#441A02]">Thông tin khách hàng</h2>
          <div className="space-y-3">
            <InfoRow label="Mã khách hàng" value={order.orderBuyerId || "N/A"} />
            <InfoRow 
              label="Địa chỉ giao hàng" 
              value={order.orderShippingAddress?.street || "N/A"} 
            />
            <InfoRow 
              label="Số điện thoại" 
              value={order.orderShippingAddress?.phone || "N/A"} 
            />
          </div>
        </div>
      </div>

      {/* ORDER ITEMS */}
      <div className="bg-white rounded-[16px] p-6 border mb-6">
        <h2 className="font-bold text-[18px] mb-4 text-[#441A02]">Sản phẩm</h2>
        
        {order.orderItems && order.orderItems.length > 0 ? (
          <div className="space-y-4">
            {order.orderItems.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                <ProductImage 
                  src={item.imageUrl} 
                  alt={item.name || "Product"}
                />
                <div className="flex-1">
                  <h3 className="font-medium text-[16px]">{item.name || "N/A"}</h3>
                  <p className="text-[14px] text-[#A09CAB]">
                    Số lượng: {item.qty} x {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="font-bold text-[18px]">
                  {formatCurrency(item.lineTotal)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-[#A09CAB]">Không có sản phẩm</p>
        )}
      </div>

      {/* ORDER SUMMARY */}
      <div className="bg-white rounded-[16px] p-6 border">
        <h2 className="font-bold text-[18px] mb-4 text-[#441A02]">Tổng kết</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-[16px]">
            <span>Tạm tính:</span>
            <span>{formatCurrency(order.orderSubtotal || 0)}</span>
          </div>
          <div className="flex justify-between text-[16px]">
            <span>Phí vận chuyển:</span>
            <span>{formatCurrency(order.orderShippingFee || 0)}</span>
          </div>
          <div className="flex justify-between text-[16px]">
            <span>Giảm giá:</span>
            <span className="text-red-500">-{formatCurrency(order.orderDiscount || 0)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between font-bold text-[20px]">
            <span>Tổng cộng:</span>
            <span className="text-[#F25C05]">{formatCurrency(order.orderTotalAmount || 0)}</span>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-6 flex justify-end gap-4">
        <button
          onClick={() => navigate("/listoforder")}
          className="px-6 py-2 bg-gray-200 text-[#441A02] rounded-lg hover:bg-gray-300 transition"
        >
          Quay lại
        </button>
        {order.orderStatus === 1 && (
          <button className="px-6 py-2 bg-[#F25C05] text-white rounded-lg hover:bg-[#d94f04] transition">
            Xác nhận đơn hàng
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- COMPONENT PHỤ ---------------- */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b">
      <span className="text-[14px] text-[#A09CAB]">{label}:</span>
      <span className="text-[16px] font-medium text-[#441A02]">{value}</span>
    </div>
  );
}

// ⚠️ FIX: Component riêng để xử lý image error một lần duy nhất
function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset error state if src changes
    setHasError(false);
  }, [src]);

  const handleError = () => {
    // If image fails to load, set error state to true
    setHasError(true);
  };

  // Render fallback if src is missing or if there was an error
  if (hasError || !src) {
    return (
      <div className="w-[80px] h-[80px] rounded-lg border bg-gray-100 flex items-center justify-center">
        <svg 
          className="w-8 h-8 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-[80px] h-[80px] rounded-lg object-cover border"
      onError={handleError}
    />
  );
}
