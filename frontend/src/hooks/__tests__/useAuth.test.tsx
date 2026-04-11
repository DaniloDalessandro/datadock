import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'

// Mock do next/navigation (requer App Router montado em ambiente real)
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  })),
}))

// Mock do módulo auth
vi.mock('@/lib/auth', () => ({
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  getUserData: vi.fn(),
  isAuthenticated: vi.fn(),
  logout: vi.fn(),
  shouldRefreshToken: vi.fn(),
  refreshAccessToken: vi.fn(),
}))

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('deve retornar estado inicial correto', async () => {
    const { isAuthenticated } = await import('@/lib/auth')
    vi.mocked(isAuthenticated).mockReturnValue(false)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBeDefined()
      expect(result.current.isLoading).toBeDefined()
      expect(result.current.user).toBeDefined()
    })
  })

  it('deve detectar quando usuário não está autenticado', async () => {
    const { getAccessToken, isAuthenticated } = await import('@/lib/auth')

    vi.mocked(getAccessToken).mockReturnValue(null)
    vi.mocked(isAuthenticated).mockReturnValue(false)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })
  })

  it('deve detectar quando usuário está autenticado', async () => {
    const { getAccessToken, isAuthenticated, getUserData } = await import('@/lib/auth')

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    }

    vi.mocked(getAccessToken).mockReturnValue('mock-token')
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(getUserData).mockReturnValue(mockUser)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
    })
  })
})
