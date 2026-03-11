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

export default function DataDeletionPage() {
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
            Data Deletion Policy
          </h1>

          <div className="space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                1. Our Data Storage Practices
              </h2>
              <p className="text-base leading-relaxed">
                Care Link Hospital processes messages through our AI-powered assistant. We maintain the following data practices to protect your privacy:
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                2. How We Handle Your Data
              </h2>
              <p className="text-base leading-relaxed mb-4">
                Depending on how you interact with our system:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li>Messages are processed anonymously without collecting personal identification details</li>
                <li>No email addresses or personal contact information are stored</li>
                <li>Data is retained only as long as necessary for service improvement</li>
                <li>All stored information is encrypted and protected</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                3. Your Right to Data Deletion
              </h2>
              <p className="text-base leading-relaxed">
                You have the right to request deletion of your personal data at any time. Since we store messages anonymously and do not collect personally identifiable information, data deletion requests are straightforward and swift. Contact us to submit a deletion request.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                4. How to Request Data Deletion
              </h2>
              <p className="text-base leading-relaxed mb-4">
                To request deletion of your data, please:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li>Email us at privacy@carelink.com with subject "Data Deletion Request"</li>
                <li>Include any relevant information that helps us identify your data</li>
                <li>We will respond within 30 days of receiving your request</li>
                <li>Your data will be permanently deleted and cannot be recovered</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                5. Third-Party Service Providers
              </h2>
              <p className="text-base leading-relaxed">
                If your data has been shared with third-party service providers, we will coordinate with them to ensure your data is deleted from their systems as well. This process may take up to 60 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                6. Contact Us
              </h2>
              <p className="text-base leading-relaxed">
                For any questions about data deletion or privacy concerns, please contact us:
              </p>
              <p className="text-base leading-relaxed mt-4">
                Care Link Hospital<br />
                Email: privacy@carelink.com<br />
                Phone: (555) 123-4567<br />
                Address: 123 Health Ave, Medical District, NY 10001
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
                href="/privacy-policy"
                className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/data-deletion"
                className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
              >
                Data Deletion
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

