import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Detects STEM questions with specific numbers and randomizes them.
 * Non-numeric or non-STEM questions pass through unchanged.
 *
 * For each numeric STEM question:
 *   1. Extracts numbers from the question text
 *   2. Randomizes them within ±50%
 *   3. Asks GPT to recalculate the correct answer with the new numbers
 *
 * @param {Array} questions - Array of quiz question objects from GPT
 * @param {string} subject - The subject (e.g. "Maths", "Physics")
 * @returns {Array} - Questions with randomized numeric values
 */
export async function randomizeQuizNumbers(questions, subject) {
  const stemSubjects = ['maths', 'math', 'mathematics', 'physics', 'chemistry', 'biology', 'science', 'computer science'];
  const isStem = stemSubjects.some(s => subject.toLowerCase().includes(s));

  if (!isStem) return questions;

  // Regex to find numbers in text (integers and decimals, including negative)
  const numberPattern = /(?<!\$[^$]*)-?\b\d+\.?\d*\b(?![^$]*\$)/g;
  // Also match numbers inside LaTeX: $...$
  const latexNumberPattern = /\$[^$]*\$/g;

  const result = [];

  for (const q of questions) {
    // Only randomize multiple_choice and short_answer with numeric content
    if (q.question_type !== 'multiple_choice' && q.question_type !== 'short_answer') {
      result.push(q);
      continue;
    }

    // Check if question text contains numbers worth randomizing
    const plainNumbers = q.question_text.replace(latexNumberPattern, '').match(numberPattern);
    const latexBlocks = q.question_text.match(latexNumberPattern) || [];
    const latexNumbers = latexBlocks.join(' ').match(/-?\d+\.?\d*/g);

    const allNumbers = [...(plainNumbers || []), ...(latexNumbers || [])];

    // Skip if no meaningful numbers (ignore 0, 1, or trivially small references)
    const meaningfulNumbers = allNumbers.filter(n => {
      const val = parseFloat(n);
      return !isNaN(val) && Math.abs(val) > 1;
    });

    if (meaningfulNumbers.length === 0) {
      result.push(q);
      continue;
    }

    // Build a number substitution map: old → new (±50%)
    const substitutions = {};
    for (const numStr of meaningfulNumbers) {
      if (substitutions[numStr]) continue; // avoid dupes
      const val = parseFloat(numStr);
      const min = Math.round(val * 0.5);
      const max = Math.round(val * 1.5);
      const newVal = min + Math.floor(Math.random() * (max - min + 1));
      // Ensure we don't randomly land on the same number
      substitutions[numStr] = newVal === val ? newVal + 1 : newVal;
    }

    // Apply substitutions to question text
    let newQuestionText = q.question_text;
    for (const [oldNum, newNum] of Object.entries(substitutions)) {
      // Replace in plain text and in LaTeX contexts
      newQuestionText = newQuestionText.split(oldNum).join(String(newNum));
    }

    // Ask GPT for the new correct answer
    try {
      const recalcResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You recalculate correct answers for modified quiz questions. Return ONLY the correct answer value, nothing else. Use $...$ for any math notation.'
          },
          {
            role: 'user',
            content: `Original question: ${q.question_text}\nOriginal correct answer: ${q.correct_answer}\n\nModified question: ${newQuestionText}\n\nWhat is the new correct answer? Return ONLY the answer value.`
          }
        ],
        temperature: 0,
        max_tokens: 200,
      });

      const newAnswer = recalcResponse.choices[0].message.content.trim();

      // Also recalculate options for multiple choice
      let newOptions = q.options;
      if (q.question_type === 'multiple_choice' && q.options) {
        const optionsResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You generate multiple choice options for quiz questions. Return ONLY a JSON array of 4 option strings in the format ["A) ...", "B) ...", "C) ...", "D) ..."]. Use $...$ for math.'
            },
            {
              role: 'user',
              content: `Question: ${newQuestionText}\nCorrect answer: ${newAnswer}\n\nGenerate 4 options (A-D) where one is the correct answer. Return ONLY the JSON array.`
            }
          ],
          temperature: 0.5,
          max_tokens: 300,
        });

        try {
          const cleaned = optionsResponse.choices[0].message.content.trim()
            .replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
          newOptions = JSON.parse(cleaned);
        } catch {
          // Keep original options structure if parsing fails
          newOptions = q.options;
        }
      }

      result.push({
        ...q,
        question_text: newQuestionText,
        correct_answer: newAnswer,
        options: newOptions,
      });
    } catch {
      // If recalculation fails, keep original question
      result.push(q);
    }
  }

  return result;
}
