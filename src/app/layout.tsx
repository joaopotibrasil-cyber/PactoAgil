import type { Metadata } from 'next';
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontSerif = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Pacto Ágil - Negociações coletivas com inteligência',
  description:
    'Micro-SaaS para sindicatos e escritórios trabalhistas: análise, criação e gestão de ACT e CCT com fluxo inteligente.',
  icons: {
    icon: '/logo-pacto-agil-new.png?v=2',
    shortcut: '/logo-pacto-agil-new.png?v=2',
    apple: '/logo-pacto-agil-new.png?v=2',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} font-sans antialiased bg-background text-foreground min-h-screen relative flex flex-col selection:bg-accent selection:text-accent-foreground overflow-x-hidden`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('pacto-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (_) {}
              })();
            `,
          }}
        />
        <div className="bg-noise" />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
