import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.tsx";
import Dashboard from "./pages/Dashboard.js";
import Products from "./pages/Products.js";
import ProductDetail from "./pages/ProductDetail.js";
import Login from "./pages/Login.js";
import NotFound from "./pages/NotFound.js";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
