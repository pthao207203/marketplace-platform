import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { MapPin } from "lucide-react";

interface Order {
  _id: string;
  createdAt: string;
  completedAt?: string;
  orderPaymentMethod: string;
  orderTotalAmount: number;
  orderStatus: number;
  orderPaymentStatus: string;
}

interface BankAccount {
  bankName: string;
  accountNumber: string;
  isDefault: boolean;
}

interface CustomerDetail {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinedDate: string;
  status: number; // 1: Active, 3: Banned
  address: any[];
  bankAccounts: BankAccount[];
  totalSpent: number;
  totalRefunded: number;
  orders: Order[];
}

const getOrderStatusLabel = (status: number) => {
    switch (status) {
        case 0: return { label: "Mới", color: "bg-blue-100 text-blue-700" };
        case 1: return { label: "Đã xác nhận", color: "bg-yellow-100 text-yellow-700" };
        case 2: return { label: "Đang giao", color: "bg-purple-100 text-purple-700" };
        case 3: return { label: "Hoàn tất", color: "bg-[#02DE35]/30 text-[#441A02]" };
        case 4: return { label: "Đã hủy", color: "bg-red-100 text-red-700" };
        default: return { label: "Không rõ", color: "bg-gray-100 text-gray-700" };
    }
};

export default function DetailOneCustomer() {
  const { id } = useParams(); 
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchCustomerDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/admin/customers/${id}`);
        const json = await res.json();
        if (json.success) setCustomer(json.data);
        else console.error(json.message);
      } catch (error) {
        console.error("Failed to fetch customer detail", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCustomerDetail();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!customer) return;

    const newStatus = customer.status === 1 ? 3 : 1;
    const actionText = newStatus === 3 ? "CHẶN" : "MỞ KHÓA";
    
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} khách hàng này không?`)) return;

    try {
      setUpdating(true);
      
      const res = await fetch(`/admin/users/${customer._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();

      if (json.success) {
        
        setCustomer((prev) => prev ? { ...prev, status: newStatus } : null);
        alert(`Đã ${actionText.toLowerCase()} thành công!`);
      } else {
        alert("Lỗi: " + json.message);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái.");
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

  const formatDate = (dateString: string) => {
    if(!dateString) return "---";
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  if (loading) return (
    <div className="w-full h-screen flex justify-center items-center">
         <div className="w-10 h-10 border-4 border-gray-300 border-t-[#F25C05] rounded-full animate-spin"></div>
    </div>
  );

  if (!customer) return <div className="p-10 text-center">Không tìm thấy thông tin khách hàng.</div>;

  const displayAddress = customer.address?.find((a: any) => a.isDefault) || customer.address?.[0];
  const addressString = displayAddress 
    ? `${displayAddress.street}, ${displayAddress.ward}, ${displayAddress.province}`
    : "Chưa cập nhật địa chỉ";

  return (
    <div className="w-full h-full py-[20px] px-[30px] bg-white/60 min-h-screen">
      
      {/* HEADER THÔNG TIN */}
      <div className="mb-[30px] md:flex flex-col justify-between">
        <div className="flex gap-[15px] w-full justify-between items-center">
          
          {/* Avatar & Badge */}
          <div className="flex flex-col items-center">
            <img
              src={customer.avatar || "/images/user-default.png"}
              className="w-[150px] h-[150px] rounded-full object-cover border-[1px] border-gray-200 bg-amber-100"
              onError={(e) => {(e.target as HTMLImageElement).src = "https://via.placeholder.com/150"}}
            />
            {/* Badge trạng thái */}
            <span className={`inline-block mt-[-30px] px-[10px] py-[5px] text-[16px] font-normal rounded-[16px] ${customer.status === 1 ? 'bg-[#02DE35]/30 text-[#441A02]' : 'bg-red-200 text-red-800'}`}>
              {customer.status === 1 ? "Đang hoạt động" : "Đã bị khóa"}
            </span>
          </div>

          <div className="w-full flex flex-col justify-between items-start ml-5">
            <h1 className="font-bold text-[18px] text-[#441A02]">{customer.name}</h1>
            <p className="font-normal text-[16px] text-[#441A02] mt-[5px]">{customer.email}</p>

            <div className="flex w-full gap-[20px] mt-4">
              <div className="flex flex-col">
                <div className="px-[15px] py-[5px] bg-[#FFB703]/30 rounded-t-[8px]"><p className="font-bold text-[#441A02]">Tổng Hoàn Trả</p></div>
                <div className="px-[15px] py-[10px] bg-white rounded-b-[8px] border-[1px] border-[#FFB703]/30"><p className="font-bold text-[18px] text-[#441A02] text-right">{formatCurrency(customer.totalRefunded)}</p></div>
              </div>
              <div className="flex flex-col">
                <div className="px-[15px] py-[5px] bg-[#8ECAE6]/30 rounded-t-[8px]"><p className="font-bold text-[#441A02]">Tổng chi tiêu</p></div>
                <div className="px-[15px] py-[10px] bg-white rounded-b-[8px] border-[1px] border-[#8ECAE6]/30"><p className="font-bold text-[18px] text-[#441A02] text-right">{formatCurrency(customer.totalSpent)}</p></div>
              </div>
            </div>
          </div>

          {/* --- NÚT HÀNH ĐỘNG --- */}
          <div className="w-[200px]">
            <button
              onClick={handleToggleStatus}
              disabled={updating}
              className={`w-full p-[10px] rounded-[16px] font-medium transition flex items-center justify-center gap-2
                ${customer.status === 1 
                    ? 'bg-[#D1460B]/20 hover:bg-[#D1460B]/30 text-[#441A02]' // Nút màu cam (Chặn)
                    : 'bg-[#02DE35]/20 hover:bg-[#02DE35]/30 text-green-800' // Nút màu xanh (Mở khóa)
                } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {updating ? (
                  <span>Đang xử lý...</span>
              ) : (
                  customer.status === 1 ? "Chặn người dùng" : "Mở khóa tài khoản"
              )}
            </button>
          </div>

        </div>
      </div>
      
      {}
      
      {/* THÔNG TIN CHI TIẾT */}
      <div className="mb-8">
        <h2 className="text-[18px] text-[#441A02] font-bold mb-[20px]">Thông tin người dùng</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div><p className="text-[12px] text-[#A09CAB] mb-1">Họ và tên</p><p className="font-medium text-[#441A02]">{customer.name}</p></div>
            <div><p className="text-[12px] text-[#A09CAB] mb-1">Email</p><p className="font-medium text-[#441A02]">{customer.email}</p></div>
            <div><p className="text-[12px] text-[#A09CAB] mb-1">SĐT</p><p className="font-medium text-[#441A02]">{customer.phone || "---"}</p></div>
            <div><p className="text-[12px] text-[#A09CAB] mb-1">Ngày tham gia</p><p className="font-medium text-[#441A02]">{formatDate(customer.joinedDate)}</p></div>
        </div>
        <div className="mt-6">
          <p className="text-[12px] text-[#A09CAB] mb-2">Địa chỉ giao hàng</p>
          <div className="p-4 bg-gray-50 rounded-xl flex items-start gap-3 border border-gray-100 max-w-2xl">
            <MapPin className="w-5 h-5 text-[#F25C05] mt-0.5 flex-shrink-0" />
            <p className="text-[#441A02]">{addressString}</p>
          </div>
        </div>
      </div>

      {/* DANH SÁCH NGÂN HÀNG */}
      <div className="mb-[30px]">
        <h2 className="text-[14px] text-[#A09CAB] uppercase mb-[15px]">Ngân hàng liên kết</h2>
        <div className="flex flex-wrap gap-[15px]">
          {customer.bankAccounts && customer.bankAccounts.length > 0 ? (
            customer.bankAccounts.map((bank, i) => (
                <div key={i} className="flex flex-col rounded-[8px] overflow-hidden min-w-[250px]">
                <div className="flex justify-between bg-[#EFF1F5] px-[15px] py-[8px]"><p className="font-medium text-[#441A02]">{bank.bankName}</p></div>
                <div className="flex flex-col bg-white border border-[#EFF1F5] px-[15px] py-[10px]"><p className="text-[16px] text-[#441A02] font-bold tracking-wide">{bank.accountNumber}</p></div>
                </div>
            ))
          ) : (<p className="text-gray-400 italic">Chưa liên kết ngân hàng.</p>)}
        </div>
      </div>

      {/* BẢNG ĐƠN HÀNG */}
      <div>
        <h2 className="text-[18px] font-bold text-[#441A02] mb-[20px]">Lịch sử đơn hàng</h2>
        <div className="w-full overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full table-auto">
            <thead className="bg-[#F9FAFB] border-b border-gray-200">
              <tr className="text-center text-[14px] font-bold text-[#441A02]">
                <th className="py-[15px]">Mã đơn</th><th className="py-[15px]">Ngày tạo</th><th className="py-[15px]">Tổng tiền</th><th className="py-[15px]">Thanh toán</th><th className="py-[15px]">Trạng thái</th><th className="py-[15px]">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {customer.orders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Khách hàng chưa có đơn hàng nào.</td></tr>
              ) : (
                customer.orders.map((order) => {
                    const statusInfo = getOrderStatusLabel(order.orderStatus);
                    return (
                        <tr key={order._id} className="hover:bg-gray-50 transition">
                            <td className="p-[15px] text-center font-bold text-[#F25C05]">#{order._id.slice(-6).toUpperCase()}</td>
                            <td className="p-[15px] text-center text-[#441A02]">{formatDate(order.createdAt)}</td>
                            <td className="p-[15px] text-center font-bold text-[#441A02]">{formatCurrency(order.orderTotalAmount)}</td>
                            <td className="p-[15px] text-center"><span className="text-sm px-2 py-1 bg-gray-100 rounded text-gray-600">{order.orderPaymentMethod}</span></td>
                            <td className="p-[15px] text-center"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>{statusInfo.label}</span></td>
                            <td className="p-[15px] text-center"><Link to={`/admin/orders/${order._id}`} className="text-blue-600 hover:underline text-sm">Chi tiết</Link></td>
                        </tr>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-5 text-right text-[16px] text-[#441A02]">Tổng: <strong>{customer.orders.length}</strong> đơn hàng</div>
      </div>

    </div>
  );
}
