# Contributing to NPM Package Manager MCP

Thank you for your interest in contributing to the NPM Package Manager MCP! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

This project follows the Code of Conduct of the master-mcps monorepo. Please be respectful and constructive in all interactions.

## Development Workflow

1. **Fork and Clone**: Fork the repository and clone your fork locally
2. **Install Dependencies**: Run `pnpm install` to install all dependencies
3. **Create a Branch**: Create a new branch for your feature or fix
4. **Make Changes**: Implement your changes following the coding standards
5. **Test**: Run tests and ensure all pass
6. **Commit**: Commit your changes with descriptive messages
7. **Push**: Push your branch to your fork
8. **Pull Request**: Open a PR against the main repository

## Coding Standards

- **TypeScript**: Use TypeScript with strict mode enabled
- **ES Modules**: Use import/export syntax
- **Async/Await**: Prefer async/await over raw Promises
- **Error Handling**: Use proper typed error handling
- **Type Safety**: Avoid using `any` type where possible

## Testing Requirements

- Write tests for new functionality
- Ensure existing tests continue to pass
- Test edge cases and error conditions
- Include integration tests for new tools

## Documentation Standards

- Update README.md for new features
- Document all new tools in the README
- Add JSDoc comments to functions
- Update ISSUES.md with any known limitations

## Pull Request Process

1. Ensure all tests pass
2. Update documentation
3. Add a clear description of changes
4. Reference any related issues
5. Wait for code review
6. Address review feedback

## Tool Development Guidelines

When adding new tools to the MCP server:

1. Follow the existing tool pattern
2. Use descriptive tool names
3. Provide clear tool descriptions
4. Handle errors gracefully
5. Return consistent response formats
6. Add comprehensive parameter validation

## Questions or Issues?

For questions about contributing, please open an issue in the repository or refer to the main master-mcps contributing guide.