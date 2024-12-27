// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

// Site title and description
export const SITE_LANG = "zh";
export const SITE_TAB = "啦啦啦";
export const SITE_TITLE = "Trtyr's Blog 🧊";
export const SITE_DESCRIPTION = "个人博客";
export const DATE_FORMAT = "ddd MMM DD YYYY";

// User profile information
export const USER_NAME = "特让他也让";
export const USER_SITE = "https://www.trtyr.top";
export const USER_AVATAR = "https://img.trtyr.top/images/person/my.jpg";

// Server and transition settings
export const SERVER_URL = "https://waline.trtyr.top";

// Theme settings
export const DAISYUI_THEME = {
  light: "winter",
  dark: "dracula",
};
export const CODE_THEME = {
  light: "github-light",
  dark: "github-dark",
};

// Menu items for navigation
export const menuItems = [
  {
    id: "home",
    text: "首页",
    href: "/",
    svg: "material-symbols:home-outline-rounded",
    target: "_self",
  },
  {
    id: "blog",
    text: "博客",
    href: "/blog",
    svg: "material-symbols:book-2-outline-rounded",
    target: "_self",
    subItems: [
      {
        id: "all",
        text: "归档",
        href: "/blog",
        svg: "material-symbols:ink-pen-outline-rounded",
        target: "_self",
      }, // All blog
      {
        id: "tech",
        text: "网络安全",
        href: "/blog/categories/%E7%BD%91%E7%BB%9C%E5%AE%89%E5%85%A8/",
        svg: "material-symbols:deployed-code-outline",
        target: "_self",
      }, // Technology category
      {
        id: "exec",
        text: "靶场练习",
        href: "/blog/tag/%E9%9D%B6%E5%9C%BA/",
        svg: "material-symbols:earthquake-rounded",
        target: "_self",
      },
    ],
  }, // Blog page with sub-items
  {
    id: "project",
    text: "项目",
    href: "/project",
    svg: "material-symbols:code-blocks-outline",
    target: "_self",
  },
  {
    id: "contact",
    text: "Contact",
    href: "mailto:contact.z1693309049@outlook.com", // Contact email
    target: "_blank", // Open in a new tab
    svg: "material-symbols:attach-email-outline-rounded",
  },
];

// Social media and contact icons
export const socialIcons = [
  {
    href: "https://github.com/trtyr",
    ariaLabel: "Github",
    title: "Github",
    svg: "ri:github-line",
  },
  {
    href: "https://space.bilibili.com/440805873",
    ariaLabel: "BiliBili",
    title: "BiliBili",
    svg: "ri:bilibili-line",
  },
  {
    href: "/rss.xml",
    ariaLabel: "RSS Feed",
    title: "RSS Feed",
    svg: "ri:rss-line",
  },
];
