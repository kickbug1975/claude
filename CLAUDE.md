# CLAUDE.md - AI Assistant Guide

This document provides comprehensive guidance for AI assistants working with this codebase.

**Last Updated:** 2025-12-09
**Repository:** kickbug1975/claude
**Status:** New repository (initialized)

---

## Table of Contents

- [Repository Overview](#repository-overview)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Conventions](#code-conventions)
- [Git Workflow](#git-workflow)
- [Testing Strategy](#testing-strategy)
- [Documentation Standards](#documentation-standards)
- [AI Assistant Guidelines](#ai-assistant-guidelines)

---

## Repository Overview

### Current State
This is a newly initialized repository. The codebase structure and technology stack will be defined as development progresses.

### Purpose
*To be documented as the project takes shape*

### Technology Stack
*To be documented once dependencies are added*

---

## Project Structure

```
claude/
├── .git/                 # Git repository data
├── .gitattributes       # Git attributes configuration
└── CLAUDE.md           # This file - AI assistant guide
```

### Directory Conventions (To Be Established)

When adding project structure, follow these conventions:

- **Source Code**: Typically in `src/`, `lib/`, or project root
- **Tests**: Usually in `test/`, `tests/`, `__tests__/`, or colocated with source
- **Documentation**: In `docs/` or as markdown files in root
- **Configuration**: Root-level config files (`.eslintrc`, `tsconfig.json`, etc.)
- **Build Output**: In `dist/`, `build/`, or `.output/` (should be gitignored)
- **Dependencies**: `node_modules/` (Node.js), `vendor/` (PHP), etc. (gitignored)

---

## Development Workflow

### Initial Setup (For Future Contributors)

```bash
# Clone the repository
git clone <repository-url>
cd claude

# Install dependencies (once package manager is established)
# npm install / yarn install / pip install -r requirements.txt / etc.

# Run initial setup scripts (if any)
# npm run setup / make setup / etc.
```

### Development Process

1. **Create a feature branch** following the naming convention
2. **Make atomic commits** with clear, descriptive messages
3. **Test your changes** before committing
4. **Update documentation** as needed
5. **Push and create PR** when ready for review

---

## Code Conventions

### General Principles

- **DRY (Don't Repeat Yourself)**: Extract common logic into reusable functions
- **KISS (Keep It Simple, Stupid)**: Prefer simple solutions over complex ones
- **YAGNI (You Aren't Gonna Need It)**: Don't add functionality until needed
- **Single Responsibility**: Each function/class should have one clear purpose
- **Meaningful Names**: Use descriptive variable and function names

### Code Style

*To be defined based on project language and linters*

Standard expectations:
- Follow established linter rules (ESLint, Pylint, etc.)
- Use consistent indentation (spaces vs tabs)
- Add comments for complex logic, not obvious code
- Keep functions focused and reasonably sized
- Handle errors appropriately

### File Organization

- Group related functionality together
- Keep files focused on a single concern
- Use index files for clean exports (if applicable)
- Maintain consistent file naming conventions

---

## Git Workflow

### Branch Naming Convention

```
feature/descriptive-name    # New features
fix/bug-description        # Bug fixes
refactor/what-changed      # Code refactoring
docs/what-documented       # Documentation updates
test/what-tested          # Test additions/updates
chore/task-description    # Maintenance tasks
```

### Commit Message Format

```
<type>: <short description>

<optional longer description>

<optional footer with issue references>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: add user authentication module

fix: resolve null pointer exception in data processor

docs: update installation instructions in README
```

### Git Best Practices

- **Atomic commits**: Each commit should represent one logical change
- **Clear messages**: Write descriptive commit messages
- **Review before commit**: Use `git diff` to review changes
- **Keep history clean**: Avoid unnecessary merge commits
- **Don't commit secrets**: Never commit API keys, passwords, or tokens
- **Test before push**: Ensure code works before pushing

---

## Testing Strategy

### Testing Levels (To Be Established)

- **Unit Tests**: Test individual functions/components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Measure and validate performance

### Running Tests

*To be documented once test framework is established*

```bash
# Example commands (adjust based on actual setup)
# npm test
# pytest
# go test ./...
```

### Test Conventions

- Write tests for new features
- Update tests when modifying existing code
- Aim for meaningful test coverage
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

---

## Documentation Standards

### Code Documentation

- **Public APIs**: Document all public functions, classes, and methods
- **Complex Logic**: Add comments explaining "why", not "what"
- **TODOs**: Mark temporary solutions with `TODO:` comments
- **Examples**: Provide usage examples for libraries/APIs

### File Headers

Consider adding file headers for context:

```
/**
 * filename.ext
 *
 * Brief description of file's purpose
 *
 * Key exports/functionality:
 * - Feature 1
 * - Feature 2
 */
```

### README Updates

Keep README.md updated with:
- Project description
- Installation instructions
- Usage examples
- Configuration options
- Contributing guidelines

---

## AI Assistant Guidelines

### When Working on This Codebase

1. **Read Before Modifying**
   - Always read files before making changes
   - Understand existing patterns and conventions
   - Check for similar implementations

2. **Follow Established Patterns**
   - Match existing code style
   - Use same naming conventions
   - Follow architectural patterns in use

3. **Be Conservative**
   - Don't over-engineer solutions
   - Avoid unnecessary refactoring
   - Don't add features not requested
   - Keep changes minimal and focused

4. **Security First**
   - Never introduce security vulnerabilities
   - Validate inputs at system boundaries
   - Don't commit sensitive information
   - Follow security best practices

5. **Test Your Changes**
   - Run existing tests
   - Add tests for new functionality
   - Verify changes work as expected
   - Check for regressions

6. **Document as You Go**
   - Update this CLAUDE.md when patterns are established
   - Add code comments for complex logic
   - Update relevant documentation
   - Keep README current

### Code Review Checklist

Before committing, verify:

- [ ] Code follows project conventions
- [ ] No security vulnerabilities introduced
- [ ] Tests pass (or are added/updated)
- [ ] Documentation updated
- [ ] No debug code or console logs left behind
- [ ] Error handling is appropriate
- [ ] Changes are minimal and focused
- [ ] Git commit message is clear

### Common Pitfalls to Avoid

- **Don't guess file locations** - Always search and verify
- **Don't assume dependencies** - Check what's actually installed
- **Don't break existing code** - Run tests before committing
- **Don't skip error handling** - Handle errors appropriately
- **Don't commit broken code** - Ensure everything works
- **Don't ignore patterns** - Follow existing conventions

### Useful Commands Reference

```bash
# Repository exploration
git log --oneline --graph    # View commit history
git status                   # Check working tree status
git diff                     # Review unstaged changes
git diff --staged           # Review staged changes

# File operations (prefer specialized tools in AI context)
# Use Read tool instead of: cat, head, tail
# Use Edit tool instead of: sed, awk
# Use Write tool instead of: echo >, cat <<EOF
# Use Glob tool instead of: find, ls
# Use Grep tool instead of: grep, rg

# Branch management
git branch -a               # List all branches
git checkout -b name        # Create and switch to new branch
git branch -d name          # Delete local branch

# Remote operations
git fetch origin            # Fetch updates from remote
git pull origin branch      # Pull and merge from remote
git push -u origin branch   # Push and set upstream
```

---

## Version History

### v1.0.0 - 2025-12-09
- Initial CLAUDE.md creation
- Established documentation template
- Defined basic conventions and guidelines
- Ready for project development

---

## Contributing to This Document

This document should be updated when:
- Project structure is established
- New conventions are adopted
- Technology stack is defined
- Testing frameworks are added
- Build/deployment processes are created
- New patterns emerge

**How to Update:**
1. Make changes to reflect current state
2. Update "Last Updated" date
3. Add entry to Version History
4. Commit with message: `docs: update CLAUDE.md with [changes]`

---

## Additional Resources

### External Documentation
*Add links to relevant external resources as needed*

### Internal Documentation
*Add links to other documentation files as they're created*

### Contact Information
- **Repository Owner:** kickbug1975
- **Main Branch:** *To be determined*
- **Issue Tracker:** *If applicable*

---

*This document is a living guide and should be updated as the project evolves.*
