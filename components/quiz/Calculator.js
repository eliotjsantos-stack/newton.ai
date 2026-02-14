'use client';

import { useState } from 'react';

export default function Calculator({ onClose }) {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('0');
  const [justCalculated, setJustCalculated] = useState(false);

  const clear = () => {
    setExpression('');
    setResult('0');
    setJustCalculated(false);
  };

  const inputNumber = (num) => {
    if (justCalculated) {
      setExpression(num);
      setResult('0');
      setJustCalculated(false);
    } else {
      setExpression(expression + num);
    }
  };

  const inputDecimal = () => {
    // Get the current number being typed
    const parts = expression.split(/[+\-×÷]/);
    const currentNum = parts[parts.length - 1];

    if (justCalculated) {
      setExpression('0.');
      setJustCalculated(false);
    } else if (!currentNum.includes('.')) {
      setExpression(expression + '.');
    }
  };

  const inputOperator = (op) => {
    if (justCalculated) {
      // Continue from the result
      setExpression(result + op);
      setJustCalculated(false);
    } else if (expression.length > 0) {
      // Replace last operator if there is one
      const lastChar = expression.slice(-1);
      if (['+', '-', '×', '÷'].includes(lastChar)) {
        setExpression(expression.slice(0, -1) + op);
      } else {
        setExpression(expression + op);
      }
    }
  };

  const calculate = () => {
    if (!expression) return;

    try {
      // Replace × and ÷ with * and / for evaluation
      let evalExpression = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/');

      // Remove trailing operator if present
      if (/[+\-*/]$/.test(evalExpression)) {
        evalExpression = evalExpression.slice(0, -1);
      }

      // Safely evaluate
      const calcResult = Function('"use strict"; return (' + evalExpression + ')')();

      // Format result (avoid floating point weirdness)
      const formatted = Number.isInteger(calcResult)
        ? String(calcResult)
        : parseFloat(calcResult.toFixed(10)).toString();

      setResult(formatted);
      setExpression('');
      setJustCalculated(true);
    } catch {
      setResult('Error');
      setExpression('');
      setJustCalculated(true);
    }
  };

  const toggleSign = () => {
    if (justCalculated) {
      const num = parseFloat(result) * -1;
      setResult(String(num));
    } else if (expression) {
      // Toggle sign of current number in expression
      const match = expression.match(/(-?\d*\.?\d*)$/);
      if (match && match[1]) {
        const currentNum = match[1];
        const beforeNum = expression.slice(0, expression.length - currentNum.length);
        if (currentNum.startsWith('-')) {
          setExpression(beforeNum + currentNum.slice(1));
        } else {
          setExpression(beforeNum + '-' + currentNum);
        }
      }
    }
  };

  const percent = () => {
    if (justCalculated) {
      const num = parseFloat(result) / 100;
      setResult(String(num));
    } else if (expression) {
      const match = expression.match(/(\d*\.?\d*)$/);
      if (match && match[1]) {
        const currentNum = match[1];
        const beforeNum = expression.slice(0, expression.length - currentNum.length);
        const percentNum = parseFloat(currentNum) / 100;
        setExpression(beforeNum + String(percentNum));
      }
    }
  };

  const displayValue = expression || result;

  return (
    <div className="w-64 bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 border-b border-neutral-200">
        <span className="text-xs font-medium text-neutral-500">Calculator</span>
        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Display */}
      <div className="px-4 py-4 bg-neutral-50 border-b border-neutral-200">
        <div className="text-right text-2xl font-light text-neutral-900 truncate min-h-[32px]">
          {displayValue}
        </div>
      </div>

      {/* Keypad */}
      <div className="p-2 grid grid-cols-4 gap-1">
        {[
          { label: 'C', action: clear, style: 'fn' },
          { label: '±', action: toggleSign, style: 'fn' },
          { label: '%', action: percent, style: 'fn' },
          { label: '÷', action: () => inputOperator('÷'), style: 'op' },
          { label: '7', action: () => inputNumber('7') },
          { label: '8', action: () => inputNumber('8') },
          { label: '9', action: () => inputNumber('9') },
          { label: '×', action: () => inputOperator('×'), style: 'op' },
          { label: '4', action: () => inputNumber('4') },
          { label: '5', action: () => inputNumber('5') },
          { label: '6', action: () => inputNumber('6') },
          { label: '-', action: () => inputOperator('-'), style: 'op' },
          { label: '1', action: () => inputNumber('1') },
          { label: '2', action: () => inputNumber('2') },
          { label: '3', action: () => inputNumber('3') },
          { label: '+', action: () => inputOperator('+'), style: 'op' },
          { label: '0', action: () => inputNumber('0'), span: 2 },
          { label: '.', action: inputDecimal },
          { label: '=', action: calculate, style: 'eq' },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className={`
              h-10 rounded-md text-sm font-medium transition-colors
              ${btn.span === 2 ? 'col-span-2' : ''}
              ${btn.style === 'fn' ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300' : ''}
              ${btn.style === 'op' ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
              ${btn.style === 'eq' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
              ${!btn.style ? 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200' : ''}
            `}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
