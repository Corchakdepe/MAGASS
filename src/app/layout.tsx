// app/layout.tsx
import './globals.css';
import AppLayout from '@/components/app-layout';

export const metadata = { title: 'Gonzalo Bike Dashboard' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {/* AppLayout controls the whole shell; children are unused here */}
        <AppLayout />
      </body>
    </html>
  );
}
