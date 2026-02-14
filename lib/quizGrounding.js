import { supabase } from '@/lib/supabase';

/**
 * Fetch grounding data for a quiz based on the class's qualification.
 * Returns null if no classId or no qan_code is set.
 */
export async function getQuizGrounding(classId) {
  if (!classId) return null;

  const { data: cls, error: classError } = await supabase
    .from('classes')
    .select('qan_code, year_group, subject')
    .eq('id', classId)
    .single();

  if (classError || !cls?.qan_code) return null;

  const { data: qual } = await supabase
    .from('qualifications')
    .select('title, board, level')
    .eq('qan_code', cls.qan_code)
    .single();

  if (!qual) return null;

  const { data: objectives } = await supabase
    .from('curriculum_objectives')
    .select('objective_text, topic_area')
    .eq('qan_code', cls.qan_code);

  const levelLabel = String(qual.level) === '3' ? 'A-Level' : 'GCSE';

  return {
    board: qual.board,
    levelLabel,
    qualTitle: qual.title,
    objectives: objectives || [],
    yearGroup: cls.year_group,
    subject: cls.subject,
  };
}

const MODE_DEFAULTS = {
  mini_quiz: 15,
  full_test: 50,
  topic_focus: 25,
  past_paper: 80,
};

const BOARD_COMMAND_WORDS = {
  AQA: ['Evaluate', 'Compare', 'Explain', 'Describe', 'Justify', 'Calculate'],
  OCR: ['Assess', 'Explain', 'Analyse', 'Describe', 'Suggest', 'Calculate'],
  Pearson: ['Analyse', 'Discuss', 'Explain', 'Evaluate', 'Describe', 'Calculate'],
};

/**
 * Board-specific past paper structure knowledge.
 * This tells GPT exactly how real papers for each board are laid out.
 */
const PAST_PAPER_STRUCTURES = {
  'Pearson_Mathematics': `You are replicating a Pearson Edexcel GCSE Mathematics (9-1) exam paper.

Paper structure you MUST follow:
- Questions are numbered sequentially (Q1, Q2, Q3...) and increase in difficulty
- Early questions (Q1-Q5): 1-2 marks each — basic arithmetic, fractions, percentages, reading charts/tables
- Middle questions (Q6-Q15): 2-4 marks each — algebra, geometry, ratio, probability with working required
- Later questions (Q16-Q22): 4-6 marks each — multi-step problems, proof, "Show that..." questions

Edexcel-specific question styles you MUST replicate:
- "Show that..." questions where students prove a given result
- "Work out..." with a clear instruction to show working
- Questions with diagrams described in text (e.g., "The diagram shows a triangle ABC where AB = 5cm...")
- Context-based questions using real-world scenarios (shopping, travel, building)
- "Here is a number machine..." style function questions
- Calculator vs non-calculator awareness — state if the question is non-calculator
- Quality of Written Communication (QWC) on 5-6 mark questions: "Explain why..." or "You must show your working"
- Frequency tables and probability from two-way tables
- Give each question a realistic exam style with clear, concise wording`,

  'Pearson_default': `You are replicating a Pearson Edexcel GCSE exam paper.

Edexcel paper style:
- Questions increase in difficulty from start to end
- Early questions: recall and basic application (1-2 marks)
- Middle questions: application and analysis (2-4 marks)
- Later questions: evaluation and extended writing (4-6 marks)
- Use "Explain two..." and "Evaluate..." for higher mark questions
- Include source/stimulus material for contextual questions
- State marks clearly and use Edexcel command words: Analyse, Calculate, Compare, Describe, Evaluate, Explain, Give, Identify, Justify, State`,

  'AQA_Mathematics': `You are replicating an AQA GCSE Mathematics (9-1) exam paper.

Paper structure you MUST follow:
- Questions increase in difficulty throughout
- Early questions (1-2 marks): number skills, basic algebra, simple geometry
- Middle questions (2-4 marks): multi-step calculations, equations, area/volume
- Later questions (4-6 marks): algebraic proof, problem solving, statistics

AQA-specific question styles you MUST replicate:
- "Write down..." for 1-mark recall questions
- "Work out..." with working space indicated
- Multiple-part questions: (a), (b), (c) with escalating difficulty within one question
- "Here is some information..." followed by data interpretation
- Contextual word problems grounded in realistic scenarios
- "Explain why [student name] is wrong" style error analysis questions
- Iteration and trial-and-improvement questions
- Box plots, cumulative frequency, and histogram interpretation`,

  'AQA_default': `You are replicating an AQA GCSE exam paper.

AQA paper style:
- Questions progress from low to high difficulty
- Use "State...", "Describe...", "Explain...", "Evaluate..." in ascending mark value
- Multi-part questions (a), (b), (c) are very common
- Extended response questions (6 marks) require a structured argument
- Include "Name a..." or "Give one..." for simple 1-mark questions
- AQA uses "Evaluate the extent to which..." for highest-tariff questions`,

  'OCR_Mathematics': `You are replicating an OCR GCSE Mathematics (9-1) exam paper.

OCR-specific question styles:
- Clear progression from Foundation to Higher tier difficulty
- "Here is a formula..." style substitution questions
- Geometric reasoning with angle facts
- Venn diagram and set notation questions
- Multi-step ratio and proportion problems
- "Explain your answer" appended to many questions
- Use of the OCR problem-solving cycle: interpret → solve → check`,

  'OCR_default': `You are replicating an OCR GCSE exam paper.

OCR paper style:
- Section A: shorter questions testing recall and application
- Section B: longer, synoptic questions
- Use "Assess...", "Suggest...", "Explain..." command words
- Contextual questions with stimulus material
- Multi-step structured questions with sub-parts`,
};

function getPastPaperInstructions(grounding, topicName) {
  if (!grounding?.board) return '';

  const board = grounding.board;
  const subjectKey = grounding.subject?.replace(/\s+/g, '') || '';

  // Try board+subject specific, then board default
  const key = `${board}_${subjectKey}`;
  const instructions = PAST_PAPER_STRUCTURES[key]
    || PAST_PAPER_STRUCTURES[`${board}_default`]
    || '';

  // Detect if the topic references a specific paper (e.g. "Paper 1", "Paper 2")
  const paperMatch = topicName.match(/paper\s*(\d)/i);
  let paperSpecific = '';
  if (paperMatch) {
    const paperNum = paperMatch[1];
    if (board === 'Pearson' && subjectKey.toLowerCase().includes('math')) {
      if (paperNum === '1') {
        paperSpecific = `\nThis is Paper 1 (Non-Calculator). ALL questions must be solvable without a calculator. Do NOT include questions requiring a calculator. Focus on: mental arithmetic, written methods, fractions, algebraic manipulation, geometric reasoning without trigonometry calculations, exact values, surds, and proof.`;
      } else if (paperNum === '2') {
        paperSpecific = `\nThis is Paper 2 (Calculator). Students have a scientific calculator. Include questions involving: trigonometry calculations, compound interest, standard form conversions, iteration, statistical calculations, and real-world data analysis.`;
      } else if (paperNum === '3') {
        paperSpecific = `\nThis is Paper 3 (Calculator). Students have a scientific calculator. Include questions involving: probability, vectors, algebraic fractions, circle theorems, transformations, and problem-solving across multiple topics.`;
      }
    } else if (board === 'AQA' && subjectKey.toLowerCase().includes('math')) {
      if (paperNum === '1') {
        paperSpecific = `\nThis is Paper 1 (Non-Calculator). ALL questions must be solvable without a calculator. Focus on number, algebra, ratio, and geometry using exact methods.`;
      } else if (paperNum === '2') {
        paperSpecific = `\nThis is Paper 2 (Calculator). Include questions requiring calculator use: statistics, probability, trigonometry, compound measures.`;
      } else if (paperNum === '3') {
        paperSpecific = `\nThis is Paper 3 (Calculator). Include questions on: algebra, geometry, probability, and cross-topic problem solving.`;
      }
    }
  }

  return instructions + paperSpecific;
}

/**
 * Build the full quiz generation prompt.
 */
export function buildQuizPrompt({ topicName, grounding, totalMarks, mode, chatContext }) {
  const effectiveMarks = totalMarks || MODE_DEFAULTS[mode] || 15;
  const effectiveMode = mode || 'mini_quiz';

  let boardSection = '';
  let objectivesSection = '';
  let commandWords = ['Explain', 'Describe', 'Evaluate', 'Calculate', 'Compare', 'Analyse'];

  if (grounding?.board) {
    boardSection = `You are generating questions for the ${grounding.board} ${grounding.levelLabel || 'GCSE'} specification: "${grounding.qualTitle}".
All questions MUST be grounded in this specification and match the style of real ${grounding.board} exam papers.`;

    const boardKey = Object.keys(BOARD_COMMAND_WORDS).find(k =>
      grounding.board?.toLowerCase().includes(k.toLowerCase())
    );
    if (boardKey) commandWords = BOARD_COMMAND_WORDS[boardKey];

    let filteredObjectives = grounding.objectives || [];
    if (effectiveMode === 'topic_focus' && filteredObjectives.length > 0) {
      const topicLower = topicName.toLowerCase();
      const matched = filteredObjectives.filter(o =>
        o.topic_area?.toLowerCase().includes(topicLower) ||
        o.objective_text?.toLowerCase().includes(topicLower)
      );
      if (matched.length > 0) filteredObjectives = matched;
    }

    if (filteredObjectives.length > 0) {
      const objList = filteredObjectives
        .slice(0, 30)
        .map(o => `- [${o.topic_area || 'General'}] ${o.objective_text}`)
        .join('\n');
      objectivesSection = `\nCurriculum objectives to base questions on:\n${objList}\n\nOnly use content covered by these objectives.`;
    }
  }

  const yearGroup = grounding?.yearGroup?.replace('year', 'Year ') || 'Year 10';

  // Mode-specific instructions
  let modeInstructions = '';
  let questionTypes = '';

  switch (effectiveMode) {
    case 'mini_quiz':
      modeInstructions = `This is a Mini Quiz — a quick revision check.
Generate a mix of 1-2 mark questions only. All questions should be easy to medium difficulty.
Aim for roughly ${Math.ceil(effectiveMarks / 1.5)} questions totalling exactly ${effectiveMarks} marks.`;
      questionTypes = '"multiple_choice", "true_false", "short_answer"';
      break;

    case 'full_test':
      modeInstructions = `This is a Full Test — exam-style paper covering the full difficulty range.
Include 1, 2, 4, and 6-mark questions.
Mark distribution: ~40% in 1-2 mark Qs, ~35% in 3-4 mark Qs, ~25% in 5-6 mark Qs.
Total marks must sum to exactly ${effectiveMarks}.`;
      questionTypes = '"multiple_choice", "true_false", "short_answer", "explain", "structured"';
      break;

    case 'topic_focus':
      modeInstructions = `This is a Topic Focus quiz — a deep dive on "${topicName}".
Include questions at all difficulty levels (easy, medium, hard).
Include 1, 2, 3, and 4-mark questions.
Total marks must sum to exactly ${effectiveMarks}.`;
      questionTypes = '"multiple_choice", "short_answer", "explain", "structured"';
      break;

    case 'past_paper': {
      const pastPaperInstructions = getPastPaperInstructions(grounding, topicName);
      modeInstructions = `This is a Past Paper Style quiz. You are generating questions that closely replicate real ${grounding?.board || ''} ${grounding?.levelLabel || 'GCSE'} past paper questions for "${topicName}".

${pastPaperInstructions}

CRITICAL RULES FOR PAST PAPER MODE:
- Questions MUST look and feel exactly like real exam questions from ${grounding?.board || 'a UK exam board'}
- Use the exact phrasing style, mark allocation patterns, and question structures from real papers
- Use DIFFERENT numbers, names, and contexts from actual past papers — but keep the same question STRUCTURE and style
- Questions should progress in difficulty from start to end, just like a real paper
- Include appropriate working space indicators (e.g., "Show your working" for questions worth 3+ marks)
- For multi-mark questions, the mark scheme should indicate what each mark is awarded for

Organise into 3 sections:
- Section A: Short questions (1-2 marks each) — recall, basic skills
- Section B: Applied questions (3-4 marks each) — application, multi-step
- Section C: Extended response questions (5-6 marks each) — analysis, proof, evaluation
Include a "section" field ("A", "B", or "C") for each question.
Mark distribution: ~30% Section A, ~35% Section B, ~35% Section C.
Total marks must sum to exactly ${effectiveMarks}.`;
      questionTypes = '"short_answer", "explain", "structured"';
      break;
    }
  }

  // Level distribution for non-mini modes
  let levelInstructions = '';
  if (effectiveMode === 'mini_quiz') {
    levelInstructions = 'All questions should have level "easy" or "medium".';
  } else {
    levelInstructions = `Assign levels based on mark value:
- 1-2 mark questions: "easy"
- 3-4 mark questions: "medium"
- 5-6 mark questions: "hard"`;
  }

  const prompt = `Generate a quiz about "${topicName}" for a ${yearGroup} student.

${boardSection}
${objectivesSection}

${modeInstructions}

${levelInstructions}

Use these command words in questions: ${commandWords.join(', ')}

Question types to use: ${questionTypes}
- "multiple_choice": 4 options (A, B, C, D), one correct answer
- "true_false": True or False question
- "short_answer": Requires 1-2 sentence response or a calculated answer with working
- "explain": Requires explanation of reasoning (open-ended)
- "structured": Multi-part question worth 4-6 marks (common in ${grounding?.levelLabel || 'GCSE'} papers). Write sub-parts as (a), (b), (c) within the question_text.

IMPORTANT - Math formatting:
- Use LaTeX notation with $ signs for ALL math: $x^2$, $\\frac{1}{2}$, $\\sqrt{16}$
- For inline math use single $: "Solve $x^2 + 5x + 6 = 0$"
- NEVER use plain text like x^2 or 1/2 - always wrap in $

For each question provide this exact JSON structure:
{
  "question_text": "The question (use $...$ for any math)",
  "question_type": "multiple_choice" | "true_false" | "short_answer" | "explain" | "structured",
  "marks": <number 1-6>,
  "level": "easy" | "medium" | "hard",
  ${effectiveMode === 'past_paper' ? '"section": "A" | "B" | "C",' : ''}
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."] (only for multiple_choice, null otherwise),
  "correct_answer": "The correct answer with full working shown (use $...$ for math)",
  "explanation": "Mark scheme: what each mark is awarded for (use $...$ for math)"
}

${chatContext ? `Base questions on this conversation context:\n${chatContext}\n` : ''}

CRITICAL: The marks of ALL questions MUST sum to exactly ${effectiveMarks}.
IMPORTANT: Return ONLY a valid JSON array of question objects. No markdown, no explanation, just the JSON array.`;

  return { prompt, effectiveMarks };
}
