import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { useState } from "react";

export default function MonthlySalesChart() {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }
  function closeDropdown() {
    setIsOpen(false);
  }

  const dataMap = {
    month: {
      categories: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ],
      series: [168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112]
    },
    quarter: {
      categories: ["Quarter1", "Quarter2", "Quarter3", "Quarter4"],
      series: [754, 678, 602, 782]
    },
    year: {
      categories: ["2021", "2022", "2023", "2024", "2025"],
      series: [2800, 3200, 3500, 3700, 4000]
    }
  };

  const options: ApexOptions = {
    colors: ["#f25c05ff"],  
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end"
      }
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 4, colors: ["transparent"] },
    xaxis: { 
      categories: dataMap[period].categories,
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit"
    },
    yaxis: { title: { text: undefined } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: { x: { show: false }, y: { formatter: (val: number) => `${val}` } },
  };

  const series = [{ name: "Sales", data: dataMap[period].series }];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Sales chart
        </h3>

        {/* Dropdown 3 option: Month / Quarter / Year */}
        <div className="flex items-center space-x-2">
          {["month", "quarter", "year"].map((p) => (
            <button
              key={p}
              className={`px-3 py-1 rounded ${
                period === p ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
              style={period === p ? { backgroundColor: "#DA5305" } : undefined}
              onClick={() => setPeriod(p as "month" | "quarter" | "year")}
            >
              {p === "month" ? "MONTH" : p === "quarter" ? "QUARTER" : "YEAR"}
            </button>
          ))}

          {/* Dropdown More */}
          <div className="relative inline-block">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>
            <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-40 p-2">
              <DropdownItem onItemClick={closeDropdown} className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">
                View More
              </DropdownItem>
              <DropdownItem onItemClick={closeDropdown} className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">
                Delete
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}
