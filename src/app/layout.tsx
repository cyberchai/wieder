import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { Toaster } from "@/components/ui/toaster";
import { ThemedBody } from '@/components/themed-body';

export const metadata: Metadata = {
  title: 'Wieder - Modern Flashcards',
  description: 'A modern flashcard application for effective learning.',
};

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <head>
//         <link rel="preconnect" href="https://fonts.googleapis.com" />
//         <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
//         <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
//       </head>
//       <ThemeProvider>
//         <AuthProvider>
//           <ThemedBody>
//             {children}
//             <Toaster />
//           </ThemedBody>
//         </AuthProvider>
//       </ThemeProvider>
//     </html>
//   );
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ThemedBody>
              {children}
              <Toaster />
            </ThemedBody>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

