import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

export default function MonthlySalesChart() {
  const options: ApexOptions = {
    chart: {
      type: "bar",

      toolbar: { show: false },
      fontFamily: "Inter, system-ui, sans-serif",
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        borderRadiusApplication: "end",
        columnWidth: "58%",
        colors: {
          ranges: [{ from: 0, to: 1000, color: "#FFB703" }], // không cần vì dùng gradient
        },
      },
    },
    colors: ["#FFB703"], // màu cột
    dataLabels: { enabled: false },
    grid: { show: false },
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: "#6B7280", fontSize: "14px", fontWeight: "normal" },
      },
    },
    yaxis: {
      show: false, // ẩn trục Y hoàn toàn
    },
    tooltip: { enabled: false },
    states: {
      hover: { filter: { type: "none" } },
      active: { filter: { type: "none" } },
    },

    // ──────────────────────────────
    // Đây là phần QUAN TRỌNG: thêm đường line + chấm + số trên đầu
    // ──────────────────────────────
    stroke: {
      show: true,
      curve: "smooth",
      lineCap: "round",
      colors: ["#F97316"],
      width: 2,
    },
    markers: {
      size: 2,
      colors: ["#F97316"],
      hover: { size: 2 },
    },
    annotations: {
      points: [
        { x: "Jan", y: 30, marker: { size: 0 } },
        { x: "Feb", y: 50, marker: { size: 0 } },
        { x: "Mar", y: 90, marker: { size: 0 } },
        { x: "Apr", y: 100, marker: { size: 0 } },
        { x: "May", y: 150, marker: { size: 0 } },
        { x: "Jun", y: 170, marker: { size: 0 } },
        { x: "Jul", y: 200, marker: { size: 0 } },
        { x: "Aug", y: 150, marker: { size: 0 } },
        { x: "Sep", y: 125, marker: { size: 0 } },
        { x: "Oct", y: 145, marker: { size: 0 } },
        { x: "Nov", y: 160, marker: { size: 0 } },
        { x: "Dec", y: 165, marker: { size: 0 } },
      ].map((item) => ({
        x: item.x,
        y: item.y,
        marker: { size: 0 },
        label: {
          borderColor: "transparent",
          offsetY: -10,
          style: { background: "transparent", color: "#F97316", fontSize: "14px", fontWeight: "noraml" },
          text: item.y.toString(),
        },
      })),
    },
  };

  const series = [
    {
      name: "Doanh thu",
      type: "column",
      data: [30, 50, 90, 100, 150, 170, 200, 150, 125, 145, 160, 165],
    },
    {
      name: "Trend",
      type: "line",
      data: [30, 50, 90, 100, 150, 170, 200, 150, 125, 145, 160, 165],
      legend: {
        show: true,
        markers: {
          fillColors: ["#FFB703", "#F97316"] // cột vàng + line cam
        }
      }
    },
  ];

  return (
    <div className="w-auto h-full flex flex-col bg-white rounded-xl px-[30px] py-[20px] border border-gray-200">
      <h3 className="text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
        Biểu đồ thống kê doanh thu (trăm triệu VND)
      </h3>

      <div className="mt-[30px] h-auto">
        <Chart options={options} series={series} type="line" />
      </div>

      <h3 className="mt-[30px] text-[14px] max-md:text-[12px]  text-[#441A02]">
        Doanh thu tăng nhanh vào đầu năm, từ tháng 1 đến tháng 7. Sau đó tụt
        dốc khoảng 2 tháng và tiếp tục tăng đều.
      </h3>
    </div>
  );
}