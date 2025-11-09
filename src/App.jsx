import { BrowserRouter, Routes, Route } from "react-router-dom";
import Bills from "./pages/Bills";
import ClaimPage from "./pages/claims";
import AddItemPage from "./pages/AddItemPage";
import DashboardPage from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Bills />} />
        <Route path="/claim" element={<ClaimPage />} />
        <Route path="/add" element={<AddItemPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
