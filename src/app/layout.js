import './globals.css';
import Navbar from '@/components/Navbar';
import DevCredits from '@/components/DevCredits';

export const metadata = {
  title: 'HAU Enrollment Queuing System',
  description: 'Digital enrollment queuing system for Holy Angel University — School of Computing',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
        <Navbar />
        {children}
        <DevCredits />
      </body>
    </html>
  );
}
