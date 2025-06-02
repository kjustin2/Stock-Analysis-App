# Git Workflow Standards

## Branch Naming
- `main`: Production-ready code
- `develop`: Development integration branch
- Feature branches: `feature/description-of-feature`
- Bug fixes: `fix/description-of-bug`
- Releases: `release/version-number`
- Hotfixes: `hotfix/description`

## Commit Messages
Format: `type(scope): description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

Example: `feat(budget): add monthly budget calculation`

## Pull Request Process
1. Create feature branch from `develop`
2. Write code and tests
3. Update documentation
4. Submit PR to `develop`
5. Code review (minimum 1 approver)
6. Pass all CI checks
7. Merge using squash and merge

## Code Review Standards
- Review within 24 hours
- Check code style compliance
- Verify test coverage
- Review documentation updates
- Check for security issues
- Ensure proper error handling

## Version Control
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Tag all releases
- Maintain a CHANGELOG.md
- No direct commits to `main` or `develop`

## CI/CD Pipeline
- Automated builds
- Run all tests
- Code quality checks
- Security scanning
- Automated deployment to staging

## Protected Branches
- `main`: Requires PR and approvals
- `develop`: Requires PR and approvals
- No force pushes allowed
- Required status checks must pass 