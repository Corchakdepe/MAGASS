// app/layout.tsx
import './globals.css';
import AppLayout from '@/components/app-layout';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SimulationProvider } from '@/contexts/SimulationContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <SimulationProvider>
            <AppLayout>{children}</AppLayout>
          </SimulationProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
