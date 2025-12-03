import { useState, useMemo } from "react";
import OrderTable from "./OrderTable";
import { sampleOrders } from "./sampleData";

type OrderStatus =
  | "All"
  | "Pending"
  | "Processing"
  | "Cancelled"
  | "Delivering"
  | "Delivered"
  | "Returned"
  | "Complaints";

export default function OrderList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // Lọc dữ liệu
  const filteredOrders = useMemo(() => {
    return sampleOrders.filter((order) => {
      const searchLower = search.toLowerCase();
      if (
        search &&
        !order.Orderid.toLowerCase().includes(searchLower) &&
        !order.Userid.toLowerCase().includes(searchLower)
      ) {
        return false;
      }

      if (statusFilter !== "All" && order.Status !== statusFilter) {
        return false;
      }

      if (dateFrom && order.CreationDate < dateFrom) return false;
      if (dateTo && order.CreationDate > dateTo) return false;

      if (minAmount && order.TotalPrice < Number(minAmount)) return false;
      if (maxAmount && order.TotalPrice > Number(maxAmount)) return false;

      return true;
    });
  }, [search, statusFilter, dateFrom, dateTo, minAmount, maxAmount]);

  // Đếm số lượng theo trạng thái
  const statusCount = {
    All: sampleOrders.length,
    Pending: sampleOrders.filter(o => o.Status === "Pending").length,
    Processing: sampleOrders.filter(o => o.Status === "Processing").length,
    Cancelled: sampleOrders.filter(o => o.Status === "Cancelled").length,
    Delivering: sampleOrders.filter(o => o.Status === "Delivering").length,
    Delivered: sampleOrders.filter(o => o.Status === "Delivered").length,
    Returned: sampleOrders.filter(o => o.Status === "Returned").length,
    Complaints: sampleOrders.filter(o => o.Status === "Complaints").length,
  };

  return (
    <div className="w-full min-h-screen bg-white/60 py-[20px] px-[30px] text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
      {/* Header + Nút (nếu cần) */}
      <div className="flex justify-between items-center mb-[20px]">
        <h1 className="text-[22px] max-md:text-[20px] font-bold text-[#441A02]">Danh sách đơn hàng</h1>
        {/* <button className="p-[10px] rounded-[16px] bg-[#F25C05] text-white hover:bg-[#d94f04] transition">
          + Xuất Excel
        </button> */}
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus)}
          className="w-[400px] border border-gray-200 p-[12px] rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#F25C05] transition font-medium"
        >
          <option value="All">Tất cả đơn hàng ({statusCount.All})</option>
          <option value="Pending">Chờ xác nhận ({statusCount.Pending})</option>
          <option value="Processing">Đang xử lý ({statusCount.Processing})</option>
          <option value="Cancelled">Đã hủy ({statusCount.Cancelled})</option>
          <option value="Delivering">Đang giao hàng ({statusCount.Delivering})</option>
          <option value="Delivered">Đã giao ({statusCount.Delivered})</option>
          <option value="Returned">Trả hàng ({statusCount.Returned})</option>
          <option value="Complaints">Khiếu nại ({statusCount.Complaints})</option>
        </select>
      </div>

      {/* Dòng 2: Lọc ngày + tổng tiền */}
      <div className="grid grid-cols-4 gap-[15px] mb-[20px]">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border border-gray-200 p-[12px] rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#F25C05] transition"
        />
        <input
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

      {/* Bảng đơn hàng - dùng lại OrderTable có sẵn */}
      <div className="rounded-[16px] overflow-hidden border border-gray-200 shadow-sm">
        <OrderTable orders={filteredOrders} />
      </div>
      {/* Tổng kết quả */}
      <div className="mb-[15px] text-right">
        <span className="text-[18px] text-[#441A02]">
          Tổng: <strong className="text-[#F25C05] text-[22px]">{filteredOrders.length}</strong> đơn hàng
        </span>
      </div>
    </div>
  );
}