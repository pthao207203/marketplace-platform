"use client";

import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { FilterParams } from "./Filter";

interface SalesChartProps {
  filter: FilterParams;
}

export default function SalesChart({ filter }: SalesChartProps) {

  const [salesData, setSalesData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true); 

        const query = new URLSearchParams({
            type: filter.type,
            year: filter.year.toString(),
            ...(filter.month !== undefined && { month: filter.month.toString() }),
            ...(filter.startDate && { startDate: filter.startDate }),
            ...(filter.endDate && { endDate: filter.endDate }),
        }).toString();
        
        const API_URL = `/admin/dashboard/monthly-sales?${query}`;
        
        const res = await fetch(API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include", 
        });

        if (!res.ok) throw new Error("API Error");

        const json = await res.json();
        
        if (json.success) {
          
          const data = json.data?.sales || Array(12).fill(0);
          setSalesData(data);
        }
      } catch (error) {
        console.error("Failed to fetch monthly sales", error);
        setSalesData(Array(12).fill(0));
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
    
  }, [filter]);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "Inter, sans-serif",
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        borderRadiusApplication: "end", 
        columnWidth: "60%", 
      },
    },
    colors: ["#FBBF24"], 
    dataLabels: { enabled: false },
    grid: {
      show: true,
      strokeDashArray: 4, 
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
      padding: { top: 0, right: 0, bottom: 0, left: 10 },
    },
    xaxis: {
      categories: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: "#9CA3AF", fontSize: "12px", fontWeight: 500 },
      },
    },
    yaxis: {
      show: true,
      labels: {
        style: { colors: "#9CA3AF", fontSize: "12px", fontWeight: 500 },
        formatter: (val) => val.toFixed(0), 
        offsetX: -10,
      },
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val) => `${val} Triệu VND`, 
      },
    },
  };

  const series = [
    {
      name: "Doanh thu",
      data: salesData,
    },
  ];

  if (loading) {
    return (
      <div className="w-auto h-full flex items-center justify-center bg-white rounded-xl border border-gray-200 min-h-[350px] animate-pulse">
        <span className="text-gray-400 font-medium">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="w-auto h-full flex flex-col bg-white rounded-xl px-[20px] py-[20px] border border-gray-200 shadow-sm">
      <div className="mb-6">
        <h3 className="text-[18px] max-md:text-[16px] font-bold text-[#441A02]">
          Biểu đồ thống kê doanh thu
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Đơn vị tính: Triệu VNĐ
        </p>
      </div>

      <div className="h-[300px] w-full">
        <Chart options={options} series={series} type="bar" height="100%" />
      </div>
    </div>
  );
}
