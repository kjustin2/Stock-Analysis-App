# Java Coding Standards

## Table of Contents
1. [Source File Basics](#source-file-basics)
2. [Naming Conventions](#naming-conventions)
3. [Code Organization](#code-organization)
4. [Formatting](#formatting)
5. [Best Practices](#best-practices)
6. [Documentation](#documentation)

## Source File Basics

### File Structure
1. License/copyright information (if present)
2. Package statement (not line-wrapped)
3. Import statements
4. Exactly one top-level class

### File Encoding and Special Characters
- Use UTF-8 encoding
- Use ASCII horizontal space (0x20) for indentation
- No tabs allowed
- Use escape sequences for special characters (`\b`, `\t`, `\n`, `\f`, `\r`, `\s`, `\"`, `\'`, `\\`)
- For non-ASCII characters, use Unicode character if it improves readability, otherwise use Unicode escape

### Import Statements
- No wildcard imports
- No line-wrapping in import statements
- Order imports in blocks:
  1. Static imports in a single block
  2. Non-static imports in a single block
  3. Single blank line between blocks
- Sort imports within blocks in ASCII order
- No static import for static nested classes

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
- Use camelCase for local variables and parameters
- Names should be meaningful and descriptive
- Avoid single-letter names except for loop counters
- Constants should be UPPER_SNAKE_CASE
- One-character parameter names in public methods are forbidden

### Packages
- All lowercase
- Words separated by dots
- Start with company domain in reverse (e.g., `com.financialadviser.module`)

### Type Variables
- Single capital letter (e.g., `T`, `E`, `X`)
- Or class-like name followed by capital T (e.g., `RequestT`, `FooBarT`)

## Code Organization

### Class Structure
1. Static fields
2. Instance fields
3. Constructors
4. Public methods
5. Protected methods
6. Private methods
7. Inner classes/interfaces

### Method Organization
- Methods with same name must be grouped together
- This applies to overloaded constructors as well
- Keep methods in a logical order (not chronological)
- Each class should have a clear organization pattern

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
- Column limit: 100 characters

### Braces (K&R Style)
- Opening brace at end of line
- Closing brace starts a new line
- Braces required for all control structures (even single-line)
- Empty blocks may be concise: `{}` (no linebreak)

### Line Wrapping
- Break after comma when wrapping method parameters
- Indent continuation lines 8 spaces
- Align wrapped lines with opening parenthesis when possible

## Best Practices

### General
- Follow SOLID principles
- Prefer composition over inheritance
- Keep methods small and focused (< 30 lines)
- Avoid deep nesting (maximum 3 levels)
- Use meaningful exception messages
- Always use @Override when applicable
- Never ignore caught exceptions

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
- Don't use finalizers

## Documentation

### Javadoc
- Required for every public or protected class/method
- First sentence should be a summary fragment
- Use block tags in order: @param, @return, @throws, @deprecated
- Include @param, @return, and @throws tags with descriptions
- Describe the "what" not the "how"
- Keep comments up-to-date with code changes

### Comments
- Use // for single-line comments
- Use /* */ for multi-line comments
- Avoid obvious comments
- Comment complex algorithms and business rules
- Required for non-obvious implementation decisions

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