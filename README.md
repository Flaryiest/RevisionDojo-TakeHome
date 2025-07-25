# Question Validation Tool

## Features

The validator detects and handles the following issues:

### Critical Issues (Questions Removed)
- **Null/Empty Specifications**: Questions with no question text
- **Invalid Options**: Null options, malformed JSON, or missing required fields
- **Answer Issues**: No correct answer or multiple correct answers
- **Duplicate Option Orders**: Multiple options with the same order value
- **Duplicate Option Content**: Options with identical content
- **Invalid Data Types**: Non-string specifications, invalid option structures

### Minor Issues (Questions Retained but Flagged)
- **Non-Sequential Ordering**: Options with gaps in order sequence (automatically fixed)

## Installation

1. Ensure you have Node.js installed (version 14+ recommended)
2. Clone or download this repository
3. No additional dependencies required (uses Node.js built-in modules)

## Usage

### Basic Usage
```bash
node src/check.js
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
This approach prioritizes question quality over quantity. A 30% removal rate is acceptable if it ensures the remaining questions are:
- Objectively answerable
- Properly formatted
- Structurally sound
- Free from ambiguity

## Example Results

From the provided dataset of 197 questions:
- **Valid questions**: 139 (70.6%)
- **Removed questions**: 58 (29.4%)

### Common Issues Found
1. **Duplicate option orders** (most common): All options had order=0
2. **Empty specifications**: Questions with blank question text
3. **Null options**: Questions missing answer choices entirely
4. **LaTeX syntax errors**: Unmatched delimiters in mathematical expressions

## Technical Details

- **Language**: JavaScript (ES6 modules)
- **Runtime**: Node.js
- **Dependencies**: None (uses built-in `fs` module)
- **Output**: JSON format with proper indentation

## Error Handling

The tool includes robust error handling for:
- File read/write operations
- JSON parsing errors
- Invalid data structures
- Command line argument parsing

## Extensibility

The validation logic is modular and can be easily extended:
- Add new validation rules in `validateQuestion.js`
- Modify removal thresholds
- Add custom LaTeX pattern detection
- Implement additional cleaning operations