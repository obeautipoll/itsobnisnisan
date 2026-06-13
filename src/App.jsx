import { Navigate, Route, Routes } from "react-router-dom";
import Admin from "./pages/admin/Admin";
import Login from "./pages/admin/Login";
import Home from "./pages/public/Home";
import { getToken } from "./lib/auth";

const AdminRoute = () => {
  const token = getToken();
  return token ? <Admin /> : <Login />;
};

const App = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/admin" element={<AdminRoute />} />
    <Route path="/admin/login" element={<Navigate to="/admin" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
