import { useState, useEffect } from "react";
import OrderTable from "./OrderTable";
import { getOrders, Order } from "../../services/api.service";

type OrderStatus =
  | "All"
  | "Pending"
  | "Cancelled"
  | "Delivering"
  | "Delivered"
  | "Returned";

export default function OrderList() {
  // State for orders data
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // Status count state
  const [statusCount, setStatusCount] = useState({
    All: 0,
    Pending: 0,
    Cancelled: 0,
    Delivering: 0,
    Delivered: 0,
    Returned: 0,
  });

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getOrders({
        search,
        status: statusFilter === "All" ? undefined : statusFilter,
        dateFrom,
        dateTo,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
        page,
        pageSize: 50,
      });

      if (response.success) {
        setOrders(response.data.items);
        setTotal(response.data.total);
        setTotalPages(Math.ceil(response.data.total / response.data.pageSize));

        // Update status counts (nếu backend trả về)
        // Hoặc tính từ data hiện tại
        updateStatusCounts(response.data.items);
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.response?.data?.error?.message || "Lỗi khi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Update status counts từ orders data
  const updateStatusCounts = (ordersList: Order[]) => {
    const counts = {
      All: ordersList.length,
      Pending: 0,
      Cancelled: 0,
      Delivering: 0,
      Delivered: 0,
      Returned: 0,
    };

    ordersList.forEach((order) => {
      if (order.status in counts) {
        counts[order.status as keyof typeof counts]++;
      }
    });

    setStatusCount(counts);
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, dateFrom, dateTo, minAmount, maxAmount]);

  // Fetch data when page or filters change
  useEffect(() => {
    fetchOrders();
  }, [page, search, statusFilter, dateFrom, dateTo, minAmount, maxAmount]);

  return (
    <div className="w-full min-h-screen bg-white/60 py-[20px] px-[30px] text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
      {/* Header */}
      <div className="flex justify-between items-center mb-[20px]">
        <h1 className="text-[22px] max-md:text-[20px] font-bold text-[#441A02]">
          Danh sách đơn hàng
        </h1>
      </div>

      {/* Dòng 1: Tìm kiếm + Lọc trạng thái */}
      <div className="flex gap-[15px] mb-[20px]">
        <input
          type="text"
          placeholder="Tìm kiếm theo mã đơn hoặc mã khách hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 p-[12px] rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#F25C05] transition"
        />

        <select
          title="Lọc theo trạng thái"
          aria-label="Lọc theo trạng thái"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus)}
          className="w-[400px] border border-gray-200 p-[12px] rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#F25C05] transition font-medium"
        >
          <option value="All">Tất cả đơn hàng ({total})</option>
          <option value="Pending">Chờ xác nhận ({statusCount.Pending})</option>
          <option value="Cancelled">Đã hủy ({statusCount.Cancelled})</option>
          <option value="Delivering">Đang giao hàng ({statusCount.Delivering})</option>
          <option value="Delivered">Đã giao ({statusCount.Delivered})</option>
          <option value="Returned">Trả hàng ({statusCount.Returned})</option>
        </select>
      </div>

      {/* Dòng 2: Lọc ngày + tổng tiền */}
      <div className="grid grid-cols-4 gap-[15px] mb-[20px]">
        <input
          title="Lọc từ ngày"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border border-gray-200 p-[12px] rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#F25C05] transition"
        />
        <input
          title="Lọc đến ngày"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border border-gray-200 p-[12px] rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#F25C05] transition"
        />
        <input
          type="number"
          placeholder="Tổng tiền từ (VNĐ)"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          className="border border-gray-200 p-[12px] rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#F25C05] transition"
        />
        <input
          type="number"
          placeholder="Tổng tiền đến (VNĐ)"
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
          className="border border-gray-200 p-[12px] rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#F25C05] transition"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-[16px]">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F25C05]"></div>
          <p className="mt-2">Đang tải...</p>
        </div>
      )}

      {/* Bảng đơn hàng */}
      {!loading && (
        <div className="rounded-[16px] overflow-hidden border border-gray-200 shadow-sm">
          <OrderTable orders={orders} onRefresh={fetchOrders} />
        </div>
      )}

      {/* Tổng kết quả + Pagination */}
      <div className="mt-5 flex justify-between items-center">
        <div>
          <span className="text-[18px] text-[#441A02]">
            Tổng: <strong className="text-[#F25C05] text-[22px]">{total}</strong> đơn hàng
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-[#F25C05] text-white rounded-[8px] 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-[#d94f04] transition"
            >
              Trước
            </button>
            
            <span className="px-4 py-2">
              Trang {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-[#F25C05] text-white rounded-[8px] 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       hover:bg-[#d94f04] transition"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
