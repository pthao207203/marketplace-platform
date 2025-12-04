import { format } from "date-fns";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, CreditCard, CheckCircle, Clock } from "lucide-react";

const shop = {
  id: 1,
  name: "Cá Biết Bay",
  email: "cabietbay@gmail.com",
  phone: "0333 333 333",
  avatar: "/images/avatars/cabietbay.jpg", // thay bằng ảnh thật
  joinedDate: "2025-07-16",
  status: "active",
  totalSpent: 10000000,
  totalOrders: 28,
  totalRefunded: 1100000,
  address: "Thôn Cá, xã Biết, Tỉnh bay, Thành phố Cá biết bay, cách Thủy Cung Động Cung 300 dặm.",
  bankAccounts: [
    { bank: "Momo", account: "0333 333 333", name: "Cá Biết Bay" },
    { bank: "VietCombank", account: "0987 678 978", name: "Cá Biết Bay" },
    { bank: "VietCombank", account: "0987 678 978", name: "Cá Biết Bay" },
  ],
  products: [
    {
      id: 1,
      name: "Áo thun cá mập",
      createdAt: "2025-07-15",
      type: "Cố định",
      quantity: 5,
      price: 155000,
      status: "Đang bán",
    },
  ]
};

export default function DetailOneShop() {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const formatDate = (dateString: string) => format(new Date(dateString), "dd/MM/yyyy");

  return (
    <div className="w-full h-full py-[20px] px-[30px] bg-white/60">


      <div className="mb-[30px] md:flex flex-col  justify-between">

        <div className="flex gap-[15px] w-full justify-between items-center">
          <div className="flex flex-col items-center">
            <img
              src={shop.avatar || "/images/user-placeholder.png"}
              // alt={shop.name}
              className="w-[150px] h-[150px] rounded-full object-cover border-[1px] border-gray-200 bg-amber-100"
            />
            <span className="inline-block mt-[-30px] px-[10px] py-[5px] bg-[#FBCCB2] text-[18px] max-md:text-[16px] font-normal text-[#441A02] rounded-[16px]">
              Đã xác thực
            </span>
          </div>
          <div className="w-full flex flex-col justify-between items-start">
            <h1 className="font-bold text-[18px] max-md:text-[16px] text-[#441A02]">{shop.name}</h1>
            <p className="font-normal text-[18px] max-md:text-[16px] text-[#441A02] mt-[5px]">
              {shop.email}
            </p>

            <div className="flex w-full gap-[10px]">
              <div className="mt-[10px] flex flex-col bg-none">
                <div className="px-[10px] py-[5px] flex justify-between min-w-[300px]  bg-[#FFB703]/30 rounded-t-[8px] mb-[5px]">
                  <p className="font-bold text-[18px] max-md:text-[16px] text-[#441A02]">Ví</p>
                  <p className="font-bold text-[18px] max-md:text-[16px] text-[#F25C05]">Lịch sử</p>
                </div>
                <div className="px-[10px] py-[5px] flex flex-col bg-white rounded-b-[8px] border-[1px] border-[#FFB703]/30">
                  <p className="font-normal text-[18px] max-md:text-[16px] text-[#441A02]">Số dư khả dụng</p>
                  <p className="font-bold text-[18px] max-md:text-[16px] text-[#441A02] text-right">{formatCurrency(shop.totalSpent)}</p>
                </div>
              </div>

              <div className="mt-[10px] flex flex-col bg-none">
                <div className="px-[10px] py-[5px] flex justify-between min-w-[300px]  bg-[#8ECAE6]/30 rounded-t-[8px] mb-[5px]">
                  <p className="font-bold text-[18px] max-md:text-[16px] text-[#441A02]">Tổng chi</p>
                  <p className="font-bold text-[18px] max-md:text-[16px] text-[#F25C05]">Lịch sử</p>
                </div>
                <div className="px-[10px] py-[5px] flex flex-col bg-white rounded-b-[8px] border-[1px] border-[#8ECAE6]/30">
                  <p className="font-normal text-[18px] max-md:text-[16px] text-[#441A02]">Tổng tiền đã chi</p>
                  <p className="font-bold text-[18px] max-md:text-[16px] text-[#441A02] text-right">{formatCurrency(shop.totalSpent)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center justify-items-end w-[226px] h-0">
            <button className="w-full p-[10px] bg-[#D1460B]/30 text-[18px] max-md:text-[16px] text-[#441A02] text-center rounded-[16px] font-normal items-center gap-[5px]">
              Chặn người dùng
            </button>
          </div>
        </div>


      </div>


      {/* Thông tin người dùng */}
      <div className="">
        <h2 className="text-[18px] max-md:text-[16px] text-[#441A02] font-bold mb-[20px]">Thông tin người dùng</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 text-sm">
          <div>
            <p className="text-[14px] max-md:text-[12px] text-[#A09CAB] mb-[10px]">Họ và tên</p>
            <p className="font-normal text-[18px] max-md:text-[16px] text-[#441A02]">{shop.name}</p>
          </div>
          <div>
            <p className="text-[14px] max-md:text-[12px] text-[#A09CAB] mb-[10px]">Gmail</p>
            <p className="font-normal text-[18px] max-md:text-[16px] text-[#441A02]">{shop.email}</p>
          </div>
          <div>
            <p className="text-[14px] max-md:text-[12px] text-[#A09CAB] mb-[10px]">SĐT</p>
            <p className="font-normal text-[18px] max-md:text-[16px] text-[#441A02]">{shop.phone}</p>
          </div>
          <div>
            <p className="text-[14px] max-md:text-[12px] text-[#A09CAB] mb-[10px]">Ngày tham gia</p>
            <p className="font-normal text-[18px] max-md:text-[16px] text-[#441A02]">{formatDate(shop.joinedDate)}</p>
          </div>
        </div>

        <div className="mt-[15px] mb-[15px]">
          <p className="text-[14px] max-md:text-[12px] text-[#A09CAB] mb-[10px]">Địa chỉ giao</p>
          <div className="mt-2 p-4 bg-gray-50 rounded-xl flex items-start gap-3">
            <MapPin className="w-5 h-5 text-orange-500 mt-0.5" />
            <p className="text-gray-800">{shop.address}</p>
            <button className="ml-auto text-orange-600 font-medium text-sm">Mặc định</button>
          </div>
        </div>
      </div>

      {/* Ngân hàng */}
      <div className="mb-[30px]">
        <h2 className="text-[14px] max-md:text-[12px] text-[#A09CAB] mb-[10px]">
          Ngân hàng
        </h2>

        <div className="flex gap-[15px]">
          {shop.bankAccounts.map((bank, i) => (
            <div
              key={i}
              className="flex flex-col  bg-none rounded-[8px] overflow-hidden"
            >
              {/* Header giống hệt phần Tổng chi */}
              <div className="flex justify-between min-w-[300px]  bg-[#EFF1F5] rounded-t-[8px] mb-[5px]">
                <p className="px-[10px] py-[5px] font-normal text-[18px] max-md:text-[16px] text-[#441A02]">
                  {bank.name}
                </p>
                {i === 0 && (
                  <p className="px-[10px] py-[5px] font-bold text-[18px] max-md:text-[16px] text-[#F25C05]">Mặc định</p>
                )}
              </div>

              {/* Nội dung bên dưới */}
              <div className="flex flex-col bg-white rounded-b-[8px] border-[1px] border-[#8ECAE6]/30 px-[10px] py-[5px] ">
                <p className="font-normal text-[18px] max-md:text-[16px] text-[#441A02]">
                  {bank.account}
                </p>
                <p className="font-normal text-[18px] max-md:text-[16px] text-[#441A02]">
                  {bank.bank}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bảng đơn hàng */}
      <div className="">
        <h2 className="text-[18px] max-md:text-[16px] font-bold text-[#441A02] mb-[20px]">
          Thông tin các sản phẩm
        </h2>

        <div className="w-full overflow-x-auto">
          <table className="w-full table-auto">
            {/* HEADER */}
            <thead className="border-b-[10px] border-[#F9FAFB] bg-white">
              <tr className="text-center text-[18px] max-md:text-[16px] font-bold text-[#441A02]">
                <th className="py-[15px]">Tên sản phẩm</th>
                <th className="py-[15px] bg-[#FFF7F3]">Ngày đăng</th>
                <th className="py-[15px]">Hình thức</th>
                <th className="py-[15px] bg-[#FFF7F3]">Số lượng</th>
                <th className="py-[15px]">Giá</th>
                <th className="py-[15px] bg-[#FFF7F3]">Trạng thái</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {shop.products?.length === 0 || !shop.products ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 font-normal text-[18px] max-md:text-[16px] text-[#441A02]"
                  >
                    Không có sản phẩm nào.
                  </td>
                </tr>
              ) : (
                shop.products.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-[#8ECAE6]/30 bg-white border-b border-gray-100 transition"
                  >
                    {/* Tên sản phẩm */}
                    <td className="p-[10px] text-center font-normal text-[#441A02] text-[18px] max-md:text-[16px]">
                      {p.name}
                    </td>

                    {/* Ngày đăng */}
                    <td className="p-[10px] text-center font-normal text-[18px] max-md:text-[16px] text-[#441A02]">
                      {formatDate(p.createdAt)}
                    </td>

                    {/* Hình thức */}
                    <td className="p-[10px] text-center font-normal text-[18px] max-md:text-[16px] text-[#441A02]">
                      {p.type}
                    </td>

                    {/* Số lượng */}
                    <td className="p-[10px] text-center font-normal text-[18px] max-md:text-[16px] text-[#441A02]">
                      {p.quantity}
                    </td>

                    {/* Giá */}
                    <td className="p-[10px] text-center font-normal text-[18px] max-md:text-[16px] text-[#441A02]">
                      {formatCurrency(p.price)}
                    </td>

                    {/* Trạng thái */}
                    <td className="p-[10px] text-center">
                      <span className="inline-flex items-center gap-1 px-[20px] py-[5px] rounded-full border-[1px] border-[#02DE35] bg-[#02DE35]/30 font-normal text-[18px] max-md:text-[16px] text-[#441A02]">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 text-right text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
          Tổng: <strong>{shop.products?.length || 0}</strong> sản phẩm
        </div>
      </div>
    </div>

  );
}