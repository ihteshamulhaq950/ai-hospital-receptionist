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
  Heart,
  Award,
  Users,
  Shield,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function HospitalHomePage() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAnonymous } = useAuth();

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="w-7 h-7 text-white font-bold text-xl" />
            </div>
            <span className="font-bold text-xl text-foreground">
              CityCare Hospital
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#services"
              className="text-sm font-medium text-muted-foreground hover:text-blue-600"
            >
              Services
            </Link>
            <Link
              href="#doctors"
              className="text-sm font-medium text-muted-foreground hover:text-blue-600"
            >
              Doctors
            </Link>
            <Link
              href="#contact"
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
                    href="#services"
                    className="text-base font-medium text-foreground hover:text-blue-600 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Services
                  </Link>
                  <Link
                    href="#doctors"
                    className="text-base font-medium text-foreground hover:text-blue-600 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Doctors
                  </Link>
                  <Link
                    href="#contact"
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

      {/* Hero Section */}
      <main>
        <section className="py-12 md:py-24 bg-linear-to-b from-blue-50 to-background dark:from-blue-950/20 dark:to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6 text-balance">
              World-Class Healthcare,{" "}
              <span className="text-blue-600">Close to Home</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
              CityCare provides 24/7 emergency services, specialized
              consultations, and advanced diagnostics with a patient-first
              approach.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto px-8">
                Our Services
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8"
              >
                Find a Doctor
              </Button>
              {!isAnonymous && user && user.invited_at && (
                <Link href={'/dashboard'}>
                  <Button
                  size="lg"
                  className="w-full sm:w-auto px-8 bg-linear-to-r from-blue-600 to-blue-700 hover:shadow-lg hover:shadow-blue-500/50 transition-shadow relative group"
                >
                  <div className="absolute inset-0 rounded-lg bg-blue-500 animate-ping opacity-25 group-hover:opacity-40 transition-opacity"></div>
                  <span className="relative">Go to Dashboard</span>
                </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Info Cards */}
        <section className="py-16" id="services">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                  <Phone className="w-6 h-6" />
                </div>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Call (555) 123-4567 for immediate assistance 24/7.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                  <MapPin className="w-6 h-6" />
                </div>
                <CardTitle>Visit Us</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  123 Health Ave, Medical District, NY 10001.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                  <Clock className="w-6 h-6" />
                </div>
                <CardTitle>Working Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  OPD: 9:00 AM - 8:00 PM. Emergency: Open 24 Hours.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose CityCare?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We combine cutting-edge medical technology with compassionate
                care to deliver the best health outcomes.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 text-green-600">
                    <Heart className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">
                    Patient-Centered Care
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Every decision we make prioritizes your health and comfort.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4 text-purple-600">
                    <Award className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">
                    Award-Winning Excellence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Recognized nationally for our quality of care and
                    innovation.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4 text-orange-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">Expert Medical Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Board-certified specialists with years of experience in
                    their fields.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center mb-4 text-cyan-600">
                    <Shield className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">Advanced Technology</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    State-of-the-art equipment for accurate diagnosis and
                    treatment.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/50 border-t mt-16" id="contact">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* About Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">+</span>
                </div>
                <span className="font-bold text-lg text-foreground">
                  CityCare Hospital
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Providing exceptional healthcare services with compassion and
                expertise since 1990.
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

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Our Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Departments
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Doctors
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">
                Our Services
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Emergency Care
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Cardiology
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Orthopedics
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Pediatrics
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    Laboratory
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
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
                    info@citycare.com
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

          {/* Bottom Bar */}
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © 2024 CityCare Hospital. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-blue-600 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="#"
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
        <Link href="/chat">
          <button className="relative group">
            {/* Pulsing Ring Animation */}
            <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-25 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-4 border-background">
              <Bot className="w-8 h-8" />
            </div>
          </button>
        </Link>
      </div>
    </div>
  );
}
