import {
  ArrowDownIcon,
  ArrowUpIcon,
  Users,
  Credit_Card_01,
  Data,
  File_Document,  
} from "../../icons";
import Badge from "../ui/badge/Badge";
import useCountUp from "../../hooks/useCountUp"; // Đường dẫn tới hook của bạn

export default function EcommerceMetrics() {
  // Dùng hook để tạo hiệu ứng đếm
  const totalRevenue = useCountUp(389526, 1400);
  const totalProducts = useCountUp(1024);
  const totalUsers = useCountUp(5359);
  const totalOrders = useCountUp(1024);

  // Format số có dấu chấm ngăn cách (ví dụ: 389,526)
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="flex flex-col gap-[10px] w-full min-w-[200px]">
      {/* Card 1 - Tổng tiền */}
      <div className="rounded-[16px] bg-[#F25C05] p-[15px] flex flex-col justify-between">
        <div className="flex items-center mb-[30px]">
          <Credit_Card_01 className="text-white mr-2 w-6 h-6" />
          <span className="text-[18px] max-md:text-[16px] font-bold text-white">
            Tổng tiền
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-[14px] max-md:text-[12px] font-normal text-white/90">
              +20,000
            </h3>
            <h4 className="text-[22px] max-md:text-[20px] font-bold text-white mt-[5px] tabular-nums">
              {formatNumber(totalRevenue)}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon className="w-4 h-4" />
            11.01%
          </Badge>
        </div>
      </div>

      {/* Card 2 - Sản phẩm */}
      <div className="rounded-[16px] bg-white border border-gray-200 p-[15px] flex flex-col justify-between">
        <div className="flex items-center mb-4">
          <Data className="text-[#441A02] mr-2 w-6 h-6" />
          <span className="text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
            Sản Phẩm
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-[14px] max-md:text-[12px] font-normal text-[#441A02]/80">
              +120
            </h3>
            <h4 className="text-[22px] max-md:text-[20px] font-bold text-[#441A02] mt-[5px] tabular-nums">
              {formatNumber(totalProducts)}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon className="w-4 h-4" />
            3.75%
          </Badge>
        </div>
      </div>

      {/* Card 3 - Người dùng */}
      <div className="rounded-[16px] bg-white border border-gray-200 p-[15px] flex flex-col justify-between">
        <div className="flex items-center mb-4">
          <Users className="text-[#441A02] mr-2 w-6 h-6" />
          <span className="text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
            Người dùng
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-[14px] max-md:text-[12px] font-normal text-red-600">
              +500
            </h3>
            <h4 className="text-[22px] max-md:text-[20px] font-bold text-[#441A02] mt-[5px] tabular-nums">
              {formatNumber(totalUsers)}
            </h4>
          </div>
          <Badge color="error">
            <ArrowDownIcon className="w-4 h-4" />
            9.05%
          </Badge>
        </div>
      </div>

      {/* Card 4 - Đơn hàng */}
      <div className="rounded-[16px] bg-white border border-gray-200 p-[15px] flex flex-col justify-between">
        <div className="flex items-center mb-4">
          <File_Document className="text-[#441A02] mr-2 w-6 h-6" />
          <span className="text-[18px] max-md:text-[16px] font-normal text-[#441A02]">
            Đơn hàng
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-[14px] max-md:text-[12px] font-normal text-[#441A02]/80">
              +120
            </h3>
            <h4 className="text-[22px] max-md:text-[20px] font-bold text-[#441A02] mt-[5px] tabular-nums">
              {formatNumber(totalOrders)}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon className="w-4 h-4" />
            3.75%
          </Badge>
        </div>
      </div>
    </div>
  );
}