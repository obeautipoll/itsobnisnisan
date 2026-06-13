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
    <Route path="/adminonlyme" element={<AdminRoute />} />
    <Route path="/admin" element={<Navigate to="/" replace />} />
    <Route path="/admin/login" element={<Navigate to="/adminonlyme" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
