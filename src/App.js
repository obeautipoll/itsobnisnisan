import { Navigate, Route, Routes } from "react-router-dom";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { getToken } from "./lib/auth";

const RequireAuth = ({ children }) => {
  const token = getToken();
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
};

const App = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/admin/login" element={<Login />} />
    <Route
      path="/admin"
      element={
        <RequireAuth>
          <Admin />
        </RequireAuth>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
