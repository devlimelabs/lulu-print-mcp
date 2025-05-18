# Contributing to Domain Radar MCP

We love your input! We want to make contributing to Domain Radar MCP as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Submit a pull request!

### Development Workflow

1. Clone your fork of the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Run setup script: `npm run setup:dev`
4. Make your changes
5. Run tests: `npm test`
6. Commit your changes: `git commit -m "Add some feature"`
7. Push to the branch: `git push origin feature/your-feature-name`
8. Create a new Pull Request

## Testing

Please make sure all tests pass before submitting a PR:

```bash
npm test
```

For manual testing, you can also run:

```bash
npm run dev
```

And follow the instructions in the [testing_guide.md](./testing_guide.md) file.

## Coding Standards

We use ESLint and TypeScript to ensure consistent code style. Please ensure your code conforms to our style guidelines by running:

```bash
npm run lint
```

### TypeScript Guidelines

- Use ES modules with import/export syntax
- Follow proper type definitions for all functions and variables
- Use async/await pattern for asynchronous code
- Use camelCase for variables and functions, PascalCase for classes and interfaces

## Environment Setup

Make sure to copy `.env.example` to `.env` and set up your development environment:

```bash
cp .env.example .env
```

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.