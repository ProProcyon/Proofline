const questionInput = document.querySelector("#question");
const solveButton = document.querySelector("#solve");
const emptyState = document.querySelector("#empty-state");
const solution = document.querySelector("#solution");

function formatNumber(value) {
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(8)));
}

function gcd(first, second) {
  let left = Math.abs(first);
  let right = Math.abs(second);
  while (right) [left, right] = [right, left % right];
  return left || 1;
}

function formatFraction(numerator, denominator) {
  if (denominator === 0) return "undefined";
  const sign = denominator < 0 ? -1 : 1;
  const divisor = gcd(numerator, denominator);
  const reducedNumerator = sign * numerator / divisor;
  const reducedDenominator = Math.abs(denominator) / divisor;
  return reducedDenominator === 1 ? String(reducedNumerator) : `${reducedNumerator}/${reducedDenominator}`;
}

function parseFraction(value) {
  const match = value.trim().match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  return match ? { numerator: Number(match[1]), denominator: Number(match[2]) } : null;
}

function solveFractions(text) {
  const match = text.match(/^\s*(-?\d+\s*\/\s*-?\d+)\s*([+\-*/])\s*(-?\d+\s*\/\s*-?\d+)\s*$/);
  if (!match) return null;
  const first = parseFraction(match[1]);
  const second = parseFraction(match[3]);
  if (!first || !second || second.numerator === 0 && match[2] === "/") return null;
  let numerator;
  let denominator;
  if (match[2] === "+" || match[2] === "-") {
    numerator = first.numerator * second.denominator + (match[2] === "+" ? 1 : -1) * second.numerator * first.denominator;
    denominator = first.denominator * second.denominator;
  } else if (match[2] === "*") {
    numerator = first.numerator * second.numerator;
    denominator = first.denominator * second.denominator;
  } else {
    numerator = first.numerator * second.denominator;
    denominator = first.denominator * second.numerator;
  }
  return {
    title: "Fraction arithmetic",
    answer: formatFraction(numerator, denominator),
    steps: [
      { text: "Combine the fractions using a common denominator when needed.", math: `${match[1]} ${match[2]} ${match[3]}` },
      { text: "Reduce the result by dividing the numerator and denominator by their greatest common factor.", math: `${numerator}/${denominator} = ${formatFraction(numerator, denominator)}` }
    ]
  };
}

function solveGeometry(text) {
  const normalized = normalizeText(text);
  const numbers = [...normalized.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  if (!numbers.length) return null;
  const [first, second] = numbers;
  let result;
  let formula;
  let title;
  let explanation;
  if (/(circle|disk)/.test(normalized) && /(area|surface)/.test(normalized)) {
    result = Math.PI * first * first;
    formula = `π × ${first}² = ${formatNumber(result)}`;
    title = "Circle area";
    explanation = "For a circle, square the radius and multiply by π.";
  } else if (/(triangle)/.test(normalized) && /(area)/.test(normalized) && second !== undefined) {
    result = first * second / 2;
    formula = `(${first} × ${second}) ÷ 2 = ${formatNumber(result)}`;
    title = "Triangle area";
    explanation = "A triangle's area is half of its base multiplied by its height.";
  } else if (/(rectangle|rectangular)/.test(normalized) && /(area)/.test(normalized) && second !== undefined) {
    result = first * second;
    formula = `${first} × ${second} = ${formatNumber(result)}`;
    title = "Rectangle area";
    explanation = "Multiply the rectangle's length by its width.";
  } else if (/(rectangle|rectangular)/.test(normalized) && /(perimeter)/.test(normalized) && second !== undefined) {
    result = 2 * (first + second);
    formula = `2 × (${first} + ${second}) = ${formatNumber(result)}`;
    title = "Rectangle perimeter";
    explanation = "A rectangle has two lengths and two widths, so add both pairs.";
  } else {
    return null;
  }
  return { title, answer: `${formatNumber(result)} square units`, steps: [
    { text: explanation, math: formula },
    { text: "Attach square units because this calculation measures space or area.", math: `Answer = ${formatNumber(result)} square units` }
  ] };
}

function parseLinearSide(side) {
  const cleaned = side.replace(/\s+/g, "");
  const variable = cleaned.match(/([+-]?\d*\.?\d*)x/);
  const constantText = cleaned.replace(/([+-]?\d*\.?\d*)x/, "");
  const coefficient = variable ? (variable[1] === "" || variable[1] === "+" ? 1 : variable[1] === "-" ? -1 : Number(variable[1])) : 0;
  const constant = constantText ? Number(constantText) : 0;
  return Number.isFinite(coefficient) && Number.isFinite(constant) ? { coefficient, constant } : null;
}

function solveLinearEquation(normalized) {
  const equation = normalized.match(/^(.+?)\s*=\s*(.+)$/);
  if (!equation || !/x/.test(normalized)) return null;
  const left = parseLinearSide(equation[1]);
  const right = parseLinearSide(equation[2]);
  if (!left || !right || left.coefficient === right.coefficient) return null;
  const result = (right.constant - left.constant) / (left.coefficient - right.coefficient);
  const coefficient = left.coefficient - right.coefficient;
  const constant = right.constant - left.constant;
  return {
    title: "Linear equation",
    answer: `x = ${formatNumber(result)}`,
    steps: [
      { text: "Move all x terms to the left side and all constant terms to the right side.", math: `${formatNumber(coefficient)}x = ${formatNumber(constant)}` },
      { text: `Divide both sides by ${formatNumber(coefficient)} to isolate x.`, math: `x = ${formatNumber(constant)} ÷ ${formatNumber(coefficient)} = ${formatNumber(result)}` },
      { text: "Check the result by substituting it back into both sides of the original equation.", math: `x = ${formatNumber(result)}` }
    ]
  };
}

function sanitizeMathExpression(raw) {
  return raw
    .replace(/\bplus\b/g, "+")
    .replace(/\bminus\b/g, "-")
    .replace(/\bmultiplied by\b/g, "*")
    .replace(/\btimes\b/g, "*")
    .replace(/\bdivided by\b/g, "/")
    .replace(/\bof\b/g, "")
    .replace(/\bpercent\b/g, "%")
    .replace(/[×x]/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function calculateExpression(raw) {
  const expression = sanitizeMathExpression(raw);

  if (!/^[\d+*/().%-]+$/.test(expression) || !/[\d)]/.test(expression)) return null;
  try {
    const result = Function(`"use strict"; return (${expression})`)();
    return Number.isFinite(result) ? { result, expression } : null;
  } catch { return null; }
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/,/g, " ")
    .replace(/−/g, " - ")
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseWordProblem(text) {
  const lower = normalizeText(text);
  const numbers = [...lower.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  if (numbers.length < 2) return null;

  const discountMatch = lower.match(/(?:costs?|price of|for)\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:dollars?|usd)?\s*(?:.*?)(?:discounted by|off|sale|reduced by)\s*(\d+(?:\.\d+)?)\s*%/);
  if (discountMatch) {
    const price = Number(discountMatch[1]);
    const rate = Number(discountMatch[2]);
    return {
      expression: `${price} - ${price} * ${rate} / 100`,
      result: price - (price * rate / 100),
      label: "Discount word problem"
    };
  }

  const operation =
    /(sum|total|altogether|in all|combined|more|added|plus|increase)/.test(lower) ? "+" :
    /(difference|less|left|remaining|after|minus|decrease|spent|gave away|lost|fewer|remains|remain|taken away|taken|removed)/.test(lower) ? "-" :
    /(divided|shared equally|share equally|split|equally among|per person)/.test(lower) ? "/" :
    /(times|multiplied by|product|groups of|each|per|every)/.test(lower) ? "*" : null;

  if (!operation) return null;

  const hasExplicitOperator = /[+\-*/]/.test(text);
  if (hasExplicitOperator) return null;

  const first = numbers[0];
  const second = numbers[1];
  const operationNames = { "+": "addition", "-": "subtraction", "*": "multiplication", "/": "division" };
  return {
    expression: `${first}${operation}${second}`,
    result: Function(`"use strict"; return (${first}${operation}${second})`)(),
    label: "Word problem",
    operationName: operationNames[operation]
  };
}

function solveQuestion(raw) {
  const question = raw.trim().replace(/[?]+$/, "");
  if (!question) return null;

  const normalized = normalizeText(question);

  const fractionResult = solveFractions(normalized.replace(/^(what is|calculate|find|solve)\s+/i, ""));
  if (fractionResult) return fractionResult;

  const geometryResult = solveGeometry(question);
  if (geometryResult) return geometryResult;

  const percent = normalized.match(/([-+]?\d*\.?\d+)\s*%\s*(?:of|\*|times|x)?\s*([-+]?\d*\.?\d+)/);
  if (percent) {
    const rate = Number(percent[1]);
    const base = Number(percent[2]);
    const answer = rate / 100 * base;
    return { title: "Percentage", answer: formatNumber(answer), steps: [
      { text: "Turn the percentage into a decimal by dividing by 100.", math: `${formatNumber(rate)}% = ${formatNumber(rate)} ÷ 100 = ${formatNumber(rate / 100)}` },
      { text: "Multiply the decimal by the original amount.", math: `${formatNumber(rate / 100)} × ${formatNumber(base)} = ${formatNumber(answer)}` }
    ] };
  }

  const directArithmetic = calculateExpression(normalized.replace(/^(what is|calculate|solve|evaluate|find)\s+/i, ""));
  if (directArithmetic) {
    const pretty = directArithmetic.expression.replace(/\*/g, " × ").replace(/\//g, " ÷ ");
    return { title: "Arithmetic", answer: formatNumber(directArithmetic.result), steps: [
      { text: "Apply the order of operations: multiplication and division come before addition and subtraction.", math: pretty },
      { text: "Evaluate the expression.", math: `${pretty} = ${formatNumber(directArithmetic.result)}` }
    ] };
  }

  const equationResult = solveLinearEquation(normalized.replace(/^(solve|find|calculate|evaluate)\s+/i, ""));
  if (equationResult) return equationResult;

  const wordProblem = parseWordProblem(question);
  if (wordProblem) {
    const pretty = wordProblem.expression.replace(/\*/g, " × ").replace(/\//g, " ÷ ");
    return { title: wordProblem.label, answer: formatNumber(wordProblem.result), steps: [
      { text: `I identified this as a ${wordProblem.operationName} problem from the story's wording.`, math: pretty },
      { text: "Now calculate the expression and check that the result answers the question.", math: `${pretty} = ${formatNumber(wordProblem.result)}` }
    ] };
  }

  return null;
}

function render(result) {
  emptyState.hidden = true;
  solution.hidden = false;
  solution.innerHTML = `<div class="solution-head"><div><p class="solution-kicker">worked solution</p><h2>${result.title}</h2></div><div class="answer-value">${result.answer}</div></div><p class="steps-title">The reasoning</p>${result.steps.map((step, index) => `<div class="step"><span class="step-number">${index + 1}</span><div>${step.text}<span class="math-line">${step.math}</span></div></div>`).join("")}`;
}

function solve() {
  const result = solveQuestion(questionInput.value);
  if (result) return render(result);
  emptyState.hidden = true;
  solution.hidden = false;
  solution.innerHTML = `<div class="solution-head"><div><p class="solution-kicker">let's unpack that</p><h2>One more detail needed</h2></div><div class="answer-value">?</div></div><p class="steps-title">Try a supported format</p><p class="error">I can patiently walk through word problems, fractions, geometry, percentages, and equations. Try <strong>Mia has 7 stickers and gets 5 more</strong>, <strong>3/4 + 1/8</strong>, or <strong>4x − 9 = 2x + 7</strong>.</p>`;
}

solveButton.addEventListener("click", solve);
questionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); solve(); }
});
document.querySelectorAll(".suggestion").forEach((button) => button.addEventListener("click", () => {
  questionInput.value = button.dataset.question;
  questionInput.focus();
}));
