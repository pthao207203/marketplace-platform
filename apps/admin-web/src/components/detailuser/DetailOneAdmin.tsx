import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { MapPin, Mail, Phone, Calendar, CreditCard } from "lucide-react";

interface BankAccount {
  bankName: string;
  accountNumber: string;
  isDefault: boolean;
}

interface AdminDetail {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinedDate: string;
  status: number;
  address: any[];
  bankAccounts: BankAccount[];
}

export default function DetailOneAdmin() {
  const { id } = useParams();
  const [admin, setAdmin] = useState<AdminDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/admin/administrators/${id}`);
        const json = await res.json();
        
        if (json.success) {
          setAdmin(json.data);
        } else {
          console.error(json.message);
        }
      } catch (error) {
        console.error("Failed to fetch admin detail", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAdminDetail();
  }, [id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "---";
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  if (loading) {
    return (
        <div className="w-full h-screen flex justify-center items-center">
             <div className="w-10 h-10 border-4 border-gray-300 border-t-[#F25C05] rounded-full animate-spin"></div>
        </div>
    );
  }

  if (!admin) {
      return <div className="p-10 text-center">Không tìm thấy thông tin quản trị viên.</div>;
  }

  const displayAddress = admin.address?.find((a: any) => a.isDefault) || admin.address?.[0];
  const addressString = displayAddress 
    ? `${displayAddress.street}, ${displayAddress.ward}, ${displayAddress.province}`
    : "Chưa cập nhật địa chỉ";

  return (
    <div className="w-full h-full py-[30px] px-[30px] bg-white/60 min-h-screen">
      
      {/* --- HEADER PROFILE --- */}
      <div className="bg-white rounded-[20px] p-[30px] shadow-sm border border-gray-100 mb-[30px] flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Avatar & Info */}
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
                <img
                    src={admin.avatar || "/images/user-default.png"}
                    className="w-[120px] h-[120px] rounded-full object-cover border-[4px] border-white shadow-md bg-gray-100"
                    onError={(e) => {(e.target as HTMLImageElement).src = "https://via.placeholder.com/120"}}
                />
                <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-[3px] border-white ${admin.status === 1 ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </div>
            
            <div className="text-center md:text-left">
                <h1 className="text-[24px] font-bold text-[#441A02] mb-1">{admin.name}</h1>
                <div className="flex flex-col gap-1 text-gray-500 text-sm">
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                        <Mail size={16} /> {admin.email}
                    </div>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">Admin</span>
                        <span className="text-gray-400">|</span>
                        <span>Tham gia: {formatDate(admin.joinedDate)}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
            <button className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition">
                Sửa thông tin
            </button>
            <button className="px-6 py-2.5 bg-[#D1460B]/10 text-[#D1460B] font-medium rounded-xl hover:bg-[#D1460B]/20 transition">
                {admin.status === 1 ? "Khóa tài khoản" : "Mở khóa"}
            </button>
        </div>
      </div>

      {/* --- CHI TIẾT THÔNG TIN --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[30px]">
        
        {/* Cột Trái: Thông tin liên hệ */}
        <div className="bg-white rounded-[20px] p-[25px] shadow-sm border border-gray-100 h-full">
            <h2 className="text-[18px] font-bold text-[#441A02] mb-[20px] flex items-center gap-2">
                <Phone className="text-orange-500" size={20}/> Thông tin liên hệ
            </h2>
            
            <div className="space-y-5">
                <div className="flex justify-between border-b border-dashed border-gray-200 pb-3">
                    <span className="text-gray-500">Số điện thoại</span>
                    <span className="font-medium text-[#441A02]">{admin.phone || "---"}</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-gray-200 pb-3">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-[#441A02]">{admin.email}</span>
                </div>
                <div>
                    <span className="text-gray-500 block mb-2">Địa chỉ</span>
                    <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
                        <MapPin size={18} className="text-orange-500 mt-0.5 shrink-0" />
                        <span className="text-[#441A02] leading-relaxed">{addressString}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Cột Phải: Thông tin Ngân hàng  */}
        <div className="bg-white rounded-[20px] p-[25px] shadow-sm border border-gray-100 h-full">
            <h2 className="text-[18px] font-bold text-[#441A02] mb-[20px] flex items-center gap-2">
                <CreditCard className="text-orange-500" size={20}/> Tài khoản ngân hàng
            </h2>

            <div className="flex flex-col gap-4">
                {admin.bankAccounts && admin.bankAccounts.length > 0 ? (
                    admin.bankAccounts.map((bank, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">{bank.bankName}</p>
                                <p className="text-lg font-bold text-[#441A02] tracking-wide">{bank.accountNumber}</p>
                            </div>
                            {bank.isDefault && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                    Chính
                                </span>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        Chưa cập nhật thông tin ngân hàng
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
