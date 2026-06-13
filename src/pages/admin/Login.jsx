import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { canCreateAdminAccount, createAdminAccount, login } from "../../lib/api";
import { setToken } from "../../lib/auth";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const signupEnabled = canCreateAdminAccount();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const data = await login(email, password);
      setToken(data.token);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      await createAdminAccount(email, password);
      setNotice(
        "Account created. If email confirmation is enabled in Supabase, confirm the user first, then sign in."
      );
    } catch (err) {
      setError(err.message || "Account creation failed.");
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
            Sign in with a Supabase Auth email and password. Username login is not used.
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Email
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
          {notice && (
            <p className="mt-4 text-sm font-semibold text-emerald-600">
              {notice}
            </p>
          )}
          <button
            className="mt-6 w-full rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-navy/90"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          {signupEnabled && (
            <button
              className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-navy hover:text-navy"
              type="button"
              disabled={loading}
              onClick={handleCreateAccount}
            >
              Create Supabase Account
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
