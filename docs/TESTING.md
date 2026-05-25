# Testing Documentation — Weather Dashboard

This document describes the testing architecture, configurations, and test run options for the SkySense weather dashboard application.

---

## 1. Testing Framework

The Weather Dashboard uses **Jest** with **ts-jest** to compile and run TypeScript unit tests in a simulated DOM environment.

- **Test Runner**: Jest
- **Environment**: `jest-environment-jsdom`
- **TypeScript Preprocessor**: `ts-jest`
- **Coverage Tool**: Jest built-in code coverage reporter.

---

## 2. Test Execution

Install development dependencies and run the tests:

### Installation
```bash
npm install
```

### Run Tests
```bash
npm run test
```

### Run Coverage Analysis
```bash
npm run test:coverage
```
An interactive HTML coverage report will be generated inside the `coverage/` directory.
