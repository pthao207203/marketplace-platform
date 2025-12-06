import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

interface Product {
    id: number;           // Mã sản phẩm
    name: string;         // Tên sản phẩm
    shop: string;         // Tên shop
    category: string;     // Phân loại
    quantity: number;     // Số lượng
    price: number;        // Tổng giá
    status: "active" | "deleted"; // Trạng thái
    created: string;      // yyyy-mm-dd (dùng cho filter date)
    purchased: number;    // giữ field này để bộ lọc hoạt động bình thường
    spent: number;        // giữ field này để filter min-max
    refund: number;       // giữ field này để filter refund
}

const dummyProducts: Product[] = [
    {
        id: 1,
        name: "Tai nghe Bluetooth X15",
        shop: "TechZone",
        category: "Điện tử",
        quantity: 3,
        price: 550000,
        status: "active",
        created: "2025-07-16",
        purchased: 3,
        spent: 550000,
        refund: 10000,
    },
    {
        id: 2,
        name: "Áo Hoodie Nỉ Unisex",
        shop: "FashionHouse",
        category: "Thời trang",
        quantity: 2,
        price: 320000,
        status: "deleted",
        created: "2025-07-16",
        purchased: 2,
        spent: 320000,
        refund: 5000,
    },
];

export default function ProductList() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [purchasedFilter, setPurchasedFilter] = useState("");
    const [spentMin, setSpentMin] = useState("");
    const [spentMax, setSpentMax] = useState("");
    const [refundFilter, setRefundFilter] = useState("");

    const filteredData = useMemo(() => {
        return dummyProducts.filter((p) => {
            if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
            if (statusFilter !== "all" && p.status !== statusFilter) return false;
            if (dateFilter && p.created !== dateFilter) return false;
            if (purchasedFilter && p.purchased !== Number(purchasedFilter)) return false;
            if (spentMin && p.spent < Number(spentMin)) return false;
            if (spentMax && p.spent > Number(spentMax)) return false;
            if (refundFilter && p.refund !== Number(refundFilter)) return false;
            return true;
        });
    }, [search, statusFilter, dateFilter, purchasedFilter, spentMin, spentMax, refundFilter]);

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split("-");
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="w-full h-full py-[20px] px-[30px] bg-white/60 min-h-screen 
                        text-[18px] max-md:text-[16px] font-normal text-[#441A02]">

            {/* Header + Add Button */}
            <div className="flex justify-end mb-[20px]">
                <Link
                    to="/product/fixed/create"
                    className="p-[10px] rounded-[16px] bg-[#F25C05] text-white 
                           hover:bg-[#d94f04] transition"
                >
                    + Thêm sản phẩm
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between mb-[20px]">
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-1/3 border border-gray-200 p-[10px] rounded-[16px] 
                               focus:outline-none focus:ring-1 focus:ring-[#F25C05] mr-[10px]"
                />

                <div className="w-full flex items-center">

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] 
                                   focus:outline-none focus:ring-1 focus:ring-[#F25C05] mr-[10px]"
                    >
                        <option value="all">Tất cả</option>
                        <option value="active">Hoạt động</option>
                        <option value="deleted">Đã xóa</option>
                    </select>

                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] 
                                   focus:outline-none focus:ring-1 focus:ring-[#F25C05] mr-[10px]"
                    />

                    <input
                        type="number"
                        placeholder="Đã mua"
                        value={purchasedFilter}
                        onChange={(e) => setPurchasedFilter(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] 
                                   focus:outline-none focus:ring-1 focus:ring-[#F25C05] mr-[10px]"
                    />

                    <input
                        type="number"
                        placeholder="Chi từ"
                        value={spentMin}
                        onChange={(e) => setSpentMin(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] 
                                   focus:outline-none focus:ring-1 focus:ring-[#F25C05] mr-[10px]"
                    />

                    <input
                        type="number"
                        placeholder="Chi đến"
                        value={spentMax}
                        onChange={(e) => setSpentMax(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] 
                                   focus:outline-none focus:ring-1 focus:ring-[#F25C05] mr-[10px]"
                    />

                    <input
                        type="number"
                        placeholder="Hoàn trả"
                        value={refundFilter}
                        onChange={(e) => setRefundFilter(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] 
                                   focus:outline-none focus:ring-1 focus:ring-[#F25C05]"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-none rounded-[16px] overflow-hidden text-[18px] max-md:text-[16px] text-[#441A02]">
                <div className="w-full overflow-x-auto">
                    <table className="w-full table-auto">

                        <thead className="border-b-[10px] border-[#F9FAFB] bg-white">
                            <tr className="text-center">
                                <th className="py-[15px] font-bold">Mã sản phẩm</th>
                                <th className="py-[15px] font-bold bg-[#FFF7F3]">Tên sản phẩm</th>
                                <th className="py-[15px] font-bold">Tên shop</th>
                                <th className="py-[15px] font-bold bg-[#FFF7F3]">Phân loại</th>
                                <th className="py-[15px] font-bold">Số lượng</th>
                                <th className="py-[15px] font-bold bg-[#FFF7F3]">Tổng giá</th>
                                <th className="py-[15px] font-bold">Trạng thái</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10">
                                        Không tìm thấy sản phẩm nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((p) => (
                                    <tr key={p.id} className="hover:bg-[#8ECAE6]/30 bg-white">

                                        <td className="p-[10px] text-center font-semibold">
                                            {p.id}
                                        </td>

                                        <td className="p-[10px] text-center">
                                            <Link to={`/product/fixed/${p.id}`}>{p.name}</Link>
                                        </td>

                                        <td className="p-[10px] text-center">{p.shop}</td>

                                        <td className="p-[10px] text-center">{p.category}</td>

                                        <td className="p-[10px] text-center">{p.quantity}</td>

                                        <td className="p-[10px] text-center">
                                            {p.price.toLocaleString()} đ
                                        </td>

                                        <td className="p-[10px] text-center">
                                            {p.status === "active" ? (
                                                <span className="px-[20px] py-[5px] rounded-full  
                                                    border-[1px] border-[#02DE35] bg-[#02DE35]/30">
                                                    Hoạt động
                                                </span>
                                            ) : (
                                                <span className="px-[20px] py-[5px] rounded-full  
                                                    border-[1px] border-[#D1460B] bg-[#D1460B]/30">
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

            <div className="mt-5 text-right">
                Tổng: <strong>{filteredData.length}</strong> sản phẩm
            </div>
        </div>
    );
}
