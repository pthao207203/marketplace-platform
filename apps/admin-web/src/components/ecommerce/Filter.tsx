"use client";

import { useState } from "react";

type FilterType = "day" | "month" | "year";

export default function Filter() {
  const [activeTab, setActiveTab] = useState<FilterType>("year");

  // Dữ liệu năm
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i); // 2025 → 2020

  const months = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg">
          {(["day", "month", "year"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-[16px] text-[18px] max-md:text-[16px] font-normal transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#8ECAE6]/30 text-[#441A02]"
                  : "text-[#441A02] hover:text-[#441A02]"
              }`}
            >
              {tab === "day" ? "Ngày" : tab === "month" ? "Tháng" : "Năm"}
            </button>
          ))}
        </div>

        {/* Right side: Filter content */}
        <div className="flex items-center gap-3 text-[18px] max-md:text-[16px]">
          {activeTab === "year" && (
            <div className="flex items-center gap-3">
              <span className="text-[#441A02] font-normal hidden sm:block">Năm</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-200 rounded-[16px] focus:outline-none focus:ring-1 focus:ring-[#F25C05] text-[#441A02] font-normal"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <span className="text-[#441A02] font-normal sm:hidden">
                Năm {selectedYear}
              </span>
            </div>
          )}

          {activeTab === "month" && (
            <div className="flex items-center gap-3">
              <span className="text-[#441A02] font-normal">Tháng</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-4 py-2 border border-gray-200 rounded-[16px] focus:outline-none focus:ring-1 focus:ring-[#F25C05] text-[#441A02] font-normal"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>
                    {month} {selectedYear}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === "day" && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-200 rounded-[16px] text-[18px] max-md:text-[16px] focus:outline-none focus:ring-1 focus:ring-[#F25C05]"
                />
                <span className="text-gray-500">→</span>
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-[18px] max-md:text-[16px] focus:outline-none focus:ring-1 focus:ring-[#F25C05]"
                />
              </div>
              <button className="px-4 py-2 bg-[#F25C05] text-white rounded-lg hover:bg-[#d94d00] transition">
                Xác nhận
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}