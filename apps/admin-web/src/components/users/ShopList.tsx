import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const USER_STATUS_MAP = {
  ACTIVE: 1,
  INACTIVE: 2,
  BANNED: 3,
};

interface Shop {
  _id: string; 
  avatar?: string;
  name: string;
  email: string;
  createdAt: string;
  // totalProducts?: number; 
  totalOrders: number; 
  revenue: number; 
  status: number; 
}

const getStatusDisplay = (status: number) => {
  switch (status) {
    case USER_STATUS_MAP.ACTIVE:
      return { label: "Hoạt động", className: "border-[#02DE35] bg-[#02DE35]/20 text-green-700" };
    case USER_STATUS_MAP.BANNED:
      return { label: "Đã khóa", className: "border-[#D1460B] bg-[#D1460B]/20 text-red-700" };
    default:
      return { label: "Không rõ", className: "border-gray-300 bg-gray-100 text-gray-600" };
  }
};

const mapStatusToNumber = (status: string) => {
  switch (status) {
    case "active":
      return USER_STATUS_MAP.ACTIVE.toString();
    case "deleted": 
      return USER_STATUS_MAP.BANNED.toString();
    default:
      return "";
  }
};

export default function ShopList() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  
  const [revenueMin, setRevenueMin] = useState(""); 
  const [revenueMax, setRevenueMax] = useState(""); 
  
  const [soldMin, setSoldMin] = useState(""); 
  const [soldMax, setSoldMax] = useState("");

  const fetchShops = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (search) params.append("search", search);
      
      const numericStatus = mapStatusToNumber(statusFilter);
      if (numericStatus) params.append("status", numericStatus);

      if (dateFilter) params.append("date", dateFilter);
      if (revenueMin) params.append("revenueMin", revenueMin);
      if (revenueMax) params.append("revenueMax", revenueMax);
      
      // Gửi request
      const res = await fetch(`/admin/sellers?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();
      if (json.success) {
        setShops(json.data);
      } else {
        setShops([]);
      }
    } catch (error) {
      console.error("Failed to fetch sellers", error);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchShops();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, statusFilter, dateFilter, revenueMin, revenueMax, soldMin, soldMax]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString("vi-VN") + " đ";
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("");
    setRevenueMin("");
    setRevenueMax("");
    setSoldMin("");
    setSoldMax("");
  };

  return (
    <div className="w-full h-full py-[20px] px-[30px] bg-white/60 min-h-screen text-[16px] text-[#441A02]">
      {/* Header + Filters */}
      <div className="flex flex-col gap-4 mb-[20px]">
        {/* Hàng 1: Search & Status */}
        <div className="flex gap-4">
            <input
            type="text"
            placeholder="Tìm kiếm tên Shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 p-[10px] rounded-[16px] outline-none focus:ring-1 focus:ring-orange-400"
            />
             <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-[200px] border border-gray-200 p-[10px] rounded-[16px] outline-none"
            >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="deleted">Đã khóa/Xóa</option>
            </select>
        </div>

        {/* Hàng 2: Advanced Filters */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <input
            type="date"
            title="Ngày gia nhập"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-200 p-[10px] rounded-[16px] w-full"
          />

          {/* Placeholder cho Tổng sản phẩm */}
          <input
            type="number"
            placeholder="Tổng SP (N/A)"
            disabled
            className="border border-gray-100 bg-gray-50 p-[10px] rounded-[16px] w-full cursor-not-allowed"
          />

          <input
            type="number"
            placeholder="Doanh thu từ..."
            value={revenueMin}
            onChange={(e) => setRevenueMin(e.target.value)}
            className="border border-gray-200 p-[10px] rounded-[16px] w-full"
          />

          <input
            type="number"
            placeholder="Doanh thu đến..."
            value={revenueMax}
            onChange={(e) => setRevenueMax(e.target.value)}
            className="border border-gray-200 p-[10px] rounded-[16px] w-full"
          />

          {/* Nút xóa bộ lọc */}
          <button 
            onClick={clearFilters}
            className="text-gray-500 hover:text-orange-600 underline text-sm"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] overflow-hidden shadow-sm border border-gray-100">
        <div className="w-full overflow-x-auto">
          <table className="w-full table-auto">
            {/* HEADER */}
            <thead className="border-b bg-[#F9FAFB] text-gray-500 uppercase text-sm">
              <tr className="text-center">
                <th className="py-[15px] px-4 font-bold">Ảnh</th>
                <th className="py-[15px] px-4 font-bold text-left">Tên Shop / Email</th>
                <th className="py-[15px] px-4 font-bold">Ngày gia nhập</th>
                <th className="py-[15px] px-4 font-bold">Đã bán (Đơn)</th>
                <th className="py-[15px] px-4 font-bold text-right">Doanh thu</th>
                <th className="py-[15px] px-4 font-bold">Trạng thái</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">
                        <div className="flex justify-center items-center gap-2">
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
                            <span>Đang tải dữ liệu...</span>
                        </div>
                    </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    Không tìm thấy cửa hàng nào phù hợp.
                  </td>
                </tr>
              ) : (
                shops.map((s) => {
                    const statusInfo = getStatusDisplay(s.status);
                    return (
                        <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                            {/* Ảnh */}
                            <td className="p-[10px] text-center">
                            <img
                                src={s.avatar || "/images/user-default.png"}
                                alt="avatar"
                                className="w-[40px] h-[40px] rounded-full object-cover border mx-auto"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/40";
                                }}
                            />
                            </td>

                            {/* Tên & Email */}
                            <td className="p-[10px] text-left">
                            <Link to={`/user/shops/${s._id}`} className="font-semibold text-[#441A02] hover:text-orange-600 block">
                                {s.name}
                            </Link>
                            <span className="text-xs text-gray-500">{s.email}</span>
                            </td>

                            {/* Ngày gia nhập */}
                            <td className="p-[10px] text-center text-gray-600">
                                {formatDate(s.createdAt)}
                            </td>

                            {/* Bán được (Total Orders) */}
                            <td className="p-[10px] text-center font-medium">
                                {s.totalOrders}
                            </td>

                            {/* Doanh thu (Revenue) */}
                            <td className="p-[10px] text-right font-bold text-[#441A02]">
                                {formatMoney(s.revenue)}
                            </td>

                            {/* Trạng thái */}
                            <td className="p-[10px] text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.className}`}>
                                    {statusInfo.label}
                                </span>
                            </td>
                        </tr>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 text-right text-sm text-gray-600">
        Tổng: <strong>{shops.length}</strong> cửa hàng
      </div>
    </div>
  );
}
