# Code Analysis Before Modification Rule

## Overview
Before making any code modifications, deletions, or additions to existing Lambda functions or shared components, a thorough analysis must be performed to ensure optimal results and maintain code quality.

## Mandatory Analysis Process

### Step 1: Current Code Analysis
When any modification is requested, you MUST:

1. **Read and analyze the current code** in the target files
2. **Identify the current implementation patterns** and architecture
3. **Understand the existing business logic** and data flow
4. **Review dependencies and imports** used in the current code
5. **Assess the current error handling** and validation patterns

### Step 2: Clarification Questions
Before implementing any changes, you MUST ask these clarification questions:

#### Scope and Requirements
- What is the specific business requirement driving this change?
- Are there any edge cases or special scenarios to consider?
- Should this change maintain backward compatibility?
- Are there any performance requirements or constraints?

#### Architecture and Design
- Should this follow the existing patterns in the current code?
- Are there any new dependencies or shared components needed?
- How should this integrate with the current error handling?
- Are there any security considerations for this change?

#### Data and Types
- What data structures are involved in this change?
- Are new types or interfaces needed?
- How should data validation be handled?
- Are there any data transformation requirements?

#### Testing and Validation
- How can this change be tested locally?
- Are there any specific test cases to consider?
- What validation should be added for the new functionality?
- Are there any monitoring or logging requirements?

### Step 3: Impact Assessment
After gathering requirements, you MUST assess:

1. **Files that will be modified** and why
2. **Potential impact on other Lambda functions** or shared components
3. **Breaking changes** that might affect other parts of the system
4. **Performance implications** of the proposed changes
5. **Security considerations** and potential vulnerabilities

## Implementation Guidelines

### Before Writing Code
1. **Present a clear plan** outlining what files will be modified and why
2. **Explain the approach** and how it aligns with existing patterns
3. **Highlight any deviations** from current architecture and justify them
4. **Confirm the plan** with the user before proceeding

### During Implementation
1. **Follow the Lambda Architecture Rule** for all modifications
2. **Maintain consistency** with existing code style and patterns
3. **Add appropriate error handling** and validation
4. **Update types and interfaces** as needed
5. **Preserve existing functionality** unless explicitly asked to change it

### After Implementation
1. **Explain what was changed** and why
2. **Highlight any new patterns** or approaches introduced
3. **Suggest testing approaches** for the modifications
4. **Recommend any follow-up actions** or improvements

## Question Templates

### For New Feature Additions
- "What specific functionality should this new feature provide?"
- "How should this feature handle error scenarios?"
- "Are there any input validation requirements?"
- "Should this feature be configurable through environment variables?"

### For Bug Fixes
- "What is the expected behavior vs. current behavior?"
- "Are there any specific scenarios where this bug occurs?"
- "Should we add additional validation to prevent this issue?"
- "How can we ensure this fix doesn't introduce new issues?"

### For Refactoring
- "What is the goal of this refactoring (performance, maintainability, etc.)?"
- "Should we maintain the same public interface?"
- "Are there any breaking changes we should be aware of?"
- "Should we update related documentation or comments?"

### For Performance Improvements
- "What are the current performance bottlenecks?"
- "Are there any specific performance targets to meet?"
- "Should we add monitoring or metrics for the improved functionality?"
- "Are there any trade-offs between performance and maintainability?"

## Exceptions to This Rule

This analysis process may be skipped ONLY when:

1. **Simple typo fixes** or obvious syntax corrections
2. **Adding basic logging statements** without changing logic
3. **Updating comments or documentation** without code changes
4. **User explicitly requests immediate implementation** after providing detailed requirements

## Enforcement

- **Always read existing code** before making modifications
- **Always ask clarifying questions** unless the request is extremely simple
- **Always provide a modification plan** before implementing
- **Always explain the reasoning** behind architectural decisions

This rule ensures that all code modifications are well-thought-out, properly planned, and aligned with the existing codebase architecture and business requirements.