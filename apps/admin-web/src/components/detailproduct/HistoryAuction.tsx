import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface AuctionItem {
  id: number;
  name: string;
  avatar: string;
  time: string;
  price: number;
  step: number;
  round: number;
}

export default function HistoryAuction() {
  const { id } = useParams<{ id: string }>(); // Lấy :id từ URL
  const [current, setCurrent] = useState<AuctionItem | null>(null);
  const [history, setHistory] = useState<AuctionItem[]>([]);

  useEffect(() => {
    // TODO: thay bằng fetch từ API thực tế
    // Giả lập dữ liệu
    const mockHistory: AuctionItem[] = [
      {
        id: 1,
        name: "Nguyen Van A",
        avatar: "https://i.pravatar.cc/150?img=1",
        time: "10:00 01/12/2025",
        price: 1000000,
        step: 50000,
        round: 1,
      },
      {
        id: 2,
        name: "Tran Thi B",
        avatar: "https://i.pravatar.cc/150?img=2",
        time: "10:05 01/12/2025",
        price: 1050000,
        step: 50000,
        round: 2,
      },
    ];

    setHistory(mockHistory);
    setCurrent(mockHistory[mockHistory.length - 1]);
  }, [id]);

  if (!current) return <div>Đang tải lịch sử...</div>;

  return (
    <div className="w-full min-h-screen bg-white/60 py-[20px] px-[30px]">
      {/* ===== GIÁ HIỆN TẠI ===== */}
      <div className="border border-orange-400 rounded-xl p-4 bg-orange-50">
        <h3 className="font-bold text-[18px] max-md:text-[16px]  text-[#441A02] mb-2">
          Giá hiện tại 
        </h3>

        <div className="flex items-center gap-3 border-orange-300 p-3">
          <img
            src={current.avatar}
            className="w-14 h-14 rounded-full object-cover"
          />

          <div className="flex-1">
            <p className="font-semibold">{current.name}</p>
            <p className="text-[14px] max-md:text-[12px] font-normal text-[#441A02]/80">Trả giá lần {current.round}</p>
          </div>

          <div className="text-right">
            <p className="text-[18px] max-md:text-[16px] text-[#441A02] font-normal">{current.time}</p>
            <p className="text-[22px] max-md:text-[20px] text-[#F25C05] font-bold">
              đ {current.price.toLocaleString("vi-VN")}{" "}
              <span className="text-[18px] max-md:text-[16px] text-[#441A02] font-normal">
                (+{current.step.toLocaleString("vi-VN")})
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ===== LỊCH SỬ ===== */}
      <div className="p-4 space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 pb-3 border-b last:border-none"
          >
            <img
              src={item.avatar}
              className="w-14 h-14 rounded-full object-cover"
            />

            <div className="flex-1">
              <p className="font-semibold">{item.name}</p>
              <p className="text-[14px] max-md:text-[12px] font-normal text-[#441A02]/80">Trả giá lần {item.round}</p>
            </div>

            <div className="text-right">
              <p className="font-normal text-[14px] max-md:text-[12px]  text-[#441A02]">{item.time}</p>
              <p className="font-bold text-[18px] max-md:text-[16px]  text-[#F25C05]">
                đ {item.price.toLocaleString("vi-VN")}{" "}
                <span className="text-[14px] max-md:text-[12px] text-[#441A02] font-normal">
                  (+{item.step.toLocaleString("vi-VN")})
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
