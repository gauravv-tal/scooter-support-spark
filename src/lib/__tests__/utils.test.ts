import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
    })

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid')
    })

    it('resolves conflicting Tailwind classes', () => {
      // tailwind-merge should resolve conflicts, keeping the last one
      expect(cn('px-4', 'px-6')).toBe('px-6')
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('handles empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('')).toBe('')
    })

    it('handles complex scenarios', () => {
      const isActive = true
      const isDisabled = false
      
      const result = cn(
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled',
        'px-4 py-2'
      )
      
      expect(result).toBe('base-class active px-4 py-2')
    })
  })
})
