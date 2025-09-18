import { Form, Link } from "react-router";

interface User {
  id: number;
  email: string;
  display_name?: string;
}

interface NavigationProps {
  user?: User | null;
}

export function Navigation({ user }: NavigationProps) {
  return (
    <header className="bg-secondary/90 backdrop-blur-sm border-b border-theme sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 accent-orange rounded-full flex items-center justify-center">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                <defs>
                  <radialGradient id="nucleusGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFB347" />
                    <stop offset="100%" stopColor="#FF6B35" />
                  </radialGradient>
                </defs>
                <g transform="translate(100,100)">
                  <ellipse cx="0" cy="0" rx="50" ry="15" fill="none" stroke="#40E0D0" strokeWidth="2" opacity="0.8"/>
                  <ellipse cx="0" cy="0" rx="50" ry="15" fill="none" stroke="#40E0D0" strokeWidth="2" opacity="0.8" transform="rotate(60)"/>
                  <ellipse cx="0" cy="0" rx="50" ry="15" fill="none" stroke="#40E0D0" strokeWidth="2" opacity="0.8" transform="rotate(120)"/>
                </g>
                <circle cx="100" cy="100" r="15" fill="url(#nucleusGradient)"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-primary">ABSURD</h1>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-primary">
          <Link
            to="/campaigns"
            className="hover:accent-orange-text transition-colors text-lg font-semibold"
          >
            Campaigns
          </Link>
          <Link
            to="/shop"
            className="hover:accent-orange-text transition-colors text-lg font-semibold"
          >
            Shop
          </Link>
          <Link
            to="/guild"
            className="hover:accent-orange-text transition-colors text-lg font-semibold"
          >
            Guild
          </Link>
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center hover:accent-orange transition-colors"
            onClick={() => {
              document.documentElement.classList.toggle('dark');
              const isDark = document.documentElement.classList.contains('dark');
              localStorage.theme = isDark ? 'dark' : 'light';
            }}
          >
            <i className="fas fa-moon text-primary"></i>
          </button>

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-primary">
                  {user.display_name || user.email}
                </div>
                <div className="text-xs text-secondary">Maker</div>
              </div>
              <div className="relative group">
                <button className="w-10 h-10 rounded-full bg-accent-orange flex items-center justify-center text-on-accent font-bold">
                  {(user.display_name || user.email)[0].toUpperCase()}
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-secondary border-2 border-theme rounded-2xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="py-2">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-primary hover:bg-tertiary"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-primary hover:bg-tertiary"
                    >
                      Dashboard
                    </Link>
                    <hr className="my-2 border-theme" />
                    <Form method="post" action="/auth/logout">
                      <button
                        type="submit"
                        className="block w-full text-left px-4 py-2 text-sm text-primary hover:bg-tertiary"
                      >
                        Sign Out
                      </button>
                    </Form>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Link
              to="/auth/login"
              className="accent-orange text-on-accent px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              Join Guild
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t border-theme">
        <div className="grid grid-cols-4 h-16">
          <Link
            to="/campaigns"
            className="flex flex-col items-center justify-center text-secondary hover:accent-orange-text transition-colors"
          >
            <i className="fas fa-rocket text-xl"></i>
            <span className="text-xs mt-1">Campaigns</span>
          </Link>
          <Link
            to="/shop"
            className="flex flex-col items-center justify-center text-secondary hover:accent-orange-text transition-colors"
          >
            <i className="fas fa-shopping-cart text-xl"></i>
            <span className="text-xs mt-1">Shop</span>
          </Link>
          <Link
            to="/guild"
            className="flex flex-col items-center justify-center text-secondary hover:accent-orange-text transition-colors"
          >
            <i className="fas fa-users text-xl"></i>
            <span className="text-xs mt-1">Guild</span>
          </Link>
          <Link
            to={user ? "/dashboard" : "/auth/login"}
            className="flex flex-col items-center justify-center text-secondary hover:accent-orange-text transition-colors"
          >
            <i className="fas fa-user-circle text-xl"></i>
            <span className="text-xs mt-1">You</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}