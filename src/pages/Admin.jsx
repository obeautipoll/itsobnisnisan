import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchContent, saveContent } from "../lib/api";
import { clearToken } from "../lib/auth";
import defaultContent from "../content/defaultContent";

const Admin = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState(defaultContent);
  const [raw, setRaw] = useState(JSON.stringify(defaultContent, null, 2));
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetchContent()
      .then((data) => {
        if (data?.content) {
          setContent(data.content);
          setRaw(JSON.stringify(data.content, null, 2));
        }
      })
      .catch(() => {
        setStatus("Using default content. Save to create CMS data.");
      });
  }, []);

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(raw);
      setStatus("Saving...");
      await saveContent(parsed);
      setContent(parsed);
      setStatus("Saved.");
    } catch (err) {
      setStatus("Invalid JSON or save failed.");
    }
  };

  const handleLogout = () => {
    clearToken();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-sand">
      <header className="border-b border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              CMS
            </p>
            <p className="text-lg font-semibold text-navy">Portfolio Editor</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <a
              className="rounded-full border border-slate-200 px-4 py-2 text-slate-600"
              href="/"
            >
              View Site
            </a>
            <button
              className="rounded-full bg-navy px-4 py-2 text-white"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h1 className="text-2xl font-bold text-navy">Edit Content</h1>
          <p className="mt-2 text-sm text-slate-500">
            Update the JSON below. Save to publish changes.
          </p>
          <textarea
            className="mt-5 h-[520px] w-full rounded-2xl border border-slate-200 p-4 font-mono text-xs text-slate-700"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <div className="mt-4 flex items-center gap-4">
            <button
              className="rounded-xl bg-gold px-5 py-2 text-sm font-semibold text-navy"
              onClick={handleSave}
            >
              Save Changes
            </button>
            {status && <span className="text-sm text-slate-500">{status}</span>}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-navy">Preview Summary</h2>
          <p className="mt-2 text-sm text-slate-500">
            {content?.profile?.name} — {content?.profile?.role}
          </p>
        </section>
      </main>
    </div>
  );
};

export default Admin;
