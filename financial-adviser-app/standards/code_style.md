# Code Style Guide

## Java Code Style

### Formatting
- Indent size: 4 spaces
- Tab size: 4 spaces
- Use spaces for indentation (no tabs)

### Import Organization
Imports should be organized in the following order with a blank line between groups:
1. java.*
2. javax.*
3. (blank line)
4. com.financialadviser.*

### Naming Conventions
- Classes: PascalCase (e.g., `BudgetManager`)
- Methods and variables: camelCase (e.g., `calculateInterest`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_INTEREST_RATE`)
- Package names: lowercase with dots (e.g., `com.financialadviser.service`)

### Code Organization
- One class per file
- Related classes should be in the same package
- Maximum line length: 120 characters
- Use meaningful names that describe the purpose

### Documentation
- All public APIs must have JavaDoc comments
- Include parameter descriptions and return values
- Document exceptions that may be thrown
- Add inline comments for complex logic

### Best Practices
- Follow SOLID principles
- Write unit tests for new code
- Keep methods focused and concise
- Use appropriate design patterns
- Handle exceptions properly 