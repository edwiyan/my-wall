// The wall owner. Shown in the sidebar and the Info tab.
// The profile picture is uploaded from the app (sidebar → "Change picture") and stored
// in Supabase; `fallbackPhoto` is shown until one is uploaded.

export const profile = {
  name: "Edrian Reyes",
  headline: "Full-Stack Developer",
  location: "Bulacan, Philippines",
  fallbackPhoto: "/profile.svg",
  about:
    "Full-stack web developer who builds web systems that replace spreadsheets, paper forms and manual processes. 11 projects built and 3 systems deployed to production.",
  skills: ["React", "TypeScript", "Laravel", "PHP", "MySQL", "PostgreSQL", "Tailwind CSS", "Python"],
  education: {
    degree: "BS Information Technology",
    school: "Bulacan Agricultural State College",
    years: "2021 – 2025",
  },
  links: [
    { label: "Portfolio", href: "https://edwiyan.github.io/edrian-s-developer-portfolio/" },
    { label: "GitHub", href: "https://github.com/edwiyan" },
  ],
  lookingFor: "Software Developer role",
};
