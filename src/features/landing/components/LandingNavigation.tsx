import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/features/shared/components/ThemeToggle";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import pasoaLogo from "@/assets/pasoa-logo.png";

export function LandingNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Announcements", href: "#announcements" },
    { label: "Events", href: "#events" },
    { label: "Acknowledgements", href: "/acknowledgements" },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-lg">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg group">
            <img
              src={pasoaLogo}
              alt="PASOA Logo"
              className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
            />
            <span className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              PASOA Student Hub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors duration-200 relative group uppercase tracking-wide"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-purple-600 to-violet-600 group-hover:w-full transition-all duration-300" />
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors duration-200 relative group uppercase tracking-wide"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-purple-600 to-violet-600 group-hover:w-full transition-all duration-300" />
                </a>
              )
            )}
          </div>

          {/* Right Side Items */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="rounded-lg hover:bg-accent"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-lg transition-shadow"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
            >
              {isOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) =>
                link.href.startsWith("/") ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-sm font-bold rounded-lg hover:bg-accent hover:text-primary transition-colors uppercase tracking-wide"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-sm font-bold rounded-lg hover:bg-accent hover:text-primary transition-colors uppercase tracking-wide"
                  >
                    {link.label}
                  </a>
                )
              )}
              <div className="border-t border-border/40 pt-3 space-y-2">
                <Button
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={() => {
                    navigate("/auth");
                    setIsOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-violet-600"
                  onClick={() => {
                    navigate("/auth");
                    setIsOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

