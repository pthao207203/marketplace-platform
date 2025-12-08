"use client"; // Quan trọng: Thêm dòng này vì chúng ta dùng useState

import { useState } from "react";

import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import SalesChart from "../../components/ecommerce/SalesChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import PageMeta from "../../components/common/PageMeta";
import Task from "../../components/ecommerce/Task";
import OrderStatisticsChart from "../../components/ecommerce/OrderStatisticsChart";

import Filter, { FilterParams } from "../../components/ecommerce/Filter";

export default function Home() {
  
  const [filterParams, setFilterParams] = useState<FilterParams>({
    type: "year",
    year: new Date().getFullYear(),
  });

  const handleFilterChange = (newParams: FilterParams) => {
    console.log("Dashboard nhận được filter mới:", newParams);
    setFilterParams(newParams);
  };

  return (
    <>
      <PageMeta
        title="Dashboard | SecondChance Admin"
        description="Trang quản trị tổng quan cho hệ thống SecondChance"
      />
      
      <div className="w-full min-h-screen py-6 px-4 md:px-6 xl:px-9 bg-gray-50/50">
        
        {/* Phần Filter & Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* 3. Truyền hàm handle xuống Filter */}
          <Filter onFilterChange={handleFilterChange} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-12 2xl:gap-7.5">
          
          {/* CỘT TRÁI */}
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-4 md:gap-6">
            <div className="w-full">
               {/* 4. Truyền filterParams xuống các con */}
               <EcommerceMetrics filter={filterParams} />
            </div>

            <div className="w-full">
               {}
               <Task />
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div className="col-span-12 xl:col-span-8 flex flex-col gap-4 md:gap-6">
            
            {/* Mục tiêu tháng */}
            <MonthlyTarget filter={filterParams} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="w-full">
                {/* Biểu đồ tròn đơn hàng */}
                <OrderStatisticsChart filter={filterParams} />
              </div>

              <div className="w-full">
                {/* Biểu đồ cột doanh thu */}
                <SalesChart filter={filterParams} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
