import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mofid App",
    short_name: "Mofid",
    description:
      "«مفید اَپ» به‌عنوان یک اپلیکیشن جامع سرمایه‌گذاری در بازار سرمایه در کنار شماست تا بتوانید بر اساس خواسته و نیاز خود، به درستی تصمیم گرفته و به آسانی در مسیر سرمایه‌گذاری گام بردارید. مدیریت مفید کارت، سرمایه‌گذاری در صندوق‌های مفید و مشاوره رایگان سرمایه‌گذاری، از جمله قابلیت‌های این اپلیکیشن است.",
    icons: [
      {
        src: "/icons/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    theme_color: "#FFFFFF",
    background_color: "#FFFFFF",
    start_url: "/?source=pwa",
    display: "standalone",
    orientation: "portrait",
    lang: "fa-IR",
    dir: "rtl",
    categories: ["finance", "business"],
    related_applications: [
      {
        platform: "webapp",
        url: "https://my.emofid.com/manifest.json",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/screenshot1.png",
        sizes: "560x995",
        type: "image/png",
        label: "مفید اپ",
      },
      {
        src: "/screenshots/screenshot2.png",
        sizes: "560x995",
        type: "image/png",
        label: "صفحه اصلی اپلیکیشن مفید",
      },
      {
        src: "/screenshots/screenshot3.png",
        sizes: "560x995",
        type: "image/png",
        label: "کارگزاری مفید",
      },
    ],
    shortcuts: [
      {
        name: "صندوق‌های مفید",
        short_name: "صندوق‌ها",
        description: "مشاهده صندوق‌های سرمایه‌گذاری مفید",
        url: "/invest/fund",
        icons: [
          {
            src: "/icons/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
