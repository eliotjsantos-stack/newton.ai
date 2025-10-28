'use client';

import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-xl border-b border-neutral-200 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <span className="text-2xl font-semibold text-black tracking-tight">Newton</span>
            </Link>
            
            <div className="flex items-center space-x-10">
              <Link href="/#how-it-works" className="text-sm text-neutral-600 hover:text-black transition">How it works</Link>
              <Link href="/#features" className="text-sm text-neutral-600 hover:text-black transition">Features</Link>
              <Link href="/about" className="text-sm text-black font-medium">About</Link>
              <Link href="/faq" className="text-sm text-neutral-600 hover:text-black transition">FAQ</Link>
              <Link href="/chat" className="px-5 py-2 bg-black text-white text-sm rounded-full hover:bg-neutral-800 transition">
                Try Newton
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-neutral-500 mb-8 tracking-wide uppercase">About Newton</p>
          <h1 className="text-5xl md:text-7xl font-semibold text-black mb-8 leading-tight tracking-tight">
            Built by a student,
            <br />
            for students.
          </h1>
          <p className="text-xl text-neutral-600 font-light leading-relaxed">
            Newton was created to solve a real problem: AI tools that enable shortcuts instead of learning.
          </p>
        </div>
      </section>

      {/* The Story */}
      <section className="py-20 px-6 bg-neutral-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold text-black mb-8">The problem</h2>
          <div className="space-y-6 text-lg text-neutral-600 leading-relaxed font-light">
            <p>
              Recent research published by The Guardian shows that students fear AI is eroding their ability to study and think independently.
            </p>
            <p>
              The problem is clear: tools like ChatGPT will write your essay, solve your homework, and complete your assignments. Students are getting answers without developing understanding.
            </p>
            <p>
              Teachers can&apos;t detect AI-generated work. Students are passing classes without learning. The system is broken.
            </p>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold text-black mb-8">The solution</h2>
          <div className="space-y-6 text-lg text-neutral-600 leading-relaxed font-light">
            <p>
              Newton is AI that maintains academic integrity by design. It refuses to write essays or complete homework. Instead, it guides students to discover answers themselves through Socratic questioning.
            </p>
            <p>
              When a student asks Newton to write an essay, it refuses and asks: &ldquo;What&apos;s your main argument going to be? How will you structure it?&rdquo;
            </p>
            <p>
              When a student asks Newton to solve an equation, it guides: &ldquo;What happens if we multiply both sides by 2?&rdquo;
            </p>
            <p>
              The result: students develop genuine understanding, not just get answers.
            </p>
          </div>
        </div>
      </section>

      {/* The Vision */}
      <section className="py-20 px-6 bg-neutral-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold text-black mb-8">The vision</h2>
          <div className="space-y-6 text-lg text-neutral-600 leading-relaxed font-light">
            <p>
              Newton is currently being piloted at Bedales School in Hampshire, UK. The goal is to prove that AI can support education without compromising academic integrity.
            </p>
            <p>
              If successful, Newton will expand to schools across the UK, providing students with a learning tool that develops critical thinking rather than replacing it.
            </p>
            <p>
              Education shouldn&apos;t be about finding shortcuts. It should be about building understanding. That&apos;s what Newton enables.
            </p>
          </div>
        </div>
      </section>

      {/* The Team */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-black mb-12">Built at Bedales</h2>
          <p className="text-lg text-neutral-600 font-light leading-relaxed mb-8">
            Newton was created by a Bedales student who saw classmates using AI to avoid learning instead of enhance it. Newton represents a different approach: AI that teaches rather than replaces thinking.
          </p>
          <div className="pt-8 border-t border-neutral-200">
            <p className="text-sm text-neutral-500 mb-4">Questions about Newton?</p>
            <a 
              href="mailto:eliot@newton-ai.co.uk"
              className="inline-block px-8 py-3 bg-black text-white rounded-full hover:bg-neutral-800 transition"
            >
              Get in touch
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-neutral-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-2xl font-semibold text-black mb-2">Newton</p>
              <p className="text-sm text-neutral-500">Teaching students to think.</p>
            </div>
            <div className="flex items-center space-x-8 text-sm">
              <Link href="/" className="text-neutral-600 hover:text-black transition">Home</Link>
              <Link href="/about" className="text-neutral-600 hover:text-black transition">About</Link>
              <Link href="/chat" className="text-neutral-600 hover:text-black transition">Chat</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-neutral-200 text-center">
            <p className="text-xs text-neutral-400">© 2025 Newton AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}