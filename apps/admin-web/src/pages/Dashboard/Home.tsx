import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import SalesChart from "../../components/ecommerce/SalesChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import PageMeta from "../../components/common/PageMeta";
import Task from "../../components/ecommerce/Task";
import OrderStatisticsChart from "../../components/ecommerce/OrderStatisticsChart";
import Filter from "../../components/ecommerce/Filter";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Dashboard | SecondChance Admin"
        description="Trang quản trị tổng quan cho hệ thống SecondChance"
      />
      
      {/* Container chính */}
      <div className="w-full min-h-screen py-6 px-4 md:px-6 xl:px-9 bg-gray-50/50">
        
        {/* Phần Filter & Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Filter />
        </div>

        {/* Grid Layout chính: Chia 12 cột */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-12 2xl:gap-7.5">
          
          {/* CỘT TRÁI (Chiếm 12/12 trên mobile, 4/12 trên màn hình lớn) */}
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-4 md:gap-6">
            {/* 1. Các chỉ số thống kê (Metrics) nằm trên cùng */}
            <div className="w-full">
               <EcommerceMetrics />
            </div>

            {/* 2. Danh sách công việc (Task) nằm dưới */}
            <div className="w-full">
               <Task />
            </div>
          </div>

          {/* CỘT PHẢI (Chiếm 12/12 trên mobile, 8/12 trên màn hình lớn) */}
          <div className="col-span-12 xl:col-span-8 flex flex-col gap-4 md:gap-6">
            {/* 1. Mục tiêu tháng */}
            <MonthlyTarget />

            {/* 2. Hàng chứa 2 biểu đồ con */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Biểu đồ thống kê đơn hàng */}
              <div className="w-full">
                <OrderStatisticsChart />
              </div>

              {/* Sales chart */}
              <div className="w-full">
                <SalesChart />
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
