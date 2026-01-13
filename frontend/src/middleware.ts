import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Middleware desabilitado - autenticação gerenciada no client-side via AuthContext
  // pois o token está no localStorage (inacessível no middleware server-side)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Aplica middleware em todas as rotas exceto: API routes, arquivos estáticos, imagens e arquivos públicos
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|manifest.json).*)',
  ],
}
