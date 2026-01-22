// app/layout.tsx
import './globals.css';
import AppLayout from '@/components/app-layout';
import { LanguageProvider } from '@/contexts/LanguageContext';

export const metadata = { title: 'Gonzalo Bike Dashboard' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <LanguageProvider>
          <AppLayout />
        </LanguageProvider>
      </body>
    </html>
  );
}
