import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AuthWrapper } from './AuthWrapper';
import { useStore } from '../../store/useStore';

// Mock dependencies
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(() => vi.fn()),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock('../../firebase/config', () => ({
  db: {},
}));

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(),
}));

describe('AuthWrapper Security', () => {
  const mockSetCurrentUser = vi.fn();
  const mockSetActiveOutletId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockReturnValue({
      setActiveOutletId: mockSetActiveOutletId,
      setCurrentUser: mockSetCurrentUser,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should ignore E2E_TEST_USER in production environment', async () => {
    // Force DEV to false
    // @ts-ignore
    import.meta.env.DEV = false;
    console.log('TEST: import.meta.env.DEV is now', import.meta.env.DEV);

    // Setup local storage with backdoor user
    const fakeUser = {
      id: 'hacker-123',
      email: 'hacker@example.com',
      role: 'admin',
      name: 'Hacker',
      activeOutletId: 'outlet-1'
    };
    localStorage.setItem('E2E_TEST_USER', JSON.stringify(fakeUser));

    // Render component
    await act(async () => {
        render(
        <AuthWrapper>
            <div>Protected Content</div>
        </AuthWrapper>
        );
    });

    // Should NOT allow access
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();

    // Should verify mock functions were NOT called with fake user
    expect(mockSetCurrentUser).not.toHaveBeenCalledWith(fakeUser);
  });

  it('should allow E2E_TEST_USER in development environment', async () => {
    // Force DEV to true
    // @ts-ignore
    import.meta.env.DEV = true;
     console.log('TEST: import.meta.env.DEV is now', import.meta.env.DEV);

    // Setup local storage with backdoor user
    const fakeUser = {
      id: 'dev-user-123',
      email: 'dev@example.com',
      role: 'admin',
      name: 'Dev User',
      activeOutletId: 'outlet-1'
    };
    localStorage.setItem('E2E_TEST_USER', JSON.stringify(fakeUser));

    // Render component
    await act(async () => {
        render(
        <AuthWrapper>
            <div>Protected Content</div>
        </AuthWrapper>
        );
    });

    await waitFor(() => {
        expect(mockSetCurrentUser).toHaveBeenCalledWith(fakeUser);
    });
  });
});
