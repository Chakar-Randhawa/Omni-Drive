import '../styles/globals.css';
import { SearchProvider } from '../context/SearchContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata = {
  title: 'OmniDrive Tools — Free Client-Side Browser Utilities',
  description: '105+ high-performance, private, client-side developer, PDF, image, audio, text, and financial tools. Zero server file uploads.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F7F8FC] text-[#111827] antialiased">
        <SearchProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </SearchProvider>
      </body>
    </html>
  );
}
