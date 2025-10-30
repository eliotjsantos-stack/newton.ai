# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Newton is an AI-powered educational assistant designed for UK secondary school students (Years 7-13, ages 11-18). The application uses a Socratic teaching methodology - it guides students to understand concepts rather than providing direct answers to homework problems.

**Core Philosophy**: Never solve student homework directly. Guide learning through strategic questioning, scaffolding, and conceptual teaching while maintaining strict academic integrity.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **React**: 19.1.0
- **Build Tool**: Turbopack (for faster dev and builds)
- **Styling**: Tailwind CSS v4
- **AI Integration**: OpenAI API (GPT-5 mini model, streaming responses)
- **Runtime**: Edge runtime for API routes
- **Math Rendering**: KaTeX (for LaTeX mathematical notation)
- **Markdown**: React Markdown with plugins (remark-gfm, remark-math, rehype-katex)

## Development Commands

```bash
# Development server (with Turbopack)
npm run dev

# Production build (with Turbopack)
npm run build

# Start production server
npm start

# Linting
npm run lint
```

The dev server runs on http://localhost:3000

## Application Architecture

### Routing Structure

The app uses Next.js App Router with the following key routes:

- `/` - Landing page (app/page.js) - marketing and intro to Newton
- `/chat` - Main chat interface where students interact with the AI
- `/about` - Information about Newton
- `/faq` - Frequently asked questions
- `/dashboard` - Student dashboard
- `/subject/[subject]` - Dynamic subject-specific pages
- `/api/chat` - Streaming chat API endpoint (Edge runtime)

### Core Components

**API Route** (`app/api/chat/route.js`):
- Uses Edge runtime for performance
- Streams responses from OpenAI
- Contains extensive system prompt (lines 9-977) defining Newton's educational philosophy
- Model: `gpt-5 mini`

**System Prompt Architecture**:
The system prompt is highly structured with critical rules:
1. **Override rules** that prevent solving specific homework problems
2. **Math formatting rules** requiring dollar signs ($...$) for inline math and ($$...$$) for display math
3. **Subject-specific scaffolding strategies** for all major subjects (Maths, Sciences, English, History, etc.)
4. **Age-appropriate adaptation** for different year groups
5. **Resource recommendations** with full URLs to educational websites
6. **Academic integrity safeguards** with detection of homework requests

**Layout** (`app/layout.js`):
- Uses Geist fonts (Sans and Mono)
- Includes KaTeX CSS from CDN
- Metadata: "Newton - AI Learning Assistant"

### Key Features & Behaviors

1. **Socratic Questioning**: The AI guides students with questions rather than providing answers
2. **Academic Integrity**: Refuses to solve specific homework problems or write essays
3. **Mathematical Notation**: All math must use LaTeX format with $ or $$ delimiters
4. **URL Formatting**: Resources must include full https:// URLs as plain text (not wrapped in math notation)
5. **Age Adaptation**: Automatically adjusts complexity based on year group (7-9, 10-11, 12-13)
6. **Streaming Responses**: Real-time streaming for better UX

## Environment Variables

Required in `.env.local`:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## Important Development Notes

### When Modifying the System Prompt

The system prompt in `app/api/chat/route.js` is extremely comprehensive (968 lines). Key sections:

- **Lines 10-80**: Critical override rules (MUST READ - these override everything else)
- **Lines 82-109**: Math formatting requirements ($ for inline, $$ for display)
- **Lines 110-179**: Handling broad questions and essay writing attempts
- **Lines 180-355**: Educational resource recommendations by subject
- **Lines 437-622**: Subject-specific scaffolding strategies
- **Lines 623-678**: Academic integrity features and detection patterns

When editing, ensure you:
1. Maintain the override hierarchy (critical rules always win)
2. Keep math formatting consistent
3. Preserve the educational philosophy of guidance over answers
4. Test with various homework request patterns to ensure proper refusal

### Mathematical Notation

The app renders math using KaTeX. In responses from the AI:
- Inline math: `$x^2 + 5x + 6$`
- Display math: `$$\frac{-b \pm \sqrt{b^2-4ac}}{2a}$$`
- NEVER use parentheses/brackets: `( )` or `[ ]` for math notation
- URLs must be plain text, NOT wrapped in dollar signs

### Git Status Note

Current working tree has merge conflicts in `app/page.js` (UU status) and several staged files including:
- app/DarkModeToggle.js (new file, not yet created)
- app/ThemeProvider.js (new file, not yet created)
- taliwind.config.js (likely a typo - should be tailwind.config.js)

Resolve merge conflicts before committing new work.

## Common Tasks

### Adding a New Subject Page

Create a new route in `app/subject/[subject]/page.js` or add to the existing dynamic route.

### Modifying Chat Behavior

Edit the system prompt in `app/api/chat/route.js`. Test thoroughly with:
- Direct homework questions (should refuse)
- Conceptual questions (should guide)
- Essay writing requests (should refuse but offer planning help)
- Math problems (should teach method with different example)

### Styling Changes

This project uses Tailwind CSS v4. Styles are utility-first with custom configuration in `postcss.config.mjs` and future `tailwind.config.js`.

### Testing the AI Response

Start the dev server and navigate to `/chat` to interact with Newton. Test various educational scenarios:
- Simple questions
- Homework problems
- Essay requests
- Subject-specific questions
- Age-appropriate language (mention year group)

## Production Deployment

Build with `npm run build` and deploy to Vercel (recommended) or any Node.js hosting platform that supports Next.js 15 and Edge runtime.

Ensure `OPENAI_API_KEY` is set in production environment variables.

## Educational Philosophy

This is not just a chatbot - it's an educational tool with strict ethical guidelines:

✅ **Should do**: Guide thinking, ask questions, teach concepts, provide frameworks, recommend resources, break down complex topics

❌ **Must never do**: Solve homework, write essays, provide answers to copy, complete assignments, do work students should submit

The "Iron Law Test": "Could a student copy what I'm about to write and submit it as their work?" If yes, refuse and reframe.
