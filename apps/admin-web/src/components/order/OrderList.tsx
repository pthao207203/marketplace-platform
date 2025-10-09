import { useState } from "react";
import OrderTable from "./OrderTable"; 
import { sampleOrders } from "./sampleData"; 

type OrderStatus = "All" | "Pending" | "Processing" | "Cancelled" | "Delivering" | "Delivered" | "Returned" | "Complaints";

export default function OrderList() {

  const [currentStatus, setCurrentStatus] = useState<OrderStatus>("All");

  const statusFilters: { status: OrderStatus; label: string; count: number }[] = [
    { status: "All", label: "All", count: sampleOrders.length },
    { status: "Pending", label: "Pending", count: sampleOrders.filter(o => o.Status === "Pending").length },
    { status: "Processing", label: "Processing", count: sampleOrders.filter(o => o.Status === "Processing").length },
    { status: "Cancelled", label: "Cancelled", count: sampleOrders.filter(o => o.Status === "Processing").length },
    { status: "Delivering", label: "Delivering", count: sampleOrders.filter(o => o.Status === "Delivering").length },
    { status: "Delivered", label: "Delivered", count: sampleOrders.filter(o => o.Status === "Delivered").length },
    { status: "Returned", label: "Returned", count: sampleOrders.filter(o => o.Status === "Returned").length },
    { status: "Complaints", label: "Complaints", count: sampleOrders.filter(o => o.Status === "Complaints").length },
  ];

  const filteredOrders = currentStatus === "All"
    ? sampleOrders
    : sampleOrders.filter(order => order.Status === currentStatus);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray/90 mb-4">
          List of order
        </h3>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-300 dark:border-gray-700">
          {statusFilters.map((filter) => (
            <button
              key={filter.status}
              onClick={() => setCurrentStatus(filter.status)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                currentStatus === filter.status
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-gray-700 hover:border-orange-700 dark:text-gray-700 dark:hover:border-orange-500"
              }`}
            >
              {filter.label} ({filter.count})
            </button> 
          ))}
        </div>

        <OrderTable orders={filteredOrders} />
      </div>
    </div>
  );
}