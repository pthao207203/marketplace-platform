import { useState } from "react";
import { Plus } from "lucide-react";

export default function CreateFixed() {
    const [images, setImages] = useState<string[]>([]);

    return (
        <div className="w-full h-full py-[20px] px-[30px] bg-white/60">
            {/* HEADER */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-4">

                    {/* ẢNH LỚN */}
                    <div className="max-w-[223px] w-[223px] h-[223px] rounded-[16px] bg-gray-100 flex items-center justify-center text-gray-400 border">
                        Chưa có ảnh
                    </div>

                    {/* THÔNG TIN */}
                    <div className="flex flex-col h-[223px] justify-between">
                        <input
                            placeholder="Nhập tiêu đề sản phẩm"
                            className="font-bold text-[18px] max-md:text-[16px] text-[#441A02] mb-[20px] border rounded-lg px-3 py-2"
                        />

                        <input
                            placeholder="Nhập giá"
                            className="font-bold text-[22px] max-md:text-[20px] text-[#441A02] border rounded-lg px-3 py-2"
                        />

                        {/* GALLERY */}
                        <div className="flex gap-2 mt-[20px]">
                            {images.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    className="w-[100px] h-[100px] rounded-[16px] object-cover border"
                                />
                            ))}

                            {/* NÚT + */}
                            <div className="w-[100px] h-[100px] rounded-[16px] flex items-center justify-center cursor-pointer hover:bg-gray-100 border">
                                <Plus className="w-6 h-6 text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* NÚT ĐĂNG */}
                <button className="bg-[#F25C05] text-white px-6 py-2 rounded-lg">
                    Đăng
                </button>
            </div>

            {/* FORM 3 CỘT */}
            <div className="grid grid-cols-3 gap-6">

                {/* COL 1 */}
                <div className="flex flex-col gap-4">
                    <Field label="Ngày đăng" placeholder="Nhập ngày" />
                    <Field label="Tên sản phẩm" placeholder="Tên sản phẩm" />
                    <Field label="Tình trạng sử dụng" placeholder="VD: Mới 100%, đã sử dụng..." />
                    <Field label="Nguồn" placeholder="Nguồn cung cấp" />
                </div>

                {/* COL 2 */}
                <div className="flex flex-col gap-4">
                    <Field label="Cập nhật cuối" placeholder="Thông tin tự cập nhật" />
                    <Field label="Giá" placeholder="Nhập giá" />
                    <Field label="Mới" placeholder="VD: 90%" />
                    <Field label="Bảo hành" placeholder="Thời gian bảo hành" />
                </div>

                {/* COL 3 */}
                <div className="flex flex-col gap-4">
                    <Field label="Thể loại giá" placeholder="Giá cố định / Giá thương lượng" />
                    <Field label="Số lượng" placeholder="VD: 1" />
                    <Field label="Hỏng" placeholder="VD: 0%" />
                    <Field label="Chính sách đổi trả" placeholder="VD: 7 ngày" />
                </div>
            </div>

            {/* DESCRIPTION */}
            <div className="mt-6">
                <label className="block text-[14px] max-md:text-[12px] text-[#A09CAB] mb-[10px]">
                    Mô tả
                </label>
                <textarea
                    placeholder="Nhập mô tả sản phẩm..."
                    className="w-full rounded-lg px-3 py-2 bg-white focus:ring-[1px] focus:ring-orange-300 font-normal text-[18px] max-md:text-[16px] text-[#441A02] border"
                />
            </div>
        </div>
    );
}

/* ---------------- COMPONENT PHỤ ---------------- */

function Field({ label, placeholder }: { label: string; placeholder: string }) {
    return (
        <div>
            <label className="block text-[14px] max-md:text-[12px] text-[#A09CAB] mb-[10px]">
                {label}
            </label>
            <input
                placeholder={placeholder}
                className="w-full rounded-lg px-3 py-2 bg-white focus:ring-[1px] focus:ring-orange-300 font-normal text-[18px] max-md:text-[16px] text-[#441A02] border placeholder:text-gray-400"
            />
        </div>
    );
}
