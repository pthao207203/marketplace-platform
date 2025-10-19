import { useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import OrderDetail from "../../components/order/OrderDetail";

export default function DetailOfOrder() {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <>
      <PageMeta
        title={`Order Detail - #${orderId}`}
        description={`Chi tiết đơn hàng #${orderId}`}
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6">
          <OrderDetail orderId={orderId} />
        </div>
      </div>
    </>
  );
}
