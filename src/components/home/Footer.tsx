import { GoRideLogo } from "@/components/icons/GoRideLogo";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Blog", href: "/blog" },
  ],
  products: [
    { label: "Ride", href: "/ride" },
    { label: "Drive", href: "/drive" },
    { label: "Business", href: "/business" },
    { label: "GoRide Eats", href: "/eats" },
  ],
  support: [
    { label: "Help Center", href: "/help" },
    { label: "Safety", href: "/safety" },
    { label: "Lost & Found", href: "/lost-found" },
    { label: "Accessibility", href: "/accessibility" },
  ],
  legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="mb-4">
              <GoRideLogo size="lg" className="[&_span]:text-background" />
            </div>
            <p className="text-background/60 text-sm mb-6 max-w-xs">
              Your reliable ride across Africa. Safe, affordable, and always on time.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-background/60">
                <Mail className="w-4 h-4" />
                <span>support@goride.rw</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-background/60">
                <Phone className="w-4 h-4" />
                <span>+250 788 123 456</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-background/60">
                <MapPin className="w-4 h-4" />
                <span>Kigali, Rwanda</span>
              </div>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-background mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold text-background mb-4">Products</h4>
            <ul className="space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-background mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-background mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/60">
            © {new Date().getFullYear()} GoRide. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5 text-background" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
