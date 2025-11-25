"use client";

import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

export default function OrderStatisticsChart() {
    /** -----------------------------
     * Biểu đồ đơn hàng thành công
     * ----------------------------- */
    const successOptions: ApexOptions = {
        chart: { type: "donut" },
        labels: ["Thành công", "Thất bại"],
        colors: ["#F25C05", "#FBCCB2"],
        legend: { position: "bottom" },
        dataLabels: { enabled: false },
        plotOptions: {
            pie: {
                donut: {
                    size: "60%",
                    labels: {
                        show: false,
                        total: {
                            show: false,
                            label: "Thành công",
                            formatter: () => "350",
                        },
                    },
                },
            },
        },
    };

    const successSeries = [350, 50];

    /** -----------------------------
     * Biểu đồ đơn hàng thất bại
     * ----------------------------- */
    const failedOptions: ApexOptions = {
        chart: { type: "donut" },
        labels: ["Hoàn trả", "Đã hủy", "Khác"],
        colors: ["#2571BC", "#F25C05", "#FFB703"],
        legend: { position: "bottom" },
        dataLabels: { enabled: false },
        plotOptions: {
            pie: {
                donut: {
                    size: "60%",
                    labels: {
                        show: false,
                        total: {
                            show: false,
                            label: "Thất bại",
                            formatter: () => "240",
                        },
                    },
                },
            },
        },
    };

    const failedSeries = [120, 80, 40];

    return (
        <div className="w-auto h-full flex flex-col bg-white rounded-xl px-[30px] py-[20px] border border-gray-200">
            <h3 className="text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
                Biểu đồ thống kê đơn hàng
            </h3>
            {/* Biểu đồ thành công */}
            <div className="flex flex-col justify-start items-start">
                <h3 className="item-start text-[14px] max-md:text-[12px] font-normal mt-[10px] text-[#441A02]">
                    Đơn hàng thành công
                </h3>
                <Chart
                    options={successOptions}
                    series={successSeries}
                    type="donut"
                    width={220}
                />

            </div>

            {/* Biểu đồ thất bại */}
            <div className="flex flex-col justify-start items-start">
                <h3 className="text-[14px] max-md:text-[12px] font-normal mt-[10px] text-[#441A02] ">
                    Đơn hàng không thành công
                </h3>
                <Chart
                    options={failedOptions}
                    series={failedSeries}
                    type="donut"
                    width={230}

                />

            </div>
        </div>
    );
}
