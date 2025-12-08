import ShopList from "../../components/users/ShopList";
import { Outlet } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
export default function Shops() {
 return (
    <>
      <PageMeta
        title="React.js Order list Order | TailAdmin - React.js Admin Order Template"
        description="This is React.js Order list Order page for TailAdmin - React.js Tailwind CSS Admin Order Template"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 p-0">
          <Outlet />
        </div>
      </div>
    </>
  );
}