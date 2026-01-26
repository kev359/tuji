import './globals.css';

export const metadata = {
  title: 'TUJIIMARISHE - Self Help Group Management',
  description: 'Digital platform for managing contributions, loans, and members',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
