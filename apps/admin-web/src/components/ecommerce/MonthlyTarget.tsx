import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import useCountUp from "../../hooks/useCountUp";
import { FilterParams } from "./Filter";

interface UserStatsData {
  now: { customer: number; shop: number };
  before: { customer: number; shop: number };
}

interface MonthlyTargetProps {
  filter: FilterParams;
}

// 3. Destructure 'filter' từ props
export default function MonthlyTarget({ filter }: MonthlyTargetProps) {
  const [data, setData] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const query = new URLSearchParams({
            type: filter.type,
            year: filter.year.toString(),
            ...(filter.month !== undefined && { month: filter.month.toString() }),
            ...(filter.startDate && { startDate: filter.startDate }),
            ...(filter.endDate && { endDate: filter.endDate }),
        }).toString();
        
        const API_URL = `/admin/dashboard/users-stats?${query}`;

        const res = await fetch(API_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", 
        });

        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }

        const json = await res.json();
        
        if (json.success) {
          setData(json.data);
        } else {
          console.error("API Error:", json.message);
        }
      } catch (error) {
        console.error("Failed to fetch user stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  
  }, [filter]);

  const cBefore = data?.before?.customer || 0;
  const sBefore = data?.before?.shop || 0;
  const cNow = data?.now?.customer || 0;
  const sNow = data?.now?.shop || 0;

  const customerBeforeAnim = useCountUp(cBefore);
  const shopBeforeAnim = useCountUp(sBefore);
  const customerNowAnim = useCountUp(cNow);
  const shopNowAnim = useCountUp(sNow);

  const calcPercent = (shop: number, customer: number) => {
    const total = shop + customer;
    if (total === 0) return 0;
    return Number(((shop / total) * 100).toFixed(1));
  };

  const percentBefore = calcPercent(sBefore, cBefore);
  const percentNow = calcPercent(sNow, cNow);

  const seriesBefore = [percentBefore];
  const seriesNow = [percentNow];

  const f = (num: number) => num.toLocaleString("vi-VN");

  const baseOptions: ApexOptions = {
    chart: {
      type: "radialBar",
      sparkline: { enabled: true },
      height: 200,
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: { background: "#FECACA", strokeWidth: "100%" },
        hollow: { size: "60%" },
        dataLabels: {
          show: true,
          name: { show: false },
          value: {
            offsetY: -5,
            fontSize: "28px",
            fontWeight: "bold",
            color: "#1F2937",
            formatter: (val) => `${val}%`, 
          },
        },
      },
    },
    stroke: { lineCap: "round" },
    tooltip: { enabled: false }, 
  };

  const optionsBefore: ApexOptions = {
    ...baseOptions,
    colors: ["#F97316"], 
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: ["#FBBF24"], 
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
  };

  const optionsNow: ApexOptions = {
    ...optionsBefore, 
  };

  if (loading) {
    return (
      <div className="w-full h-[350px] rounded-2xl bg-gray-50 border border-gray-200 animate-pulse flex items-center justify-center text-gray-400">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-[#FBCCB2] to-white from-0% via-5% to-40% border border-gray-200 px-[30px] py-[20px]">
      <h3 className="text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
        Thống kê tỷ lệ Shop / Người dùng
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Tháng trước</p>
          <Chart options={optionsBefore} series={seriesBefore} type="radialBar" height={220} />
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Hiện tại</p>
          <Chart options={optionsNow} series={seriesNow} type="radialBar" height={220} />
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-[20px]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#FECACA]"></div> {/* Màu track */}
          <span className="text-sm text-gray-700">Customer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500"></div> {/* Màu fill */}
          <span className="text-sm text-gray-700">Shop</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[5px] mt-[32px] text-center">
        <div>
          <div className="bg-[#EFF1F5] text-[14px] max-md:text-[12px] text-[#441A02]">Customer Before</div>
          <div className="text-[22px] max-md:text-[20px] font-bold text-[#441A02]">{f(customerBeforeAnim)}</div>
        </div>
        <div>
          <div className="bg-[#EFF1F5] text-[14px] max-md:text-[12px] text-[#441A02]">Shop Before</div>
          <div className="text-[22px] max-md:text-[20px] font-bold text-[#441A02]">{f(shopBeforeAnim)}</div>
        </div>
        <div>
          <div className="bg-[#EFF1F5] text-[14px] max-md:text-[12px] text-[#441A02]">Customer Now</div>
          <div className="text-[22px] max-md:text-[20px] font-bold text-[#441A02]">{f(customerNowAnim)}</div>
        </div>
        <div>
          <div className="bg-[#EFF1F5] text-[14px] max-md:text-[12px] text-[#441A02]">Shop Now</div>
          <div className="text-[22px] max-md:text-[20px] font-bold text-[#441A02]">{f(shopNowAnim)}</div>
        </div>
      </div>
    </div>
  );
}
