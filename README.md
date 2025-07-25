# Question Validation Tool

## Features

The validator detects and handles the following issues:

### Critical Issues (Questions Removed)
- **Null/Empty Specifications**: Questions with no question text
- **Invalid Options**: Null options, malformed JSON, or missing required fields
- **Answer Issues**: No correct answer or multiple correct answers
- **Duplicate Option Orders**: Multiple options with the same order value
- **Duplicate Option Content**: Options with identical content
- **Malformed LaTeX**: Unmatched LaTeX delimiters or syntax errors
- **Invalid Data Types**: Non-string specifications, invalid option structures

### Minor Issues (Questions Retained but Flagged)
- **Non-Sequential Ordering**: Options with gaps in order sequence (automatically fixed)
- **Minor LaTeX Warnings**: Detected but not problematic LaTeX usage

## Installation

1. Ensure you have Node.js installed (version 14+ recommended)
2. Clone or download this repository
3. No additional dependencies required (uses Node.js built-in modules)

## Usage

### Basic Usage
```bash
node src/check.js
```
  
or  
  
```bash
npm run start
```

### Custom File Paths
```bash
node src/check.js --input questions.json --output cleaned_questions.json --report validation_report.json
```

### Command Line Options
- `--input`: Path to input questions file (default: `data/questions.json`)
- `--output`: Path for cleaned questions output (default: `data/output.json`)
- `--report`: Path for validation report (default: `data/report.json`)

## Input Format

Questions should be in JSON format with the following structure:
```json
[
  {
    "question_id": "UUID",
    "specification": "Question text with optional LaTeX $$math$$",
    "options": "[{\"id\": 123, \"content\": \"Answer A\", \"correct\": true, \"order\": 0}, ...]"
  }
]
```

Note: The `options` field can be either a JSON string or an array object.

## Output Format

### output.json
Clean questions in the expected format:
```json
[
  {
    "id": "UUID",
    "question": "Question text",
    "options": [
      {
        "id": 123,
        "content": "Answer A", 
        "correct": true,
        "order": 0
      }
    ]
  }
]
```

### report.json
Validation issues for each question:
```json
{
  "question-uuid": ["list of issues"],
  "another-uuid": []
}
```

## Validation Logic

### Removal Threshold
Questions are removed if they have any critical issues that make them unanswerable or ambiguous:

1. **Data Integrity Issues**: Missing IDs, null/empty content
2. **Answer Logic Issues**: No correct answer, multiple correct answers
3. **Structural Issues**: Duplicate orders, malformed options
4. **Format Issues**: Severe LaTeX errors, invalid JSON

### Justification
This approach prioritizes question quality over quantity. It ensures the remaining questions are:
- Objectively answerable
- Properly formatted
- Structurally sound
- Free from ambiguity

## Technical Details

- **Language**: JavaScript (ES6 modules)
- **Runtime**: Node.js
- **Dependencies**: None (uses built-in `fs` module)
- **Output**: JSON format with proper indentation

## Current Issues

- Questions referencing an image or graph without it existing
- ex: 047cac71-264b-435c-83b7-224a166de720
  
- Questions referencing data that doesn't exist
- ex: 005c762e-c7d6-4189-9747-086531cf5258
  
- Questions with a confusing or incorrect wording
- ex: 97a1e83b-6c1b-4697-be02-4ec7a88f7df6

- Questions being wrongly flagged as ambiguous (particularly grammatical questions)