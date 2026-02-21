# Multi-Agent Development Guidelines

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create your feature branch**
   ```bash
   # Use the helper script
   .\dev-helper.bat feature your-feature-name

   # Or manually
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

## 📋 Development Workflow

### 1. Daily Routine
- **Start**: Pull latest changes from main
- **Work**: Create feature branches for all changes
- **Test**: Run tests and checks locally
- **Commit**: Use descriptive commit messages
- **Push**: Push feature branch and create PR

### 2. Before Committing
```bash
# Run all checks
npm run check:errors
npx tsc --noEmit
npm run lint
```

### 3. Creating Pull Requests
- Use the PR template
- Add screenshots for UI changes
- Tag relevant team members
- Ensure CI checks pass

## 🛠️ Available Scripts

```bash
# Development helpers
.\dev-helper.bat status    # Check git status
.\dev-helper.bat sync      # Sync with main safely
.\dev-helper.bat feature   # Create feature branch
.\dev-helper.bat conflict  # Help with conflicts

# Quality checks
npm run check:errors       # Custom error checking
npm run lint              # ESLint
npx tsc --noEmit          # TypeScript check
```

## 🔧 Conflict Resolution

When you encounter merge conflicts:

1. **Don't panic!** Conflicts are normal in collaborative development
2. **Use the helper**: `.\dev-helper.bat conflict`
3. **Open conflicting files** in your editor
4. **Look for markers**: `<<<<<<<`, `=======`, `>>>>>>>`
5. **Choose the correct version** or merge manually
6. **Remove markers** and save
7. **Stage and commit**: `git add <file>` then `git commit`

## 📚 Best Practices

### Code Quality
- ✅ Write descriptive variable/function names
- ✅ Add TypeScript types for all props and state
- ✅ Keep functions small and focused
- ✅ Add comments for complex logic
- ✅ Remove console.log statements before committing

### Git Hygiene
- ✅ Commit frequently with clear messages
- ✅ Never commit directly to main
- ✅ Pull before pushing
- ✅ Use rebase instead of merge when possible
- ✅ Delete merged branches

### Communication
- 💬 Use descriptive PR titles and descriptions
- 📋 Update task status in project management tools
- 🏷️ Tag relevant team members in PRs
- 📞 Ask for help when stuck (don't struggle alone!)

## 🚨 Emergency Procedures

### If you accidentally committed to main:
1. **Don't push!**
2. Create a new branch from main
3. Reset main to the previous commit
4. Push the fix branch and create PR

### If you need to undo recent commits:
```bash
# Undo last commit but keep changes
git reset --soft HEAD~1

# Undo last commit and discard changes
git reset --hard HEAD~1
```

## 📞 Getting Help

- **Code reviews**: Tag @team-lead in your PR
- **Technical questions**: Use the #dev-support channel
- **Blockers**: Mention in daily standup or team chat
- **Documentation**: Check DEVELOPMENT_WORKFLOW.md first

## 🎯 Success Metrics

- ✅ All PRs have at least 1 approval
- ✅ CI checks pass for all merges
- ✅ No critical bugs in production
- ✅ Code coverage maintained
- ✅ Team velocity improving

---

**Remember**: Quality over speed. Better to do it right the first time than rush and create technical debt!