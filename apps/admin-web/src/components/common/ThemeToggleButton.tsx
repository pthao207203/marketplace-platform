import { useTheme } from "../../context/ThemeContext";

export const ThemeToggleButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();


  return (
    <button
      onClick={toggleTheme}
      className={`relative flex items-center justify-center transition-colors border rounded-full h-11 w-11
        ${theme === "light"
          ? "bg-gray-900 text-white border-gray-800 hover:bg-gray-700"  // khi sáng → nút tối
          : "bg-yellow-400 text-white border-yellow-500 hover:bg-yellow-300" // khi tối → nút vàng
        }`}
    >
      {theme === "light" ? (
        
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.293 13.293a8 8 0 11-10.586-10.586 8 8 0 0010.586 10.586z" />
        </svg>
      ) : (
  
        <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M10 15a5 5 0 100-10 5 5 0 000 10zm0 3v2m0-18v2m8 8h2M0 10h2m15.364 6.364l1.414 1.414M2.222 2.222l1.414 1.414M15.364 3.636l1.414-1.414M2.222 17.778l1.414-1.414" />
  </svg>
      )}
    </button>
  );
};
