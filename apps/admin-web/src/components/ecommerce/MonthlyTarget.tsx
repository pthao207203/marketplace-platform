import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import useCountUp from "../../hooks/useCountUp"; // Điều chỉnh đường dẫn nếu cần

export default function CustomerToShopChart() {
  // Dùng hook đếm số - giữ nguyên giá trị cuối
  const customerBefore = useCountUp(250000);
  const shopBefore = useCountUp(250000);
  const customerNow = useCountUp(250000);
  const shopNow = useCountUp(280000);

  // Format số có dấu chấm phẩy (giống VN)
  const f = (num: number) => num.toLocaleString("vi-VN");

  const seriesBefore = [85];
  const seriesNow = [78];

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
  };

  const optionsBefore: ApexOptions = {
    ...baseOptions,
    colors: ["#F97316", "#FBBF24"],
    series: seriesBefore,
    labels: ["Customer", "Shop"],
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
    ...baseOptions,
    colors: ["#F97316", "#FBBF24"],
    series: seriesNow,
    labels: ["Customer", "Shop"],
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

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-[#FBCCB2] to-white from-0% via-5% to-40% border border-gray-200 px-[30px] py-[20px]">
      <h3 className="text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
        Biểu đồ thống kê số lượng người dùng trở thành shop
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="text-center">
          <Chart options={optionsBefore} series={seriesBefore} type="radialBar" height={220} />
        </div>
        <div className="text-center">
          <Chart options={optionsNow} series={seriesNow} type="radialBar" height={220} />
        </div>
      </div>

      <div className="flex justify-center gap-8 mt-[30px]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500"></div>
          <span className="text-sm text-gray-700">Customer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
          <span className="text-sm text-gray-700">Shop</span>
        </div>
      </div>

      {/* Chỉ thay 4 dòng số này */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[5px] mt-[32px] text-center">
        <div>
          <div className="bg-[#EFF1F5] text-[14px] max-md:text-[12px] text-[#441A02]">Customer Before</div>
          <div className="text-[22px] max-md:text-[20px] font-bold text-[#441A02]">{f(customerBefore)}</div>
        </div>
        <div>
          <div className="bg-[#EFF1F5] text-[14px] max-md:text-[12px] text-[#441A02]">Shop Before</div>
          <div className="text-[22px] max-md:text-[20px] font-bold text-[#441A02]">{f(shopBefore)}</div>
        </div>
        <div>
          <div className="bg-[#EFF1F5] text-[14px] max-md:text-[12px] text-[#441A02]">Customer Now</div>
          <div className="text-[22px] max-md:text-[20px] font-bold text-[#441A02]">{f(customerNow)}</div>
        </div>
        <div>
          <div className="bg-[#EFF1F5] text-[14px] max-md:text-[12px] text-[#441A02]">Shop Now</div>
          <div className="text-[22px] max-md:text-[20px] font-bold text-[#441A02]">{f(shopNow)}</div>
        </div>
      </div>
    </div>
  );
}