import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProducts, Product } from "../../services/api.service";

export default function NegotiationList() {
    // State for products
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Filter states
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [shopFilter, setShopFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    // Fetch products from API
    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getProducts({
                priceType: 2, // Negotiation
                search,
                status: statusFilter === "all" ? undefined : (statusFilter === "active" ? 1 : 0),
                deleted: false,
                dateFilter,
                shop: shopFilter,
                category: categoryFilter === "all" ? undefined : categoryFilter,
                page,
                pageSize: 50,
            });

            if (response.success) {
                setProducts(response.data.items);
                setTotal(response.data.total);
                setTotalPages(Math.ceil(response.data.total / response.data.pageSize));
            }
        } catch (err: any) {
            console.error("Error fetching products:", err);
            setError(err.response?.data?.error?.message || "Lỗi khi tải danh sách sản phẩm");
        } finally {
            setLoading(false);
        }
    };

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, dateFilter, shopFilter, categoryFilter]);

    // Fetch data when page or filters change
    useEffect(() => {
        fetchProducts();
    }, [page, search, statusFilter, dateFilter, shopFilter, categoryFilter]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="w-full h-full py-[20px] px-[30px] bg-white/60 min-h-screen 
                        text-[18px] max-md:text-[16px] font-normal text-[#441A02]">

            {/* Header + Add Button */}
            <div className="flex justify-end mb-[20px]">
                <Link
                    to="/product/negotiation/create"
                    className="p-[10px] rounded-[16px] bg-[#F25C05] text-white 
                           hover:bg-[#d94f04] transition"
                >
                    + Thêm sản phẩm
                </Link>
            </div>

            {/* Filters */}
            <div className="mb-[20px] space-y-[10px]">
                {/* Row 1: Search + Status */}
                <div className="flex items-center gap-[10px]">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 border border-gray-200 p-[10px] rounded-[16px] 
                                   focus:outline-none focus:ring-1 focus:ring-[#F25C05]"
                    />

                    <select
                        title="Lọc theo trạng thái"
                        aria-label="Lọc theo trạng thái"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-[200px] border border-gray-200 p-[10px] rounded-[16px] 
                                   focus:outline-none focus:ring-1 focus:ring-[#F25C05]"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="deleted">Đã xóa</option>
                    </select>
                </div>

                {/* Row 2: Date + Shop + Category */}
                <div className="flex items-center gap-[10px]">
                    <input
                        type="date"
                        title="Lọc theo ngày"
                        aria-label="Lọc theo ngày"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="flex-1 border border-gray-200 p-[10px] rounded-[16px] 
                                   focus:outline-none focus:ring-1 focus:ring-[#F25C05]"
                    />

                    <input
                        type="text"
                        placeholder="Tên shop"
                        value={shopFilter}
                        onChange={(e) => setShopFilter(e.target.value)}
                        className="flex-1 border border-gray-200 p-[10px] rounded-[16px] 
                                   focus:outline-none focus:ring-1 focus:ring-[#F25C05]"
                    />

                    <select
                        title="Lọc theo phân loại"
                        aria-label="Lọc theo phân loại"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="flex-1 border border-gray-200 p-[10px] rounded-[16px] 
                                   focus:outline-none focus:ring-1 focus:ring-[#F25C05]"
                    >
                        <option value="all">Tất cả phân loại</option>
                        <option value="Điện tử">Điện tử</option>
                        <option value="Thời trang">Thời trang</option>
                        <option value="Gia dụng">Gia dụng</option>
                        <option value="Sách">Sách</option>
                        <option value="Khác">Khác</option>
                    </select>
                </div>
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

            {/* Table */}
            {!loading && (
                <div className="bg-none rounded-[16px] overflow-hidden text-[18px] max-md:text-[16px] text-[#441A02]">
                    <div className="w-full overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead className="border-b-[10px] border-[#F9FAFB] bg-white">
                                <tr className="text-center">
                                    <th className="py-[15px] font-bold whitespace-nowrap">Mã SP</th>
                                    <th className="py-[15px] font-bold bg-[#FFF7F3] whitespace-nowrap">Tên sản phẩm</th>
                                    <th className="py-[15px] font-bold whitespace-nowrap">Shop</th>
                                    <th className="py-[15px] font-bold bg-[#FFF7F3] whitespace-nowrap">Phân loại</th>
                                    <th className="py-[15px] font-bold whitespace-nowrap">Số lượng</th>
                                    <th className="py-[15px] font-bold bg-[#FFF7F3] whitespace-nowrap">Giá khởi điểm</th>
                                    <th className="py-[15px] font-bold whitespace-nowrap">Ngày tạo</th>
                                    <th className="py-[15px] font-bold bg-[#FFF7F3] whitespace-nowrap">Trạng thái</th>
                                </tr>
                            </thead>

                            <tbody>
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-10">
                                            Không tìm thấy sản phẩm nào.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((p) => (
                                        <tr key={p.id} className="hover:bg-[#8ECAE6]/30 bg-white">
                                            <td className="p-[10px] text-center font-semibold">
                                                <Link 
                                                    to={`/product/negotiation/${p.id}`}
                                                    className="text-[#611A02] hover:underline"
                                                >
                                                    {p.id}
                                                </Link>
                                            </td>

                                            <td className="p-[10px] text-center">
                                                <Link 
                                                    to={`/product/negotiation/${p.id}`}
                                                    className="hover:text-[#611A02] hover:underline transition"
                                                >
                                                    {p.name}
                                                </Link>
                                            </td>

                                            <td className="p-[10px] text-center whitespace-nowrap">{p.shop}</td>

                                            <td className="p-[10px] text-center whitespace-nowrap">{p.category}</td>

                                            <td className="p-[10px] text-center">{p.quantity}</td>

                                            <td className="p-[10px] text-center whitespace-nowrap">
                                                {p.price.toLocaleString()} đ
                                            </td>

                                            <td className="p-[10px] text-center whitespace-nowrap">
                                                {p.created ? formatDate(p.created) : "N/A"}
                                            </td>

                                            <td className="p-[10px] text-center">
                                                {p.deleted === 0 && p.status === 1 ? (
                                                    <span className="inline-block px-[20px] py-[5px] rounded-full  
                                                        border-[1px] border-[#02DE35] bg-[#02DE35]/30 text-sm whitespace-nowrap">
                                                        Hoạt động
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-[20px] py-[5px] rounded-full  
                                                        border-[1px] border-[#D1460B] bg-[#D1460B]/30 text-sm whitespace-nowrap">
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
            )}

            {/* Pagination */}
            <div className="mt-5 flex justify-between items-center">
                <div>
                    Tổng: <strong>{total}</strong> sản phẩm
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
