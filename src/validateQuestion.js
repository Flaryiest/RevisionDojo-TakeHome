// Configuration constants
const CONFIG = {
  VALIDATION: {
    MIN_SPECIFICATION_LENGTH: 10,
    MIN_OPTIONS_COUNT: 2,
    MAX_OPTIONS_COUNT: 10,
    MAX_LATEX_EXPRESSION_LENGTH: 200,
    MAX_CONSECUTIVE_SPACES: 2,
    MIN_SUPER_SUBSCRIPT_LENGTH: 2,
  },
  REGEX: {
    MATH_COMMANDS:
      /\\(?:frac|sqrt|sum|int|lim|sin|cos|tan|log|ln|alpha|beta|gamma|delta|theta|pi|infty|cdot|times|div|pm|leq|geq|neq|approx|equiv)\b/,
    LATEX_DELIMITERS: /\$|\\\(|\\\[/,
    LONG_SINGLE_DOLLAR_EXPRESSION: /\$[^$]{50,}\$/,
    MISSING_VISUAL_CONTENT:
      /\b(in the (figure|graph|chart|table|diagram|image|plot|scatterplot|histogram)\s+(above|below|shown)|the (figure|graph|chart|table|diagram|image|plot|scatterplot|histogram)\s+(above|below|shown)|as shown in the (figure|graph|chart|table|diagram|plot)|the following (figure|graph|chart|table|diagram|image|plot)\s+shows|shown in the (graph|figure|chart|table|diagram|plot)|the (bar|line|scatter)\s+(plot|chart|graph)\s+(below|above)\s+shows|data set [A-Z]|dataset [A-Z]|the data (below|above)|from the data|using the data|based on the data|the (given|provided) data|according to the data)\b/i,
  },
};

export function validateQuestion(question) {
  const issues = [];
  let isValid = true;
  let cleanedQuestion = { ...question };

  // Missing or invalid question_id
  if (!question.question_id || typeof question.question_id !== "string") {
    issues.push("Critical: Missing or invalid question_id");
    isValid = false;
    return { isValid, issues, cleanedQuestion };
  }

  // null, empty, or invalid specification
  const specificationIssues = validateSpecification(question.specification);
  issues.push(...specificationIssues.issues);
  if (specificationIssues.shouldRemove) {
    isValid = false;
  } else if (specificationIssues.cleaned) {
    cleanedQuestion.specification = specificationIssues.cleaned;
  }

  // Check options
  const optionsIssues = validateOptions(question.options);
  issues.push(...optionsIssues.issues);
  if (optionsIssues.shouldRemove) {
    isValid = false;
  } else if (optionsIssues.cleaned) {
    cleanedQuestion.options = optionsIssues.cleaned;
  }

  // Convert question to expected format (specification -> question)
  if (isValid && cleanedQuestion.specification) {
    // Create new object with desired field order: question, id, options
    const orderedQuestion = {
      question: cleanedQuestion.specification,
      id: cleanedQuestion.question_id,
      options: cleanedQuestion.options,
    };
    cleanedQuestion = orderedQuestion;
  }

  return { isValid, issues, cleanedQuestion };
}

function validateSpecification(specification) {
  const issues = [];
  let shouldRemove = false;
  let cleaned = specification;

  // null or undefined
  if (specification === null || specification === undefined) {
    issues.push("Critical: Specification is null or undefined");
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // Empty string
  if (typeof specification === "string" && specification.trim() === "") {
    issues.push("Critical: Specification is empty");
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // Non-string types
  if (typeof specification !== "string") {
    issues.push("Critical: Specification is not a string");
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // Malformed LaTeX
  const latexIssues = validateLatex(specification);
  if (latexIssues.shouldRemove) {
    issues.push(...latexIssues.issues);
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  } else if (latexIssues.issues.length > 0) {
    issues.push(...latexIssues.issues);
    cleaned = latexIssues.cleaned || specification;
  }

  // Overly short or nonsensical text
  if (
    specification.trim().length < CONFIG.VALIDATION.MIN_SPECIFICATION_LENGTH
  ) {
    issues.push("Critical: Specification is too short to be meaningful");
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // Check for references to missing visual content
  if (CONFIG.REGEX.MISSING_VISUAL_CONTENT.test(specification)) {
    // Check if there's actually visual content (images, embedded data, etc.)
    const hasVisualContent =
      /!\[.*?\]\(.*?\)|<img\b[^>]*>|data:image\/|<svg\b[^>]*>|https?:\/\/.*\.(png|jpg|jpeg|gif|svg)/i.test(
        specification,
      );

    if (!hasVisualContent) {
      issues.push(
        "Serious: References missing visual content (figure, graph, chart, table, or data)",
      );
      shouldRemove = true;
      return { issues, shouldRemove, cleaned };
    }
  }

  return { issues, shouldRemove, cleaned };
}

function validateLatex(text) {
  const issues = [];
  let shouldRemove = false;

  // AUTO-FIX: Clean up common formatting issues before validation
  // Fix line breaks, malformed image URLs, unnecessary escapes, and excessive spacing

  let cleaned = text
    .replace(/(?<!\$)\\\\\n/g, "\n")
    .replace(/(?<!\$)\\\n/g, "\n")
    .replace(/!\[(.*?)\]\((.*?)\?\\"?\)/g, "![$1]($2)")
    .replace(/\\"/g, '"')
    .replace(/\s{3,}/g, " ".repeat(CONFIG.VALIDATION.MAX_CONSECUTIVE_SPACES));

  const wasAutoFixed = cleaned !== text;
  if (wasAutoFixed) {
    issues.push("Auto-fixed: Cleaned up formatting and escape sequences");
  }

  // CRITICAL ISSUES - These will break rendering and must be removed

  // 1. Unmatched $$ delimiters (will break entire LaTeX rendering)
  const dollarMatches = cleaned.match(/\$\$/g);
  if (dollarMatches && dollarMatches.length % 2 !== 0) {
    issues.push(
      "Critical: Unmatched LaTeX delimiters ($$) - will break rendering",
    );
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // 2. Unmatched \( \) delimiters (will break rendering)
  const openParens = (cleaned.match(/\\\(/g) || []).length;
  const closeParens = (cleaned.match(/\\\)/g) || []).length;
  if (openParens !== closeParens) {
    issues.push(
      "Critical: Unmatched LaTeX delimiters (\\( \\)) - will break rendering",
    );
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // 3. Unmatched single $ delimiters (very common LaTeX error)
  const singleDollarMatches = cleaned.match(/(?<!\$)\$(?!\$)/g);
  if (singleDollarMatches && singleDollarMatches.length % 2 !== 0) {
    issues.push(
      "Critical: Unmatched single dollar LaTeX delimiters ($) - will break rendering",
    );
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // 4. Unmatched {} braces within LaTeX contexts
  const dollarSections = cleaned.split(/\$\$/);
  for (let i = 1; i < dollarSections.length; i += 2) {
    // Only check LaTeX sections
    const section = dollarSections[i];
    const openBraces = (section.match(/\{/g) || []).length;
    const closeBraces = (section.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push(
        "Critical: Unmatched braces in LaTeX section - will break rendering",
      );
      shouldRemove = true;
      return { issues, shouldRemove, cleaned };
    }
  }

  // 5. Check for LaTeX commands with missing required arguments
  const incompleteCommands = [
    /\\frac\s*\{[^}]*\}\s*$/, // \frac{numerator} without denominator
    /\\sqrt\s*$/, // \sqrt without argument
    /\\[a-zA-Z]+\s*\{[^}]*$/, // Any command with unclosed brace
    /\\\w+\s*\{[^}]*\{[^}]*$/, // Nested unclosed braces
  ];

  for (const pattern of incompleteCommands) {
    if (pattern.test(cleaned)) {
      issues.push(
        "Critical: Incomplete LaTeX commands - will cause rendering errors",
      );
      shouldRemove = true;
      return { issues, shouldRemove, cleaned };
    }
  }

  // SERIOUS ISSUES - These will likely cause user confusion but might still render

  // 6. Mixed dollar notation (inconsistent LaTeX style)
  // Only flag if both single AND double dollars are used in the same text
  const hasSingleDollars = /(?<!\$)\$(?!\$).*?(?<!\$)\$(?!\$)/.test(cleaned); // At least one pair of single dollars
  const hasDoubleDollars = /\$\$.*?\$\$/.test(cleaned); // At least one pair of double dollars
  if (hasSingleDollars && hasDoubleDollars) {
    issues.push(
      "Serious: Mixed single/double dollar LaTeX notation - inconsistent formatting",
    );
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // 7. LaTeX commands outside of math delimiters (will display as plain text)
  const hasLatexCommands = CONFIG.REGEX.MATH_COMMANDS.test(cleaned);
  const hasLatexDelimiters = CONFIG.REGEX.LATEX_DELIMITERS.test(cleaned);

  if (hasLatexCommands && !hasLatexDelimiters) {
    issues.push(
      "Serious: LaTeX commands found outside math delimiters - will display as plain text",
    );
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // 8. Extremely long LaTeX expressions (likely to cause rendering issues)
  const longLatexPattern = new RegExp(
    `\\$\\$[^$]{${CONFIG.VALIDATION.MAX_LATEX_EXPRESSION_LENGTH},}\\$\\$`,
  );
  if (longLatexPattern.test(cleaned)) {
    issues.push(
      "Serious: Extremely long LaTeX expression - may cause rendering performance issues",
    );
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // 9. Invalid LaTeX syntax patterns (but exclude false positives from formatting)
  const invalidPatterns = [
    /\$\$\s*\$\$/, // Empty LaTeX blocks
    /\\\\\\/, // Triple backslashes (invalid)
    /\$\s*\$/, // Empty single dollar blocks
    /\\[0-9]/, // Backslash followed by number (often typo)
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(cleaned)) {
      issues.push("Serious: Invalid LaTeX syntax patterns detected");
      shouldRemove = true;
      return { issues, shouldRemove, cleaned };
    }
  }

  // AUTO-FIX: Handle moderate issues with automatic corrections

  // Fix superscripts and subscripts without braces
  let fixedModerate = cleaned;
  const superscriptPattern = new RegExp(
    `\\^([a-zA-Z0-9]{${CONFIG.VALIDATION.MIN_SUPER_SUBSCRIPT_LENGTH},})`,
    "g",
  );
  const subscriptPattern = new RegExp(
    `_([a-zA-Z0-9]{${CONFIG.VALIDATION.MIN_SUPER_SUBSCRIPT_LENGTH},})`,
    "g",
  );

  fixedModerate = fixedModerate.replace(superscriptPattern, "^{$1}");
  fixedModerate = fixedModerate.replace(subscriptPattern, "_{$1}");

  if (fixedModerate !== cleaned) {
    cleaned = fixedModerate;
    issues.push("Auto-fixed: Added braces to multi-character super/subscripts");
  }

  // MODERATE ISSUES - Flag but don't remove (users might not notice)

  // 10. Potential formatting issues that might still work
  const moderateIssues = [
    {
      pattern: CONFIG.REGEX.LONG_SINGLE_DOLLAR_EXPRESSION,
      message:
        "Moderate: Long single-dollar LaTeX expression - consider using double dollars",
    },
    {
      pattern: /\\\w+\s+\\\w+/,
      message: "Minor: Multiple LaTeX commands without proper spacing",
    },
    {
      pattern: /\$[^$]*\n[^$]*\$/,
      message:
        "Moderate: LaTeX expression spans multiple lines - may cause formatting issues",
    },
  ];

  for (const issue of moderateIssues) {
    if (issue.pattern.test(cleaned)) {
      issues.push(issue.message);
    }
  }

  // MINOR ISSUES - Just flag for awareness

  // 11. Style/best practice issues - only flag actual LaTeX spacing issues, not normal text
  const minorIssues = [
    {
      pattern: /(?<!\$)\*(?!\*)/,
      message:
        "Asterisk found - consider using \\cdot or \\times for multiplication",
    },
    // Removed space patterns as they were causing false positives on normal text
  ];

  for (const issue of minorIssues) {
    if (issue.pattern.test(cleaned)) {
      issues.push(`Minor: ${issue.message}`);
    }
  }

  return { issues, shouldRemove, cleaned };
}

function validateOptions(options) {
  const issues = [];
  let shouldRemove = false;
  let cleaned = options;

  // null or undefined options
  if (options === null || options === undefined) {
    issues.push("Critical: Options are null or undefined");
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // Parse options if they're a string
  let parsedOptions;
  try {
    if (typeof options === "string") {
      parsedOptions = JSON.parse(options);
      cleaned = parsedOptions;
    } else if (Array.isArray(options)) {
      parsedOptions = options;
    } else {
      issues.push(
        "Critical: Options are not in valid format (array or JSON string)",
      );
      shouldRemove = true;
      return { issues, shouldRemove, cleaned };
    }
  } catch (error) {
    issues.push("Critical: Options contain malformed JSON");
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // Check if options is an array
  if (!Array.isArray(parsedOptions)) {
    issues.push("Critical: Options is not an array");
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // Check minimum number of options
  if (parsedOptions.length < CONFIG.VALIDATION.MIN_OPTIONS_COUNT) {
    issues.push("Critical: Insufficient options (less than 2)");
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // Check maximum reasonable number of options
  if (parsedOptions.length > CONFIG.VALIDATION.MAX_OPTIONS_COUNT) {
    issues.push("Serious: Too many options (more than 10)");
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // Validate each option
  const seenIds = new Set();
  const seenOrders = new Set();
  const seenContent = new Set();
  let correctCount = 0;

  for (let i = 0; i < parsedOptions.length; i++) {
    const option = parsedOptions[i];

    // Check required fields
    if (
      !option.hasOwnProperty("id") ||
      !option.hasOwnProperty("content") ||
      !option.hasOwnProperty("correct") ||
      !option.hasOwnProperty("order")
    ) {
      issues.push(`Critical: Option ${i} missing required fields`);
      shouldRemove = true;
      return { issues, shouldRemove, cleaned };
    }

    // Duplicate IDs
    if (seenIds.has(option.id)) {
      issues.push(`Critical: Duplicate option ID: ${option.id}`);
      shouldRemove = true;
      return { issues, shouldRemove, cleaned };
    }
    seenIds.add(option.id);

    // Duplicate orders
    if (seenOrders.has(option.order)) {
      issues.push(`Critical: Duplicate option order: ${option.order}`);
      shouldRemove = true;
      return { issues, shouldRemove, cleaned };
    }
    seenOrders.add(option.order);

    // Duplicate content
    if (seenContent.has(option.content?.trim()?.toLowerCase())) {
      issues.push(`Critical: Duplicate option content detected`);
      shouldRemove = true;
      return { issues, shouldRemove, cleaned };
    }
    seenContent.add(option.content?.trim()?.toLowerCase());

    // Check content validity
    if (
      !option.content ||
      typeof option.content !== "string" ||
      option.content.trim() === ""
    ) {
      issues.push(`Critical: Option ${i} has empty or invalid content`);
      shouldRemove = true;
      return { issues, shouldRemove, cleaned };
    }

    // Check correct field
    if (typeof option.correct !== "boolean") {
      issues.push(`Critical: Option ${i} has invalid 'correct' field`);
      shouldRemove = true;
      return { issues, shouldRemove, cleaned };
    }

    if (option.correct) {
      correctCount++;
    }

    // Check order field
    if (typeof option.order !== "number" || option.order < 0) {
      issues.push(`Critical: Option ${i} has invalid order value`);
      shouldRemove = true;
      return { issues, shouldRemove, cleaned };
    }
  }

  // Correct answer count
  if (correctCount === 0) {
    issues.push("Critical: No correct answer specified");
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  if (correctCount > 1) {
    issues.push("Critical: Multiple correct answers specified");
    shouldRemove = true;
    return { issues, shouldRemove, cleaned };
  }

  // Check order sequence
  const orders = parsedOptions.map((opt) => opt.order).sort((a, b) => a - b);
  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i) {
      issues.push("Auto-fixed: Improper option ordering");
      // Fix the ordering
      parsedOptions.forEach((opt, idx) => {
        opt.order = idx;
      });
      cleaned = parsedOptions;
      break;
    }
  }

  return { issues, shouldRemove, cleaned };
}
