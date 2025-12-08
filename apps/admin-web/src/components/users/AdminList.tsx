import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const USER_STATUS_MAP = {
  ACTIVE: 1,
  INACTIVE: 2,
  BANNED: 3,
};

interface Admin {
  _id: string;
  avatar?: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string; 
  status: number;
}

const getStatusDisplay = (status: number) => {
  switch (status) {
    case USER_STATUS_MAP.ACTIVE:
      return { label: "Hoạt động", className: "border-[#02DE35] bg-[#02DE35]/20 text-green-700" };
    case USER_STATUS_MAP.BANNED: 
      return { label: "Đã khóa", className: "border-[#D1460B] bg-[#D1460B]/20 text-red-700" };
    default:
      return { label: "Không rõ", className: "border-gray-200 bg-gray-100 text-gray-600" };
  }
};

const mapStatusToNumber = (status: string) => {
  switch (status) {
    case "active": return USER_STATUS_MAP.ACTIVE.toString();
    case "deleted": return USER_STATUS_MAP.BANNED.toString();
    default: return "";
  }
};

export default function AdminList() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (search) params.append("search", search);
      
      const numericStatus = mapStatusToNumber(statusFilter);
      if (numericStatus) params.append("status", numericStatus);

      if (dateFilter) params.append("date", dateFilter);

      const res = await fetch(`/admin/administrators?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();
      if (json.success) {
        setAdmins(json.data);
      } else {
        setAdmins([]);
      }
    } catch (error) {
      console.error("Failed to fetch admins", error);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAdmins();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search, statusFilter, dateFilter]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("");
  };

  return (
    <div className="w-full h-full py-[20px] px-[30px] bg-white/60 min-h-screen text-[16px] text-[#441A02]">
      {/* --- Header + Filters --- */}
      <div className="flex flex-col gap-4 mb-[20px]">
        {/* Hàng 1: Search & Status */}
        <div className="flex gap-4 items-center">
            <input
                type="text"
                placeholder="Tìm tên, email..."
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
                <option value="deleted">Đã khóa</option>
            </select>
        </div>

        {/* Hàng 2: Date Filter & Reset */}
        <div className="flex gap-4 items-center">
            <div className="w-[200px]">
                <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border border-gray-200 p-[10px] rounded-[16px] w-full outline-none"
                />
            </div>
            
            <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-orange-600 underline">
                Xóa bộ lọc
            </button>
        </div>
      </div>

      {/* --- Table --- */}
      <div className="bg-white rounded-[16px] overflow-hidden shadow-sm border border-gray-100">
        <div className="w-full overflow-x-auto">
          <table className="w-full table-auto">
            {/* HEADER */}
            <thead className="border-b bg-[#F9FAFB] text-gray-500 uppercase text-sm">
              <tr className="text-center">
                <th className="py-[15px] px-4 font-bold">Ảnh</th>
                <th className="py-[15px] px-4 font-bold text-left">Thông tin cá nhân</th>
                <th className="py-[15px] px-4 font-bold">Số điện thoại</th>
                <th className="py-[15px] px-4 font-bold">Ngày tạo</th>
                <th className="py-[15px] px-4 font-bold">Trạng thái</th>
                <th className="py-[15px] px-4 font-bold">Hành động</th>
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
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    Không tìm thấy quản trị viên nào.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                    const statusInfo = getStatusDisplay(admin.status);
                    return (
                        <tr key={admin._id} className="hover:bg-gray-50 transition-colors">
                            {/* Ảnh */}
                            <td className="p-[10px] text-center">
                                <img
                                    src={admin.avatar || "/images/user-default.png"}
                                    alt="avatar"
                                    className="w-[40px] h-[40px] rounded-full object-cover border mx-auto"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/40";
                                    }}
                                />
                            </td>

                            {/* Tên & Email */}
                            <td className="p-[10px] text-left">
                                <Link to={`/user/admins/${admin._id}`} className="font-semibold text-[#441A02] hover:text-orange-600 block">
                                    {admin.name}
                                </Link>
                                <span className="text-xs text-gray-500">{admin.email}</span>
                            </td>

                            {/* Số điện thoại */}
                            <td className="p-[10px] text-center text-gray-600">
                                {admin.phone || "---"}
                            </td>

                            {/* Ngày tạo */}
                            <td className="p-[10px] text-center text-gray-600">
                                {formatDate(admin.createdAt)}
                            </td>
                            
                            {/* Trạng thái */}
                            <td className="p-[10px] text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.className}`}>
                                    {statusInfo.label}
                                </span>
                            </td>

                             {/* Hành động (Ví dụ nút sửa) */}
                             <td className="p-[10px] text-center">
                                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-2">
                                    Sửa
                                </button>
                                {/* Thêm nút khác nếu cần */}
                            </td>
                        </tr>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-5 text-right text-sm text-gray-600">
        Tổng: <strong>{admins.length}</strong> quản trị viên
      </div>
    </div>
  );
}
