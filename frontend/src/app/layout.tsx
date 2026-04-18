import type { Metadata } from 'next';
import { Orbitron, Rajdhani } from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  variable: '--font-rajdhani',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Vein-Based ATM Authentication',
  description: 'Simulation-ready vein authentication platform with Firestore',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${orbitron.variable} ${rajdhani.variable} app-shell`}
        style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
