const questionInput = document.querySelector("#question");
const questionForm = document.querySelector("#question-form");
const solveButton = document.querySelector("#solve");
const emptyState = document.querySelector("#empty-state");
const solution = document.querySelector("#solution");
const coinBalance = document.querySelector("#coin-balance");
const colorMenu = document.querySelector(".color-menu");
const colorMenuToggle = document.querySelector(".color-menu-toggle");
const colorChoices = document.querySelectorAll(".color-choice");
const quizLaunch = document.querySelector("#quiz-launch");
const quizPanel = document.querySelector("#quiz-panel");

let coins = Number(localStorage.getItem("proofline-coins") || 0);
let savedColor = localStorage.getItem("proofline-background") || "#f7f8f4";
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

let quizQuestions = [];

function randomWhole(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function createQuizQuestions() {
  const equationConstant = randomWhole(3, 12);
  const equationRight = randomWhole(10, 25);
  const rectangleLength = randomWhole(5, 14);
  const rectangleWidth = randomWhole(2, 8);
  const fractionDenominator = [4, 5, 6, 8, 10][randomWhole(0, 4)];
  const fractionNumerator = randomWhole(1, fractionDenominator - 1);
  const fractionAddend = randomWhole(1, fractionDenominator - 1);
  const equationAnswer = equationRight;
  const rectangleAnswer = 2 * (rectangleLength + rectangleWidth);
  const fractionAnswer = formatFraction(fractionNumerator + fractionAddend, fractionDenominator);
  return [
    { prompt: `Solve: x + ${equationConstant} = ${equationConstant} + ${equationRight}`, answer: String(equationAnswer), explanation: `Add the constants on the right: ${equationConstant} + ${equationRight} = ${equationConstant + equationRight}, then subtract ${equationConstant} from both sides. So x = ${equationAnswer}.` },
    { prompt: `A rectangle is ${rectangleLength} units long and ${rectangleWidth} units wide. What is its perimeter?`, answer: String(rectangleAnswer), explanation: `Use 2 × (length + width): 2 × (${rectangleLength} + ${rectangleWidth}) = ${rectangleAnswer} units.` },
    { prompt: `What is ${fractionNumerator}/${fractionDenominator} + ${fractionAddend}/${fractionDenominator}? Give your answer as a fraction.`, answer: fractionAnswer, explanation: `The denominators already match, so add the numerators: ${fractionNumerator}/${fractionDenominator} + ${fractionAddend}/${fractionDenominator} = ${fractionNumerator + fractionAddend}/${fractionDenominator} = ${fractionAnswer}.` }
  ];
}

function updateWallet() {
  coinBalance.textContent = coins;
}

function setBackground(color) {
  document.documentElement.style.setProperty("--paper", color);
  colorChoices.forEach((choice) => choice.classList.toggle("active", choice.dataset.color === color));
  localStorage.setItem("proofline-background", color);
}

updateWallet();
setBackground(savedColor);

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
  } else if (/(circle|disk)/.test(normalized) && /(perimeter|circumference|around)/.test(normalized)) {
    result = 2 * Math.PI * first;
    formula = `2 × π × ${first} = ${formatNumber(result)}`;
    title = "Circle circumference";
    explanation = "A circle's perimeter is called its circumference: multiply 2, π, and the radius.";
  } else if (/(triangle)/.test(normalized) && /(area)/.test(normalized) && second !== undefined) {
    result = first * second / 2;
    formula = `(${first} × ${second}) ÷ 2 = ${formatNumber(result)}`;
    title = "Triangle area";
    explanation = "A triangle's area is half of its base multiplied by its height.";
  } else if (/(triangle)/.test(normalized) && /(perimeter)/.test(normalized) && numbers.length >= 3) {
    result = numbers[0] + numbers[1] + numbers[2];
    formula = `${numbers[0]} + ${numbers[1]} + ${numbers[2]} = ${formatNumber(result)}`;
    title = "Triangle perimeter";
    explanation = "Add the lengths of all three sides to find a triangle's perimeter.";
  } else if (/(square)/.test(normalized) && /(perimeter|around)/.test(normalized)) {
    result = 4 * first;
    formula = `4 × ${first} = ${formatNumber(result)}`;
    title = "Square perimeter";
    explanation = "A square has four equal sides, so multiply one side by 4.";
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
  const unitLabel = /(area)/i.test(title) ? "square units" : "units";
  return { title, answer: `${formatNumber(result)} ${unitLabel}`, steps: [
    { text: explanation, math: formula },
    { text: `The answer is measured in ${unitLabel} because this is a ${unitLabel === "square units" ? "space" : "distance"} measurement.`, math: `Answer = ${formatNumber(result)} ${unitLabel}` }
  ] };
}

function parseLinearSide(side) {
  const cleaned = side.replace(/\s+/g, "");
  const terms = cleaned.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join("") !== cleaned) return null;

  let coefficient = 0;
  let constant = 0;
  for (const term of terms) {
    if (term.endsWith("x")) {
      const value = term.slice(0, -1);
      coefficient += value === "" || value === "+" ? 1 : value === "-" ? -1 : Number(value);
    } else {
      constant += Number(term);
    }
  }
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
  quizPanel.hidden = true;
  emptyState.hidden = false;
  coins += 10;
  localStorage.setItem("proofline-coins", coins);
  updateWallet();
  const result = solveQuestion(questionInput.value);
  if (result) return render(result);
  emptyState.hidden = true;
  solution.hidden = false;
  solution.innerHTML = `<div class="solution-head"><div><p class="solution-kicker">let's unpack that</p><h2>One more detail needed</h2></div><div class="answer-value">?</div></div><p class="steps-title">Try a supported format</p><p class="error">I can patiently walk through word problems, fractions, geometry, percentages, and equations. Try <strong>Mia has 7 stickers and gets 5 more</strong>, <strong>3/4 + 1/8</strong>, or <strong>4x − 9 = 2x + 7</strong>.</p>`;
}

function answersMatch(input, expected) {
  return input.toLowerCase().replace(/\s+/g, "").replace(/units?/g, "") === expected;
}

function renderQuizQuestion() {
  const question = quizQuestions[quizIndex];
  quizPanel.hidden = false;
  emptyState.hidden = true;
  solution.hidden = true;
  quizPanel.innerHTML = `<p class="quiz-kicker">knowledge check</p><p class="quiz-progress">QUESTION ${quizIndex + 1} OF ${quizQuestions.length}</p><h2 class="quiz-question">${question.prompt}</h2><form class="quiz-form" id="quiz-form"><input class="quiz-input" id="quiz-input" autocomplete="off" placeholder="Your answer" aria-label="Your answer" /><button class="quiz-submit" type="submit">Check answer</button></form>`;
  quizPanel.querySelector("#quiz-input").focus();
  quizPanel.querySelector("#quiz-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (quizAnswered) return;
    quizAnswered = true;
    const input = quizPanel.querySelector("#quiz-input").value.trim();
    const correct = answersMatch(input, question.answer);
    if (correct) quizScore += 1;
    quizPanel.querySelector("#quiz-form").hidden = true;
    quizPanel.insertAdjacentHTML("beforeend", `<p class="quiz-feedback"><strong>${correct ? "Correct." : `The answer is ${question.answer}.`}</strong> ${question.explanation}</p><button class="quiz-next" id="quiz-next" type="button">${quizIndex === quizQuestions.length - 1 ? "See my score" : "Next question ↗"}</button>`);
    quizPanel.querySelector("#quiz-next").addEventListener("click", () => {
      if (quizIndex === quizQuestions.length - 1) return renderQuizSummary();
      quizIndex += 1;
      quizAnswered = false;
      renderQuizQuestion();
    });
  });
}

function renderQuizSummary() {
  coins += 100;
  localStorage.setItem("proofline-coins", coins);
  updateWallet();
  quizPanel.innerHTML = `<p class="quiz-kicker">test complete</p><div class="quiz-score">${quizScore} / ${quizQuestions.length}</div><p class="quiz-summary">${quizScore === quizQuestions.length ? "Excellent work. You showed a strong handle on the recent topics." : "Good effort. Review the explanations, then try the test again to sharpen your skills."}</p><button class="quiz-next" id="quiz-restart" type="button">Try again ↗</button>`;
  quizPanel.querySelector("#quiz-restart").addEventListener("click", startQuiz);
}

function startQuiz() {
  quizIndex = 0;
  quizScore = 0;
  quizAnswered = false;
  quizQuestions = createQuizQuestions();
  renderQuizQuestion();
}

function closeColorMenu() {
  colorMenu.classList.remove("is-open");
}

colorMenuToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  colorMenu.classList.toggle("is-open");
});

document.addEventListener("click", (event) => {
  if (!colorMenu.contains(event.target)) closeColorMenu();
});

colorChoices.forEach((choice) => choice.addEventListener("click", () => {
  if (choice.dataset.color === savedColor) return closeColorMenu();
  if (coins < 10) return closeColorMenu();
  coins -= 10;
  savedColor = choice.dataset.color;
  localStorage.setItem("proofline-coins", coins);
  updateWallet();
  setBackground(savedColor);
  closeColorMenu();
}));

quizLaunch.addEventListener("click", startQuiz);

questionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  solve();
});
questionInput.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.code === "Enter") && !event.shiftKey) {
    event.preventDefault();
    solve();
  }
});
document.querySelectorAll(".suggestion").forEach((button) => button.addEventListener("click", () => {
  questionInput.value = button.dataset.question;
  questionInput.focus();
}));
