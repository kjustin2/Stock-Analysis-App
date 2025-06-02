# Architecture Standards

## Technology Stack
- Frontend: JavaFX
- Backend: Spring Framework
- Database: SQLite
- ORM: Hibernate
- Logging: Log4j2
- Testing: JUnit 5, Mockito

## Layer Organization

### Presentation Layer (UI)
- Located in `com.financialadviser.ui`
- FXML files in `src/main/resources/fxml`
- CSS files in `src/main/resources/css`
- Controllers in `com.financialadviser.controller`

### Service Layer
- Located in `com.financialadviser.service`
- Interface-based design
- Implementation in `com.financialadviser.service.impl`
- Business logic and transaction management

### Repository Layer
- Located in `com.financialadviser.repository`
- Spring Data JPA repositories
- Custom queries when needed
- Database access abstraction

### Model Layer
- Located in `com.financialadviser.model`
- JPA entities
- Data transfer objects (DTOs)
- Value objects

### Configuration
- Located in `com.financialadviser.config`
- Spring configuration classes
- Database configuration
- Security configuration

## Security Standards
- Password encryption using BCrypt
- Role-based access control
- Secure data storage
- Input validation and sanitization

## Database Standards
- Use prepared statements
- Follow naming conventions
- Implement proper indexing
- Regular backups
- Version control for schema changes

## Error Handling
- Custom exceptions in `com.financialadviser.exception`
- Proper error messages
- Logging of errors
- User-friendly error displays

## Testing Standards
- Unit tests for all services
- Integration tests for repositories
- UI tests for critical workflows
- Minimum 80% code coverage
- Test data management 