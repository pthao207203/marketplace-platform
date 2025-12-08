import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { getProductById } from "../../services/api.service";

interface ProductDetailProps {
  productType: "fixed" | "negotiation" | "auction";
  showHistoryButton?: boolean;
}

export default function ProductDetail({ productType, showHistoryButton = false }: ProductDetailProps) {
  const { id } = useParams();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getProductById(id);
        
        if (response.success) {
          setProduct(response.data);
        }
      } catch (err: any) {
        console.error("Error fetching product:", err);
        setError(err.response?.data?.error?.message || "Lỗi khi tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-full py-[20px] px-[30px] bg-white/60 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F25C05] mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-full py-[20px] px-[30px] bg-white/60">
        <div className="p-6 text-center text-red-500 text-xl bg-red-50 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  // Not found state
  if (!product) {
    return (
      <div className="w-full h-full py-[20px] px-[30px] bg-white/60">
        <div className="p-6 text-center text-red-500 text-xl">
          Không tìm thấy sản phẩm!
        </div>
      </div>
    );
  }

  // Helper functions
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getMainImage = () => {
    if (Array.isArray(product.media) && product.media.length > 0) {
      return product.media[0];
    }
    return "/placeholder-image.jpg";
  };

  const getGalleryImages = () => {
    if (Array.isArray(product.media)) {
      return product.media.slice(0, 3);
    }
    return [];
  };

  return (
    <div className="w-full h-full py-[20px] px-[30px] bg-white/60">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-start gap-4">
          {/* ẢNH LỚN */}
          <img
            src={getMainImage()}
            alt={product.name}
            className="max-w-[223px] w-[223px] h-[223px] rounded-[16px] object-cover border"
            onError={(e) => {
              e.currentTarget.src = "/placeholder-image.jpg";
            }}
          />

          {/* THÔNG TIN */}
          <div className="flex flex-col h-[223px] justify-between">
            <h2 className="font-bold text-[18px] max-md:text-[16px] text-[#441A02] mb-[20px]">
              {product.name || "N/A"}
            </h2>
            <p className="font-bold text-[22px] max-md:text-[20px] text-[#441A02]">
              đ {(product.price || 0).toLocaleString()}
            </p>

            {/* GALLERY */}
            <div className="flex gap-2 mt-[20px]">
              {getGalleryImages().map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  alt={`Gallery ${i + 1}`}
                  className="w-[100px] h-[100px] rounded-[16px] object-cover border"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-image.jpg";
                  }}
                />
              ))}

              {/* NÚT + */}
              {getGalleryImages().length < 3 && (
                <div className="w-[100px] h-[100px] rounded-[16px] flex items-center justify-center cursor-pointer hover:bg-gray-100 border">
                  <Plus className="w-6 h-6 text-gray-500" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-[10px]">
          {showHistoryButton && (
            <Link
              to={`/product/${productType}/${id}/history`}
              className="bg-[#8ECAE6]/30 text-[#441A02] px-6 py-2 rounded-lg border-[1px] border-[#8ECAE6] hover:bg-[#8ECAE6]/50 transition"
            >
              Lịch sử
            </Link>
          )}
          <button className="bg-[#F25C05] text-white px-6 py-2 rounded-lg hover:bg-[#d94f04] transition">
            Cập nhật
          </button>
        </div>
      </div>

      {/* FORM 3 CỘT */}
      <div className="grid grid-cols-3 gap-6">
        {/* COL 1 */}
        <div className="flex flex-col gap-4">
          <Field label="Ngày đăng" value={formatDate(product.createdAt)} />
          <Field label="Tên sản phẩm" value={product.name || "N/A"} />
          <Field label="Tình trạng sử dụng" value={product.condition || "N/A"} />
          <Field label="Nguồn gốc" value={product.hasOrigin ? "Có xuất xứ" : "Không rõ"} />
        </div>

        {/* COL 2 */}
        <div className="flex flex-col gap-4">
          <Field label="Cập nhật cuối" value={formatDate(product.updatedAt)} />
          <Field label="Giá" value={(product.price || 0).toLocaleString() + " đ"} />
          <Field label="Mới" value={product.newPercent ? `${product.newPercent}%` : "N/A"} />
          <Field label="Bảo hành" value={product.warrantyMonths ? `${product.warrantyMonths} tháng` : "N/A"} />
        </div>

        {/* COL 3 */}
        <div className="flex flex-col gap-4">
          <Field label="Thể loại giá" value={product.priceTypeLabel || "N/A"} />
          <Field label="Số lượng" value={String(product.quantity || 0)} />
          <Field label="Hỏng" value={product.damagePercent ? `${product.damagePercent}%` : "0%"} />
          <Field label="Chính sách đổi trả" value={product.returnPolicy ? "Có" : "Không"} />
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="mt-6">
        <label className="block text-[14px] max-md:text-[12px] text-[#A09CAB] mb-[10px]">
          Mô tả
        </label>
        <textarea
          title="Mô tả sản phẩm"
          value={product.description || "Không có mô tả"}
          readOnly
          rows={5}
          className="w-full rounded-lg px-3 py-2 bg-white focus:ring-[1px] focus:ring-orange-300 font-normal text-[18px] max-md:text-[16px] text-[#441A02] resize-none"
        />
      </div>

      {/* SELLER INFO (nếu có) */}
      {product.seller && (
        <div className="mt-6 p-4 bg-white rounded-lg border">
          <h3 className="font-bold text-[16px] mb-2">Thông tin người bán</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Shop" value={product.seller.shopName || product.seller.userName} />
            <Field label="User ID" value={product.seller.id} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- COMPONENT PHỤ ---------------- */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-[14px] max-md:text-[12px] text-[#A09CAB] mb-[10px]">
        {label}
      </label>
      <input
        title="giá trị"
        value={value}
        readOnly
        className="w-full rounded-lg px-3 py-2 bg-white focus:ring-[1px] focus:ring-orange-300 font-normal text-[18px] max-md:text-[16px] text-[#441A02]"
      />
    </div>
  );
}
