import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import pasoaLogo from "@/assets/pasoa-logo.png";

const currentYear = new Date().getFullYear();

export function LandingFooter() {
  return (
    <footer className="relative border-t border-border/40 bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg group">
              <img
                src={pasoaLogo}
                alt="PASOA Logo"
                className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
              />
              <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                PASOA Student Hub
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your digital home for announcements, events, and community connection.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              
            </div>
          </div>

          {/* Features Column */}
          <div className="space-y-4">
            <h4 className="font-bold text-foreground">Features</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-purple-600 transition-colors">
                  Announcements
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-purple-600 transition-colors">
                  Chatbot Support
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-purple-600 transition-colors">
                  Events & Registration
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-purple-600 transition-colors">
                  FAQ System
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-4">
            <h4 className="font-bold text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/auth/privacy" className="hover:text-purple-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/auth/terms" className="hover:text-purple-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="mailto:support@pasoahub.edu.ph" className="hover:text-purple-600 transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-600 transition-colors">
                  Report Bug
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-4">
            <h4 className="font-bold text-foreground">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="mailto:support@pasoahub.edu.ph" className="hover:text-purple-600 transition-colors">
                  support@pasoahub.edu.ph
                </a>
              </li>
              <li>
                <p>College of Business Administration</p>
              </li>
              <li>
                <p>PASOA, Philippines</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40" />

        {/* Bottom Footer */}
        <div className="pt-8 md:pt-12 space-y-6 md:space-y-4">
          {/* Compliance Notice */}
          <div className="bg-gradient-to-r from-purple-500/5 to-violet-500/5 border border-purple-500/20 rounded-xl p-4 text-center">
            <p className="text-xs md:text-sm text-muted-foreground">
              <span className="font-semibold text-purple-700 dark:text-purple-400">
                Privacy Compliant:
              </span>{" "}
              This platform is compliant with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173). Your personal data is securely protected.
            </p>
          </div>

          {/* Copyright */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <p className="text-xs md:text-sm text-muted-foreground">
              © {currentYear} PASOA Student Hub. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
