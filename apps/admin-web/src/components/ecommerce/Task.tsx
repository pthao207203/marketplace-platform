import {
  Users,
  Chat_Circle_Check,
  File_Document,
  Triangle_Warning,
} from "../../icons";

const tasks = [
  {
    icon: <Users className="w-6 h-6 text-black" />,
    text: "Còn 78 hồ sơ đang chờ duyệt",
  },
  {
    icon: <Chat_Circle_Check className="w-6 h-6 text-black" />,
    text: "Còn 100 tin nhắn chưa rep",
  },
  {
    icon: <File_Document className="w-6 h-6 text-black" />,
    text: "Còn 5 đơn từ chối hoàn hàng",
  },
  {
    icon: <Triangle_Warning className="w-6 h-6 text-black" />,
    text: "Còn 1 đơn khiếu nại",
  },
];

export default function Task() {
  return (
    <div className="space-y-[10px]">
      {tasks.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-[8px] rounded-[40px] bg-gradient-to-r from-[#F4753E] to-white"
        >
          {/* Icon tròn bên trái */}
          <div className="bg-white w-[56px] h-[56px] rounded-full flex items-center justify-center border border-gray-200">
            {item.icon}
          </div>

          {/* Text */}
          <p className="text-[#441A02] font-medium text-[14px] max-md:text-[12px]">
            {item.text}
          </p>
        </div>
      ))}
    </div>
  );
}
