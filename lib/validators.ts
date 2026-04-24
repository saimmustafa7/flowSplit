export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, error: 'Password must contain at least 1 uppercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, error: 'Password must contain at least 1 number' };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 special character' };
  }
  return { valid: true };
}

export function validateName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { valid: false, error: 'Name must be at least 2 characters' };
  if (trimmed.length > 50) return { valid: false, error: 'Name must be less than 50 characters' };
  if (!/^[a-zA-Z\s\-]+$/.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters, spaces, and hyphens' };
  }
  return { valid: true };
}

export function validateSoloExpense(amount: number, title: string, category: string, date: string): { valid: boolean; error?: string } {
  if (!title.trim() || title.trim().length > 100) return { valid: false, error: 'Title must be 1-100 characters' };
  if (amount <= 0 || amount > 1000000000) return { valid: false, error: 'Amount must be between 1 and 10,000,000' };
  if (!category) return { valid: false, error: 'Category is required' };
  
  const expenseDate = new Date(date);
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  
  if (expenseDate > now) return { valid: false, error: 'Date cannot be in the future' };
  if (expenseDate < oneYearAgo) return { valid: false, error: 'Date cannot be more than 1 year in the past' };
  
  return { valid: true };
}

// Add group validators, invite validators etc here as needed based on the spec
export function validateGroupName(name: string): { valid: boolean; error?: string } {
  if (name.trim().length < 2 || name.trim().length > 50) return { valid: false, error: 'Group name must be 2-50 characters' };
  return { valid: true };
}

export function validateEmoji(emoji: string): { valid: boolean; error?: string } {
  const trimmed = emoji.trim()
  if (!trimmed) return { valid: false, error: 'Emoji is required' }
  // Use Intl.Segmenter to count grapheme clusters, because many emojis are
  // multi-codepoint sequences (base + variation selector \uFE0F, ZWJ sequences etc.)
  // and the simple /^\p{Emoji}$/u regex rejects them.
  try {
    const segmenter = new Intl.Segmenter()
    const segments = [...segmenter.segment(trimmed)]
    if (segments.length !== 1) return { valid: false, error: 'Must be a single emoji' }
  } catch {
    // Fallback: just ensure the string is non-empty and short
    if (trimmed.length > 8) return { valid: false, error: 'Must be a single emoji' }
  }
  return { valid: true }
}

export function assertSplitIntegrity(splits: Record<string, number>, total: number): void {
  const sum = Object.values(splits).reduce((a, b) => a + b, 0)
  if (sum !== total) {
    throw new Error(
      `Split integrity violation: splits sum to ${sum} but total is ${total}. Diff: ${total - sum} paisa. This is a bug — do not insert.`
    )
  }
}

