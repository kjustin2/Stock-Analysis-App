# Java Coding Standards

## Table of Contents
1. [Naming Conventions](#naming-conventions)
2. [Code Organization](#code-organization)
3. [Formatting](#formatting)
4. [Best Practices](#best-practices)
5. [Documentation](#documentation)

## Naming Conventions

### Classes and Interfaces
- Use PascalCase (e.g., `CustomerService`, `PaymentProcessor`)
- Names should be nouns or noun phrases
- Avoid abbreviations unless widely accepted (e.g., `HTTP`, `URL`)

### Methods
- Use camelCase (e.g., `calculateTotal`, `getUserById`)
- Names should be verbs or verb phrases
- Boolean methods should be phrased as questions (e.g., `isValid`, `hasPermission`)

### Variables
- Use camelCase
- Names should be meaningful and descriptive
- Avoid single-letter names except for loop counters
- Constants should be UPPER_SNAKE_CASE

### Packages
- All lowercase
- Words separated by dots
- Start with company domain in reverse (e.g., `com.financialadviser.module`)

## Code Organization

### Class Structure
1. Static fields
2. Instance fields
3. Constructors
4. Public methods
5. Protected methods
6. Private methods
7. Inner classes/interfaces

### File Organization
- One top-level class per file
- Related classes and interfaces can be nested
- Maximum file length: 2000 lines
- Break large classes into smaller, focused components

## Formatting

### Indentation and Spacing
- Use 4 spaces for indentation (no tabs)
- One blank line between methods
- No space between method name and parenthesis
- One space after control keywords (if, for, while)

### Line Wrapping
- Maximum line length: 120 characters
- Break after comma when wrapping method parameters
- Align wrapped lines with opening parenthesis

### Braces
- Opening brace on the same line
- Closing brace on a new line
- Always use braces for control statements, even for single lines

## Best Practices

### General
- Follow SOLID principles
- Prefer composition over inheritance
- Keep methods small and focused (< 30 lines)
- Avoid deep nesting (maximum 3 levels)
- Use meaningful exception messages

### Null Handling
- Use Optional for nullable return values
- Validate parameters early (fail fast)
- Don't return null collections (return empty instead)

### Resource Management
- Use try-with-resources for AutoCloseable resources
- Close resources in finally blocks when try-with-resources isn't applicable
- Release resources in the reverse order of acquisition

### Concurrency
- Prefer immutable objects
- Use synchronized sparingly
- Prefer concurrent collections over synchronized collections
- Document thread-safety characteristics

## Documentation

### Javadoc
- Required for all public APIs
- Include @param, @return, and @throws tags
- Describe the "what" not the "how"
- Keep comments up-to-date with code changes

### Comments
- Use // for single-line comments
- Use /* */ for multi-line comments
- Avoid obvious comments
- Comment complex algorithms and business rules

### Example Javadoc
```java
/**
 * Processes a payment for the specified amount.
 *
 * @param amount The payment amount in cents
 * @param currency The three-letter ISO currency code
 * @return A PaymentResult containing the transaction ID and status
 * @throws InvalidAmountException if amount is negative or zero
 * @throws PaymentProcessingException if the payment fails
 */
public PaymentResult processPayment(long amount, String currency) {
    // Implementation
}
```

## Testing Standards

### Unit Tests
- One test class per production class
- Use descriptive test method names (given_when_then pattern)
- Each test should verify one specific behavior
- Use appropriate assertions
- Maintain test independence

### Test Organization
```java
@Test
void givenValidAmount_whenProcessingPayment_thenSucceeds() {
    // Arrange
    // Act
    // Assert
}
``` 