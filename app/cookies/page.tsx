"use client";

import Link from "next/link";
import {
  Bot,
  Phone,
  MapPin,
  Clock,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MessageCircle,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState } from "react";

export default function CookiePolicyPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="w-7 h-7 text-white font-bold text-xl" />
            </div>
            <span className="font-bold text-xl text-foreground">
              Care Link Hospital
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/#services"
              className="text-sm font-medium text-muted-foreground hover:text-blue-600"
            >
              Services
            </Link>
            <Link
              href="/#doctors"
              className="text-sm font-medium text-muted-foreground hover:text-blue-600"
            >
              Doctors
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground hover:text-blue-600"
            >
              Contact
            </Link>
            <Button size="sm">Book Appointment</Button>
            <ThemeToggle />
          </nav>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-75 sm:w-100">
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                </VisuallyHidden>
                <nav className="flex flex-col gap-2 mt-8">
                  <Link
                    href="/#services"
                    className="text-base font-medium text-foreground hover:text-blue-600 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Services
                  </Link>
                  <Link
                    href="/#doctors"
                    className="text-base font-medium text-foreground hover:text-blue-600 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Doctors
                  </Link>
                  <Link
                    href="/contact"
                    className="text-base font-medium text-foreground hover:text-blue-600 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Contact
                  </Link>
                  <Button
                    className="m-6"
                    size="lg"
                    onClick={() => setIsOpen(false)}
                  >
                    Book Appointment
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-8">
            Cookie Policy
          </h1>

          <div className="space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                1. What Are Cookies?
              </h2>
              <p className="text-base leading-relaxed">
                Cookies are small data files that are placed on your device when you visit a website. They help us enhance your experience, analyze website usage, and deliver personalized content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                2. Types of Cookies We Use
              </h2>
              <p className="text-base leading-relaxed mb-4">
                Care Link Hospital uses the following types of cookies:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly and cannot be disabled.</li>
                <li><strong>Performance Cookies:</strong> These help us understand how visitors use our website by collecting information about pages visited and errors encountered.</li>
                <li><strong>Functionality Cookies:</strong> These enable the website to provide enhanced functionality and personalization based on your preferences.</li>
                <li><strong>Marketing Cookies:</strong> These track your activity to deliver targeted advertising and measure campaign effectiveness.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                3. How We Use Cookies
              </h2>
              <p className="text-base leading-relaxed">
                We use cookies to remember your preferences, understand how you use our website, improve our services, and provide you with relevant content and advertising. This helps us deliver a better user experience and measure the effectiveness of our marketing campaigns.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                4. Third-Party Cookies
              </h2>
              <p className="text-base leading-relaxed">
                Our website may contain links to third-party websites and services that use their own cookies. We are not responsible for the cookie practices of third-party sites. Please review their privacy policies to understand their cookie usage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                5. Managing Your Cookies
              </h2>
              <p className="text-base leading-relaxed mb-4">
                You can control and manage cookies through your browser settings. Most browsers allow you to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li>View what cookies are set on your device</li>
                <li>Allow or block specific cookies</li>
                <li>Delete all cookies from your device</li>
                <li>Set your browser to notify you when a cookie is being set</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                6. Contact Us
              </h2>
              <p className="text-base leading-relaxed">
                If you have questions about our cookie policy, please contact us at:
              </p>
              <p className="text-base leading-relaxed mt-4">
                Email: cookies@carelink.com<br />
                Phone: (555) 123-4567
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted/50 border-t mt-16" id="contact">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">+</span>
                </div>
                <span className="font-bold text-lg text-foreground">
                  Care Link Hospital
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Providing exceptional healthcare services with compassion and expertise since 1990.
              </p>
              <div className="flex gap-3">
                <Link
                  href="#"
                  className="w-9 h-9 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:border-blue-600 transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </Link>
                <Link
                  href="#"
                  className="w-9 h-9 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:border-blue-600 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </Link>
                <Link
                  href="#"
                  className="w-9 h-9 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:border-blue-600 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </Link>
                <Link
                  href="#"
                  className="w-9 h-9 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:border-blue-600 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Our Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Doctors
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Our Services</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Emergency Care
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Cardiology
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Orthopedics
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Pediatrics
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Laboratory
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Contact Us</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    123 Health Ave, Medical District, NY 10001
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    (555) 123-4567
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    info@carelink.com
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    Emergency: 24/7
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © 2024 Care Link Hospital. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating AI Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <div className="bg-background px-4 py-2 rounded-2xl shadow-xl border border-blue-100 dark:border-blue-900 animate-bounce">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap">
            Hi, how can I help you?
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/chat">
            <button className="relative group">
              <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-4 border-background">
                <Bot className="w-8 h-8" />
              </div>
            </button>
          </Link>
          <button
            onClick={async () => {
              const response = await fetch('/api/whatsapp/contact');
              if (response.ok) {
                const data = await response.json();
                if (data.redirect) {
                  window.open(data.redirect, '_blank');
                }
              }
            }}
            className="relative group"
          >
            <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-25 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative w-16 h-16 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-4 border-background">
              <MessageCircle className="w-8 h-8" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
