import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
interface Auction {
    id: number;
    avatar: string;
    name: string;
    joined: string; // yyyy-mm-dd
    purchased: number;
    spent: number;
    refund: number;
    status: "active" | "deleted";
}

const dummyAuctions: Auction[] = [
    {
        id: 1,
        avatar: "/images/user.png",
        name: "Cá biết bay",
        joined: "2025-07-16",
        purchased: 5,
        spent: 355000,
        refund: 35500,
        status: "active",
    },
    {
        id: 2,
        avatar: "/images/user.png",
        name: "Cá biết bay",
        joined: "2025-07-16",
        purchased: 5,
        spent: 355000,
        refund: 35500,
        status: "deleted",
    },
    // Thêm dữ liệu khác nếu cần...
];

export default function AuctionList() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [purchasedFilter, setPurchasedFilter] = useState("");
    const [spentMin, setSpentMin] = useState("");
    const [spentMax, setSpentMax] = useState("");
    const [refundFilter, setRefundFilter] = useState("");

    const filteredData = useMemo(() => {
        return dummyAuctions.filter((c) => {
            if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
            if (statusFilter !== "all" && c.status !== statusFilter) return false;
            if (dateFilter && c.joined !== dateFilter) return false;
            if (purchasedFilter && c.purchased !== Number(purchasedFilter)) return false;
            if (spentMin && c.spent < Number(spentMin)) return false;
            if (spentMax && c.spent > Number(spentMax)) return false;
            if (refundFilter && c.refund !== Number(refundFilter)) return false;
            return true;
        });
    }, [search, statusFilter, dateFilter, purchasedFilter, spentMin, spentMax, refundFilter]);

    // Format ngày đẹp hơn: 16/07/2025
    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split("-");
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="w-full h-full py-[20px] px-[30px] bg-white/60 min-h-screen text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
            {/* Header + Filters */}
             <div className="flex justify-end mb-[20px]">
                <Link
                    to="/product/auction/create"
                    className="p-[10px] rounded-[16px] bg-[#F25C05] text-white text-[18px] max-md:text-[16px] font-normal 
               hover:bg-[#d94f04] transition"
                >
                    + Thêm sản phẩm
                </Link>
            </div>
            <div className="flex items-center justify-between mb-[20px]">
                {/* Ô tìm kiếm */}
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-1/3 border border-gray-200 p-[10px] rounded-[16px] focus:outline-none focus:ring-1 focus:ring-[#F25C05] mr-[10px]"
                />

                {/* Các filter nhỏ hơn */}
                <div className="w-full flex items-center ">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] focus:outline-none focus:ring-1 focus:ring-[#F25C05] mr-[10px]"
                    >
                        <option value="all">Tất cả </option>
                        <option value="active">Hoạt động</option>
                        <option value="deleted">Đã xóa</option>
                    </select>

                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] focus:outline-none focus:ring-1 focus:ring-[#F25C05] mr-[10px]"
                    />

                    <input
                        type="number"
                        placeholder="Đã mua"
                        value={purchasedFilter}
                        onChange={(e) => setPurchasedFilter(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] focus:outline-none focus:ring-1 focus:ring-[#F25C05] mr-[10px]"
                    />

                    <input
                        type="number"
                        placeholder="Chi từ"
                        value={spentMin}
                        onChange={(e) => setSpentMin(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] focus:outline-none focus:ring-1 focus:ring-[#F25C05] mr-[10px]"
                    />

                    <input
                        type="number"
                        placeholder="Chi đến"
                        value={spentMax}
                        onChange={(e) => setSpentMax(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] focus:outline-none focus:ring-1 focus:ring-[#F25C05] mr-[10px]"
                    />

                    <input
                        type="number"
                        placeholder="Hoàn trả"
                        value={refundFilter}
                        onChange={(e) => setRefundFilter(e.target.value)}
                        className="w-full border border-gray-200 p-[10px] rounded-[16px] focus:outline-none focus:ring-1 focus:ring-[#F25C05]"
                    />
                </div>
            </div>


            {/* Table */}
            <div className="bg-none rounded-[16px] overflow-hidden text-[18px] max-md:text-[16px] font-normal text-[#441A02] ">
                <div className="w-full overflow-x-auto">
                    <table className="w-full table-auto">

                        {/* HEADER */}
                        <thead className=" border-b-[10px] border-[#F9FAFB] bg-white  ">
                            <tr className="text-center">
                                <th className="py-[15px] font-bold">Ảnh</th>
                                <th className="py-[15px] font-bold bg-[#FFF7F3]">Tên tài khoản</th>
                                <th className="py-[15px] font-bold">Ngày gia nhập</th>
                                <th className="py-[15px] font-bold bg-[#FFF7F3]">Đã mua</th>
                                <th className="py-[15px] font-bold">Tiền đã chi</th>
                                <th className="py-[15px] font-bold bg-[#FFF7F3]">Tiền hoàn trả</th>
                                <th className="py-[15px] font-bold">Trạng thái</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-[#441A02]">
                                        Không tìm thấy khách hàng nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((c) => (
                                    <tr key={c.id} className="hover:bg-[#8ECAE6]/30 bg-white">
                                        {/* Cột Ảnh */}
                                        <td className="flex p-[10px] items-center justify-center">
                                            <img
                                                src={c.avatar}
                                                alt="avatar"
                                                className="w-[50px] h-[50px] rounded-full  object-cover border-[1px] border-gray-200"
                                            />
                                        </td>

                                        {/* Cột Tên */}
                                        <td className="p-[10px] font-normal text-[#441A02] text-center">
                                            <Link
                                                to={`/product/auction/${c.id}`}
                                                className=""
                                            >
                                                {c.name}
                                            </Link>
                                        </td>

                                        {/* Các cột khác */}
                                        <td className="p-[10px] text-center">{formatDate(c.joined)}</td>
                                        <td className="p-[10px] text-center">{c.purchased}</td>
                                        <td className="p-[10px] text-center text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
                                            {c.spent.toLocaleString()} đ
                                        </td>
                                        <td className="p-[10px] text-center text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
                                            {c.refund.toLocaleString()} đ
                                        </td>
                                        <td className="p-[10px] text-center">
                                            {c.status === "active" ? (
                                                <span className="px-[20px] py-[5px] rounded-full  border-[1px] border-[#02DE35] bg-[#02DE35]/30 text-[#441A02] text-[18px] max-md:text-[16px] font-normal">
                                                    Hoạt động
                                                </span>
                                            ) : (
                                                <span className="px-[20px] py-[5px] rounded-full border-[1px] border-[#D1460B] bg-[#D1460B]/30 text-[#441A02] text-[18px] max-md:text-[16px] font-normal">
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

            {/* Footer info */}
            <div className="mt-5 text-right text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
                Tổng: <strong>{filteredData.length}</strong> khách hàng
            </div>
        </div>
    );
}