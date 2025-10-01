import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import OrderTable from "../../components/tables/BasicTables/OrderTable";

export default function BasicTables() {
  return (
    <>
      <PageMeta
        title="Orders Table Dashboard | Marketplace Admin"
        description="View and manage marketplace orders"
      />
      <PageBreadcrumb pageTitle="Orders Table" />
      <div className="space-y-6">
        <ComponentCard title="Orders">
          <OrderTable />
        </ComponentCard>
      </div>
    </>
  );
}
