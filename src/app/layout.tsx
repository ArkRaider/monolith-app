import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Dancing_Script } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import Script from 'next/script';

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-script",
  subsets: ["latin"],
});

import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/context/NotificationContext";
import { InboxProvider } from "@/context/InboxContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { ProfileProvider } from "@/context/ProfileContext";
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
          colorBackground: '#ffffff',
          colorText: '#141311',
          colorInputBackground: '#f3f4f6',
          colorInputText: '#141311'
        }
      }}
    >
      <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${dancingScript.variable} h-full antialiased`} suppressHydrationWarning>
        <body className="min-h-full flex flex-col">
          {/* Theme initializer — keeps your selected UI Profile after refresh */}
          <Script id="theme-initializer">
            {`
              try {
                var layout = localStorage.getItem('layoutPreference');
                if (layout) {
                  document.documentElement.dataset.layout = layout;
                }
              } catch (e) {}
            `}
          </Script>
          {/* We use ThemeProvider to manage your custom UI Profiles */}
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="structural-brutalist"
            enableSystem={false}
            themes={[
              'structural-brutalist', 'lofi-aesthetic', 'dark-academia',
              'light-academia', 'pastel-dream', 'cyberpunk-neon',
              'deep-abyss', 'matcha-zen', 'monochrome',
              'metallic-silver', 'sunset-vaporwave'
            ]}
          >
            <NotificationProvider>
              <NotificationsProvider>
                <ProfileProvider>
                  <InboxProvider>
                    {children}
                    <InboxWidget />
                  </InboxProvider>
                </ProfileProvider>
              </NotificationsProvider>
            </NotificationProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}