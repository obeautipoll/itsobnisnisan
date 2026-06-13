import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchContent,
  fetchMessages,
  saveContent,
  uploadImage,
} from "../../lib/api";
import { clearToken } from "../../lib/auth";
import defaultContent from "../../content/defaultContent";

const mergeContent = (base, incoming) => {
  if (!incoming) return base;
  if (Array.isArray(base) || Array.isArray(incoming)) {
    return incoming === undefined ? base : incoming;
  }
  if (
    typeof base === "object" &&
    base !== null &&
    typeof incoming === "object" &&
    incoming !== null
  ) {
    return Object.keys({ ...base, ...incoming }).reduce((merged, key) => {
      merged[key] = mergeContent(base[key], incoming[key]);
      return merged;
    }, {});
  }
  return incoming === undefined ? base : incoming;
};

const TextInput = ({ label, value, onChange, type = "text" }) => (
  <label className="flex flex-col gap-2 text-sm text-slate-600">
    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
      {label}
    </span>
    <input
      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

const TextArea = ({ label, value, onChange, rows = 3 }) => (
  <label className="flex flex-col gap-2 text-sm text-slate-600">
    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
      {label}
    </span>
    <textarea
      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

const cmsSections = [
  { id: "profile", label: "Profile" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "certificates", label: "Certificates" },
  { id: "leadership", label: "Leadership" },
  { id: "contact", label: "Contact" },
  { id: "inbox", label: "Inbox" },
];

const SectionCard = ({ id, title, children, onSave, status }) => (
  <section className="scroll-mt-24 rounded-3xl bg-white p-6 shadow-soft" id={id}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-bold text-navy">{title}</h2>
      <div className="flex items-center gap-3">
        {status && <span className="text-xs text-slate-500">{status}</span>}
        <button
          className="rounded-full bg-navy px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white"
          onClick={onSave}
          type="button"
        >
          Save Section
        </button>
      </div>
    </div>
    <div className="mt-6 grid gap-4">{children}</div>
  </section>
);

const ImageUpload = ({ label, onUploaded, accept = "image/*", section }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await uploadImage(file, section);
      onUploaded(result.url);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <label className="flex flex-col gap-2 text-sm text-slate-600">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <input
        type="file"
        accept={accept}
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <span className="text-xs text-slate-400">Uploading...</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  );
};

const Admin = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState(defaultContent);
  const [status, setStatus] = useState({});
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetchContent()
      .then((data) => {
        if (data?.content) {
          setContent(mergeContent(defaultContent, data.content));
        }
      })
      .catch(() => {
        setStatus((prev) => ({
          ...prev,
          global: "No CMS data found. Add content and save to publish.",
        }));
      });

    fetchMessages()
      .then((data) => setMessages(data?.messages || []))
      .catch(() => {
        setMessages([]);
      });
  }, []);

  const handleSaveSection = async (sectionName) => {
    setStatus((prev) => ({ ...prev, [sectionName]: "Saving..." }));
    try {
      await saveContent({ [sectionName]: content[sectionName] });
      setStatus((prev) => ({ ...prev, [sectionName]: "Saved." }));
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        [sectionName]: err.message || "Save failed.",
      }));
    }
  };

  const handleSaveAll = async () => {
    setStatus((prev) => ({ ...prev, global: "Saving all..." }));
    try {
      await saveContent(content);
      setStatus((prev) => ({ ...prev, global: "All changes saved." }));
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        global: err.message || "Save all failed.",
      }));
    }
  };

  const handleLogout = () => {
    clearToken();
    navigate("/admin", { replace: true });
  };

  const updateSection = (sectionName, updater) => {
    setContent((prev) => ({
      ...prev,
      [sectionName]: updater(prev[sectionName]),
    }));
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
            {status.global && (
              <span className="text-xs text-slate-500">{status.global}</span>
            )}
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-slate-600"
              onClick={handleSaveAll}
              type="button"
            >
              Save All
            </button>
            <a
              className="rounded-full border border-slate-200 px-4 py-2 text-slate-600"
              href="/"
            >
              View Site
            </a>
            <button
              className="rounded-full bg-navy px-4 py-2 text-white"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav className="rounded-3xl bg-white p-4 shadow-soft">
            <p className="px-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              Sections
            </p>
            <div className="mt-3 grid gap-1">
              {cmsSections.map((section) => (
                <a
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-sand hover:text-navy"
                  href={`#${section.id}`}
                  key={section.id}
                >
                  {section.label}
                </a>
              ))}
            </div>
          </nav>
        </aside>

        <div className="flex flex-col gap-6">
        <SectionCard
          id="profile"
          title="Profile"
          onSave={() => handleSaveSection("profile")}
          status={status.profile}
        >
          <TextInput
            label="Full name"
            value={content.profile.name}
            onChange={(value) =>
              updateSection("profile", (prev) => ({ ...prev, name: value }))
            }
          />
          <TextInput
            label="Short name"
            value={content.profile.shortName}
            onChange={(value) =>
              updateSection("profile", (prev) => ({ ...prev, shortName: value }))
            }
          />
          <TextInput
            label="Hero tag"
            value={content.profile.heroTag}
            onChange={(value) =>
              updateSection("profile", (prev) => ({ ...prev, heroTag: value }))
            }
          />
          <TextArea
            label="Tagline"
            value={content.profile.tagline}
            onChange={(value) =>
              updateSection("profile", (prev) => ({ ...prev, tagline: value }))
            }
          />
          <TextInput
            label="Email"
            value={content.profile.email}
            onChange={(value) =>
              updateSection("profile", (prev) => ({ ...prev, email: value }))
            }
          />
          <TextInput
            label="Phone"
            value={content.profile.phone}
            onChange={(value) =>
              updateSection("profile", (prev) => ({ ...prev, phone: value }))
            }
          />
          <TextInput
            label="Resume link"
            value={content.profile.resume}
            onChange={(value) =>
              updateSection("profile", (prev) => ({ ...prev, resume: value }))
            }
          />
          <TextInput
            label="Avatar image path"
            value={content.profile.avatar}
            onChange={(value) =>
              updateSection("profile", (prev) => ({ ...prev, avatar: value }))
            }
          />
          <ImageUpload
            label="Upload avatar image"
            section="profile"
            onUploaded={(url) =>
              updateSection("profile", (prev) => ({ ...prev, avatar: url }))
            }
          />
          <TextInput
            label="GitHub link"
            value={content.profile.links.github}
            onChange={(value) =>
              updateSection("profile", (prev) => ({
                ...prev,
                links: { ...prev.links, github: value },
              }))
            }
          />
          <TextInput
            label="Facebook link"
            value={content.profile.links.facebook}
            onChange={(value) =>
              updateSection("profile", (prev) => ({
                ...prev,
                links: { ...prev.links, facebook: value },
              }))
            }
          />
          <TextInput
            label="LinkedIn link"
            value={content.profile.links.linkedin}
            onChange={(value) =>
              updateSection("profile", (prev) => ({
                ...prev,
                links: { ...prev.links, linkedin: value },
              }))
            }
          />
        </SectionCard>

        <SectionCard
          id="education"
          title="Education"
          onSave={() => handleSaveSection("education")}
          status={status.education}
        >
          {content.education.schools.map((school, index) => (
            <div
              key={`${school.name}-${index}`}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <TextInput
                label="School name"
                value={school.name}
                onChange={(value) =>
                  updateSection("education", (prev) => {
                    const next = [...prev.schools];
                    next[index] = { ...next[index], name: value };
                    return { ...prev, schools: next };
                  })
                }
              />
              <TextInput
                label="Period"
                value={school.period}
                onChange={(value) =>
                  updateSection("education", (prev) => {
                    const next = [...prev.schools];
                    next[index] = { ...next[index], period: value };
                    return { ...prev, schools: next };
                  })
                }
              />
              <TextInput
                label="Program"
                value={school.program}
                onChange={(value) =>
                  updateSection("education", (prev) => {
                    const next = [...prev.schools];
                    next[index] = { ...next[index], program: value };
                    return { ...prev, schools: next };
                  })
                }
              />
              <TextInput
                label="Note"
                value={school.note}
                onChange={(value) =>
                  updateSection("education", (prev) => {
                    const next = [...prev.schools];
                    next[index] = { ...next[index], note: value };
                    return { ...prev, schools: next };
                  })
                }
              />
              <label className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={school.highlight}
                  onChange={(event) =>
                    updateSection("education", (prev) => {
                      const next = [...prev.schools];
                      next[index] = {
                        ...next[index],
                        highlight: event.target.checked,
                      };
                      return { ...prev, schools: next };
                    })
                  }
                />
                Highlight as primary
              </label>
              <button
                className="mt-3 text-xs font-semibold text-red-500"
                type="button"
                onClick={() =>
                  updateSection("education", (prev) => ({
                    ...prev,
                    schools: prev.schools.filter((_, i) => i !== index),
                  }))
                }
              >
                Remove school
              </button>
            </div>
          ))}
          <button
            className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-500"
            type="button"
            onClick={() =>
              updateSection("education", (prev) => ({
                ...prev,
                schools: [
                  ...prev.schools,
                  {
                    name: "",
                    period: "",
                    program: "",
                    note: "",
                    highlight: false,
                  },
                ],
              }))
            }
          >
            Add school
          </button>
          <TextArea
            label="Coursework (one per line)"
            value={content.education.coursework.join("\n")}
            onChange={(value) =>
              updateSection("education", (prev) => ({
                ...prev,
                coursework: value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean),
              }))
            }
            rows={4}
          />
          <TextArea
            label="Memberships (one per line)"
            value={content.education.memberships.join("\n")}
            onChange={(value) =>
              updateSection("education", (prev) => ({
                ...prev,
                memberships: value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean),
              }))
            }
            rows={4}
          />
        </SectionCard>

        <SectionCard
          id="skills"
          title="Skills"
          onSave={() => handleSaveSection("skills")}
          status={status.skills}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-navy">Languages</h3>
              {content.skills.languages.map((skill, index) => (
                <div className="mt-3 grid gap-2" key={`${skill.name}-${index}`}>
                  <TextInput
                    label="Name"
                    value={skill.name}
                    onChange={(value) =>
                      updateSection("skills", (prev) => {
                        const next = [...prev.languages];
                        next[index] = { ...next[index], name: value };
                        return { ...prev, languages: next };
                      })
                    }
                  />
                  <TextInput
                    label="Icon class"
                    value={skill.icon}
                    onChange={(value) =>
                      updateSection("skills", (prev) => {
                        const next = [...prev.languages];
                        next[index] = { ...next[index], icon: value };
                        return { ...prev, languages: next };
                      })
                    }
                  />
                  <button
                    className="text-xs font-semibold text-red-500"
                    type="button"
                    onClick={() =>
                      updateSection("skills", (prev) => ({
                        ...prev,
                        languages: prev.languages.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="mt-4 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500"
                type="button"
                onClick={() =>
                  updateSection("skills", (prev) => ({
                    ...prev,
                    languages: [...prev.languages, { name: "", icon: "" }],
                  }))
                }
              >
                Add language
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-navy">Tools</h3>
              {content.skills.tools.map((skill, index) => (
                <div className="mt-3 grid gap-2" key={`${skill.name}-${index}`}>
                  <TextInput
                    label="Name"
                    value={skill.name}
                    onChange={(value) =>
                      updateSection("skills", (prev) => {
                        const next = [...prev.tools];
                        next[index] = { ...next[index], name: value };
                        return { ...prev, tools: next };
                      })
                    }
                  />
                  <TextInput
                    label="Icon class"
                    value={skill.icon}
                    onChange={(value) =>
                      updateSection("skills", (prev) => {
                        const next = [...prev.tools];
                        next[index] = { ...next[index], icon: value };
                        return { ...prev, tools: next };
                      })
                    }
                  />
                  <button
                    className="text-xs font-semibold text-red-500"
                    type="button"
                    onClick={() =>
                      updateSection("skills", (prev) => ({
                        ...prev,
                        tools: prev.tools.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="mt-4 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500"
                type="button"
                onClick={() =>
                  updateSection("skills", (prev) => ({
                    ...prev,
                    tools: [...prev.tools, { name: "", icon: "" }],
                  }))
                }
              >
                Add tool
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          id="experience"
          title="Experience"
          onSave={() => handleSaveSection("experience")}
          status={status.experience}
        >
          {content.experience.map((role, index) => (
            <div
              key={`${role.title}-${index}`}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <TextInput
                label="Title"
                value={role.title}
                onChange={(value) =>
                  updateSection("experience", (prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], title: value };
                    return next;
                  })
                }
              />
              <TextInput
                label="Period"
                value={role.period}
                onChange={(value) =>
                  updateSection("experience", (prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], period: value };
                    return next;
                  })
                }
              />
              <TextArea
                label="Bullets (one per line)"
                value={role.bullets.join("\n")}
                onChange={(value) =>
                  updateSection("experience", (prev) => {
                    const next = [...prev];
                    next[index] = {
                      ...next[index],
                      bullets: value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    };
                    return next;
                  })
                }
                rows={4}
              />
              <button
                className="text-xs font-semibold text-red-500"
                type="button"
                onClick={() =>
                  updateSection("experience", (prev) =>
                    prev.filter((_, i) => i !== index)
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-500"
            type="button"
            onClick={() =>
              updateSection("experience", (prev) => [
                ...prev,
                { title: "", period: "", bullets: [] },
              ])
            }
          >
            Add role
          </button>
        </SectionCard>

        <SectionCard
          id="projects"
          title="Projects"
          onSave={() => handleSaveSection("projects")}
          status={status.projects}
        >
          <TextArea
            label="Section description"
            value={content.projects.description}
            onChange={(value) =>
              updateSection("projects", (prev) => ({
                ...prev,
                description: value,
              }))
            }
          />
          <TextInput
            label="Badge"
            value={content.projects.badge}
            onChange={(value) =>
              updateSection("projects", (prev) => ({
                ...prev,
                badge: value,
              }))
            }
          />

          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-navy">Featured projects</h3>
            {content.projects.featured.map((project, index) => (
              <div className="mt-4 grid gap-2" key={`${project.title}-${index}`}>
                <TextInput
                  label="Title"
                  value={project.title}
                  onChange={(value) =>
                    updateSection("projects", (prev) => {
                      const next = [...prev.featured];
                      next[index] = { ...next[index], title: value };
                      return { ...prev, featured: next };
                    })
                  }
                />
                <TextInput
                  label="Period"
                  value={project.period}
                  onChange={(value) =>
                    updateSection("projects", (prev) => {
                      const next = [...prev.featured];
                      next[index] = { ...next[index], period: value };
                      return { ...prev, featured: next };
                    })
                  }
                />
                <TextInput
                  label="Badge"
                  value={project.badge}
                  onChange={(value) =>
                    updateSection("projects", (prev) => {
                      const next = [...prev.featured];
                      next[index] = { ...next[index], badge: value };
                      return { ...prev, featured: next };
                    })
                  }
                />
                <TextArea
                  label="Description"
                  value={project.description}
                  onChange={(value) =>
                    updateSection("projects", (prev) => {
                      const next = [...prev.featured];
                      next[index] = { ...next[index], description: value };
                      return { ...prev, featured: next };
                    })
                  }
                />
                <TextInput
                  label="Image path"
                  value={project.image}
                  onChange={(value) =>
                    updateSection("projects", (prev) => {
                      const next = [...prev.featured];
                      next[index] = { ...next[index], image: value };
                      return { ...prev, featured: next };
                    })
                  }
                />
                <ImageUpload
                  label="Upload image"
                  section="projects"
                  onUploaded={(url) =>
                    updateSection("projects", (prev) => {
                      const next = [...prev.featured];
                      next[index] = { ...next[index], image: url };
                      return { ...prev, featured: next };
                    })
                  }
                />
                <TextInput
                  label="Link"
                  value={project.link}
                  onChange={(value) =>
                    updateSection("projects", (prev) => {
                      const next = [...prev.featured];
                      next[index] = { ...next[index], link: value };
                      return { ...prev, featured: next };
                    })
                  }
                />
                <TextInput
                  label="Icons (comma separated)"
                  value={project.icons.join(", ")}
                  onChange={(value) =>
                    updateSection("projects", (prev) => {
                      const next = [...prev.featured];
                      next[index] = {
                        ...next[index],
                        icons: value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      };
                      return { ...prev, featured: next };
                    })
                  }
                />
                <button
                  className="text-xs font-semibold text-red-500"
                  type="button"
                  onClick={() =>
                    updateSection("projects", (prev) => ({
                      ...prev,
                      featured: prev.featured.filter((_, i) => i !== index),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="mt-4 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500"
              type="button"
              onClick={() =>
                updateSection("projects", (prev) => ({
                  ...prev,
                  featured: [
                    ...prev.featured,
                    {
                      title: "",
                      period: "",
                      badge: "",
                      description: "",
                      image: "",
                      link: "",
                      icons: [],
                    },
                  ],
                }))
              }
            >
              Add featured project
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-navy">Project cards</h3>
            {content.projects.cards.map((project, index) => (
              <div className="mt-4 grid gap-2" key={`${project.title}-${index}`}>
                <TextInput
                  label="Title"
                  value={project.title}
                  onChange={(value) =>
                    updateSection("projects", (prev) => {
                      const next = [...prev.cards];
                      next[index] = { ...next[index], title: value };
                      return { ...prev, cards: next };
                    })
                  }
                />
                <TextInput
                  label="Tag"
                  value={project.tag}
                  onChange={(value) =>
                    updateSection("projects", (prev) => {
                      const next = [...prev.cards];
                      next[index] = { ...next[index], tag: value };
                      return { ...prev, cards: next };
                    })
                  }
                />
                <TextArea
                  label="Description"
                  value={project.description}
                  onChange={(value) =>
                    updateSection("projects", (prev) => {
                      const next = [...prev.cards];
                      next[index] = { ...next[index], description: value };
                      return { ...prev, cards: next };
                    })
                  }
                />
                <TextInput
                  label="Image path"
                  value={project.image}
                  onChange={(value) =>
                    updateSection("projects", (prev) => {
                      const next = [...prev.cards];
                      next[index] = { ...next[index], image: value };
                      return { ...prev, cards: next };
                    })
                  }
                />
                <ImageUpload
                  label="Upload image"
                  section="projects"
                  onUploaded={(url) =>
                    updateSection("projects", (prev) => {
                      const next = [...prev.cards];
                      next[index] = { ...next[index], image: url };
                      return { ...prev, cards: next };
                    })
                  }
                />
                <TextInput
                  label="Icons (comma separated)"
                  value={(project.icons || []).join(", ")}
                  onChange={(value) =>
                    updateSection("projects", (prev) => {
                      const next = [...prev.cards];
                      next[index] = {
                        ...next[index],
                        icons: value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      };
                      return { ...prev, cards: next };
                    })
                  }
                />
                <button
                  className="text-xs font-semibold text-red-500"
                  type="button"
                  onClick={() =>
                    updateSection("projects", (prev) => ({
                      ...prev,
                      cards: prev.cards.filter((_, i) => i !== index),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="mt-4 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500"
              type="button"
              onClick={() =>
                updateSection("projects", (prev) => ({
                  ...prev,
                  cards: [
                    ...prev.cards,
                    {
                      title: "",
                      tag: "",
                      description: "",
                      image: "",
                      icons: [],
                    },
                  ],
                }))
              }
            >
              Add project card
            </button>
          </div>
        </SectionCard>
        <SectionCard
          id="certificates"
          title="Certificates"
          onSave={() => handleSaveSection("certificates")}
          status={status.certificates}
        >
          <TextArea
            label="Section description"
            value={content.certificates.description}
            onChange={(value) =>
              updateSection("certificates", (prev) => ({
                ...prev,
                description: value,
              }))
            }
          />
          <TextInput
            label="Badge"
            value={content.certificates.badge}
            onChange={(value) =>
              updateSection("certificates", (prev) => ({
                ...prev,
                badge: value,
              }))
            }
          />
          {content.certificates.items.map((cert, index) => (
            <div
              key={`${cert.title}-${index}`}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <TextInput
                label="Tag"
                value={cert.tag}
                onChange={(value) =>
                  updateSection("certificates", (prev) => {
                    const next = [...prev.items];
                    next[index] = { ...next[index], tag: value };
                    return { ...prev, items: next };
                  })
                }
              />
              <TextInput
                label="Title"
                value={cert.title}
                onChange={(value) =>
                  updateSection("certificates", (prev) => {
                    const next = [...prev.items];
                    next[index] = { ...next[index], title: value };
                    return { ...prev, items: next };
                  })
                }
              />
              <TextArea
                label="Description"
                value={cert.description}
                onChange={(value) =>
                  updateSection("certificates", (prev) => {
                    const next = [...prev.items];
                    next[index] = { ...next[index], description: value };
                    return { ...prev, items: next };
                  })
                }
              />
              <TextInput
                label="PDF link"
                value={cert.pdf}
                onChange={(value) =>
                  updateSection("certificates", (prev) => {
                    const next = [...prev.items];
                    next[index] = { ...next[index], pdf: value };
                    return { ...prev, items: next };
                  })
                }
              />
              <ImageUpload
                label="Upload certificate PDF"
                accept="application/pdf"
                section="certificates"
                onUploaded={(url) =>
                  updateSection("certificates", (prev) => {
                    const next = [...prev.items];
                    next[index] = { ...next[index], pdf: url };
                    return { ...prev, items: next };
                  })
                }
              />
              <button
                className="text-xs font-semibold text-red-500"
                type="button"
                onClick={() =>
                  updateSection("certificates", (prev) => ({
                    ...prev,
                    items: prev.items.filter((_, i) => i !== index),
                  }))
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-500"
            type="button"
            onClick={() =>
              updateSection("certificates", (prev) => ({
                ...prev,
                items: [
                  ...prev.items,
                  { tag: "", title: "", description: "", pdf: "" },
                ],
              }))
            }
          >
            Add certificate
          </button>
        </SectionCard>

        <SectionCard
          id="leadership"
          title="Leadership"
          onSave={() => handleSaveSection("leadership")}
          status={status.leadership}
        >
          {content.leadership.map((role, index) => (
            <div
              key={`${role.title}-${index}`}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <TextInput
                label="Title"
                value={role.title}
                onChange={(value) =>
                  updateSection("leadership", (prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], title: value };
                    return next;
                  })
                }
              />
              <TextInput
                label="Role"
                value={role.role}
                onChange={(value) =>
                  updateSection("leadership", (prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], role: value };
                    return next;
                  })
                }
              />
              <TextInput
                label="Period"
                value={role.period}
                onChange={(value) =>
                  updateSection("leadership", (prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], period: value };
                    return next;
                  })
                }
              />
              <TextArea
                label="Bullets (one per line)"
                value={role.bullets.join("\n")}
                onChange={(value) =>
                  updateSection("leadership", (prev) => {
                    const next = [...prev];
                    next[index] = {
                      ...next[index],
                      bullets: value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    };
                    return next;
                  })
                }
              />
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Accent
                </span>
                <select
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
                  value={role.accent}
                  onChange={(event) =>
                    updateSection("leadership", (prev) => {
                      const next = [...prev];
                      next[index] = { ...next[index], accent: event.target.value };
                      return next;
                    })
                  }
                >
                  <option value="gold">Gold</option>
                  <option value="navy">Navy</option>
                </select>
              </label>
              <button
                className="text-xs font-semibold text-red-500"
                type="button"
                onClick={() =>
                  updateSection("leadership", (prev) =>
                    prev.filter((_, i) => i !== index)
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-500"
            type="button"
            onClick={() =>
              updateSection("leadership", (prev) => [
                ...prev,
                { title: "", role: "", period: "", bullets: [], accent: "gold" },
              ])
            }
          >
            Add leadership role
          </button>
        </SectionCard>

        <SectionCard
          id="contact"
          title="Contact"
          onSave={() => handleSaveSection("contact")}
          status={status.contact}
        >
          <TextInput
            label="Headline"
            value={content.contact.headline}
            onChange={(value) =>
              updateSection("contact", (prev) => ({ ...prev, headline: value }))
            }
          />
          <TextArea
            label="Description"
            value={content.contact.description}
            onChange={(value) =>
              updateSection("contact", (prev) => ({
                ...prev,
                description: value,
              }))
            }
          />
        </SectionCard>

        <section
          className="scroll-mt-24 rounded-3xl bg-white p-6 shadow-soft"
          id="inbox"
        >
          <h2 className="text-xl font-bold text-navy">Inbox</h2>
          <p className="mt-2 text-sm text-slate-500">
            Latest messages from the public contact form.
          </p>
          <div className="mt-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-slate-400">No messages yet.</p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <p className="text-sm font-semibold text-navy">
                  {msg.name} ({msg.email})
                </p>
                <p className="mt-2 text-sm text-slate-600">{msg.message}</p>
              </div>
            ))}
          </div>
        </section>
        </div>
      </main>
    </div>
  );
};

export default Admin;
