import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../lib/api";
import { setToken } from "../../lib/auth";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(username, password);
      setToken(data.token);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <form
          className="w-full rounded-3xl bg-white p-8 shadow-soft"
          onSubmit={handleSubmit}
        >
          <h1 className="text-2xl font-bold text-navy">CMS Login</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in with your Supabase account to edit portfolio content.
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Email
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Password
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          {error && (
            <p className="mt-4 text-sm font-semibold text-red-500">{error}</p>
          )}
          <button
            className="mt-6 w-full rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-navy/90"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
