'use client'

import { useState } from "react"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User,
  Mail,
  Lock,
} from "lucide-react"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth" // IMPORTADO
import { config } from "@/lib/config"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { logout } = useAuth() // USANDO O HOOK DE AUTENTICAÇÃO
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  // Form states
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleLogout = () => {
    logout() // USANDO FUNÇÃO DE LOGOUT DO CONTEXTO
    router.push("/login")
  }

  const handleOpenAccountDialog = async () => {
    // FIX: Fecha dropdown ANTES de abrir dialog
    setIsDropdownOpen(false)

    // Pequeno delay para animação do dropdown fechar
    await new Promise(resolve => setTimeout(resolve, 100))

    setIsLoadingProfile(true)
    setIsAccountDialogOpen(true)

    // Load user data from API
    try {
      // O interceptor irá adicionar o cabeçalho de autorização automaticamente
      const response = await fetch(`${config.apiUrl}/api/auth/profile/`)

      if (response.ok) {
        const data = await response.json()
        const userData = data.user || data

        setFirstName(userData.first_name || "")
        setLastName(userData.last_name || "")
        setEmail(userData.email || "")
      } else if (response.status === 401) {
        toast.error("Sessão expirada. Faça login novamente.")
        logout()
        router.push("/login")
      } else {
        toast.error("Erro ao carregar dados da conta")
      }
    } catch (error) {
      console.error("Error loading user data:", error)
      toast.error("Erro ao conectar com o servidor")
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handleSaveAccount = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`${config.apiUrl}/api/auth/profile/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // O cabeçalho de autorização é adicionado pelo interceptor
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: email,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        const updatedUser = data.user || data
        localStorage.setItem("user_first_name", updatedUser.first_name || "")
        localStorage.setItem("user_last_name", updatedUser.last_name || "")
        localStorage.setItem("user_email", updatedUser.email || "")

        toast.success("Dados atualizados com sucesso!")
        setIsAccountDialogOpen(false)

        window.location.reload() // Mantido por enquanto para garantir a atualização da UI
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Erro ao atualizar dados")
      }
    } catch (error) {
      console.error("Error updating user data:", error)
      toast.error("Erro ao conectar com o servidor")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos de senha")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não conferem")
      return
    }

    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${config.apiUrl}/api/auth/password/change/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // O cabeçalho de autorização é adicionado pelo interceptor
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
          new_password_confirm: confirmPassword,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        if (data.tokens) {
          localStorage.setItem("access_token", data.tokens.access)
          localStorage.setItem("refresh", data.tokens.refresh)
        }

        toast.success("Senha alterada com sucesso!")

        setOldPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const errorData = await response.json()

        if (errorData.details) {
          const errors = errorData.details
          if (errors.old_password) {
            toast.error("Senha atual incorreta")
          } else if (errors.new_password_confirm) {
            toast.error("As novas senhas não conferem")
          } else if (errors.new_password) {
            toast.error(errors.new_password[0] || "Senha inválida")
          } else {
            toast.error(errorData.error || "Erro ao alterar senha")
          }
        } else {
          toast.error(errorData.error || "Erro ao alterar senha")
        }
      }
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Erro ao conectar com o servidor")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseDialog = () => {
    setIsAccountDialogOpen(false)
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const getInitials = (name: string) => {
    const words = name.trim().split(" ")
    if (words.length === 1) {
      return words[0][0].toUpperCase()
    }
    return (
      words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
    )
  }

  const capitalizeFirstLetter = (name: string) => {
    if (!name) return name
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="bg-gray-100 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {capitalizeFirstLetter(user.name)}
                </span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-gray-100"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {capitalizeFirstLetter(user.name)}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleOpenAccountDialog} className="cursor-pointer">
                <BadgeCheck />
                Minha conta
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <User className="w-6 h-6 text-blue-600" />
              Minha Conta
            </DialogTitle>
            <DialogDescription>
              Visualize e edite suas informações pessoais.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <Avatar className="h-20 w-20 rounded-xl">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-xl text-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {capitalizeFirstLetter(user.name)}
                </h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nome
                  </Label>
                  {isLoadingProfile ? (
                    <div className="h-11 bg-gray-100 animate-pulse rounded-md" />
                  ) : (
                    <Input
                      id="firstName"
                      placeholder="Digite seu nome"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-11"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Sobrenome
                  </Label>
                  {isLoadingProfile ? (
                    <div className="h-11 bg-gray-100 animate-pulse rounded-md" />
                  ) : (
                    <Input
                      id="lastName"
                      placeholder="Digite seu sobrenome"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountEmail" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                {isLoadingProfile ? (
                  <div className="h-11 bg-gray-100 animate-pulse rounded-md" />
                ) : (
                  <Input
                    id="accountEmail"
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Alterar Senha
              </h3>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword" className="text-sm">
                    Senha Atual
                  </Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    placeholder="Digite sua senha atual"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm">
                    Nova Senha
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Digite a nova senha (mín. 8 caracteres)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">
                    Confirmar Nova Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Digite novamente a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleChangePassword}
                  variant="outline"
                  className="w-full h-11"
                  disabled={isSubmitting || !oldPassword || !newPassword || !confirmPassword}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Alterando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Alterar Senha
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                className="flex-1 h-11"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSaveAccount}
                className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarMenu>
  )
}