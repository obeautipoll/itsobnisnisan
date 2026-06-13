import { useEffect, useMemo, useState } from "react";
import { fetchContent, submitContact } from "../../lib/api";
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

const Home = () => {
  const [content, setContent] = useState(defaultContent);
  const [showLoader, setShowLoader] = useState(true);
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [certificateModal, setCertificateModal] = useState({
    open: false,
    src: "",
    title: "Certificate",
  });
  const [contactStatus, setContactStatus] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  useEffect(() => {
    let alive = true;
    fetchContent()
      .then((data) => {
        if (!alive) return;
        if (data?.content) setContent(mergeContent(defaultContent, data.content));
      })
      .catch(() => {
        if (alive) setContent(defaultContent);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const handleLoad = () => {
      setTimeout(() => setShowLoader(false), 500);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }

    return () => {
      window.removeEventListener("load", handleLoad);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY >= 300);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [content]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openCertificate = (src, title) => {
    setCertificateModal({ open: true, src, title });
  };

  const closeCertificate = () => {
    setCertificateModal({ open: false, src: "", title: "Certificate" });
  };

  const leadershipAccentClass = useMemo(
    () => ({
      gold: "border-t-gold",
      navy: "border-t-navy dark:border-t-white",
    }),
    []
  );

  const {
    profile,
    education,
    skills,
    experience,
    projects,
    certificates,
    leadership,
    contact,
  } = content;

  return (
    <>
      {showLoader && (
        <div id="loader">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent"></div>
        </div>
      )}

      <button
        id="backToTop"
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-40 rounded-full bg-navy p-3 text-white shadow-lg transition hover:-translate-y-1 hover:bg-gold dark:bg-gold dark:text-navy dark:hover:bg-white ${
          showBackToTop ? "" : "hidden"
        }`}
      >
        <i className="ri-arrow-up-line text-xl"></i>
      </button>

      <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/85 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-16">
          <a href="#" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-gold font-bold text-xl group-hover:rotate-12 transition duration-300">
              OB
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Portfolio
              </p>
              <p className="text-sm font-bold text-navy dark:text-white sm:text-lg">
                {profile?.shortName}
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <a className="hover:text-gold transition-colors" href="#education">
              Education
            </a>
            <a className="hover:text-gold transition-colors" href="#skills">
              Skills
            </a>
            <a className="hover:text-gold transition-colors" href="#experience">
              Experience
            </a>
            <a className="hover:text-gold transition-colors" href="#projects">
              Projects
            </a>
            <a className="hover:text-gold transition-colors" href="#certificates">
              Certificates
            </a>
            <a className="hover:text-gold transition-colors" href="#leadership">
              Leadership
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              className="hidden sm:block rounded-full border border-navy px-4 py-2 text-xs font-semibold uppercase tracking-widest text-navy transition hover:bg-navy hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-navy"
              href={profile?.resume}
              target="_blank"
              rel="noreferrer"
            >
              Resume
            </a>
            <a
              className="hidden sm:block rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 transition hover:border-gold hover:text-gold dark:border-slate-700 dark:text-slate-300"
              href="/admin"
            >
              Edit
            </a>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-gold"
              onClick={() => setIsDark((prev) => !prev)}
              type="button"
            >
              <i
                className={`${
                  isDark ? "ri-moon-line" : "ri-sun-line"
                } text-xl`}
              ></i>
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-16 pt-10 sm:px-10 lg:px-16">
        <section
          className="reveal section-anchor card grid gap-8 rounded-[32px] p-8 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] items-center"
          id="hero"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gold mb-4">
              <span className="h-2 w-2 rounded-full bg-gold animate-pulse"></span>
              {profile?.heroTag}
            </div>
            <h1 className="text-4xl font-bold leading-tight text-navy dark:text-white sm:text-5xl lg:text-6xl">
              {profile?.name}
            </h1>
            <p className="mt-6 max-w-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              {profile?.tagline}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#projects"
                className="rounded-full bg-navy px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-1 hover:bg-navy/90 dark:bg-white dark:text-navy"
              >
                View Projects
              </a>
              <div className="flex gap-3">
                <a
                  href={profile?.links?.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-gold hover:text-gold dark:border-slate-600 dark:text-slate-400"
                >
                  <i className="devicon-github-original text-xl"></i>
                </a>
                <a
                  href={profile?.links?.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-gold hover:text-gold dark:border-slate-600 dark:text-slate-400"
                >
                  <i className="ri-facebook-fill text-xl"></i>
                </a>
                <a
                  href={`mailto:${profile?.email}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-gold hover:text-gold dark:border-slate-600 dark:text-slate-400"
                >
                  <i className="ri-mail-send-line text-xl"></i>
                </a>
              </div>
            </div>
          </div>

          <div className="flex justify-center relative">
            <div className="relative h-64 w-64 sm:h-80 sm:w-80">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold/50 animate-spin-slow"></div>
              <div className="h-full w-full overflow-hidden rounded-full border-4 border-white shadow-2xl dark:border-slate-800">
                <img
                  src={profile?.avatar}
                  alt={profile?.name}
                  className="h-full w-full object-cover transition duration-500 hover:scale-110"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="reveal section-anchor" id="education">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="card rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-navy/10 rounded-lg text-navy dark:bg-white/10 dark:text-white">
                  <i className="ri-graduation-cap-fill text-xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-navy dark:text-white">
                  Education
                </h2>
              </div>

              <div className="space-y-8 relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 pl-6">
                {education?.schools?.map((school, index) => (
                  <div className="relative" key={school.name}>
                    <span
                      className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white ${
                        school.highlight
                          ? "bg-gold"
                          : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    ></span>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                      <h3 className="font-bold text-navy dark:text-white">
                        {school.name}
                      </h3>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded dark:bg-slate-800">
                        {school.period}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {school.program}
                    </p>
                    <p
                      className={`text-xs font-semibold mt-1 ${
                        index === 0 ? "text-gold" : "text-slate-500"
                      }`}
                    >
                      {school.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card rounded-3xl p-8 flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Relevant Coursework
                </h3>
                <div className="flex flex-wrap gap-2">
                  {education?.coursework?.map((item) => (
                    <span
                      key={item}
                      className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full dark:bg-slate-800 dark:text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Memberships
                </h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {education?.memberships?.map((membership) => (
                    <li className="flex items-center gap-2" key={membership}>
                      <i className="ri-checkbox-circle-line text-gold"></i>
                      {membership}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="reveal section-anchor" id="skills">
          <h2 className="text-3xl font-bold text-navy dark:text-white mb-8">
            Technical Skills
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-6 rounded-2xl">
              <h3 className="flex items-center gap-2 text-lg font-bold text-navy dark:text-white mb-4">
                <i className="ri-code-s-slash-line text-gold"></i> Languages
              </h3>
              <div className="flex flex-wrap gap-3">
                {skills?.languages?.map((skill) => (
                  <div
                    key={skill.name}
                    className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <i className={skill.icon}></i>
                    <span className="text-sm dark:text-slate-300">
                      {skill.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6 rounded-2xl">
              <h3 className="flex items-center gap-2 text-lg font-bold text-navy dark:text-white mb-4">
                <i className="ri-tools-line text-gold"></i> Frameworks & Tools
              </h3>
              <div className="flex flex-wrap gap-3">
                {skills?.tools?.map((skill) => (
                  <div
                    key={skill.name}
                    className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <i className={skill.icon}></i>
                    <span className="text-sm dark:text-slate-300">
                      {skill.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="reveal section-anchor" id="experience">
          <div className="card rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gold/20 rounded-lg text-gold">
                <i className="ri-briefcase-4-fill text-xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-navy dark:text-white">
                Work Experience
              </h2>
            </div>

            <div className="space-y-8 border-l-2 border-slate-200 dark:border-slate-700 ml-3 pl-6">
              {experience?.map((role) => (
                <div className="relative" key={role.title}>
                  <span className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-2 border-white bg-navy dark:border-slate-800"></span>
                  <h3 className="text-lg font-bold text-navy dark:text-white">
                    {role.title}
                  </h3>
                  <p className="text-xs uppercase text-slate-400 mb-2">
                    {role.period}
                  </p>
                  <ul className="list-disc list-outside ml-4 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                    {role.bullets?.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="reveal section-anchor" id="projects">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-navy dark:text-white">
                Projects
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {projects?.description}
              </p>
            </div>
            <span className="self-start rounded-full bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-navy">
              {projects?.badge}
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {projects?.featured?.map((project) => (
              <a
                key={project.title}
                href={project.link}
                target="_blank"
                rel="noreferrer"
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card dark:border-slate-700 dark:bg-slate-800 lg:col-span-2"
              >
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-52 w-full object-cover transition duration-700 group-hover:scale-105 sm:h-64"
                  />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
                  <span>{project.period}</span>
                  <span className="font-bold text-gold">{project.badge}</span>
                </div>
                <h3 className="mt-2 text-lg font-bold text-navy dark:text-white">
                  {project.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {project.description}
                </p>
                <div className="mt-4 flex gap-2">
                  {project.icons?.map((icon) => (
                    <i
                      key={icon}
                      className={`${icon} text-lg text-slate-400`}
                    ></i>
                  ))}
                </div>
              </a>
            ))}

            {projects?.cards?.map((project) => (
              <div
                key={project.title}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-40 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {project.tag}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-navy dark:text-white">
                    {project.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {project.description}
                  </p>
                  {project.icons?.length ? (
                    <div className="mt-3 flex gap-2">
                      {project.icons.map((icon) => (
                        <i
                          key={icon}
                          className={`${icon} text-lg text-slate-400`}
                        ></i>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal section-anchor" id="certificates">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-navy dark:text-white">
                Certificates
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {certificates?.description}
              </p>
            </div>
            <span className="self-start rounded-full bg-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-navy">
              {certificates?.badge}
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates?.items?.map((cert) => (
              <div
                className="card rounded-2xl border border-slate-200 p-5 shadow-soft dark:border-slate-700"
                key={cert.title}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-gold">
                  {cert.tag}
                </p>
                <h3 className="mt-2 text-lg font-bold text-navy dark:text-white">
                  {cert.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {cert.description}
                </p>
                <button
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:-translate-y-0.5 hover:bg-navy/90"
                  type="button"
                  onClick={() => openCertificate(cert.pdf, cert.title)}
                >
                  <i className="ri-file-pdf-line text-base"></i>
                  View Certificate
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal section-anchor" id="leadership">
          <h2 className="text-3xl font-bold text-navy dark:text-white mb-8">
            Leadership
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {leadership?.map((role) => (
              <div
                key={role.title}
                className={`card p-6 rounded-2xl border-t-4 ${
                  leadershipAccentClass[role.accent] || "border-t-gold"
                }`}
              >
                <h3 className="text-lg font-bold text-navy dark:text-white">
                  {role.title}
                </h3>
                <p className="text-xs uppercase tracking-widest text-gold mb-4">
                  {role.role}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  {role.period}
                </p>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                  {role.bullets?.map((item) => (
                    <li className="flex gap-2" key={item}>
                      <i className="ri-arrow-right-s-line text-gold"></i>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section
          className="reveal section-anchor card grid gap-8 rounded-3xl p-8 lg:grid-cols-[1fr_1.2fr]"
          id="contact"
        >
          <div>
            <h2 className="text-3xl font-bold text-navy dark:text-white">
              {contact?.headline}
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              {contact?.description}
            </p>

            <div className="mt-8 space-y-4">
              <a
                href={`mailto:${profile?.email}`}
                className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-800"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-gold">
                  <i className="ri-mail-line"></i>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Email Me</p>
                  <p className="font-medium text-navy dark:text-white">
                    {profile?.email}
                  </p>
                </div>
              </a>
              <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/10 text-navy dark:bg-white/10 dark:text-white">
                  <i className="ri-phone-line"></i>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Call Me</p>
                  <p className="font-medium text-navy dark:text-white">
                    {profile?.phone}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form
            className="rounded-2xl border border-slate-200 bg-white/50 p-6 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/50"
            onSubmit={async (event) => {
              event.preventDefault();
              setContactStatus("Sending...");
              try {
                await submitContact(contactForm);
                setContactStatus("Message sent!");
                setContactForm({ name: "", email: "", message: "" });
              } catch (err) {
                setContactStatus("Failed to send. Try again.");
              }
            }}
          >
            <div className="grid gap-5">
              <div>
                <label
                  className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500"
                  htmlFor="name"
                >
                  Name
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  id="name"
                  type="text"
                  placeholder="Your Name"
                  value={contactForm.name}
                  onChange={(event) =>
                    setContactForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={contactForm.email}
                  onChange={(event) =>
                    setContactForm((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500"
                  htmlFor="message"
                >
                  Message
                </label>
                <textarea
                  className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  id="message"
                  placeholder="How can I help you?"
                  value={contactForm.message}
                  onChange={(event) =>
                    setContactForm((prev) => ({
                      ...prev,
                      message: event.target.value,
                    }))
                  }
                  required
                ></textarea>
              </div>
              <button
                className="rounded-xl bg-gold px-6 py-4 text-sm font-bold uppercase tracking-widest text-navy shadow-lg transition hover:-translate-y-1 hover:bg-orange-500 hover:text-white"
                type="submit"
              >
                Send Message
              </button>
              {contactStatus && (
                <p className="text-sm text-slate-500">{contactStatus}</p>
              )}
            </div>
          </form>
        </section>
      </main>

      <div
        id="certificateModal"
        className={`modal-overlay fixed inset-0 z-50 items-center justify-center px-6 py-10 ${
          certificateModal.open ? "flex modal-open" : "hidden"
        }`}
        onClick={(event) => {
          if (event.target.id === "certificateModal") closeCertificate();
        }}
      >
        <div className="modal-panel w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <h3
              id="certificateTitle"
              className="text-lg font-bold text-navy dark:text-white"
            >
              {certificateModal.title}
            </h3>
            <button
              id="closeCertificate"
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-500 transition hover:border-gold hover:text-gold dark:border-slate-700 dark:text-slate-300"
              onClick={closeCertificate}
            >
              Close
            </button>
          </div>
          <div className="mt-4 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
            <iframe
              id="certificateFrame"
              title="Certificate preview"
              className="h-full w-full"
              src={certificateModal.src}
            ></iframe>
          </div>
        </div>
      </div>

      <footer className="mt-12 border-t border-slate-200 bg-white/60 py-10 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 sm:flex-row sm:justify-between sm:px-10">
          <p className="text-sm text-slate-500">
            (c) 2026 {profile?.name}. All rights reserved.
          </p>
          <div className="flex gap-6 text-2xl text-slate-400">
            <a
              href={profile?.links?.github}
              className="hover:text-navy dark:hover:text-white transition"
            >
              <i className="devicon-github-original"></i>
            </a>
            <a
              href={profile?.links?.linkedin}
              className="hover:text-blue-600 transition"
            >
              <i className="devicon-linkedin-plain"></i>
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
