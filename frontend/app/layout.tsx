import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'ReachInbox Scheduler',
  description: 'Cold email scheduler with multi-sender rotation and delivery caps',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white text-neutral-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
