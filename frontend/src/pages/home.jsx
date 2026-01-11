import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition">
            <span className="font-bold text-xl tracking-tight text-white">CrisisNet</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-sm text-slate-300 hover:text-white transition">
              How It Works
            </a>
            <a href="#features" className="text-sm text-slate-300 hover:text-white transition">
              Features
            </a>
            <a href="#contact" className="text-sm text-slate-300 hover:text-white transition">
              Contact
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20 px-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-slate-900">
            Detect crises.<br />
            <span className="text-blue-700">Coordinate response.</span><br />
            Save lives.
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            CrisisNet gives communities and authorities real-time intelligence and coordination tools 
            to detect disasters faster, allocate resources smarter, and save more lives.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-4 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Start Now — It's Free
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-lg font-semibold border border-slate-300 text-slate-900 hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              From Crisis to Response in Seconds
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our four-stage pipeline detects emerging crises, validates threats, 
              and coordinates the right resources to the right place—instantly.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="relative">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-3xl font-semibold text-blue-700">
                  1
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Detect</h3>
                <p className="text-sm text-slate-600 text-center">
                  AI analyzes reports, sensors, and social signals to identify emerging crises in real-time.
                </p>
              </div>
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-1 bg-gradient-to-r from-blue-300 to-transparent"></div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-3xl font-semibold text-blue-700">
                  2
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Evaluate</h3>
                <p className="text-sm text-slate-600 text-center">
                  Trust scoring filters false alarms and prioritizes verified, high-confidence threats.
                </p>
              </div>
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-1 bg-gradient-to-r from-blue-300 to-transparent"></div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-3xl font-semibold text-blue-700">
                  3
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Allocate</h3>
                <p className="text-sm text-slate-600 text-center">
                  Instantly match available volunteers and resources to crisis needs by location and skill.
                </p>
              </div>
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-1 bg-gradient-to-r from-blue-300 to-transparent"></div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-3xl font-semibold text-blue-700">
                  4
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Notify</h3>
                <p className="text-sm text-slate-600 text-center">
                  Send real-time alerts to all stakeholders via Telegram, SMS, and push notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">
            Built for Crisis Response
          </h2>

          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-6">
                Detection & Intelligence
              </h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Multi-source crisis detection powered by AI. Our algorithms analyze reports, 
                social media, sensors, and expert networks to spot emerging threats before they escalate.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-slate-600">Real-time multi-source monitoring</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-slate-600">Reputation-based trust scoring</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-slate-600">Severity & urgency assessment</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-6">
                Coordination & Response
              </h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Instantly coordinate volunteers, resources, and authorities. Location-aware matching 
                ensures the right help gets to the right place at the right time.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span className="text-slate-600">Smart resource allocation by location</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span className="text-slate-600">Volunteer skill & availability matching</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span className="text-slate-600">Role-based access control (citizens, volunteers, authorities)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16">
            Why Communities Trust CrisisNet
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Lightning Fast</h3>
              <p className="text-slate-600 text-sm">
                From detection to response in seconds. Every second counts in a crisis.
              </p>
            </div>

            <div className="p-8 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Enterprise Security</h3>
              <p className="text-slate-600 text-sm">
                Bank-level encryption and compliance with emergency response standards.
              </p>
            </div>

            <div className="p-8 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Global Ready</h3>
              <p className="text-slate-600 text-sm">
                Works across geographies and in any language. No internet? Works offline too.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 px-6 bg-blue-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Ready to coordinate better?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Join communities and authorities already using CrisisNet to respond faster and smarter to emergencies.
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 py-4 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Get Started — Free Account
          </Link>
          <p className="text-sm text-slate-600 mt-4">
            No credit card required. Set up in minutes.
          </p>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <span className="font-semibold text-slate-900">CrisisNet</span>
              </Link>
              <p className="text-sm text-slate-600">
                Real-time crisis detection, intelligence, and coordination platform.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#how-it-works" className="text-slate-600 hover:text-slate-900">How It Works</a></li>
                <li><a href="#features" className="text-slate-600 hover:text-slate-900">Features</a></li>
                <li><a href="#" className="text-slate-600 hover:text-slate-900">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-600 hover:text-slate-900">Documentation</a></li>
                <li><a href="#" className="text-slate-600 hover:text-slate-900">Blog</a></li>
                <li><a href="#" className="text-slate-600 hover:text-slate-900">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-600 hover:text-slate-900">Privacy</a></li>
                <li><a href="#" className="text-slate-600 hover:text-slate-900">Terms</a></li>
                <li><a href="#" className="text-slate-600 hover:text-slate-900">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 text-center">
            <p className="text-sm text-slate-600">
              © 2025 CrisisNet. Built to save lives.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
