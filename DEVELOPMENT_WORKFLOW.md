# Development Workflow Guidelines

## Branching Strategy
- **Feature branches**: `feature/feature-name` or `feat/feature-name`
- **Bug fixes**: `fix/bug-description`
- **Hotfixes**: `hotfix/critical-issue`
- **Main branches**: `main` (production), `develop` (integration)

## Commit Message Standards
```
type(scope): description

[optional body]

[optional footer]
```

Types: feat, fix, docs, style, refactor, test, chore

## Pull Request Process
- Create PR from feature branch to develop
- Add description with:
  - What was changed
  - Why it was changed
  - How to test
  - Screenshots/videos if UI changes
- Request review from at least 1 team member
- Address review comments
- Merge only after approval

## Code Review Checklist
- [ ] Functionality works as expected
- [ ] No console errors or warnings
- [ ] TypeScript types are correct
- [ ] Tests pass (if applicable)
- [ ] Code follows project conventions
- [ ] No sensitive data exposed
- [ ] Performance considerations addressed