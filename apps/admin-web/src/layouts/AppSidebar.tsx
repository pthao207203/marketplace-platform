// AppSidebar.tsx (thay thế toàn bộ)
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  SettingIcon,
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";

interface SubItem {
  name: string;
  path: string;
}
interface NavItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
}

const navItems: NavItem[] = [
  { icon: <GridIcon />, name: "Dashboard", path: "/" },
  {
    icon: <UserCircleIcon />,
    name: "Người dùng",
    subItems: [
      { name: "Khách hàng", path: "/user/customers" },
      { name: "Người bán", path: "/user/shops" },
      { name: "Quản trị viên", path: "/user/admins" },
    ],
  },
  {
    name: "Sản phẩm",
    icon: <BoxCubeIcon />,
    subItems: [
      { name: "Cố định", path: "/product/fixed" },
      { name: "Thương lượng", path: "/product/negotiation" },
      { name: "Đấu giá", path: "/product/auction" },
    ],
  },
  { name: "Đơn hàng", icon: <ListIcon />, path: "/listoforder" },
  { name: "Cài đặt", icon: <SettingIcon />, path: "/settings" },
];

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { pathname } = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});

  // Robust isActive: handle root "/" specially and allow prefix matches for subpaths
  const isActive = useCallback(
    (path: string) => {
      if (!path) return false;
      if (path === "/") return pathname === "/";
      // pathname does not include query string; handles trailing slash and nested paths
      return pathname === path || pathname.startsWith(path + "/");
    },
    [pathname]
  );
  console.log("Current pathname:", pathname);

  // Auto open submenu when any subItem matches current path
  useEffect(() => {
    const matchedIndex = navItems.findIndex(
      (item) => item.subItems?.some((sub) => isActive(sub.path))
    );
    setOpenSubmenu(matchedIndex === -1 ? null : matchedIndex);
  }, [pathname, isActive]);

  // Update heights for all submenu refs (so transition to correct heights)
  useEffect(() => {
    const newHeights: Record<string, number> = {};
    Object.keys(subMenuRefs.current).forEach((key) => {
      const el = subMenuRefs.current[key];
      if (el) newHeights[key] = el.scrollHeight;
    });
    setSubMenuHeight(newHeights);
  }, [isExpanded, isHovered, isMobileOpen, openSubmenu, pathname]);

  // Toggle submenu by index
  const toggleMenu = (index: number) => {
    setOpenSubmenu((prev) => (prev === index ? null : index));
  };

  // Debug helper — remove or comment out in production
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("Sidebar debug:", { pathname, openSubmenu, isExpanded, isHovered, isMobileOpen });
  }, [pathname, openSubmenu, isExpanded, isHovered, isMobileOpen]);

  return (
    <aside
      className={`fixed top-0 left-0 flex flex-col px-5 bg-white h-screen transition-all duration-300 border-r border-gray-200 z-50
        ${isExpanded || isHovered || isMobileOpen ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Sidebar"
    >
      <div className={`pt-1 pb-3 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/" aria-label="Homepage">
          {(isExpanded || isHovered || isMobileOpen) ? (
            <img src="/images/logo/logo3.svg" alt="Logo" width={150} />
          ) : (
            <img src="/images/logo/logo.svg" alt="Logo" width={40} />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto no-scrollbar">
        <nav className="mb-4">
          <h2
            className={`mb-4 text-[18px] max-md:text-[16px] font-normal uppercase flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}
              ${openSubmenu !== null ? "text-[#441A02]" : "text-gray-400"}`}
          >
            {(isExpanded || isHovered || isMobileOpen) ? "Menu" : <HorizontaLDots className="size-6" />}
          </h2>

          <ul className="flex flex-col gap-4">
            {navItems.map((nav, index) => {
              const hasSub = !!nav.subItems?.length;
              const active = nav.path ? isActive(nav.path) : false;
              const key = `main-${index}`;
              const isOpen = openSubmenu === index;

              return (
                <li key={nav.name}>
                  {hasSub ? (
                    <div>
                      <button
                        onClick={() => toggleMenu(index)}
                        className={`menu-item w-full text-left cursor-pointer text-[18px] max-md:text-[16px] font-normal text-[#441A02]
                          ${isOpen ? "bg-[#FEEFE6]" : "bg-white hover:bg-white"}
                          ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}
                        `}
                        aria-expanded={isOpen}
                        aria-controls={key}
                      >
                        <span className={`menu-item-icon-size text-[18px] max-md:text-[16px] font-normal ${isOpen ? "text-orange-500" : "text-[#441A02]"}`}>
                          {nav.icon}
                        </span>
                        {(isExpanded || isHovered || isMobileOpen) && (
                          <span className={`menu-item-text text-[18px] max-md:text-[16px] font-normal  ${isOpen ? "text-orange-500" : ""}`}>
                            {nav.name}
                          </span>
                        )}
                        {(isExpanded || isHovered || isMobileOpen) && (
                          <ChevronDownIcon
                            className={`ml-auto w-5 h-5 transition-transform ${isOpen ? "rotate-180 text-orange-500" : "text-[#441A02]"}`}
                          />
                        )}
                      </button>

                      {/* Submenu container: always in DOM to ensure Links exist; show/hide via height */}
                      <div
                        id={key}
                        ref={(el: HTMLDivElement | null) => { subMenuRefs.current[key] = el; }}
                        className="overflow-hidden transition-all duration-300"
                        style={{
                          height:
                            isOpen && (isExpanded || isHovered || isMobileOpen)
                              ? `${subMenuHeight[key] ?? 0}px`
                              : "0px",
                        }}
                      >
                        <ul className="mt-2 space-y-1 ml-9">
                          {nav.subItems!.map((sub) => {
                            const activeSub = isActive(sub.path);
                            return (
                              <li key={sub.name}>
                                <Link
                                  to={sub.path}
                                  className={`menu-dropdown-item px-2 py-1 rounded-md block text-[18px] max-md:text-[16px] font-normal ${activeSub
                                      ? "bg-blue-100 text-[#441A02]"
                                      : "text-[#441A02] hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                                >
                                  {sub.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <Link
                      to={nav.path!}
                      className={`menu-item text-[18px] max-md:text-[16px] font-normal ${active ? "bg-[#FEEFE6]" : "bg-white hover:bg-white"}`}
                    >
                      <span className={`menu-item-icon-size ${active ? "text-orange-500" : "text-[#441A02]"}`}>
                        {nav.icon}
                      </span>
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <span className={`menu-item-text ${active ? "text-orange-500" : "text-[#441A02]"}`}>
                          {nav.name}
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
