"use client";

import { useEffect, useState } from "react";

export type FilterType = "day" | "month" | "year";

export interface FilterParams {
  type: FilterType;
  year: number;
  month?: number;      
  startDate?: string;  
  endDate?: string;    
}
interface FilterProps {
  
  onFilterChange: (params: FilterParams) => void;
}

export default function Filter({ onFilterChange }: FilterProps) {
  const [activeTab, setActiveTab] = useState<FilterType>("year");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const months = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (activeTab === "year") {
      onFilterChange({ type: "year", year: selectedYear });
    } else if (activeTab === "month") {
      onFilterChange({ 
        type: "month", 
        year: selectedYear, 
        month: selectedMonth + 1 
      });
    }
    
  }, [activeTab, selectedYear, selectedMonth]);

  const handleDateRangeSubmit = () => {
    if (!startDate || !endDate) {
      alert("Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }

    onFilterChange({
      type: "day",
      year: selectedYear, 
      startDate,
      endDate
    });
  };

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

        <div className="flex items-center gap-3 text-[18px] max-md:text-[16px]">
          {/* TAB NĂM */}
          {activeTab === "year" && (
            <div className="flex items-center gap-3">
              <span className="text-[#441A02] font-normal hidden sm:block">Năm</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-200 rounded-[16px] focus:outline-none focus:ring-1 focus:ring-[#F25C05] text-[#441A02] font-normal"
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}

          {/* TAB THÁNG */}
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
                    {month}
                  </option>
                ))}
              </select>
              {}
              <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-2 py-2 border border-gray-200 rounded-[16px] focus:outline-none focus:ring-1 focus:ring-[#F25C05] text-[#441A02] font-normal"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
              </select>
            </div>
          )}

          {/* TAB NGÀY */}
          {activeTab === "day" && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-[16px] text-[16px] focus:outline-none focus:ring-1 focus:ring-[#F25C05]"
                />
                <span className="text-gray-500">→</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-[16px] text-[16px] focus:outline-none focus:ring-1 focus:ring-[#F25C05]"
                />
              </div>
              <button 
                onClick={handleDateRangeSubmit}
                className="px-4 py-2 bg-[#F25C05] text-white rounded-[16px] hover:bg-[#d94d00] transition whitespace-nowrap"
              >
                Xác nhận
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
