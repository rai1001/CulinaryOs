import '@testing-library/jest-dom/vitest';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Extends Vitest's expect method with methods from react-testing-library
// import '@testing-library/jest-dom/vitest' does this automatically for vitest environment

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});
