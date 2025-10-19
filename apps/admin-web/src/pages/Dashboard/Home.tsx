import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import SalesChart from "../../components/ecommerce/SalesChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import PageMeta from "../../components/common/PageMeta";
import { useLanguage } from "../../i18n/language"; // 🔹 Thêm import hook

export default function Home() {
  const { t } = useLanguage(); // 🔹 Lấy hàm dịch t()

  return (
    <>
      <PageMeta
        title={t("dashboard.title")}
        description={t("dashboard.welcome")}
      />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <SalesChart />
        </div>
      </div>
    </>
  );
}
