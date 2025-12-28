import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup após cada teste
afterEach(() => {
  cleanup()
})

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

global.localStorage = localStorageMock as unknown as Storage

// Mock do fetch
global.fetch = vi.fn()

// Resetar mocks após cada teste
afterEach(() => {
  vi.clearAllMocks()
})
