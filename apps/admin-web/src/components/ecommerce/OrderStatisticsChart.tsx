"use client";

import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { FilterParams } from "./Filter";

interface OrderStatsData {
  overviewChart: { series: number[] }; 
  processChart: { series: number[] };  
  failedChart: { series: number[] };   
}

interface OrderStatisticsChartProps {
  filter: FilterParams;
}

export default function OrderStatisticsChart({ filter }: OrderStatisticsChartProps) {
  const [stats, setStats] = useState<OrderStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true); 

        const query = new URLSearchParams({
            type: filter.type,
            year: filter.year.toString(),
            ...(filter.month !== undefined && { month: filter.month.toString() }),
            ...(filter.startDate && { startDate: filter.startDate }),
            ...(filter.endDate && { endDate: filter.endDate }),
        }).toString();
        
        const API_URL = `/admin/dashboard/orders-stats?${query}`;
        
        const res = await fetch(API_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include", 
        });

        if (!res.ok) throw new Error("Network response was not ok");
        
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch order stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  
  }, [filter]);

  const baseChartOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "Satoshi, sans-serif" },
    legend: {
      position: "bottom",
      fontSize: "13px",
      fontFamily: "Satoshi",
      itemMargin: { horizontal: 5, vertical: 5 },
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: { show: false },
        },
      },
    },
    tooltip: { enabled: true },
  };

  const overviewOptions: ApexOptions = {
    ...baseChartOptions,
    labels: ["Thành công", "Đang xử lý", "Thất bại"],
    colors: ["#10B981", "#3C50E0", "#FF5630"], 
  };

  const processOptions: ApexOptions = {
    ...baseChartOptions,
    labels: ["Chờ xác nhận", "Đang giao"],
    colors: ["#FBBF24", "#3C50E0"], 
  };

  const failedOptions: ApexOptions = {
    ...baseChartOptions,
    labels: ["Đã hủy", "Trả hàng/Hoàn tiền"],
    colors: ["#DC2626", "#F97316"], 
  };

  const EmptyChart = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
      <div className="w-32 h-32 rounded-full border-4 border-gray-100 flex items-center justify-center bg-gray-50">
        <span className="text-xs text-center px-2">{label}</span>
      </div>
    </div>
  );

  const renderChartSection = (title: string, options: any, series: number[] | undefined) => {
    const data = series || [0];
    const total = data.reduce((a, b) => a + b, 0);

    return (
      <div className="flex flex-col items-center justify-start h-full w-full">
        <h4 className="mb-4 text-sm font-bold text-gray-600 uppercase tracking-wide">
          {title}
        </h4>
        <div className="relative flex justify-center w-full">
          {total > 0 ? (
            <Chart options={options} series={data} type="donut" width={240} />
          ) : (
            <EmptyChart label="Không có dữ liệu" />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white rounded-xl px-5 py-6 border border-gray-200 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="flex-1 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl px-5 py-6 border border-gray-200 shadow-sm">
      <h3 className="mb-6 text-lg font-bold text-gray-800">
        Thống kê trạng thái đơn hàng
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        
        {/* 1. TỔNG QUAN */}
        <div className="col-span-1 md:col-span-2 flex justify-center border-b border-gray-100 pb-6">
          {renderChartSection("Tổng quan", overviewOptions, stats?.overviewChart.series)}
        </div>

        {/* 2. ĐANG XỬ LÝ */}
        <div className="col-span-1 flex justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0">
          {renderChartSection("Đang xử lý", processOptions, stats?.processChart.series)}
        </div>

        {/* 3. THẤT BẠI */}
        <div className="col-span-1 flex justify-center pt-2 md:pt-0">
          {renderChartSection("Đơn lỗi / Hủy", failedOptions, stats?.failedChart.series)}
        </div>

      </div>
    </div>
  );
}
