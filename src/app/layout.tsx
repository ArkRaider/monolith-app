import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/context/NotificationContext";
import { InboxProvider } from "@/context/InboxContext";
import { InboxWidget } from "@/components/InboxWidget";

export const metadata: Metadata = {
  title: "Monolith Study",
  description: "A place to do the work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#787958',
          colorBackground: '#ffffff',      // Forces the whole box to be white
          colorText: '#141311',            // Forces the main text to be dark
          colorInputBackground: '#f3f4f6', // Light gray background for inputs
          colorInputText: '#141311'        // Dark text inside inputs
        }
      }}
    >
      <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
        <head>
          {/* Theme initializer — runs before paint to avoid FOUC */}
          <Script
            id="theme-initializer"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  let layout = localStorage.getItem('layoutPreference');
                  if (!layout) {
                    layout = 'structural-brutalist';
                  }
                  document.documentElement.dataset.layout = layout;
                } catch (e) {}
              `,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col">
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="structural-brutalist"
            enableSystem={false}
          >
            <NotificationProvider>
              <InboxProvider>
                {children}
                {/* InboxWidget lives at root — persists on all routes
                    including /room/[slug]/studio. The floating button
                    is suppressed in rooms; only the panel overlay shows. */}
                <InboxWidget />
              </InboxProvider>
            </NotificationProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}