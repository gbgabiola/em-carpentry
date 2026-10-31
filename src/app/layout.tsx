import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { siteConfig } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: "%s | EM Carpentry & Home Maintenance",
  },
  description: siteConfig.description,
  robots: { index: false, follow: false },
};

// Fixed script with no untrusted input; apply saved preference before the first paint.
const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem('em-theme')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={siteConfig.locale} suppressHydrationWarning>
      <head>
        <script id="theme-init">{themeScript}</script>
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" className="site-width page-main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
