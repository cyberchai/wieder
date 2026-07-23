import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { ImpersonationProvider } from '@/providers/impersonation-provider';
import { QueryProvider } from '@/providers/simple-query-provider';
import { RippleTransitionProvider } from '@/providers/ripple-transition-provider';
import { RippleTransition } from '@/components/ripple-transition';
import { ImpersonationBanner } from '@/components/impersonation-banner';
import { Toaster } from "@/components/ui/toaster";
import { ThemedBody } from '@/components/themed-body';

export const metadata: Metadata = {
  title: 'wieder - learning with flashcards',
  description: 'a flashcard application for learning.',
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
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-0DM61FVYK4"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-0DM61FVYK4');
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Shantell+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Cherry+Bomb+One&display=swap" rel="stylesheet" />
      </head>
      <body>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <ImpersonationProvider>
                <RippleTransitionProvider>
                  <RippleTransition>
                    <ThemedBody>
                      <ImpersonationBanner />
                      {children}
                      <Toaster />
                    </ThemedBody>
                  </RippleTransition>
                </RippleTransitionProvider>
              </ImpersonationProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

