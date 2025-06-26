import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="max-w-3xl mx-auto w-full flex flex-col flex-1">
        <main className="flex-grow py-6">{children}</main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
