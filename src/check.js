import fs from "fs";
import { validateQuestion } from "./validateQuestion.js";

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    input: "data/questions.json",
    output: "data/output.json",
    report: "data/report.json",
  };

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    if (flag === "--input") config.input = value;
    else if (flag === "--output") config.output = value;
    else if (flag === "--report") config.report = value;
  }

  return config;
}

async function main() {
  try {
    const config = parseArgs();
    console.log("Loading questions from:", config.input);

    // Load questions
    const questionsData = JSON.parse(fs.readFileSync(config.input, "utf-8"));
    console.log(`Loaded ${questionsData.length} questions`);

    // Process each question
    const validQuestions = [];
    const report = {};
    let removedCount = 0;

    for (const question of questionsData) {
      const validation = await validateQuestion(question);
      report[question.question_id] = validation.issues;

      if (validation.isValid) {
        validQuestions.push(validation.cleanedQuestion);
      } else {
        removedCount++;
      }
    }

    console.log(`\nValidation complete:`);
    console.log(`- Valid questions: ${validQuestions.length}`);
    console.log(`- Removed questions: ${removedCount}`);
    console.log(`- Total processed: ${questionsData.length}`);

    fs.writeFileSync(config.output, JSON.stringify(validQuestions, null, 2));
    fs.writeFileSync(config.report, JSON.stringify(report, null, 2));

    console.log(`\nOutput written to: ${config.output}`);
    console.log(`Report written to: ${config.report}`);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
