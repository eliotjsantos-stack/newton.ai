'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      {/* Premium Glassmorphism Navigation */}
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-white/80 backdrop-blur-2xl shadow-2xl' 
            : 'bg-transparent'
        }`}
        style={{
          boxShadow: scrolled ? '0 8px 32px rgba(0, 0, 0, 0.08)' : 'none'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div 
                className="w-11 h-11 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110"
                style={{
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
                <span className="text-lg font-bold text-white">N</span>
              </div>
              <span className="text-xl font-extrabold text-neutral-900 tracking-tight">Newton</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              <a 
                href="#features" 
                className="px-6 py-2.5 text-neutral-700 hover:text-black font-semibold rounded-2xl hover:bg-neutral-100/80 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className="px-6 py-2.5 text-neutral-700 hover:text-black font-semibold rounded-2xl hover:bg-neutral-100/80 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95"
              >
                How It Works
              </a>
              <a 
                href="#subjects" 
                className="px-6 py-2.5 text-neutral-700 hover:text-black font-semibold rounded-2xl hover:bg-neutral-100/80 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Subjects
              </a>
              <a 
                href="#faq" 
                className="px-6 py-2.5 text-neutral-700 hover:text-black font-semibold rounded-2xl hover:bg-neutral-100/80 backdrop-blur-sm transition-all duration-300 hover:scale-105 active:scale-95"
              >
                FAQ
              </a>
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
                Try Newton
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-3 hover:bg-neutral-100/80 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <svg className="w-6 h-6 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden bg-white/95 backdrop-blur-2xl border-t border-neutral-200/50 shadow-2xl animate-slideDown"
            style={{
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
            }}
          >
            <div className="px-6 py-6 space-y-3">
              <a href="#features" className="block px-6 py-4 text-neutral-700 hover:text-black font-semibold rounded-2xl hover:bg-neutral-100/80 transition-all duration-300">
                Features
              </a>
              <a href="#how-it-works" className="block px-6 py-4 text-neutral-700 hover:text-black font-semibold rounded-2xl hover:bg-neutral-100/80 transition-all duration-300">
                How It Works
              </a>
              <a href="#subjects" className="block px-6 py-4 text-neutral-700 hover:text-black font-semibold rounded-2xl hover:bg-neutral-100/80 transition-all duration-300">
                Subjects
              </a>
              <a href="#faq" className="block px-6 py-4 text-neutral-700 hover:text-black font-semibold rounded-2xl hover:bg-neutral-100/80 transition-all duration-300">
                FAQ
              </a>
              <Link href="/dashboard" className="block px-8 py-4 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white font-bold rounded-2xl text-center shadow-xl transition-all duration-300">
                Try Newton
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-5xl mx-auto mb-20 animate-fadeIn">
            <div 
              className="inline-block mb-8 px-6 py-3 bg-white/70 backdrop-blur-xl border border-neutral-200/50 rounded-full shadow-lg animate-float"
              style={{
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span className="text-sm font-bold text-neutral-900">The AI That Teaches, Not Tells</span>
              </div>
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold text-neutral-900 mb-8 tracking-tighter leading-none animate-slideUp">
              Learn to think,
              <br />
              <span className="bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent">
                not just answer
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-neutral-600 mb-12 leading-relaxed max-w-3xl mx-auto font-medium animate-slideUp" style={{ animationDelay: '100ms' }}>
              Newton refuses to do your homework. Instead, it guides you through the Socratic method—asking questions that help you discover answers yourself.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center animate-slideUp" style={{ animationDelay: '200ms' }}>
              <Link
                href="/dashboard"
                className="px-10 py-5 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white text-lg font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25), 0 6px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                Start Learning Free →
              </Link>
              <a
                href="#how-it-works"
                className="px-10 py-5 bg-white/70 backdrop-blur-xl border-2 border-neutral-200/50 text-neutral-900 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
                }}
              >
                See How It Works
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-neutral-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">No Sign-Up Required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">UK Curriculum Aligned</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Academic Integrity First</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section id="features" className="py-24 px-6 sm:px-8 lg:px-12 bg-gradient-to-br from-neutral-100 via-neutral-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl font-extrabold text-neutral-900 mb-6 tracking-tight">
              The AI Homework Crisis
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed font-medium">
              Students are using AI to complete assignments without learning anything—Newton breaks this cycle
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start mb-20">
            {/* Problem Card */}
            <div 
              className="p-10 bg-white/70 backdrop-blur-2xl border border-red-200/50 rounded-3xl shadow-2xl"
              style={{
                boxShadow: '0 16px 48px rgba(239, 68, 68, 0.15)'
              }}
            >
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-neutral-900 mb-6">Traditional AI Tools</h3>
              <ul className="space-y-4">
                {[
                  { title: 'Does homework directly', desc: 'Writes complete essays and solves problems' },
                  { title: 'No learning happens', desc: 'Students copy without understanding' },
                  { title: 'Academic dishonesty', desc: 'Work is not authentically theirs' },
                  { title: 'Exam failure', desc: 'Cannot replicate on tests without AI' }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                    <div>
                      <div className="font-bold text-neutral-900">{item.title}</div>
                      <div className="text-sm text-neutral-600 font-medium">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution Card */}
            <div 
              className="p-10 bg-white/70 backdrop-blur-2xl border border-green-200/50 rounded-3xl shadow-2xl"
              style={{
                boxShadow: '0 16px 48px rgba(34, 197, 94, 0.15)'
              }}
            >
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-neutral-900 mb-6">Newton AI</h3>
              <ul className="space-y-4">
                {[
                  { title: 'Refuses to do homework', desc: 'Detects and blocks direct problem solving' },
                  { title: 'Socratic teaching', desc: 'Asks questions that guide your thinking' },
                  { title: 'True understanding', desc: 'You learn the concepts deeply' },
                  { title: 'Exam confidence', desc: 'Prepared to solve problems independently' }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <div>
                      <div className="font-bold text-neutral-900">{item.title}</div>
                      <div className="text-sm text-neutral-600 font-medium">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: 'Socratic Method',
                description: 'Newton asks guiding questions that help you discover answers yourself, building genuine understanding'
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Academic Integrity',
                description: 'Detects and refuses homework requests—your work stays authentically yours, maintaining honest learning'
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Year-Group Adapted',
                description: 'Teaching style adjusts from Year 7 to A-Level—simpler language for younger students, deeper concepts for older'
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
                title: 'Subject Specialist',
                description: 'Covers Maths, Sciences, English, History, Languages, and more—with expert knowledge in each area'
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'GCSE & A-Level Ready',
                description: 'Aligned with UK curriculum requirements, exam command words, and assessment objectives'
              },
              {
                icon: (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'Private & Anonymous',
                description: 'No account needed, no data collected—your conversations stay completely private and secure'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-8 bg-white/70 backdrop-blur-2xl border border-neutral-200/50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-slideUp"
                style={{
                  animationDelay: `${i * 100}ms`,
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)'
                }}
              >
                <div 
                  className="w-16 h-16 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110"
                  style={{
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-4 group-hover:text-black transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl font-extrabold text-neutral-900 mb-6 tracking-tight">
              How Newton Works
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed font-medium">
              A simple 4-step process that transforms how you learn
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Ask Your Question',
                description: 'Type in what you are stuck on—whether it is a concept, problem, or essay topic',
                icon: (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                step: '2',
                title: 'Newton Asks Questions',
                description: 'Instead of giving answers, Newton asks you guiding questions to spark your thinking',
                icon: (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )
              },
              {
                step: '3',
                title: 'You Discover the Answer',
                description: 'By thinking through Newton questions, you figure out the solution on your own',
                icon: (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )
              },
              {
                step: '4',
                title: 'Deep Understanding',
                description: 'You retain the knowledge because you learned it actively, not passively copied it',
                icon: (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                )
              }
            ].map((item, i) => (
              <div
                key={i}
                className="relative p-8 bg-white/70 backdrop-blur-2xl border border-neutral-200/50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
                style={{
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)'
                }}
              >
                {/* Step Number Badge */}
                <div 
                  className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl flex items-center justify-center shadow-xl"
                  style={{
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  <span className="text-xl font-extrabold text-white">{item.step}</span>
                </div>

                {/* Icon */}
                <div 
                  className="w-16 h-16 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                  style={{
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {item.icon}
                </div>

                <h3 className="text-xl font-bold text-neutral-900 mb-3">{item.title}</h3>
                <p className="text-neutral-600 leading-relaxed font-medium">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Example Conversation */}
          <div 
            className="mt-20 p-10 bg-white/70 backdrop-blur-2xl border border-neutral-200/50 rounded-3xl shadow-2xl"
            style={{
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h3 className="text-3xl font-bold text-neutral-900 mb-8 text-center">See It In Action</h3>
            <div className="space-y-6 max-w-3xl mx-auto">
              {[
                { role: 'student', text: 'Can you solve this quadratic equation for me: x² + 5x + 6 = 0?' },
                { role: 'newton', text: 'I cannot solve it for you—that would be doing your homework! But I can help you learn. What do you know about factoring quadratics?' },
                { role: 'student', text: 'I think you need two numbers that multiply to make 6 and add to make 5?' },
                { role: 'newton', text: 'Exactly! Now you are thinking. What two numbers fit that description?' },
                { role: 'student', text: '2 and 3?' },
                { role: 'newton', text: 'Perfect! So how would you write the factored form using those numbers?' }
              ].map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-4 ${msg.role === 'student' ? 'justify-end' : 'justify-start'} animate-slideUp`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {msg.role === 'newton' && (
                    <div 
                      className="w-10 h-10 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                    >
                      <span className="text-sm font-bold text-white">N</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] px-6 py-4 rounded-2xl shadow-lg ${
                      msg.role === 'student'
                        ? 'bg-gradient-to-br from-neutral-100 to-neutral-50 border border-neutral-200/50'
                        : 'bg-white/90 backdrop-blur-sm border border-neutral-200/50'
                    }`}
                  >
                    <p className="text-neutral-800 font-medium leading-relaxed">{msg.text}</p>
                  </div>
                  {msg.role === 'student' && (
                    <div className="w-10 h-10 bg-neutral-200 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-xs font-bold text-neutral-700">You</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center mt-8 text-neutral-600 font-medium">
              Notice how Newton guides without giving away the answer? That is the Socratic method in action.
            </p>
          </div>
        </div>
      </section>

      {/* Universal Learning Section */}
      <section id="subjects" className="py-24 px-6 sm:px-8 lg:px-12 bg-gradient-to-br from-neutral-100 via-neutral-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl font-extrabold text-neutral-900 mb-6 tracking-tight">
              Works for Any Subject
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed font-medium">
              From GCSE Maths to A-Level History—Newton adapts to whatever you are learning
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { 
                name: 'STEM Subjects', 
                examples: 'Maths, Physics, Chemistry, Biology, Computer Science',
                icon: (
                  <svg className="w-8 h-8 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
              },
              { 
                name: 'Humanities', 
                examples: 'History, Geography, Religious Studies, Philosophy',
                icon: (
                  <svg className="w-8 h-8 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              { 
                name: 'Languages & Arts', 
                examples: 'English, French, Spanish, Art, Music',
                icon: (
                  <svg className="w-8 h-8 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
              }
            ].map((category, i) => (
              <div
                key={i}
                className="group p-8 bg-white/70 backdrop-blur-xl border border-neutral-200/50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
                style={{
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)'
                }}
              >
                <div className="mb-6">{category.icon}</div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3 group-hover:text-black transition-colors duration-300">
                  {category.name}
                </h3>
                <p className="text-neutral-600 font-medium leading-relaxed">
                  {category.examples}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-lg text-neutral-600 font-semibold mb-8">
              Year 7 to Year 13 • GCSE to A-Level • Any topic you need help with
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-10 py-4 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
              }}
            >
              Try Newton Now →
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl sm:text-6xl font-extrabold text-neutral-900 mb-6 tracking-tight">
              What Students & Teachers Say
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto font-medium">
              Real feedback from people using Newton every day
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                quote: "I love the fact that it gives methodology suggestions and guidance rather than quick fix solutions.",
                author: "Kate Williams",
                role: "Maths Teacher",
                rating: 5
              },
              {
                quote: "I was struggling to understand the constant of e in A-Level maths. Newton explained it really well and I now understand. When I asked it to write an essay, it refused because that would be cheating—but it did help me construct my own essay, which was very helpful!",
                author: "Grace Adam",
                role: "Year 12 Student",
                rating: 5
              },
              {
                quote: "This helps students plan essays and create ideas for certain points. It stops students from using inaccurate quotations which is a problem for English lit. Really good for humanities students to further their understanding.",
                author: "Flora Meyrick",
                role: "Year 12 Student",
                rating: 5
              },
              {
                quote: "If I want to get work done quickly, I use ChatGPT. But if I am actually trying to learn how to do my work—which I have been doing because I know I will not be able to use AI in exams—Newton is really useful.",
                author: "Pippin Wilce",
                role: "Year 12 Student",
                rating: 4
              }
            ].map((testimonial, i) => (
              <div
                key={i}
                className="p-8 bg-white/70 backdrop-blur-2xl border border-neutral-200/50 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300"
                style={{
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)'
                }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, starIndex) => (
                    <svg 
                      key={starIndex} 
                      className={`w-5 h-5 ${starIndex < testimonial.rating ? 'text-yellow-400' : 'text-neutral-300'}`}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-base text-neutral-700 font-medium leading-relaxed mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="border-t border-neutral-200 pt-4">
                  <p className="font-bold text-neutral-900">{testimonial.author}</p>
                  <p className="text-sm text-neutral-600 font-medium">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 sm:px-8 lg:px-12 bg-gradient-to-br from-neutral-100 via-neutral-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl sm:text-6xl font-extrabold text-neutral-900 mb-6 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Do I need to create an account?',
                a: 'No! You can start using Newton immediately without signing up. We respect your privacy and do not collect personal data.'
              },
              {
                q: 'Will Newton do my homework for me?',
                a: 'Absolutely not. Newton is specifically designed to detect and refuse homework requests. It will guide you to understand concepts, but never give direct answers that could be submitted as your work.'
              },
              {
                q: 'What subjects does Newton cover?',
                a: 'Newton covers all major GCSE and A-Level subjects including Maths, Sciences (Biology, Chemistry, Physics), English, History, Geography, and Languages. It adapts to any academic topic you need help with.'
              },
              {
                q: 'How does Newton know my year group?',
                a: 'When you first use Newton, it asks your year group (Year 7-13). This helps it adjust explanations to your level—simpler for younger students, more sophisticated for A-Level.'
              },
              {
                q: 'Can Newton help me prepare for exams?',
                a: 'Yes! Newton helps you understand concepts deeply, which is the best exam preparation. It will not solve practice questions for you, but it will guide you through the thinking process.'
              },
              {
                q: 'Is my data private?',
                a: 'Completely. Newton does not require login, does not store personal information, and your conversations stay private. We take privacy seriously.'
              },
              {
                q: 'What if Newton cannot answer my question?',
                a: 'Newton is powered by advanced AI and can handle most academic questions. If it encounters something unusual, it will be honest about its limitations and guide you to other resources.'
              },
              {
                q: 'How is Newton different from ChatGPT?',
                a: 'Unlike ChatGPT, Newton refuses to do your homework. It uses the Socratic method to teach you to think critically, rather than giving you answers you can copy. This means you actually learn the material.'
              }
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-white/70 backdrop-blur-2xl border border-neutral-200/50 rounded-2xl shadow-lg overflow-hidden"
                style={{
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)'
                }}
              >
                <button
                  onClick={() => setActiveAccordion(activeAccordion === i ? null : i)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-white/50 transition-all duration-300"
                >
                  <span className="text-lg font-bold text-neutral-900 pr-4">{faq.q}</span>
                  <svg 
                    className={`w-6 h-6 text-neutral-600 flex-shrink-0 transition-transform duration-300 ${
                      activeAccordion === i ? 'rotate-180' : ''
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeAccordion === i && (
                  <div className="px-8 pb-6 text-neutral-700 font-medium leading-relaxed animate-slideDown">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 px-6 sm:px-8 lg:px-12 bg-gradient-to-br from-neutral-900 to-neutral-800 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl sm:text-6xl font-extrabold text-white mb-8 tracking-tight">
            Start Learning the Right Way
          </h2>
          <p className="text-xl text-neutral-300 mb-12 leading-relaxed font-medium max-w-2xl mx-auto">
            Join thousands of students who are learning to think, not just copying answers.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link
              href="/dashboard"
              className="px-12 py-5 bg-white text-neutral-900 text-lg font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                boxShadow: '0 16px 48px rgba(255, 255, 255, 0.3)'
              }}
            >
              Try Newton Now →
            </Link>
            <a
              href="#features"
              className="px-12 py-5 bg-white/10 backdrop-blur-xl border-2 border-white/30 text-white text-lg font-bold rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Learn More
            </a>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-neutral-300">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">No Sign-Up Required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Start in Seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Real Learning</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 sm:px-8 lg:px-12 bg-white/70 backdrop-blur-2xl border-t border-neutral-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
                <span className="text-base font-bold text-white">N</span>
              </div>
              <span className="text-lg font-bold text-neutral-900">Newton</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8">
              <a href="#features" className="text-neutral-600 hover:text-black font-semibold transition-colors duration-300">
                Features
              </a>
              <a href="#how-it-works" className="text-neutral-600 hover:text-black font-semibold transition-colors duration-300">
                How It Works
              </a>
              <a href="#subjects" className="text-neutral-600 hover:text-black font-semibold transition-colors duration-300">
                Subjects
              </a>
              <a href="#faq" className="text-neutral-600 hover:text-black font-semibold transition-colors duration-300">
                FAQ
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-neutral-200/50 text-center text-neutral-600 font-medium">
            <p>© 2025 Newton AI. Helping students learn to think.</p>
            <p className="mt-2 text-sm">Built with academic integrity at its core.</p>
          </div>
        </div>
      </footer>

      {/* Premium CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .animate-slideUp {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        
        .animate-slideDown {
          animation: slideDown 0.4s ease-out forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}