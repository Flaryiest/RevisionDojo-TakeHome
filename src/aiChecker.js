class AmbiguityDetector {
  static analyzeAmbiguity(text) {
    const words = text.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let ambiguityScore = 0;
    const issues = [];

    // 1. Vague pronouns and references
    const vaguePronouns = ['it', 'this', 'that', 'these', 'those', 'they', 'them'];
    const pronounCount = words.filter(word => vaguePronouns.includes(word)).length;
    if (pronounCount > 2) {
      ambiguityScore += 0.3;
      issues.push('Multiple vague pronouns detected');
    }

    // 2. Unclear quantifiers
    const vagueQuantifiers = ['some', 'many', 'few', 'several', 'various', 'certain'];
    const quantifierCount = words.filter(word => vagueQuantifiers.includes(word)).length;
    if (quantifierCount > 1) {
      ambiguityScore += 0.2;
      issues.push('Vague quantifiers present');
    }

    // 3. Missing question structure
    const hasQuestionWord = /\b(what|which|how|why|when|where|who)\b/i.test(text);
    const hasQuestionMark = text.includes('?');
    const hasTask = /\b(find|calculate|solve|determine|identify)\b/i.test(text);
    
    if (!hasQuestionWord && !hasQuestionMark && !hasTask) {
      ambiguityScore += 0.4;
      issues.push('Unclear question structure');
    }

    // 4. Conditional complexity
    const conditionals = text.match(/\b(if|when|unless|provided|assuming|given that)\b/gi) || [];
    if (conditionals.length > 2) {
      ambiguityScore += 0.3;
      issues.push('Multiple conditions may cause confusion');
    }

    // 5. Context dependency issues
    const contextDependentPhrases = [
      'as shown', 'given above', 'the following', 'from the data', 
      'in the figure', 'according to', 'based on'
    ];
    const contextCount = contextDependentPhrases.filter(phrase => 
      text.toLowerCase().includes(phrase)).length;
    if (contextCount > 1) {
      ambiguityScore += 0.3;
      issues.push('Multiple context dependencies');
    }

    // 6. Mathematical ambiguity
    const variables = text.match(/\$[a-zA-Z]\$/g) || [];
    const definedVariables = text.match(/where\s+\$[a-zA-Z]\$|let\s+\$[a-zA-Z]\$/gi) || [];
    const undefinedVars = variables.length - definedVariables.length;
    if (undefinedVars > 2) {
      ambiguityScore += 0.3;
      issues.push('Undefined mathematical variables');
    }

    return {
      score: Math.min(ambiguityScore, 1.0),
      issues,
      isAmbiguous: ambiguityScore > 0.6
    };
  }
}

export class AIChecker {
  static needsImprovement(text) {
    // Check for confusing variable descriptions
    const confusingPatterns = [
     
      
      // Mathematical confusion patterns
      /where.*\$[a-z]\$.*is.*number.*sides/i,
      /\$[a-z]\$.*represents.*height.*but.*calculate.*area/i,
      /variable.*\$[a-z]\$.*is.*width.*find.*perimeter.*of.*length/i,
      /where.*\$[a-z]\$.*equals.*speed.*determine.*distance.*time/i,
      
      // Self-referential confusion
      /this.*question.*asks.*about.*this.*problem.*which.*refers.*to.*this/i,
      /the.*above.*statement.*concerning.*the.*statement.*above/i,
      /answer.*choice.*that.*best.*describes.*this.*answer.*choice/i,
      
      // Circular definition patterns
      /\$[a-z]\$.*is.*defined.*as.*\$[a-z]\$.*which.*is.*\$[a-z]\$/i,
      /function.*f.*where.*f.*equals.*function.*f/i,
      /variable.*represents.*the.*variable.*that.*represents/i,
      
    ];

    // Check for confusing patterns
    const hasConfusingPattern = confusingPatterns.some(pattern => pattern.test(text));
    
    // Check for ambiguity using NLP analysis
    const ambiguityAnalysis = AmbiguityDetector.analyzeAmbiguity(text);
    
    return hasConfusingPattern || ambiguityAnalysis.isAmbiguous;
  }

  static getAmbiguityReport(text) {
    return AmbiguityDetector.analyzeAmbiguity(text);
  }

  static async fixQuestion(text) {
    // Return null to remove ambiguous/confusing questions
    return null;
  }
}
