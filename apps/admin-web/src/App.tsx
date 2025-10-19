import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layouts/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ListOfOrder from "./pages/Orders/ListOfOrder";
import DetailOfOrder from "./pages/Orders/DetailOfOrder"
import Language from "./pages/Language/Languages"

import { LanguageProvider } from "./i18n/language";

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />
          </Route>

          {/* OrderList Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/listoforder" element={<ListOfOrder />} />
          </Route>
          
          {/* OrderDetail Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/detailoforder/:orderId" element={<DetailOfOrder />} />
          </Route>  

          {/*Language Layout*/}
          <Route element={<AppLayout />}>
            <Route index path="/language" element={<Language />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}
