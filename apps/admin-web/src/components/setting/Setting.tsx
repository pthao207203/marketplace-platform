import { Plus, X, UploadCloud } from "lucide-react";
import { useState, useEffect } from "react";
interface PartnerBank {
  code: string; 
  name: string; 
  logoUrl: string;
}

interface Contact {
  phone: string;
  email: string;
  facebook: string;
}

interface SystemSettings {
  siteName: string; 
  logoUrl: string;
  iconUrl: string;
  contact: Contact;
  partnerBanks: PartnerBank[]; 
  termsAndPolicies: string; 
}

const DEFAULT_SETTINGS: SystemSettings = {
  siteName: "",
  logoUrl: "",
  iconUrl: "",
  contact: { phone: "", email: "", facebook: "" },
  partnerBanks: [],
  termsAndPolicies: "",
};

export default function Setting() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/admin/system");
        const json = await res.json();
        if (json.success) {
          const data = json.data;
          
          if (!data.partnerBanks) data.partnerBanks = [];
          if (!data.contact) data.contact = { phone: "", email: "", facebook: "" };
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/admin/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      
      const json = await res.json();
      if (json.success) {
        alert("Cập nhật thành công!");
        setSettings(json.data); 
      } else {
        alert("Lỗi: " + json.message);
      }
    } catch (error) {
      console.error("Save error", error);
      alert("Có lỗi xảy ra khi lưu.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (field: keyof Contact, value: string) => {
    setSettings((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  };

  const addBank = () => {
    const newBank: PartnerBank = { code: "", name: "", logoUrl: "" };
    setSettings((prev) => ({ ...prev, partnerBanks: [...prev.partnerBanks, newBank] }));
  };

  const removeBank = (index: number) => {
    const newBanks = [...settings.partnerBanks];
    newBanks.splice(index, 1);
    setSettings((prev) => ({ ...prev, partnerBanks: newBanks }));
  };

  const updateBank = (index: number, field: keyof PartnerBank, value: string) => {
    const newBanks = [...settings.partnerBanks];
    newBanks[index] = { ...newBanks[index], [field]: value };
    setSettings((prev) => ({ ...prev, partnerBanks: newBanks }));
  };

  if (loading) return <div className="p-10 text-center">Đang tải cấu hình...</div>;

  return (
    <div className="w-full h-full py-[20px] px-[30px] bg-white/60 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="font-bold text-[22px] text-[#441A02]">Cài đặt chung</h1>
        <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-[#F25C05] hover:bg-[#e04d00] text-white text-[16px] font-medium px-8 py-3 rounded-lg transition disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Cập nhật"}
        </button>
      </div>

      {/* LOGO & ICON */}
      <div className="grid grid-cols-2 gap-20 mb-12">
        {/* Logo */}
        <div>
          <Label text="Logo Website" />
          <div className="flex items-center gap-4">
             <div className="relative group w-40 h-40 border-2 border-dashed border-gray-300 rounded-xl bg-white flex items-center justify-center overflow-hidden">
                {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                    <span className="text-gray-400 text-xs">No Image</span>
                )}
             </div>
             <div className="flex-1">
                 <p className="text-sm text-gray-500 mb-2">URL Ảnh Logo:</p>
                 <Input 
                    value={settings.logoUrl} 
                    onChange={(e) => handleChange("logoUrl", e.target.value)}
                    placeholder="https://..." 
                 />
             </div>
          </div>
        </div>

        {/* Icon */}
        <div>
          <Label text="Icon Favicon" />
          <div className="flex items-center gap-4">
            <div className="relative group w-24 h-24 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                {settings.iconUrl ? (
                    <img src={settings.iconUrl} alt="Icon" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-gray-400 text-xs">No Icon</span>
                )}
            </div>
            <div className="flex-1">
                 <p className="text-sm text-gray-500 mb-2">URL Ảnh Icon:</p>
                 <Input 
                    value={settings.iconUrl} 
                    onChange={(e) => handleChange("iconUrl", e.target.value)}
                    placeholder="https://..." 
                 />
             </div>
          </div>
        </div>
      </div>

      {/* TÊN WEBSITE */}
      <div className="max-w-md mb-12">
        <Label text="Tên website" />
        <Input 
            value={settings.siteName} 
            onChange={(e) => handleChange("siteName", e.target.value)} 
        />
      </div>

      {/* THÔNG TIN LIÊN HỆ */}
      <h2 className="font-bold text-[20px] text-[#441A02] mb-[20px]">Thông tin liên hệ</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
        <div>
          <Label text="Hotline / SĐT" />
          <Input 
            value={settings.contact.phone} 
            onChange={(e) => handleContactChange("phone", e.target.value)} 
          />
        </div>
        <div>
          <Label text="Email hỗ trợ" />
          <Input 
            value={settings.contact.email} 
            onChange={(e) => handleContactChange("email", e.target.value)} 
          />
        </div>
        <div>
          <Label text="Facebook Fanpage" />
          <Input 
            value={settings.contact.facebook} 
            onChange={(e) => handleContactChange("facebook", e.target.value)} 
          />
        </div>
      </div>

      {/* NGÂN HÀNG */}
      <div className="mb-12 border-t border-gray-200 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-[20px] text-[#441A02]">Ngân hàng hợp tác</h2>
          <button
            onClick={addBank}
            className="flex items-center gap-2 text-[#F25C05] hover:text-[#e04d00] font-medium transition"
          >
            <Plus className="w-5 h-5" />
            Thêm ngân hàng
          </button>
        </div>

        <div className="space-y-6">
          {settings.partnerBanks.map((bank, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-6 items-start md:items-center w-full p-4 bg-gray-50 rounded-xl border border-gray-100">
              
              <div className="w-full md:w-1/4">
                <Label text="Logo Bank (URL)" />
                <div className="flex gap-2">
                    {bank.logoUrl && <img src={bank.logoUrl} className="w-10 h-10 object-contain rounded border bg-white"/>}
                    <Input 
                        value={bank.logoUrl}
                        onChange={(e) => updateBank(index, "logoUrl", e.target.value)}
                        placeholder="URL ảnh..."
                    />
                </div>
              </div>

              <div className="w-full md:w-1/4">
                <Label text="Tên viết tắt (Code)" />
                <Input
                  value={bank.code}
                  onChange={(e) => updateBank(index, "code", e.target.value)}
                  placeholder="VD: Momo"
                />
              </div>

              <div className="w-full md:w-2/4 flex gap-2 items-end">
                <div className="flex-1">
                    <Label text="Tên đầy đủ" />
                    <Input
                    value={bank.name}
                    onChange={(e) => updateBank(index, "name", e.target.value)}
                    placeholder="Ngân hàng..."
                    />
                </div>
                <button onClick={() => removeBank(index)} className="mb-1 p-3 text-red-500 hover:bg-red-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHÍNH SÁCH */}
      <h2 className="font-bold text-[20px] text-[#441A02] mb-5">Điều khoản & Chính sách</h2>
      <div className="max-w-5xl">
        <textarea
          className="w-full h-64 p-6 border border-gray-300 rounded-xl text-[#441A02] text-base resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={settings.termsAndPolicies}
          onChange={(e) => handleChange("termsAndPolicies", e.target.value)}
          placeholder="Nhập nội dung chính sách..."
        />
      </div>
    </div>
  );
}

function Label({ text }: { text: string }) {
  return <label className="block text-[14px] font-semibold text-[#A09CAB] mb-[8px] uppercase tracking-wide">{text}</label>;
}

function Input({ value, onChange, placeholder }: { value?: string; onChange?: (e: any) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-normal text-[16px] text-[#441A02] focus:outline-none focus:ring-2 focus:ring-orange-400 transition bg-white"
    />
  );
}
