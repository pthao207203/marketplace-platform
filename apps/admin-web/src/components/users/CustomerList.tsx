import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const USER_STATUS_MAP = {
  ACTIVE: 1, 
  INACTIVE: 2, 
  DELETED: 3, 
};

interface Customer {
  _id: string;
  avatar?: string;
  name: string;
  email?: string;
  createdAt: string; 
  purchased: number;
  spent: number;
  refund: number;
  status: number; 
}

const mapStatusToNumber = (status: string) => {
    switch (status) {
      case "active":
        return USER_STATUS_MAP.ACTIVE.toString();
      case "deleted":
        return USER_STATUS_MAP.DELETED.toString();
      default:
        return "";
    }
};

const getStatusDisplay = (status: number) => {
  switch (status) {
    case USER_STATUS_MAP.ACTIVE:
      return { label: "Hoạt động", color: "green" };
    case USER_STATUS_MAP.DELETED:
      return { label: "Đã xóa", color: "red" };
    case USER_STATUS_MAP.INACTIVE:
      return { label: "Đã khóa", color: "red" };
    default:
      return { label: "Không rõ", color: "gray" };
  }
};

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [purchasedFilter, setPurchasedFilter] = useState("");
  const [spentMin, setSpentMin] = useState("");
  const [spentMax, setSpentMax] = useState("");
  const [refundFilter, setRefundFilter] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.append("search", search);
      
      // SỬA: Chuyển đổi trạng thái string của FE sang number của BE
      const numericStatus = mapStatusToNumber(statusFilter);
      if (numericStatus) {
          params.append("status", numericStatus);
      }
      
      if (dateFilter) params.append("date", dateFilter);
      if (purchasedFilter) params.append("purchased", purchasedFilter);
      if (spentMin) params.append("spentMin", spentMin);
      if (spentMax) params.append("spentMax", spentMax);
      if (refundFilter) params.append("refund", refundFilter);

      const res = await fetch(`/admin/customers?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
      } else {
        console.error("API Error:", json.message);
        setCustomers([]);
      }
    } catch (error) {
      console.error("Failed to fetch customers", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    search,
    statusFilter,
    dateFilter,
    purchasedFilter,
    spentMin,
    spentMax,
    refundFilter,
  ]);

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
    setPurchasedFilter("");
    setSpentMin("");
    setSpentMax("");
    setRefundFilter("");
  };

  return (
    <div className="px-[30px] py-[20px] bg-gray-50 min-h-screen text-[16px] font-normal text-[#441A02]">
      {/* --- PHẦN HEADER & BỘ LỌC --- */}
      <div className="flex flex-col gap-4 mb-[20px]">
        {/* Hàng 1: Tìm kiếm & Trạng thái */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 p-[10px] rounded-[12px] focus:outline-none focus:ring-1 focus:ring-[#F25C05]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-[150px] border border-gray-200 p-[10px] rounded-[12px] focus:outline-none focus:ring-1 focus:ring-[#F25C05]"
          >
            <option value="all">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="deleted">Đã xóa</option>
          </select>
        </div>

        {/* Hàng 2: Các bộ lọc chi tiết (Dùng Grid) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <input
            type="date"
            title="Ngày tham gia"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-200 p-[8px] rounded-[12px] w-full"
          />
          <input
            type="number"
            placeholder="Đã mua (số đơn)"
            value={purchasedFilter}
            onChange={(e) => setPurchasedFilter(e.target.value)}
            className="border border-gray-200 p-[8px] rounded-[12px] w-full"
          />
          <input
            type="number"
            placeholder="Chi từ..."
            value={spentMin}
            onChange={(e) => setSpentMin(e.target.value)}
            className="border border-gray-200 p-[8px] rounded-[12px] w-full"
          />
          <input
            type="number"
            placeholder="Chi đến..."
            value={spentMax}
            onChange={(e) => setSpentMax(e.target.value)}
            className="border border-gray-200 p-[8px] rounded-[12px] w-full"
          />
          <input
            type="number"
            placeholder="Min hoàn trả"
            value={refundFilter}
            onChange={(e) => setRefundFilter(e.target.value)}
            className="border border-gray-200 p-[8px] rounded-[12px] w-full"
          />
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-[#F25C05] underline"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* --- PHẦN BẢNG DỮ LIỆU --- */}
      <div className="bg-white rounded-[16px] shadow-sm overflow-hidden border border-gray-100">
        <div className="w-full overflow-x-auto">
          <table className="w-full table-auto text-left">
            <thead className="bg-[#F9FAFB] border-b text-sm uppercase text-gray-500 font-semibold">
              <tr>
                <th className="py-4 px-6 text-center">Ảnh</th>
                <th className="py-4 px-6">Tên tài khoản</th>
                <th className="py-4 px-6 text-center">Ngày gia nhập</th>
                <th className="py-4 px-6 text-center">Đã mua</th>
                <th className="py-4 px-6 text-right">Tiền đã chi</th>
                <th className="py-4 px-6 text-right">Tiền hoàn trả</th>
                <th className="py-4 px-6 text-center">Trạng thái</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-[#F25C05] rounded-full animate-spin"></div>
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    Không tìm thấy khách hàng nào phù hợp.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {/* Ảnh */}
                    <td className="py-3 px-6 text-center">
                      <img
                        src={c.avatar || "/images/user-default.png"} // Ảnh fallback
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/50?text=U";
                        }}
                      />
                    </td>

                    {/* Tên */}
                    <td className="py-3 px-6">
                      <Link
                        to={`/user/customers/${c._id}`}
                        className="font-medium text-[#441A02] hover:text-[#F25C05] block"
                      >
                        {c.name}
                      </Link>
                      <span className="text-xs text-gray-400">{c.email}</span>
                    </td>

                    {/* Ngày gia nhập */}
                    <td className="py-3 px-6 text-center text-gray-600">
                      {formatDate(c.createdAt)}
                    </td>

                    {/* Đã mua */}
                    <td className="py-3 px-6 text-center font-medium">
                      {c.purchased}
                    </td>

                    {/* Tiền đã chi */}
                    <td className="py-3 px-6 text-right font-medium text-[#441A02]">
                      {formatMoney(c.spent)}
                    </td>

                    {/* Tiền hoàn trả */}
                    <td className="py-3 px-6 text-right text-red-500 font-medium">
                      {c.refund > 0 ? formatMoney(c.refund) : "-"}
                    </td>

                    {/* SỬA: Trạng thái (Sử dụng hàm getStatusDisplay) */}
                    <td className="py-3 px-6 text-center">
                      {(() => {
                        const { label, color } = getStatusDisplay(c.status);
                        return (
                          <span
                            className={`px-3 py-1 rounded-full border border-${color}-200 bg-${color}-50 text-${color}-700 text-xs font-semibold`}
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-5 text-right text-sm text-gray-600">
        Tổng: <strong>{customers.length}</strong> khách hàng
      </div>
    </div>
  );
}
