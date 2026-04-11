import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthData,
  isAuthenticated,
  getTokenExpiration,
  isTokenExpired,
} from '../auth'

describe('Auth Utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getAccessToken', () => {
    it('deve retornar null quando não há token', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      expect(getAccessToken()).toBeNull()
    })

    it('deve retornar o token quando existe', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('test-token')
      expect(getAccessToken()).toBe('test-token')
    })
  })

  describe('getRefreshToken', () => {
    it('deve retornar null quando não há token', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      expect(getRefreshToken()).toBeNull()
    })

    it('deve retornar o refresh token quando existe', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('refresh-token')
      expect(getRefreshToken()).toBe('refresh-token')
    })
  })

  describe('setAuthTokens', () => {
    it('deve armazenar access token', () => {
      setAuthTokens({ access: 'new-access-token' })
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'new-access-token')
    })

    it('deve armazenar refresh token', () => {
      setAuthTokens({ refresh: 'new-refresh-token' })
      expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'new-refresh-token')
    })

    it('deve armazenar ambos os tokens', () => {
      setAuthTokens({ access: 'access', refresh: 'refresh' })
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'access')
      expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', 'refresh')
    })
  })

  describe('clearAuthData', () => {
    it('deve limpar todos os dados de autenticação', () => {
      clearAuthData()
      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('user_data')
    })
  })

  describe('isAuthenticated', () => {
    it('deve retornar false quando não há token', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)
      expect(isAuthenticated()).toBe(false)
    })

    it('deve retornar true quando há token', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('token')
      expect(isAuthenticated()).toBe(true)
    })
  })

  describe('getTokenExpiration', () => {
    it('deve retornar null para token inválido', () => {
      expect(getTokenExpiration('invalid')).toBeNull()
    })

    it('deve decodificar e retornar a expiração do token', () => {
      // Token JWT com exp: 1234567890 (segundos)
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjEyMzQ1Njc4OTB9.signature'
      const expiration = getTokenExpiration(token)
      expect(expiration).toBe(1234567890 * 1000) // Convertido para millisegundos
    })
  })

  describe('isTokenExpired', () => {
    it('deve retornar true para token inválido', () => {
      expect(isTokenExpired('invalid')).toBe(true)
    })

    it('deve retornar true para token expirado', () => {
      // Token com exp no passado
      const pastTime = Math.floor(Date.now() / 1000) - 3600 // 1 hora atrás
      const payload = btoa(JSON.stringify({ exp: pastTime }))
      const token = `header.${payload}.signature`

      expect(isTokenExpired(token)).toBe(true)
    })

    it('deve retornar false para token válido', () => {
      // Token com exp no futuro (2 horas)
      const futureTime = Math.floor(Date.now() / 1000) + 7200
      const payload = btoa(JSON.stringify({ exp: futureTime }))
      const token = `header.${payload}.signature`

      expect(isTokenExpired(token, 0)).toBe(false)
    })

    it('deve considerar buffer de tempo', () => {
      // Token que expira em 3 minutos
      const nearFutureTime = Math.floor(Date.now() / 1000) + 180
      const payload = btoa(JSON.stringify({ exp: nearFutureTime }))
      const token = `header.${payload}.signature`

      // Com buffer de 5 minutos, deve considerar expirado
      expect(isTokenExpired(token, 5)).toBe(true)

      // Com buffer de 1 minuto, ainda válido
      expect(isTokenExpired(token, 1)).toBe(false)
    })
  })
})
