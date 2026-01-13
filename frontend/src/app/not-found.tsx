"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-8xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold">Página não encontrada</h2>
          <p className="text-muted-foreground">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        
        <div className="space-y-3">
          {isAuthenticated ? (
            <>
              <Button asChild className="w-full">
                <Link href="/dashboard">
                  Voltar ao Dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="javascript:history.back()">
                  Voltar à página anterior
                </Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Você será redirecionado para a página de login em alguns segundos...
              </p>
              <Button asChild className="w-full">
                <Link href="/login">
                  Ir para Login
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}