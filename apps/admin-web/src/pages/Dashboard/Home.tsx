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
        title="React.js Ecommerce Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="w-full h-full py-[20px] px-[30px] bg-white/60">
        <div className="w-full">
            <div className="mb-[20px]">
              <Filter />
            </div>

          </div>

        <div className="flex flex-col gap-[10px] md:flex-row w-full h-full">
          {/* Cột trái */}
          <div className="w-auto md:w-[35%] sm:w-[100%]">
            <div className="mb-[10px]">
              <EcommerceMetrics />
            </div>
            <Task />
          </div>

          {/* Cột phải */}
          <div className="w-full h-full">
            <MonthlyTarget />

            <div className="flex flex-col md:flex-row gap-[10px] mt-[10px] min-h-full">

              {/* Biểu đồ thống kê đơn hàng */}
              <div className="w-auto h-auto">
                <OrderStatisticsChart />
              </div>

              {/* Sales chart */}
              <div className="w-full h-auto">
                <SalesChart />
              </div>

            </div>
          </div>

        </div>
      </div>

    </>
  );
}
