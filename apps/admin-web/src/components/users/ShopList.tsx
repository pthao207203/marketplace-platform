import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

interface Shop {
    id: number;
    avatar: string;
    name: string;
    joined: string; // yyyy-mm-dd
    totalamount: number;
    sold: number;
    money: number;
    status: "active" | "deleted";
}

const dummyShops: Shop[] = [
    {
        id: 1,
        avatar: "/images/user.png",
        name: "Cá biết bay",
        joined: "2025-07-16",
        totalamount: 5,
        sold: 355000,
        money: 35500,
        status: "active",
    },
    {
        id: 2,
        avatar: "/images/user.png",
        name: "Cá biết bay",
        joined: "2025-07-16",
        totalamount: 5,
        sold: 355000,
        money: 35500,
        status: "deleted",
    },
];

export default function ShopList() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [totalamountFilter, settotalamountFilter] = useState("");
    const [soldMin, setsoldMin] = useState("");
    const [soldMax, setsoldMax] = useState("");
    const [moneyFilter, setmoneyFilter] = useState("");

    const filteredData = useMemo(() => {
        return dummyShops.filter((s) => {
            if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
            if (statusFilter !== "all" && s.status !== statusFilter) return false;
            if (dateFilter && s.joined !== dateFilter) return false;
            if (totalamountFilter && s.totalamount !== Number(totalamountFilter)) return false;
            if (soldMin && s.sold < Number(soldMin)) return false;
            if (soldMax && s.sold > Number(soldMax)) return false;
            if (moneyFilter && s.money !== Number(moneyFilter)) return false;
            return true;
        });
    }, [search, statusFilter, dateFilter, totalamountFilter, soldMin, soldMax, moneyFilter]);

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split("-");
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="w-full h-full py-[20px] px-[30px] bg-white/60 min-h-screen text-[18px] max-md:text-[16px] text-[#441A02]">

            {/* Header + Filters */}
            <div className="flex items-center justify-between mb-[20px]">

                {/* Search */}
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-1/3 border border-gray-200 p-[10px] rounded-[16px] mr-[10px]"
                />

                {/* Filters */}
                <div className="w-full flex items-center">

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] mr-[10px]"
                    >
                        <option value="all">Tất cả</option>
                        <option value="active">Hoạt động</option>
                        <option value="deleted">Đã xóa</option>
                    </select>

                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] mr-[10px]"
                    />

                    <input
                        type="number"
                        placeholder="Tổng sản phẩm"
                        value={totalamountFilter}
                        onChange={(e) => settotalamountFilter(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] mr-[10px]"
                    />

                    <input
                        type="number"
                        placeholder="Bán được từ"
                        value={soldMin}
                        onChange={(e) => setsoldMin(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] mr-[10px]"
                    />

                    <input
                        type="number"
                        placeholder="Bán được đến"
                        value={soldMax}
                        onChange={(e) => setsoldMax(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] mr-[10px]"
                    />

                    <input
                        type="number"
                        placeholder="Tiền kiếm được"
                        value={moneyFilter}
                        onChange={(e) => setmoneyFilter(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px]"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-[16px] overflow-hidden">
                <div className="w-full overflow-x-auto">
                    <table className="w-full table-auto">

                        {/* HEADER */}
                        <thead className="border-b-[10px] border-[#F9FAFB] bg-white">
                            <tr className="text-center">
                                <th className="py-[15px] font-bold">Ảnh</th>
                                <th className="py-[15px] font-bold bg-[#FFF7F3]">Tên tài khoản</th>
                                <th className="py-[15px] font-bold">Ngày gia nhập</th>
                                <th className="py-[15px] font-bold bg-[#FFF7F3]">Tổng sản phẩm</th>
                                <th className="py-[15px] font-bold">Bán được</th>
                                <th className="py-[15px] font-bold bg-[#FFF7F3]">Tiền kiếm được</th>
                                <th className="py-[15px] font-bold">Trạng thái</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10">
                                        Không tìm thấy cửa hàng nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((s) => (
                                    <tr key={s.id} className="hover:bg-[#8ECAE6]/30 bg-white">

                                        {/* Ảnh */}
                                        <td className="p-[10px] flex items-center justify-center">
                                            <img
                                                src={s.avatar}
                                                className="w-[50px] h-[50px] rounded-full object-cover border"
                                            />
                                        </td>

                                        {/* Tên */}
                                        <td className="p-[10px] text-center">
                                            <Link to={`/user/shops/${s.id}`}>
                                                {s.name}
                                            </Link>
                                        </td>

                                        {/* Ngày gia nhập */}
                                        <td className="p-[10px] text-center">{formatDate(s.joined)}</td>

                                        {/* Tổng sản phẩm */}
                                        <td className="p-[10px] text-center">{s.totalamount}</td>

                                        {/* Bán được */}
                                        <td className="p-[10px] text-center">{s.sold}</td>

                                        {/* Tiền kiếm được */}
                                        <td className="p-[10px] text-center">{s.money.toLocaleString()} đ</td>

                                        {/* Trạng thái */}
                                        <td className="p-[10px] text-center">
                                            {s.status === "active" ? (
                                                <span className="px-[20px] py-[5px] rounded-full border border-[#02DE35] bg-[#02DE35]/20">
                                                    Hoạt động
                                                </span>
                                            ) : (
                                                <span className="px-[20px] py-[5px] rounded-full border border-[#D1460B] bg-[#D1460B]/20">
                                                    Đã xóa
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-5 text-right">
                Tổng: <strong>{filteredData.length}</strong> cửa hàng
            </div>
        </div>
    );
}
