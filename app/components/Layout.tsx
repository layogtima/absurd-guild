interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-primary text-primary transition-colors duration-200">
      {children}
    </div>
  );
}
