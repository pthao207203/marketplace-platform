import { useEffect, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Users,
  Credit_Card_01,
  Data,
  File_Document,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import useCountUp from "../../hooks/useCountUp";
import { FilterParams } from "./Filter"; 

const ICON_MAPPING: Record<string, React.ElementType> = {
  revenue: Credit_Card_01,
  products: Data,
  users: Users,
  orders: File_Document,
};

interface MetricItemProps {
  title: string;
  icon: React.ElementType;
  value: number;
  increment: number;
  percentage: number;
  trend: "up" | "down";
  isPrimary?: boolean;
}

interface ApiMetricItem {
  key: string;
  title: string;
  value: number;
  increment: number;
  percentage: number;
  trend: "up" | "down";
  isPrimary?: boolean;
}

interface EcommerceMetricsProps {
  filter: FilterParams;
}

const MetricCard = ({ data }: { data: MetricItemProps }) => {
  const { title, icon: Icon, value, increment, percentage, trend, isPrimary } = data;
  const animatedValue = useCountUp(value, 1400);
  const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const cardBg = isPrimary ? "bg-[#F25C05]" : "bg-white border border-gray-200";
  const titleColor = isPrimary ? "text-white" : "text-[#441A02]";
  const subTextColor = isPrimary ? "text-white/90" : "text-[#441A02]/80";
  const valueColor = isPrimary ? "text-white" : "text-[#441A02]";
  const iconColor = isPrimary ? "text-white" : "text-[#441A02]";

  return (
    <div className={`rounded-[16px] p-[15px] flex flex-col justify-between ${cardBg}`}>
      <div className="flex items-center mb-4">
        <Icon className={`${iconColor} mr-2 w-6 h-6`} />
        <span className={`text-[18px] max-md:text-[16px] font-bold ${titleColor}`}>{title}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <h3 className={`text-[14px] max-md:text-[12px] font-normal ${subTextColor}`}>
            {increment > 0 ? "+" : ""}{formatNumber(increment)}
          </h3>
          <h4 className={`text-[22px] max-md:text-[20px] font-bold mt-[5px] tabular-nums ${valueColor}`}>
            {formatNumber(animatedValue)}
          </h4>
        </div>
        <Badge color={trend === "up" ? "success" : "error"}>
          {trend === "up" ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
          {percentage}%
        </Badge>
      </div>
    </div>
  );
};

export default function EcommerceMetrics({ filter }: EcommerceMetricsProps) {
  const [metrics, setMetrics] = useState<MetricItemProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true); 

        const query = new URLSearchParams({
            type: filter.type,
            year: filter.year.toString(),
            ...(filter.month !== undefined && { month: filter.month.toString() }),
            ...(filter.startDate && { startDate: filter.startDate }),
            ...(filter.endDate && { endDate: filter.endDate }),
        }).toString();

        const API_URL = `/admin/dashboard/metrics?${query}`;
        console.log("[EcommerceMetrics] Gọi API:", API_URL);
        
        const response = await fetch(API_URL, {
          method: "GET",
          credentials: "include", 
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Lỗi HTTP: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();

        if (json.success) {
          if (!json.data || json.data.length === 0) {
            console.warn("[EcommerceMetrics] API trả về mảng rỗng");
          }
          
          const mappedData: MetricItemProps[] = json.data.map((item: ApiMetricItem) => ({
            ...item,
            icon: ICON_MAPPING[item.key] || Data,
          }));
          setMetrics(mappedData);
        } else {
          setErrorMsg(json.message || "API trả về lỗi không xác định");
        }
      } catch (error: any) {
        console.error("[EcommerceMetrics] Fetch Error:", error);
        setErrorMsg(error.message || "Lỗi kết nối Server");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  
  }, [filter]); 

  if (loading) {
    return (
      <div className="flex flex-col gap-[10px] w-full min-w-[200px]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[120px] rounded-[16px] bg-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
        <strong>Có lỗi xảy ra:</strong> {errorMsg}
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-sm">
        Chưa có dữ liệu thống kê. (Data is empty)
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[10px] w-full min-w-[200px]">
      {metrics.map((item, index) => (
        <MetricCard key={index} data={item} />
      ))}
    </div>
  );
}
