import React from "react";
import { Link } from "react-router-dom";
import section1 from "../assets/section1.jpg";
import section2 from "../assets/section2.jpg";
import card1 from "../assets/card1.jpg";
import card2 from "../assets/card2.jpg";
import card3 from "../assets/card3.jpg";
import section3 from "../assets/section3.jpg";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
    
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-lg sticky top-0 z-50">
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
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${section1})` }}
        />

        {/* Blue + dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 via-slate-900/60 to-slate-950/80" />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-white">
            Detect crises.<br />
            <span className="text-blue-400">Coordinate response.</span><br />
            Save lives.
          </h1>

          <p className="text-base md:text-lg text-slate-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            CrisisNet gives communities and authorities real-time intelligence and coordination tools
            to detect disasters faster, allocate resources smarter, and save more lives.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-4 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-xl"
            >
              Start Now — It's Free
            </Link>

            <Link
              to="/login"
              className="px-8 py-4 rounded-lg font-semibold border border-white/30 text-white hover:bg-white/10 transition"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative h-screen snap-start flex items-center overflow-hidden"
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${section2})` }}
        />
        
        {/* Optional: Add overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="relative z-10 w-full px-6">
          <div className="max-w-7xl mx-auto text-white">

            {/* Title */}
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
                From Crisis to Response in Seconds
              </h2>
              <p className="text-base md:text-lg text-white/90 max-w-3xl mx-auto font-medium">
                Our four-stage pipeline detects crises, validates threats, and
                coordinates the right resources — instantly.
              </p>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              {[
                ["1", "Detect", "AI analyzes reports, sensors, and signals."],
                ["2", "Evaluate", "Trust scoring filters real threats."],
                ["3", "Allocate", "Resources matched by skill & location."],
                ["4", "Notify", "Alerts via SMS, Telegram & push."],
              ].map(([n, title, desc]) => (
                <div key={n} className="text-center">
                  
                  {/* ORANGE / RUST CIRCLE */}
                  <div className="
                    mx-auto w-14 h-14 rounded-full 
                    bg-orange-500 text-white 
                    flex items-center justify-center 
                    text-lg font-extrabold 
                    mb-4 shadow-lg
                  ">
                    {n}
                  </div>

                  <h3 className="text-lg font-bold mb-2">
                    {title}
                  </h3>
                  <p className="text-sm md:text-base text-white/90 font-medium">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Features row */}
            <div className="grid md:grid-cols-2 gap-10 md:gap-16">
              
              <div className="flex flex-col items-center">
                <div className="max-w-md w-full">
                  <h3 className="text-xl md:text-2xl font-bold mb-4 text-center">
                    Detection & Intelligence
                  </h3>
                  <ul className="space-y-3 text-white/90 text-base font-medium pl-4">
                    <li>• Real-time multi-source monitoring</li>
                    <li>• Reputation-based trust scoring</li>
                    <li>• Severity & urgency assessment</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="max-w-md w-full">
                  <h3 className="text-xl md:text-2xl font-bold mb-4 text-center">
                    Coordination & Response
                  </h3>
                  <ul className="space-y-3 text-white/90 text-base font-medium pl-4">
                    <li>• Smart resource allocation</li>
                    <li>• Volunteer skill matching</li>
                    <li>• Role-based access control</li>
                  </ul>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      <section className="relative py-16 px-6 overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${section3})` }}
        />

        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 max-w-7xl mx-auto text-white">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">
            Why Communities Trust CrisisNet
          </h2>
          <p className="text-slate-200 text-center max-w-3xl mx-auto mb-12 text-sm md:text-base">
            Built to respond fast, stay secure, and work anywhere — even when infrastructure fails.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[ 
              { img: card1, title: "Lightning Fast", text: "From detection to response in seconds. Every second counts." },
              { img: card2, title: "Enterprise Security", text: "Bank-level encryption with strict role-based access control." },
              { img: card3, title: "Global Ready", text: "Works across regions, languages, and even offline environments." },
            ].map((card, i) => (
              <div key={i} className="relative h-72 rounded-xl overflow-hidden border border-white/10">
                <img
                  src={card.img}
                  alt={card.title}
                  className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-110"
                />
                <div className="absolute inset-0 bg-black/40" />

                <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                  <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-200">{card.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <h3 className="text-2xl font-bold mb-3">Ready to coordinate better?</h3>
            <p className="text-slate-200 mb-6 text-sm">
              Join communities and authorities already using CrisisNet.
            </p>
            <Link
              to="/signup"
              className="inline-block px-8 py-3 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 transition"
            >
              Get Started — Free Account
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-6 px-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 border-t border-slate-700">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs text-slate-300">
            © 2025 CrisisNet. Built to save lives.
          </p>
        </div>
      </footer>
    </div>
  );
}