"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Log do erro para debug
    console.error('Erro da aplicação:', error);

    // Se não estiver autenticado, redirecionar para login
    if (!isAuthenticated) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-destructive">Oops!</h1>
          <h2 className="text-2xl font-semibold">Algo deu errado</h2>
          <p className="text-muted-foreground">
            Ocorreu um erro inesperado na aplicação.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-left bg-muted p-3 rounded-md">
              <strong>Erro:</strong> {error.message}
              {error.digest && <><br /><strong>ID:</strong> {error.digest}</>}
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          {isAuthenticated ? (
            <>
              <Button onClick={reset} className="w-full">
                Tentar novamente
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Voltar ao Dashboard
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Você será redirecionado para a página de login...
              </p>
              <Button onClick={() => router.push('/login')} className="w-full">
                Ir para Login
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}