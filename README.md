# Question Validation Tool

## Issue Detection & Removal

This validator implements a comprehensive quality assurance system that identifies and removes questions exhibiting various structural, formatting, and content issues. The system uses a tiered approach with four severity levels and includes NLP-based ambiguity detection to ensure only high-quality, answerable questions remain in the dataset.

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

## Validation Logic & Removal Threshold
    
The removal threshold is based on whether a question is product ready, in that users would be able to answer the question, and notice no major flaws. As such, questions are removed if they are unanswerable, or if there are any major display issues. The majority of questions with simple formatting issues are autofixed, leaving only completely unanswerable questions to be removed.  
  
### Removal Strategy
Questions are removed if they exhibit **any Critical or Serious issues**. This strict threshold is implemented because:

1. **Critical Issues** make questions fundamentally broken - they cannot be answered, will cause rendering failures, or have structural problems that prevent proper functionality
2. **Serious Issues** create significant user confusion or inconsistent experiences, even if technically renderable
3. **Moderate Issues** are flagged but questions remain valid - these are style preferences or minor formatting concerns that don't affect functionality
4. **Auto-Fixed Issues** are automatically corrected during validation - questions are improved and kept in the dataset with reported fixes

## Technical Details

- **Language**: JavaScript (ES6 modules)
- **Runtime**: Node.js (version 14+ recommended)
- **Dependencies**: Prettier (development only)
- **Output**: JSON format with proper indentation
- **Error Reporting**: Standardized severity-based error messages with auto-fix tagging

## Development Commands

```bash
# Run validation
npm run start
# or
node src/check.js

# Format code with Prettier
npm run format

# Custom file paths
node src/check.js --input custom.json --output clean.json --report report.json
```

## Validation Coverage & Limitations

### Critical Issues (Questions Removed - Will Break Functionality)
These issues make questions completely unanswerable or cause rendering failures:

- **Null/Empty Specifications**: Questions with no question text or empty strings
- **Invalid Question IDs**: Missing or malformed question identifiers
- **Invalid Options Structure**: Null options, malformed JSON, or missing required fields (id, content, correct, order)
- **Answer Logic Failures**: No correct answer specified or multiple correct answers flagged
- **Duplicate Option Orders**: Multiple options with identical order values
- **Duplicate Option Content**: Options with identical text content (case-insensitive)
- **Malformed LaTeX**: Unmatched delimiters ($$, \( \), single $) that break rendering
- **Incomplete LaTeX Commands**: Commands missing required arguments (\frac without denominator, etc.)
- **Invalid Data Types**: Non-string specifications, invalid option structures
- **Insufficient Options**: Less than 2 options provided
- **Excessive Options**: More than 10 options (unwieldy for users)

### Serious Issues (Questions Removed - Likely User Confusion)
These issues will likely render but cause significant user confusion:

- **Mixed LaTeX Notation**: Inconsistent use of single ($) and double ($$) dollar delimiters in same question
- **LaTeX Outside Delimiters**: LaTeX commands found outside proper math delimiters
- **Extremely Long LaTeX**: LaTeX expressions exceeding 200 characters (performance issues)
- **Invalid LaTeX Syntax**: Triple backslashes, empty LaTeX blocks, other syntax errors
- **Missing Visual Content**: Questions referencing figures, graphs, charts, tables, datasets, or diagrams that are not provided
- **Confusing Variable Descriptions**: Questions with variables described incorrectly (e.g., describing number of sides when variable represents side length)
- **Ambiguous Question Structure**: Detected using NLP analysis for:
  - Multiple vague pronouns ("it", "this", "that") without clear referents
  - Unclear question structure lacking proper interrogative elements
  - Overly complex sentence structures that reduce comprehension
  - Vague quantifiers ("some", "many", "few") without specific context
  - Missing contextual information needed to answer questions
  
### Moderate Issues (Questions Retained but Flagged)
These issues are noticeable but don't prevent answering:

- **Unclear Question Structure**: Lacks question words, question marks, or task instructions
- **Long Single-Dollar LaTeX**: Single-dollar expressions over 50 characters (style preference)
- **Multi-line LaTeX**: LaTeX expressions spanning multiple lines (formatting concern)

### Auto-Fixed Issues (Automatically Corrected)
These issues are detected and automatically corrected without removing questions:

- **Formatting Cleanup**: Removes excessive line breaks, malformed escapes, unnecessary spaces
- **Super/Subscript Braces**: Adds missing braces to multi-character superscripts/subscripts
- **Non-Sequential Ordering**: Fixes gaps in option order sequences (0, 1, 2, 3...)
- **Duplicate Option Orders**: Automatically reassigns sequential order values when multiple options have the same order
- **Image URL Formatting**: Cleans up malformed image reference syntax

### Known Limitations
The following issues require manual review and are not automatically detected:

- **Complex Semantic Issues**: Questions with subtle logical problems or ambiguous phrasing not caught by pattern matching (97a1e83b-6c1b-4697-be02-4ec7a88f7df6)

- **False Positives**: Some grammatical questions may be incorrectly flagged as ambiguous (rare due to improved detection logic)

- **Rich Content**: Questions with HTML/base64 content that might not render properly in all contexts
