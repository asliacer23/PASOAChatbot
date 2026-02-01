/**
 * Hook for managing login attempt restrictions
 * Prevents brute force attacks by limiting login attempts
 */

const STORAGE_KEY = "login_attempts";
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface LoginAttempts {
  count: number;
  firstAttemptTime: number;
  lastAttemptTime: number;
  lockedUntil?: number;
}

export function useLoginAttempts() {
  const getLoginAttempts = (): LoginAttempts => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return {
          count: 0,
          firstAttemptTime: 0,
          lastAttemptTime: 0,
        };
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error("Error reading login attempts:", error);
      return {
        count: 0,
        firstAttemptTime: 0,
        lastAttemptTime: 0,
      };
    }
  };

  const saveLoginAttempts = (attempts: LoginAttempts) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
    } catch (error) {
      console.error("Error saving login attempts:", error);
    }
  };

  const recordFailedAttempt = () => {
    const attempts = getLoginAttempts();
    const now = Date.now();

    // Check if lockout period has expired
    if (attempts.lockedUntil && now < attempts.lockedUntil) {
      return {
        isLocked: true,
        remainingTime: Math.ceil((attempts.lockedUntil - now) / 1000),
        attemptsRemaining: 0,
      };
    }

    // Reset if the timeout window has passed
    if (now - attempts.firstAttemptTime > LOCKOUT_DURATION_MS) {
      const newAttempts: LoginAttempts = {
        count: 1,
        firstAttemptTime: now,
        lastAttemptTime: now,
      };
      saveLoginAttempts(newAttempts);
      return {
        isLocked: false,
        remainingTime: 0,
        attemptsRemaining: MAX_ATTEMPTS - 1,
      };
    }

    // Increment attempt counter
    attempts.count += 1;
    attempts.lastAttemptTime = now;

    // Check if max attempts reached
    if (attempts.count >= MAX_ATTEMPTS) {
      attempts.lockedUntil = now + LOCKOUT_DURATION_MS;
      saveLoginAttempts(attempts);
      return {
        isLocked: true,
        remainingTime: Math.ceil(LOCKOUT_DURATION_MS / 1000),
        attemptsRemaining: 0,
      };
    }

    saveLoginAttempts(attempts);
    return {
      isLocked: false,
      remainingTime: 0,
      attemptsRemaining: MAX_ATTEMPTS - attempts.count,
    };
  };

  const checkLoginStatus = () => {
    const attempts = getLoginAttempts();
    const now = Date.now();

    if (!attempts.lockedUntil) {
      return {
        isLocked: false,
        remainingTime: 0,
        attemptsRemaining: MAX_ATTEMPTS - attempts.count,
      };
    }

    if (now < attempts.lockedUntil) {
      return {
        isLocked: true,
        remainingTime: Math.ceil((attempts.lockedUntil - now) / 1000),
        attemptsRemaining: 0,
      };
    }

    // Lockout period has expired
    clearLoginAttempts();
    return {
      isLocked: false,
      remainingTime: 0,
      attemptsRemaining: MAX_ATTEMPTS,
    };
  };

  const clearLoginAttempts = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing login attempts:", error);
    }
  };

  return {
    recordFailedAttempt,
    checkLoginStatus,
    clearLoginAttempts,
    MAX_ATTEMPTS,
  };
}
