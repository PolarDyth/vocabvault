/**
 * Password validation utilities for stronger security
 */

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: "weak" | "fair" | "good" | "strong"
}

const MIN_PASSWORD_LENGTH = 8

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (optional but improves strength)
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  let score = 0

  // Length check
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  } else {
    score += 1
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  } else {
    score += 1
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  } else {
    score += 1
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  } else {
    score += 1
  }

  // Special character (optional but adds to strength)
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score += 2
  }

  // Common password patterns to avoid
  const commonPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /^abc123/i,
    /^letmein/i,
    /^admin/i,
    /^welcome/i,
    /^monkey/i,
    /^dragon/i,
  ]

  if (commonPatterns.some((pattern) => pattern.test(password))) {
    errors.push("Password is too common. Please choose a more unique password")
    score = Math.max(0, score - 2)
  }

  // Determine strength
  let strength: PasswordValidationResult["strength"]
  if (score <= 2) {
    strength = "weak"
  } else if (score <= 4) {
    strength = "fair"
  } else if (score <= 6) {
    strength = "good"
  } else {
    strength = "strong"
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}

/**
 * Get color class for password strength indicator
 */
export function getStrengthColor(strength: PasswordValidationResult["strength"]): string {
  switch (strength) {
    case "weak":
      return "bg-destructive"
    case "fair":
      return "bg-orange-500"
    case "good":
      return "bg-yellow-500"
    case "strong":
      return "bg-green-500"
  }
}

/**
 * Get percentage for password strength bar
 */
export function getStrengthPercent(strength: PasswordValidationResult["strength"]): number {
  switch (strength) {
    case "weak":
      return 25
    case "fair":
      return 50
    case "good":
      return 75
    case "strong":
      return 100
  }
}
