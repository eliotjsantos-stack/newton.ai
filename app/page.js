'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-xl border-b border-neutral-200 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-semibold text-black tracking-tight">Newton</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-10">
              <a href="#how-it-works" className="text-sm text-neutral-600 hover:text-black transition">How it works</a>
              <a href="#features" className="text-sm text-neutral-600 hover:text-black transition">Features</a>
              <a href="#for-teachers" className="text-sm text-neutral-600 hover:text-black transition">For teachers</a>
              <Link href="/chat" className="px-5 py-2 bg-black text-white text-sm rounded-full hover:bg-neutral-800 transition">
                Try Newton
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t border-neutral-200">
              <a href="#how-it-works" className="block px-4 py-2 text-sm text-neutral-600">How it works</a>
              <a href="#features" className="block px-4 py-2 text-sm text-neutral-600">Features</a>
              <a href="#for-teachers" className="block px-4 py-2 text-sm text-neutral-600">For teachers</a>
              <Link href="/chat" className="block px-4 py-2 bg-black text-white text-sm rounded-full text-center mt-4">
                Try Newton
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-neutral-500 mb-8 tracking-wide uppercase">Education AI</p>

          <h1 className="text-6xl md:text-8xl font-semibold text-black mb-8 leading-[1.05] tracking-tight">
            Teaches students
            <br />
            to think.
          </h1>

          <p className="text-xl md:text-2xl text-neutral-600 mb-16 max-w-2xl mx-auto font-light leading-relaxed">
            Newton refuses to do homework. Instead, it guides learning through thoughtful questioning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href="/chat" className="px-8 py-3.5 bg-black text-white rounded-full hover:bg-neutral-800 transition text-base">
              Try Newton
            </Link>
            <a href="#how-it-works" className="px-8 py-3.5 border border-neutral-300 text-black rounded-full hover:border-black transition text-base">
              Learn more
            </a>
          </div>

          {/* Guardian Badge */}
          <div className="border-t border-neutral-200 pt-8">
            <p className="text-sm text-neutral-500">
              &ldquo;Students fear AI is eroding their study ability&rdquo; — <span className="text-black">The Guardian</span>
            </p>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-32 px-6 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-semibold text-black mb-6 tracking-tight">The problem</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto font-light">
              Traditional AI tools enable shortcuts. Newton enables learning.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-3xl border border-neutral-200">
              <h3 className="text-lg font-medium text-black mb-3">AI does the work</h3>
              <p className="text-neutral-600 leading-relaxed">Students copy-paste from ChatGPT without understanding the material.</p>
            </div>

            <div className="bg-white p-10 rounded-3xl border border-neutral-200">
              <h3 className="text-lg font-medium text-black mb-3">Learning declines</h3>
              <p className="text-neutral-600 leading-relaxed">Critical thinking skills erode when AI provides instant answers.</p>
            </div>

            <div className="bg-white p-10 rounded-3xl border border-neutral-200">
              <h3 className="text-lg font-medium text-black mb-3">Teachers struggle</h3>
              <p className="text-neutral-600 leading-relaxed">Detecting AI-generated work is nearly impossible.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-semibold text-black mb-6 tracking-tight">How Newton works</h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto font-light">
              Built to maintain academic integrity while genuinely helping students learn.
            </p>
          </div>

          <div className="space-y-24">
            {/* Feature 1 */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-3xl font-semibold text-black mb-4">Refuses to do homework</h3>
                <p className="text-lg text-neutral-600 leading-relaxed font-light">
                  Newton detects when students ask it to write essays or solve problems directly. It politely refuses and redirects to learning.
                </p>
              </div>
              <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-200">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-neutral-600">S</span>
                    </div>
                    <div className="bg-neutral-100 rounded-2xl px-4 py-3 flex-1">
                      <p className="text-neutral-900 text-sm">Write me an essay on Macbeth</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-white">N</span>
                    </div>
                    <div className="bg-neutral-100 rounded-2xl px-4 py-3 flex-1">
                      <p className="text-neutral-900 text-sm">I can&apos;t write your essay - that wouldn&apos;t help you learn. But let&apos;s explore Macbeth together. What themes interest you?</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-200">
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-neutral-200">
                      <p className="text-sm text-neutral-600 mb-2">Mathematics • 12 conversations</p>
                      <p className="text-xs text-neutral-500">Last: Quadratic equations</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-neutral-200">
                      <p className="text-sm text-neutral-600 mb-2">English • 8 conversations</p>
                      <p className="text-xs text-neutral-500">Last: Shakespeare analysis</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-neutral-200">
                      <p className="text-sm text-neutral-600 mb-2">Physics • 5 conversations</p>
                      <p className="text-xs text-neutral-500">Last: Newton&apos;s laws</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-3xl font-semibold text-black mb-4">Subject-organized learning</h3>
                <p className="text-lg text-neutral-600 leading-relaxed font-light">
                  Conversations are automatically organized by subject. Students can return to past discussions and build on their knowledge.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-3xl font-semibold text-black mb-4">Socratic questioning</h3>
                <p className="text-lg text-neutral-600 leading-relaxed font-light">
                  Instead of giving answers, Newton asks guiding questions that help students discover solutions themselves.
                </p>
              </div>
              <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-200">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <p className="text-sm text-neutral-900 mb-4">&ldquo;Let&apos;s think about this step by step. What happens when we multiply both sides by 2?&rdquo;</p>
                  <p className="text-xs text-neutral-500">Guides without solving</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-semibold text-black mb-6 tracking-tight">Built for learning</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-3xl border border-neutral-200">
              <h3 className="text-lg font-medium text-black mb-3">UK curriculum aligned</h3>
              <p className="text-neutral-600 leading-relaxed">Supports GCSE and A-Level subjects with appropriate guidance.</p>
            </div>

            <div className="bg-white p-10 rounded-3xl border border-neutral-200">
              <h3 className="text-lg font-medium text-black mb-3">Progress tracking</h3>
              <p className="text-neutral-600 leading-relaxed">Learning journeys organized by subject and topic.</p>
            </div>

            <div className="bg-white p-10 rounded-3xl border border-neutral-200">
              <h3 className="text-lg font-medium text-black mb-3">Privacy first</h3>
              <p className="text-neutral-600 leading-relaxed">No accounts. No data collection. Completely anonymous.</p>
            </div>

            <div className="bg-white p-10 rounded-3xl border border-neutral-200">
              <h3 className="text-lg font-medium text-black mb-3">Math support</h3>
              <p className="text-neutral-600 leading-relaxed">Beautiful equation rendering for mathematics and sciences.</p>
            </div>

            <div className="bg-white p-10 rounded-3xl border border-neutral-200">
              <h3 className="text-lg font-medium text-black mb-3">24/7 availability</h3>
              <p className="text-neutral-600 leading-relaxed">Learn anytime, anywhere. No scheduling required.</p>
            </div>

            <div className="bg-white p-10 rounded-3xl border border-neutral-200">
              <h3 className="text-lg font-medium text-black mb-3">Instant response</h3>
              <p className="text-neutral-600 leading-relaxed">Immediate, thoughtful guidance when students need it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Teachers Section */}
      <section id="for-teachers" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-semibold text-black mb-6 tracking-tight">For teachers</h2>
            <p className="text-xl text-neutral-600 font-light">
              Designed to support your teaching, not replace it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-200">
              <p className="text-black font-medium mb-2">Maintains academic integrity</p>
              <p className="text-sm text-neutral-600">Refuses to complete assignments.</p>
            </div>
            <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-200">
              <p className="text-black font-medium mb-2">GDPR compliant</p>
              <p className="text-sm text-neutral-600">No personal data collected.</p>
            </div>
            <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-200">
              <p className="text-black font-medium mb-2">No training required</p>
              <p className="text-sm text-neutral-600">Students can start immediately.</p>
            </div>
            <div className="bg-neutral-50 p-8 rounded-3xl border border-neutral-200">
              <p className="text-black font-medium mb-2">Free 2-week pilot</p>
              <p className="text-sm text-neutral-600">Test with your students.</p>
            </div>
          </div>

          <div className="bg-black p-12 rounded-3xl text-center">
            <h3 className="text-2xl font-semibold text-white mb-4">Request a pilot program</h3>
            <p className="text-neutral-400 mb-8 max-w-xl mx-auto">
              2-week trial • Free for students • Teacher feedback • Full evaluation
            </p>
            <a 
              href="mailto:eliot@newton-ai.co.uk" 
              className="inline-block px-8 py-3.5 bg-white text-black rounded-full font-medium hover:bg-neutral-100 transition"
            >
              Contact us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-neutral-200">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl font-semibold text-black mb-4">Newton</p>
          <p className="text-neutral-500 mb-2">Teaching students to think.</p>
          <p className="text-sm text-neutral-400">© 2025 Newton AI</p>
        </div>
      </footer>
    </div>
  );
}