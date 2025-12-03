import { Plus, X } from "lucide-react";
import { useState } from "react";

interface Bank {
  id: string;
  logo: string;
  shortName: string;
  fullName: string;
}

export default function Setting() {
  const [banks, setBanks] = useState<Bank[]>([
    {
      id: "1",
      logo: "/demo/momo.png",
      shortName: "Momo",
      fullName: "Ví điện tử Momo",
    },
    {
      id: "2",
      logo: "/demo/vietcombank.png",
      shortName: "Vietcombank",
      fullName: "Ngân hàng Thương mại Cổ phần Ngoại thương Việt Nam",
    },
  ]);

  const addBank = () => {
    setBanks([...banks, { id: Date.now().toString(), logo: "", shortName: "", fullName: "" }]);
  };

  const removeBank = (id: string) => {
    setBanks(banks.filter((b) => b.id !== id));
  };

  const updateBank = (id: string, field: keyof Bank, value: string) => {
    setBanks(banks.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  return (
    <div className="w-full h-full py-[20px] px-[30px] bg-white/60 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="font-bold text-[22px] max-md:text-[20px] text-[#441A02] mb-[30px]">Cài đặt chung</h1>
        <button className="bg-[#F25C05] hover:bg-[#e04d00] text-white text-[18px] max-md:text-[16px] font-normal px-8 py-3 rounded-lg transition">
          Cập nhật
        </button>
      </div>

      {/* LOGO & ICON LOGO */}
      <div className="grid grid-cols-2 gap-20 mb-12">
        {/* Logo */}
        <div>
          <Label text="Logo" />
          <div className="relative group w-40 h-40 border-2 border-dashed border-gray-300 rounded-xl bg-white flex items-center justify-center overflow-hidden">
            <img
              src="/demo/logo-full.png"
              alt="Logo"
              className="w-full h-full object-contain p-4"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <Plus className="w-10 h-10 text-white" />
            </div>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        {/* Icon Logo */}
        <div>
          <Label text="Icon Logo" />
          <div className="relative group w-24 h-24 rounded-lg bg-red-600 overflow-hidden">
            <img
              src="/demo/logo-icon.png"
              alt="Icon"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Tên website */}
      <div className="max-w-md mb-12">
        <Label text="Tên website" />
        <input
          defaultValue="SECONDCHANCE"
          className="w-full px-5 py-3.5 border border-gray-300 rounded-lg text-lg font-semibold text-[#441A02] focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* THÔNG TIN LIÊN HỆ */}
      <h2 className="font-bold text-[22px] max-md:text-[20px] text-[#441A02] mb-[30px]">Thông tin liên hệ</h2>
      <div className="grid grid-cols-3 gap-10 mb-12 ">
        <div>
          <Label text="SĐT" />
          <Input value="0333 333 333" />
        </div>
        <div>
          <Label text="Email" />
          <Input value="cabietbay@gmail.com" />
        </div>
        <div>
          <Label text="Facebook" />
          <Input value="facebook.com/cabietbay" />
        </div>
      </div>

      {/* NGÂN HÀNG HỢP TÁC - 3 cột + thêm/xóa */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-[22px] max-md:text-[20px] text-[#441A02] mb-[30px]">Ngân hàng hợp tác</h2>
          <button
            onClick={addBank}
            className="flex items-center gap-2 text-[#F25C05] hover:text-[#e04d00] font-medium transition"
          >
            <Plus className="w-5 h-5" />
            Thêm ngân hàng
          </button>
        </div>

        <div className="space-y-6">
          {banks.map((bank) => (
            <div key={bank.id} className="flex gap-8 items-center w-full p-[10px]">
              {/* Logo */}
              <div className="">
                <Label text="" />
                {bank.logo ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={bank.logo} alt="" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Plus className="w-7 h-7 text-white" />
                    </div>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Tên viết tắt */}
              <div>
                <Label text="Tên viết tắt" />
                <Input
                  value={bank.shortName}
                  onChange={(e) => updateBank(bank.id, "shortName", e.target.value)}
                  placeholder="VD: Momo"
                />
              </div>

              {/* Tên đầy đủ */}
              <div className="flex gap-3 items-start w-full">
                <div className="flex-1">
                  <Label text="Tên đầy đủ" />
                  <Input
                    value={bank.fullName}
                    onChange={(e) => updateBank(bank.id, "fullName", e.target.value)}
                    placeholder="VD: Ví điện tử Momo"
                  />
                </div>
                {banks.length > 1 && (
                  <button
                    onClick={() => removeBank(bank.id)}
                    className="mt-8 p-2 hover:bg-red-50 rounded-lg transition"
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHÍNH SÁCH */}
      <h2 className="text-xl font-bold text-[#441A02] mb-5">Thông tin chính sách</h2>
      <div className="max-w-5xl">
        <Label text="Chính sách trở thành người bán" />
        <textarea
          className="w-full h-64 p-6 border border-gray-300 rounded-xl text-[#441A02] text-base resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
          defaultValue={`1. Nguyên tắc chung
• Người bán chỉ được đăng bán các sản phẩm hợp pháp theo quy định pháp luật Việt Nam.
• Sản phẩm đăng bán phải thuộc loại đã qua sử dụng (second-hand), trừ khi được quy định khác.

2. Quy trình đăng ký
• Người bán cần cung cấp đầy đủ thông tin cá nhân và giấy tờ tùy thân.
• Tài khoản sẽ được xét duyệt trong vòng 24-48 giờ.`}
        />
      </div>
    </div>
  );
}

/* ========== COMPONENTS ========== */
function Label({ text }: { text: string }) {
  return <label className="block text-[14px] max-md:text-[12px] text-[#A09CAB] mb-[10px]">{text}</label>;
}

function Input({ value, onChange, placeholder }: { value?: string; onChange?: (e: any) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-normal text-[18px] max-md:text-[16px] text-[#441A02] focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
    />
  );
}