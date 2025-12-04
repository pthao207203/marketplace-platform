import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { MapPin } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  createdAt: string;
  type: string;
  quantity: number;
  price: number;
  status: number | string; 
}

interface BankAccount {
  bankName: string;
  accountNumber: string;
  isDefault: boolean;
}

interface ShopDetail {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinedDate: string;
  status: number;
  address: any[];
  bankAccounts: BankAccount[];
  totalRevenue: number;
  totalOrders: number;
  products: Product[];
}

export default function DetailOneShop() {
  const { id } = useParams();
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/admin/sellers/${id}`);
        const json = await res.json();
        
        if (json.success) {
          setShop(json.data);
        } else {
          console.error(json.message);
        }
      } catch (error) {
        console.error("Failed to fetch shop detail", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchShopDetail();
  }, [id]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

  const formatDate = (dateString: string) => {
    if (!dateString) return "---";
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  const getProductStatus = (status: any) => {
      // Nếu DB lưu số
      if (typeof status === 'number') {
          return status === 1 ? "Đang bán" : "Đã ẩn";
      }
      return status; 
  };

  if (loading) {
    return (
        <div className="w-full h-screen flex justify-center items-center">
             <div className="w-10 h-10 border-4 border-gray-300 border-t-[#F25C05] rounded-full animate-spin"></div>
        </div>
    );
  }

  if (!shop) {
      return <div className="p-10 text-center">Không tìm thấy thông tin cửa hàng.</div>;
  }

  const displayAddress = shop.address?.find((a: any) => a.isDefault) || shop.address?.[0];
  const addressString = displayAddress 
    ? `${displayAddress.street}, ${displayAddress.ward}, ${displayAddress.province}`
    : "Chưa cập nhật địa chỉ";

  return (
    <div className="w-full h-full py-[20px] px-[30px] bg-white/60 min-h-screen">
      
      {/* --- HEADER --- */}
      <div className="mb-[30px] md:flex flex-col justify-between">
        <div className="flex gap-[15px] w-full justify-between items-center">
          <div className="flex flex-col items-center">
            <img
              src={shop.avatar || "/images/user-default.png"}
              className="w-[150px] h-[150px] rounded-full object-cover border-[1px] border-gray-200 bg-amber-100"
              onError={(e) => {(e.target as HTMLImageElement).src = "https://via.placeholder.com/150"}}
            />
            <span className={`inline-block mt-[-30px] px-[10px] py-[5px] text-[16px] font-normal rounded-[16px] ${shop.status === 1 ? 'bg-[#FBCCB2] text-[#441A02]' : 'bg-red-200 text-red-800'}`}>
              {shop.status === 1 ? "Đã xác thực" : "Đã khóa"}
            </span>
          </div>
          
          <div className="w-full flex flex-col justify-between items-start ml-5">
            <h1 className="font-bold text-[18px] text-[#441A02]">{shop.name}</h1>
            <p className="font-normal text-[16px] text-[#441A02] mt-[5px]">{shop.email}</p>

            <div className="flex w-full gap-[20px] mt-4">
              {/* Card Doanh Thu */}
              <div className="flex flex-col">
                <div className="px-[15px] py-[5px] flex justify-between min-w-[250px] bg-[#FFB703]/30 rounded-t-[8px]">
                  <p className="font-bold text-[#441A02]">Doanh Thu</p>
                </div>
                <div className="px-[15px] py-[10px] bg-white rounded-b-[8px] border-[1px] border-[#FFB703]/30">
                  <p className="font-bold text-[18px] text-[#441A02] text-right">
                    {formatCurrency(shop.totalRevenue)}
                  </p>
                </div>
              </div>

              {/* Card Số đơn bán */}
              <div className="flex flex-col">
                <div className="px-[15px] py-[5px] flex justify-between min-w-[250px] bg-[#8ECAE6]/30 rounded-t-[8px]">
                  <p className="font-bold text-[#441A02]">Tổng đơn bán</p>
                </div>
                <div className="px-[15px] py-[10px] bg-white rounded-b-[8px] border-[1px] border-[#8ECAE6]/30">
                  <p className="font-bold text-[18px] text-[#441A02] text-right">
                    {shop.totalOrders} Đơn
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-[200px]">
            <button className="w-full p-[10px] bg-[#D1460B]/20 hover:bg-[#D1460B]/30 text-[#441A02] rounded-[16px] font-medium transition">
              Chặn cửa hàng
            </button>
          </div>
        </div>
      </div>

      {/* --- THÔNG TIN --- */}
      <div className="mb-8">
        <h2 className="text-[18px] text-[#441A02] font-bold mb-[20px]">Thông tin liên hệ</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[12px] text-[#A09CAB] mb-1 uppercase">Tên Shop</p>
            <p className="text-[16px] text-[#441A02] font-medium">{shop.name}</p>
          </div>
          <div>
            <p className="text-[12px] text-[#A09CAB] mb-1 uppercase">Email</p>
            <p className="text-[16px] text-[#441A02] font-medium">{shop.email}</p>
          </div>
          <div>
            <p className="text-[12px] text-[#A09CAB] mb-1 uppercase">SĐT</p>
            <p className="text-[16px] text-[#441A02] font-medium">{shop.phone || "---"}</p>
          </div>
          <div>
            <p className="text-[12px] text-[#A09CAB] mb-1 uppercase">Ngày tham gia</p>
            <p className="text-[16px] text-[#441A02] font-medium">{formatDate(shop.joinedDate)}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[12px] text-[#A09CAB] mb-2 uppercase">Địa chỉ lấy hàng</p>
          <div className="p-4 bg-gray-50 rounded-xl flex items-start gap-3 border border-gray-100 max-w-2xl">
            <MapPin className="w-5 h-5 text-[#F25C05] mt-0.5 flex-shrink-0" />
            <p className="text-[#441A02]">{addressString}</p>
          </div>
        </div>
      </div>

      {/* --- NGÂN HÀNG --- */}
      <div className="mb-[30px]">
        <h2 className="text-[14px] text-[#A09CAB] uppercase mb-[15px]">Tài khoản nhận tiền</h2>
        <div className="flex flex-wrap gap-[15px]">
          {shop.bankAccounts && shop.bankAccounts.length > 0 ? (
            shop.bankAccounts.map((bank, i) => (
                <div key={i} className="flex flex-col rounded-[8px] overflow-hidden min-w-[250px]">
                <div className="flex justify-between bg-[#EFF1F5] px-[15px] py-[8px]">
                    <p className="font-medium text-[#441A02]">{bank.bankName}</p>
                    {bank.isDefault && <p className="font-bold text-[#F25C05] text-xs mt-1">Default</p>}
                </div>
                <div className="flex flex-col bg-white border border-[#EFF1F5] px-[15px] py-[10px]">
                    <p className="text-[16px] text-[#441A02] font-bold tracking-wide">{bank.accountNumber}</p>
                </div>
                </div>
            ))
          ) : (
             <p className="text-gray-400 italic">Chưa liên kết ngân hàng.</p>
          )}
        </div>
      </div>

      {/* --- BẢNG SẢN PHẨM --- */}
      <div>
        <h2 className="text-[18px] font-bold text-[#441A02] mb-[20px]">Danh sách sản phẩm</h2>
        <div className="w-full overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full table-auto">
            <thead className="bg-[#F9FAFB] border-b border-gray-200">
              <tr className="text-center text-[14px] font-bold text-[#441A02]">
                <th className="py-[15px]">Tên sản phẩm</th>
                <th className="py-[15px]">Ngày đăng</th>
                <th className="py-[15px]">Hình thức</th>
                <th className="py-[15px]">Số lượng</th>
                <th className="py-[15px]">Giá bán</th>
                <th className="py-[15px]">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {shop.products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    Cửa hàng chưa có sản phẩm nào.
                  </td>
                </tr>
              ) : (
                shop.products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition">
                    <td className="p-[15px] text-left font-medium text-[#441A02]">
                        <Link to={`/admin/products/${p._id}`} className="hover:text-[#F25C05]">
                             {p.name}
                        </Link>
                    </td>
                    <td className="p-[15px] text-center text-[#441A02]">
                        {formatDate(p.createdAt)}
                    </td>
                    <td className="p-[15px] text-center text-[#441A02]">
                        {p.type || "Cố định"}
                    </td>
                    <td className="p-[15px] text-center text-[#441A02]">
                        {p.quantity}
                    </td>
                    <td className="p-[15px] text-center font-bold text-[#F25C05]">
                        {formatCurrency(p.price)}
                    </td>
                    <td className="p-[15px] text-center">
                        <span className="inline-flex items-center gap-1 px-[20px] py-[5px] rounded-full border-[1px] border-[#02DE35] bg-[#02DE35]/30 text-sm text-[#441A02]">
                            {getProductStatus(p.status)}
                        </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-5 text-right text-[16px] text-[#441A02]">
          Tổng: <strong>{shop.products.length}</strong> sản phẩm
        </div>
      </div>

    </div>
  );
}
