export function validateQuestion(question) {
    const issues = [];
    let isValid = true;
    let cleanedQuestion = { ...question };
    
    // Missing or invalid question_id
    if (!question.question_id || typeof question.question_id !== 'string') {
        issues.push("Missing or invalid question_id");
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
        cleanedQuestion.id = cleanedQuestion.question_id;
        cleanedQuestion.question = cleanedQuestion.specification;
        delete cleanedQuestion.question_id;
        delete cleanedQuestion.specification;
    }
    
    return { isValid, issues, cleanedQuestion };
}

function validateSpecification(specification) {
    const issues = [];
    let shouldRemove = false;
    let cleaned = specification;
    
    // null or undefined
    if (specification === null || specification === undefined) {
        issues.push("Specification is null or undefined");
        shouldRemove = true;
        return { issues, shouldRemove, cleaned };
    }
    
    // Empty string
    if (typeof specification === 'string' && specification.trim() === '') {
        issues.push("Specification is empty");
        shouldRemove = true;
        return { issues, shouldRemove, cleaned };
    }
    
    // Non-string types
    if (typeof specification !== 'string') {
        issues.push("Specification is not a string");
        shouldRemove = true;
        return { issues, shouldRemove, cleaned };
    }
    
    
    // Overly short or nonsensical text
    if (specification.trim().length < 10) {
        issues.push("Specification is too short to be meaningful");
        shouldRemove = true;
        return { issues, shouldRemove, cleaned };
    }
    
    // Missing question mark or unclear question structure
    const hasQuestionWords = /\b(what|how|when|where|why|which|who|does|is|are|can|will|would|should)\b/i.test(specification);
    const hasQuestionMark = specification.includes('?');
    const hasTaskInstruction = /\b(task|choose|select|find|determine|calculate|solve)\b/i.test(specification);
    
    if (!hasQuestionWords && !hasQuestionMark && !hasTaskInstruction) {
        issues.push("Specification appears to lack clear question structure");
        // Don't remove - many valid questions might not have explicit question words
    }
    
    return { issues, shouldRemove, cleaned };
}

function validateOptions(options) {
    const issues = [];
    let shouldRemove = false;
    let cleaned = options;
    
    // null or undefined options
    if (options === null || options === undefined) {
        issues.push("Options are null or undefined");
        shouldRemove = true;
        return { issues, shouldRemove, cleaned };
    }
    
    // Parse options if they're a string
    let parsedOptions;
    try {
        if (typeof options === 'string') {
            parsedOptions = JSON.parse(options);
            cleaned = parsedOptions;
        } else if (Array.isArray(options)) {
            parsedOptions = options;
        } else {
            issues.push("Options are not in valid format (array or JSON string)");
            shouldRemove = true;
            return { issues, shouldRemove, cleaned };
        }
    } catch (error) {
        issues.push("Options contain malformed JSON");
        shouldRemove = true;
        return { issues, shouldRemove, cleaned };
    }
    
    // Check if options is an array
    if (!Array.isArray(parsedOptions)) {
        issues.push("Options is not an array");
        shouldRemove = true;
        return { issues, shouldRemove, cleaned };
    }
    
    // Check minimum number of options
    if (parsedOptions.length < 2) {
        issues.push("Insufficient options (less than 2)");
        shouldRemove = true;
        return { issues, shouldRemove, cleaned };
    }
    
    // Check maximum reasonable number of options
    if (parsedOptions.length > 10) {
        issues.push("Too many options (more than 10)");
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
        if (!option.hasOwnProperty('id') || !option.hasOwnProperty('content') || 
            !option.hasOwnProperty('correct') || !option.hasOwnProperty('order')) {
            issues.push(`Option ${i} missing required fields`);
            shouldRemove = true;
            return { issues, shouldRemove, cleaned };
        }
        
        // Duplicate IDs
        if (seenIds.has(option.id)) {
            issues.push(`Duplicate option ID: ${option.id}`);
            shouldRemove = true;
            return { issues, shouldRemove, cleaned };
        }
        seenIds.add(option.id);
        
        // Duplicate orders
        if (seenOrders.has(option.order)) {
            issues.push(`Duplicate option order: ${option.order}`);
            shouldRemove = true;
            return { issues, shouldRemove, cleaned };
        }
        seenOrders.add(option.order);
        
        // Duplicate content
        if (seenContent.has(option.content?.trim()?.toLowerCase())) {
            issues.push(`Duplicate option content detected`);
            shouldRemove = true;
            return { issues, shouldRemove, cleaned };
        }
        seenContent.add(option.content?.trim()?.toLowerCase());
        
        // Check content validity
        if (!option.content || typeof option.content !== 'string' || option.content.trim() === '') {
            issues.push(`Option ${i} has empty or invalid content`);
            shouldRemove = true;
            return { issues, shouldRemove, cleaned };
        }
        
        // Check correct field
        if (typeof option.correct !== 'boolean') {
            issues.push(`Option ${i} has invalid 'correct' field`);
            shouldRemove = true;
            return { issues, shouldRemove, cleaned };
        }
        
        if (option.correct) {
            correctCount++;
        }
        
        // Check order field
        if (typeof option.order !== 'number' || option.order < 0) {
            issues.push(`Option ${i} has invalid order value`);
            shouldRemove = true;
            return { issues, shouldRemove, cleaned };
        }
    }
    
    // Correct answer count
    if (correctCount === 0) {
        issues.push("No correct answer specified");
        shouldRemove = true;
        return { issues, shouldRemove, cleaned };
    }
    
    if (correctCount > 1) {
        issues.push("Multiple correct answers specified");
        shouldRemove = true;
        return { issues, shouldRemove, cleaned };
    }
    
    // Check order sequence
    const orders = parsedOptions.map(opt => opt.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i) {
            issues.push("Non-sequential option ordering");
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
