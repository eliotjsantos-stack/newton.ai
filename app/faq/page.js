'use client';

import Link from 'next/link';
import { useState } from 'react';

const faqs = [
  {
    category: 'For Students',
    questions: [
      {
        q: 'Will Newton do my homework for me?',
        a: 'No. Newton is designed to help you learn, not to do your work for you. If you ask Newton to write an essay or solve a problem directly, it will refuse and instead guide you to understand how to do it yourself.'
      },
      {
        q: 'What subjects does Newton support?',
        a: 'Newton supports all major GCSE and A-Level subjects including Maths, Science (Physics, Chemistry, Biology), English, History, Languages, and more. It adapts its teaching style to each subject.'
      },
      {
        q: 'Can I use Newton for exam prep?',
        a: 'Yes! Newton is excellent for exam preparation. It can help you understand difficult concepts, practice problem-solving techniques, and develop exam strategies. However, it will not give you answers to practice questions - it will guide you to solve them yourself.'
      },
      {
        q: 'Is Newton better than ChatGPT?',
        a: 'Newton is built specifically for learning. Unlike ChatGPT, which will write your essay if you ask, Newton refuses to do your work and instead teaches you how to think through problems. It is not about being "better" - it is about being designed for genuine learning.'
      },
      {
        q: 'Can teachers see my conversations?',
        a: 'No. Newton does not store conversations or collect any personal data. Your chats are completely private and only stored locally on your device.'
      }
    ]
  },
  {
    category: 'For Teachers',
    questions: [
      {
        q: 'How does Newton maintain academic integrity?',
        a: 'Newton is programmed to refuse essay writing, homework completion, and direct problem-solving. It uses Socratic questioning to guide students toward understanding rather than providing finished work. Students still need to do the cognitive work themselves.'
      },
      {
        q: 'What data does Newton collect?',
        a: 'None. Newton does not require student accounts, does not store conversations in a database, and does not collect any personal information. Usage is completely anonymous.'
      },
      {
        q: 'Is Newton GDPR compliant?',
        a: 'Yes. Since Newton collects no personal data and requires no student accounts, GDPR requirements are minimal. Students access it anonymously through a web link.'
      },
      {
        q: 'How do I monitor student usage?',
        a: 'During the pilot program, we provide anonymous usage analytics (number of conversations, subjects accessed, time spent) without tracking individual students. Teachers can also review how students are using Newton through feedback sessions.'
      },
      {
        q: 'What if Newton gives wrong information?',
        a: 'While Newton is highly accurate, no AI is perfect. This is why we recommend a supervised pilot with teacher oversight. Students should verify information and teachers should review how Newton is being used. Report any issues to us immediately.'
      },
      {
        q: 'How much does Newton cost?',
        a: 'The 2-week pilot is completely free. After validation, whole-school access is approximately £8-10k annually. We also offer department-specific licensing for smaller rollouts.'
      }
    ]
  },
  {
    category: 'Technical',
    questions: [
      {
        q: 'What devices does Newton work on?',
        a: 'Newton works on any device with a web browser - laptops, tablets, and smartphones. No app download or installation required.'
      },
      {
        q: 'Does Newton work offline?',
        a: 'No. Newton requires an internet connection to function as it processes requests in real-time.'
      },
      {
        q: 'What AI model does Newton use?',
        a: 'Newton uses GPT-4, the same technology as ChatGPT, but with a specialized system that enforces academic integrity and teaching methodology.'
      },
      {
        q: 'Can Newton handle mathematical equations?',
        a: 'Yes. Newton supports LaTeX rendering for mathematical expressions and can guide students through complex calculations and proofs.'
      },
      {
        q: 'Is there a mobile app?',
        a: 'Not currently. Newton is web-based and works perfectly on mobile browsers. A dedicated app may be developed based on pilot feedback.'
      }
    ]
  },
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I request a pilot program?',
        a: 'Contact us at eliot@newton-ai.co.uk with your school name, number of interested teachers, and target year groups. We will schedule a demo and discuss implementation details.'
      },
      {
        q: 'What does the pilot program include?',
        a: '2-week trial period, free access for students, teacher training session, feedback collection, and full evaluation report before any commitment to expand.'
      },
      {
        q: 'How long does setup take?',
        a: 'Setup is immediate. We provide a web link, teachers share it with students, and they can start using Newton right away. No technical setup required.'
      },
      {
        q: 'Can we customize Newton for our school?',
        a: 'Currently Newton is standardized for UK curriculum. Custom features (school branding, specific exam board focus, integration with school systems) can be discussed for full rollouts.'
      }
    ]
  }
];

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-neutral-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:bg-neutral-50 px-6 transition"
      >
        <span className="text-base font-medium text-black pr-8">{question}</span>
        <svg
          className={`w-5 h-5 text-neutral-600 flex-shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          <p className="text-neutral-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-xl border-b border-neutral-200 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <span className="text-2xl font-semibold text-black tracking-tight">Newton</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-10">
              <Link href="/#how-it-works" className="text-sm text-neutral-600 hover:text-black transition">How it works</Link>
              <Link href="/#features" className="text-sm text-neutral-600 hover:text-black transition">Features</Link>
              <Link href="/about" className="text-sm text-neutral-600 hover:text-black transition">About</Link>
              <Link href="/faq" className="text-sm text-black font-medium">FAQ</Link>
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
          <p className="text-sm text-neutral-500 mb-8 tracking-wide uppercase">Frequently Asked Questions</p>
          <h1 className="text-5xl md:text-7xl font-semibold text-black mb-8 leading-tight tracking-tight">
            Questions?
          </h1>
          <p className="text-xl text-neutral-600 font-light leading-relaxed">
            Everything you need to know about Newton.
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="pb-32 px-6">
        <div className="max-w-3xl mx-auto space-y-16">
          {faqs.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-2xl font-semibold text-black mb-6 px-6">{section.category}</h2>
              <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden">
                {section.questions.map((faq, faqIdx) => (
                  <FAQItem key={faqIdx} question={faq.q} answer={faq.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 px-6 bg-neutral-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-black mb-6">Still have questions?</h2>
          <p className="text-lg text-neutral-600 font-light mb-8">
            Get in touch and we will help you get started with Newton.
          </p>
          <a 
            href="mailto:eliot@newton-ai.co.uk"
            className="inline-block px-8 py-3 bg-black text-white rounded-full hover:bg-neutral-800 transition"
          >
            Contact us
          </a>
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
              <Link href="/faq" className="text-neutral-600 hover:text-black transition">FAQ</Link>
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