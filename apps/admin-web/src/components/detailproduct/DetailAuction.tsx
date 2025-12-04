import { useParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductAuction {
    id: number;
    title: string;
    price: number;
    images: string[];
    created: string;
    updated: string;
    name: string;
    condition: string;
    source: string;
    newPercent: string;
    warranty: string;
    priceType: string;
    quantity: number;
    broken: string;
    returnPolicy: string;
    description: string;
}

// Fake data (sau này thay bằng API)
const dummyAuctionData: ProductAuction[] = [
    {
        id: 1,
        title: "Bộ bàn ghế sang trọng",
        price: 86000000,
        images: ["/demo/table1.jpg", "/demo/table1.jpg", "/demo/table1.jpg"],
        created: "18/06/2025",
        updated: "19/06/2025",
        name: "0333 333 333",
        condition: "Chưa sử dụng",
        source: "Uy tín",
        newPercent: "99%",
        warranty: "3 tháng",
        priceType: "Giá cố định",
        quantity: 1,
        broken: "0%",
        returnPolicy: "7 ngày",
        description: "Đây là sản phẩm mua new từ công ty...",
    },
];

export default function DetailAuction() {
    const { id } = useParams();

    const data = useMemo(() => {
        return dummyAuctionData.find((p) => p.id === Number(id));
    }, [id]);

    if (!data) {
        return (
            <div className="p-6 text-center text-red-500 text-xl">
                Không tìm thấy sản phẩm!
            </div>
        );
    }

    return (
        <div className="w-full h-full py-[20px] px-[30px] bg-white/60">
            {/* HEADER */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-4">

                    {/* ẢNH LỚN */}
                    <img
                        src={data.images[0]}
                        className="max-w-[223px] w-[223px] h-[223px]  rounded-[16px] object-cover border"
                    />

                    {/* THÔNG TIN */}
                    <div className="flex flex-col h-[223px] justify-between">
                        <h2 className="font-bold text-[18px] max-md:text-[16px] text-[#441A02] mb-[20px]">{data.title}</h2>
                        <p className="font-bold text-[22px] max-md:text-[20px] text-[#441A02]">
                            đ {data.price.toLocaleString()}
                        </p>

                        {/* GALLERY */}
                        <div className="flex gap-2 mt-[20px]">
                            {data.images.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    className="w-[100px] h-[100px] rounded-[16px] object-cover border"
                                />
                            ))}

                            {/* NÚT + */}
                            <div className="w-[100px] h-[100px] rounded-[16px] flex items-center justify-center cursor-pointer hover:bg-gray-100">
                                <Plus className="w-6 h-6 text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-[10px]">
                     <Link
                        to={`/product/auction/${id}/history`}
                        className="bg-[#8ECAE6]/30 text-[#441A02] px-6 py-2 rounded-lg border-[1px] border-[#8ECAE6]"
                    >
                        Lịch sử
                    </Link>
                    <button className="bg-[#F25C05] text-white px-6 py-2 rounded-lg">
                        Cập nhật
                    </button>
                </div>
            </div>

            {/* FORM 3 CỘT */}
            <div className="grid grid-cols-3 gap-6  ">

                {/* COL 1 */}
                <div className="flex flex-col gap-4 ">
                    <Field label="Ngày đăng" value={data.created} />
                    <Field label="Tên sản phẩm" value={data.name} />
                    <Field label="Tình trạng sử dụng" value={data.condition} />
                    <Field label="Nguồn" value={data.source} />
                </div>

                {/* COL 2 */}
                <div className="flex flex-col gap-4">
                    <Field label="Cập nhật cuối" value={data.updated} />
                    <Field label="Giá" value={data.price.toLocaleString()} />
                    <Field label="Mới" value={data.newPercent} />
                    <Field label="Bảo hành" value={data.warranty} />
                </div>

                {/* COL 3 */}
                <div className="flex flex-col gap-4">
                    <Field label="Thể loại giá" value={data.priceType} />
                    <Field label="Số lượng" value={String(data.quantity)} />
                    <Field label="Hỏng" value={data.broken} />
                    <Field label="Chính sách đổi trả" value={data.returnPolicy} />
                </div>
            </div>

            {/* DESCRIPTION */}
            <div className="mt-6">
                <label className="block text-[14px] max-md:text-[12px] text-[#A09CAB] mb-[10px]">Mô tả</label>
                <textarea
                    value={data.description}
                    className="w-full rounded-lg px-3 py-2 bg-white focus:ring-[1px] focus:ring-orange-300 font-normal text-[18px] max-md:text-[16px] text-[#441A02]"
                />
            </div>
        </div>
    );
}

/* ---------------- COMPONENT PHỤ ---------------- */

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <label className="block text-[14px] max-md:text-[12px] text-[#A09CAB] mb-[10px]">{label}</label>
            <input
                value={value}
                readOnly
                className="w-full rounded-lg px-3 py-2 bg-white focus:ring-[1px] focus:ring-orange-300 font-normal text-[18px] max-md:text-[16px] text-[#441A02]"
            />
        </div>
    );
}
