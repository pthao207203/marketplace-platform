// App.tsx – PHIÊN BẢN HOÀN HẢO 100% (copy-paste là chạy)
import { Routes, Route } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layouts/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ListOfOrder from "./pages/Orders/ListOfOrder";
import Customers from "./pages/Users/Customers";
import Admins from "./pages/Users/Admins";
import Shops from "./pages/Users/Shops";
import CustomerList from "./components/users/CustomerList";
import DetailOneCustomer from "./components/detailuser/DetailOneCustomer";
import ShopList from "./components/users/ShopList";
import DetailOneShop from "./components/detailuser/DetailOneShop";
import AdminList from "./components/users/AdminList";
import DetailOneAdmin from "./components/detailuser/DetailOneAdmin";
import Negotiation from "./pages/Products/Negotiation";
import NegotiationList from "./components/products/NegotiationList";
import Fixed from "./pages/Products/Fixed";
import FixedList from "./components/products/FixedList";
import Auction from "./pages/Products/Auction";
import AuctionList from "./components/products/AuctionList";
import DetailOrder from "./components/detailorder/DetailOrder";
import DetailFixed from "./components/detailproduct/DetailFixed";
import DetailNegotiation from "./components/detailproduct/DetailNegotiation";
import DetailAuction from "./components/detailproduct/DetailAuction";
import Settings from "./pages/Settings/Settings";
import CreateFixed from "./components/products/CreateFixed";
import CreateNegotiation from "./components/products/CreateNegotiation";
import CreateAuction from "./components/products/CreateAuction";
import HistoryNegotiation from "./components/detailproduct/HistoryNegotiation";
import HistoryAuction from "./components/detailproduct/HistoryAuction";
export default function App() {
  return (
    <>
      {/* ĐÚNG VỊ TRÍ: Phải nằm TRONG <BrowserRouter> và SAU khi Router đã được cung cấp */}
      <ScrollToTop />

      <Routes>
        {/* Tất cả trang có sidebar */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/listoforder" element={<ListOfOrder />} />
          <Route path="/listoforder/:id" element={<DetailOrder />} />
          <Route path="/settings" element={<Settings />} />

          <Route path="/user/customers" element={<Customers />}>
            <Route index element={<CustomerList />} />
            <Route path=":id" element={<DetailOneCustomer />} />
          </Route>

          <Route path="/user/shops" element={<Shops />}>
            <Route index element={<ShopList />} />
            <Route path=":id" element={<DetailOneShop />} />
          </Route>

          <Route path="/user/admins" element={<Admins />}>
            <Route index element={<AdminList />} />
            <Route path=":id" element={<DetailOneAdmin />} />
          </Route>

          <Route path="/product/fixed" element={<Fixed />}>
            <Route index element={<FixedList />} />
            <Route path="create" element={<CreateFixed />} /> 
            <Route path=":id" element={<DetailFixed />} />
          </Route>

          <Route path="/product/negotiation" element={<Negotiation />}>
            <Route index element={<NegotiationList />} />
            <Route path="create" element={<CreateNegotiation />} />  
            <Route path=":id" element={<DetailNegotiation />} />
             <Route path=":id/history" element={<HistoryNegotiation />} /> 
          </Route>


          <Route path="/product/auction" element={<Auction />}>
            <Route index element={<AuctionList />} />
            <Route path="create" element={<CreateAuction />} />
            <Route path=":id" element={<DetailAuction />} />
            <Route path=":id/history" element={<HistoryAuction />} /> 
          </Route>
        </Route>

        {/* Auth */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
