const defaultContent = {
  profile: {
    name: "Orlene Bliss Nisnisan",
    shortName: "Orlene Bliss",
    heroTag: "Data + Web",
    tagline:
      "Information Technology student specializing in database, full-stack development, and data analytics.",
    email: "nisnisanob@gmail.com",
    phone: "+63 975 4793 107",
    resume: "https://nisnisan-resume.tiiny.site/",
    links: {
      github: "https://github.com/obeautipoll",
      facebook: "https://www.facebook.com/nisnisanob",
      linkedin: "https://linkedin.com",
    },
    avatar: "/pic.jpeg",
  },
  education: {
    schools: [
      {
        name: "MSU - Iligan Institute of Technology",
        period: "Aug 2022 - June 2026",
        program: "B.S. in Information Technology (Database)",
        note: "GPA: 1.3 / 5.0",
        highlight: true,
      },
      {
        name: "Corpus Christi Parochial School",
        period: "Aug 2020 - April 2022",
        program: "Accountancy Business and Management",
        note: "Average: 90 / 100",
        highlight: false,
      },
    ],
    coursework: [
      "Data Structures & Algo",
      "Comp. Architecture",
      "Database Security",
      "Big Data Analytics",
      "Startup Essentials",
    ],
    memberships: [
      "DevCon Iligan Volunteers",
      "College Literary Committee",
      "CCCM's CoreGroup",
    ],
  },
  skills: {
    languages: [
      { name: "Python", icon: "devicon-python-plain colored" },
      { name: "Java", icon: "devicon-java-plain colored" },
      { name: "JavaScript", icon: "devicon-javascript-plain colored" },
      { name: "PHP", icon: "devicon-php-plain colored" },
      { name: "TypeScript", icon: "devicon-typescript-plain colored" },
      { name: "HTML/CSS", icon: "devicon-html5-plain colored" },
    ],
    tools: [
      { name: "MySQL", icon: "devicon-mysql-plain colored" },
      { name: "Redis", icon: "devicon-redis-plain colored" },
      { name: "MongoDB", icon: "devicon-mongodb-plain colored" },
      { name: "Tailwind", icon: "devicon-tailwindcss-original colored" },
      { name: "React.js", icon: "devicon-react-original colored" },
      { name: "Node.js", icon: "devicon-nodejs-plain colored" },
      { name: "IntelliJ", icon: "devicon-intellij-plain colored" },
    ],
  },
  experience: [
    {
      title: "Data Management Specialist",
      period: "Private Contract - Oct 2022 - Mar 2023",
      bullets: [
        "Managed large datasets using Excel macros, resulting in a 30% increase in efficiency.",
        "Utilized Google Sheets/Excel for analytics, leading to a 20% improvement in decision-making accuracy.",
      ],
    },
    {
      title: "Website Designer and Developer",
      period: "Freelance - Sept 2022 - Jan 2023",
      bullets: [
        "Designed 10+ responsive websites using HTML, CSS, and JS, boosting client satisfaction by 25%.",
        "Achieved a 90% client retention rate by customizing dynamic mobile layouts.",
      ],
    },
    {
      title: "Mathematics Mentor",
      period: "Preply - Oct 2025 - Dec 2025",
      bullets: [
        "Helped students improve grades by an average of 20% through personalized online lessons.",
        "Created engaging materials resulting in a 90% student satisfaction rate.",
      ],
    },
  ],
  projects: {
    description:
      "Featured work with visual previews. The first two projects link to live sites.",
    badge: "Visual Showcase",
    featured: [
      {
        title: "e-SKEDLAV - Tutoring System",
        period: "Capstone - Apr 2025",
        badge: "Live Site",
        description:
          "Full-stack platform for managing tutor sessions using SQL, Supabase, React.",
        image: "/image%20(3).png",
        link: "https://capstone199-supabase-lav.vercel.app/",
        icons: ["devicon-postgresql-plain", "devicon-react-original"],
      },
      {
        title: "SpeakUp",
        period: "Backend - Aug 2025",
        badge: "Live Site",
        description:
          "Backend development for complaint management using Firebase, Node.js, React.",
        image: "/image%20(4).png",
        link: "https://myiit-speakup-gold.vercel.app/login",
        icons: ["devicon-firebase-plain", "devicon-nodejs-plain"],
      },
    ],
    cards: [
      {
        title: "Barangay Management",
        tag: "System",
        description:
          "Digitalized manual processes using Redis & JS, reducing paperwork by 40%.",
        image: "/image%20(5).png",
        icons: ["devicon-redis-plain", "devicon-javascript-plain"],
      },
      {
        title: "Student Data",
        tag: "Management",
        description: "Simple, clean interface for managing student records and accounts",
        image: "/image%20(1).png",
      },
      {
        title: "Emigration Management",
        tag: "Visualization",
        description:
          "Data management UI for tracking demographic reports and records.",
        image: "/image%20(2).png",
      },
      {
        title: "Emigration Analytics",
        tag: "Machine Learning",
        description:
          "Interactive forecasting and visualization tools for long-term insights.",
        image: "/image.png",
      },
    ],
  },
  certificates: {
    description:
      "Verified learning milestones and professional training certificates.",
    badge: "PDF Gallery",
    items: [
      {
        tag: "CSS Essentials",
        title: "CSS Essentials",
        description: "Core CSS foundations and layout mastery.",
        pdf: "/certificates/CSSEssentialsv120251212-30-uoihw8.pdf",
      },
      {
        tag: "Hour of Code",
        title: "December 2024 HoC",
        description: "Completed Hour of Code learning challenge.",
        pdf: "/certificates/December%202024%20HoC%20Certificate%20BLISS%20NISNISAN.pdf",
      },
      {
        tag: "HTML Essentials",
        title: "HTML Essentials",
        description: "Semantic HTML structures and accessibility basics.",
        pdf: "/certificates/HTMLEssentialsv120250925-31-f0obhk.pdf",
      },
      {
        tag: "JavaScript",
        title: "JavaScript Essentials 1",
        description: "Core JavaScript syntax, logic, and DOM basics.",
        pdf:
          "/certificates/JavaScript_Essentials_1_certificate_orlenebliss-nisnisan-g-msuiit-edu-ph_ff7847a8-fb5e-4edc-8988-947a7f67f26f.pdf",
      },
      {
        tag: "Wadhwani",
        title: "Wadhwani Foundation",
        description: "Entrepreneurship and innovation fundamentals.",
        pdf:
          "/certificates/Wadhwani%20Foundation%20Certificate%20-%206938cb9349e895be1f165b4d.pdf",
      },
    ],
  },
  leadership: [
    {
      title: "CCS Student Council",
      role: "Undersecretary, Literary Comm.",
      period: "Aug 2024 - Present",
      bullets: [
        "Creates promotional materials to enhance college presence.",
        "Trains participants for \"Battle of the Brains\" competitions.",
      ],
      accent: "gold",
    },
    {
      title: "Catholic Center Campus Ministry",
      role: "Core Group Leader",
      period: "Aug 2022 - Present",
      bullets: [
        "Leads spiritual activities and outreach programs.",
        "Manages documentation and news articles for events.",
      ],
      accent: "navy",
    },
  ],
  contact: {
    headline: "Let's Connect",
    description:
      "Open to opportunities in database management and full-stack development.",
  },
};

export default defaultContent;
