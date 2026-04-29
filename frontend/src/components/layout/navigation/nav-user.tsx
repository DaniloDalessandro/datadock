'use client'

import { useEffect, useState } from "react"
import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  User,
  Mail,
  Lock,
  Sun,
  Moon,
  Monitor,
} from "lucide-react"

import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
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
  const { logout } = useAuth()
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light")

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const applyTheme = (mode: "light" | "dark" | "system") => {
    const root = document.documentElement
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const resolved = mode === "system" ? (systemPrefersDark ? "dark" : "light") : mode
    root.classList.toggle("dark", resolved === "dark")
  }

  const handleThemeChange = (mode: "light" | "dark" | "system") => {
    setTheme(mode)
    localStorage.setItem("datadock-theme", mode)
    applyTheme(mode)
  }

  useEffect(() => {
    const saved = (localStorage.getItem("datadock-theme") as "light" | "dark" | "system" | null) || "light"
    setTheme(saved)
    applyTheme(saved)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleOpenAccountDialog = async () => {
    setIsDropdownOpen(false)
    await new Promise(resolve => setTimeout(resolve, 100))

    setIsLoadingProfile(true)
    setIsAccountDialogOpen(true)

    try {
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

        window.location.reload()
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
              className="transition-colors duration-150 hover:bg-[#f7f7f7] dark:hover:bg-[rgba(255,255,255,0.05)]"
              style={{ background: "transparent" }}
            >
              {/* Avatar — Rausch bg, white initials */}
              <Avatar className="h-8 w-8 rounded-lg flex-shrink-0">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback
                  className="rounded-lg text-xs font-medium"
                  style={{
                    background: "#ff385c",
                    color: "#ffffff",
                    fontWeight: 600,
                  }}
                >
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-sm font-semibold text-[#222222] dark:text-[#f7f8f8]">
                  {capitalizeFirstLetter(user.name)}
                </span>
                <span className="truncate text-xs text-[#6a6a6a] dark:text-[#8a8f98]">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-[#929292] dark:text-[#62666d]" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {/* Dropdown — white surface, hairline border, Airbnb shadow */}
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-[14px] bg-white dark:bg-[#191a1b] border-[#dddddd] dark:border-[rgba(255,255,255,0.08)]"
            style={{
              boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px",
            }}
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg flex-shrink-0">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback
                    className="rounded-lg text-xs font-medium"
                    style={{ background: "#ff385c", color: "#ffffff", fontWeight: 600 }}
                  >
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate text-sm font-semibold text-[#222222] dark:text-[#f7f8f8]">
                    {capitalizeFirstLetter(user.name)}
                  </span>
                  <span className="truncate text-xs text-[#6a6a6a] dark:text-[#8a8f98]">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-[#dddddd] dark:bg-[rgba(255,255,255,0.06)]" />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleOpenAccountDialog}
                className="cursor-pointer text-[#222222] dark:text-[#d0d6e0] hover:bg-[#f7f7f7] dark:hover:bg-[rgba(255,255,255,0.05)]"
              >
                <BadgeCheck className="mr-2 h-4 w-4 text-[#6a6a6a] dark:text-[#8a8f98]" />
                Minha conta
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleThemeChange("light")}
                className="cursor-pointer hover:bg-[#f7f7f7] dark:hover:bg-[rgba(255,255,255,0.05)]"
                style={{ color: theme === "light" ? "#ff385c" : "#222222" }}
              >
                <Sun className="mr-2 h-4 w-4 text-[#6a6a6a] dark:text-[#8a8f98]" />
                Tema: Claro
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleThemeChange("dark")}
                className="cursor-pointer hover:bg-[#f7f7f7] dark:hover:bg-[rgba(255,255,255,0.05)]"
                style={{ color: theme === "dark" ? "#ff385c" : "#222222" }}
              >
                <Moon className="mr-2 h-4 w-4 text-[#6a6a6a] dark:text-[#8a8f98]" />
                Tema: Escuro
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleThemeChange("system")}
                className="cursor-pointer hover:bg-[#f7f7f7] dark:hover:bg-[rgba(255,255,255,0.05)]"
                style={{ color: theme === "system" ? "#ff385c" : "#222222" }}
              >
                <Monitor className="mr-2 h-4 w-4 text-[#6a6a6a] dark:text-[#8a8f98]" />
                Tema: Sistema
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-[#dddddd] dark:bg-[rgba(255,255,255,0.06)]" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-[#222222] dark:text-[#d0d6e0] hover:bg-[#f7f7f7] dark:hover:bg-[rgba(255,255,255,0.05)]"
            >
              <LogOut className="mr-2 h-4 w-4 text-[#6a6a6a] dark:text-[#8a8f98]" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-semibold">
              <User className="w-6 h-6 text-[#ff385c]" />
              Minha Conta
            </DialogTitle>
            <DialogDescription>
              Visualize e edite suas informações pessoais.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Profile header */}
            <div className="flex items-center gap-4 p-4 rounded-[14px] bg-[#f7f7f7] border border-[#dddddd] dark:bg-[rgba(255,255,255,0.03)] dark:border-[rgba(255,255,255,0.06)]">
              <Avatar className="h-20 w-20 rounded-[14px] flex-shrink-0">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback
                  className="rounded-[14px] text-2xl font-semibold"
                  style={{
                    background: "#ff385c",
                    color: "#ffffff",
                  }}
                >
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg text-[#222222] dark:text-[#f7f8f8]">
                  {capitalizeFirstLetter(user.name)}
                </h3>
                <p className="text-sm text-[#6a6a6a] dark:text-[#8a8f98]">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="flex items-center gap-2 text-sm font-medium text-[#3f3f3f] dark:text-[#d0d6e0]"
                  >
                    <User className="w-4 h-4 text-[#6a6a6a] dark:text-[#8a8f98]" />
                    Nome
                  </Label>
                  {isLoadingProfile ? (
                    <div className="h-14 animate-pulse rounded-[8px] bg-[#f2f2f2] dark:bg-[rgba(255,255,255,0.04)]" />
                  ) : (
                    <Input
                      id="firstName"
                      placeholder="Digite seu nome"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="flex items-center gap-2 text-sm font-medium text-[#3f3f3f] dark:text-[#d0d6e0]"
                  >
                    <User className="w-4 h-4 text-[#6a6a6a] dark:text-[#8a8f98]" />
                    Sobrenome
                  </Label>
                  {isLoadingProfile ? (
                    <div className="h-14 animate-pulse rounded-[8px] bg-[#f2f2f2] dark:bg-[rgba(255,255,255,0.04)]" />
                  ) : (
                    <Input
                      id="lastName"
                      placeholder="Digite seu sobrenome"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="accountEmail"
                  className="flex items-center gap-2 text-sm font-medium text-[#3f3f3f] dark:text-[#d0d6e0]"
                >
                  <Mail className="w-4 h-4 text-[#6a6a6a] dark:text-[#8a8f98]" />
                  Email
                </Label>
                {isLoadingProfile ? (
                  <div className="h-14 animate-pulse rounded-[8px] bg-[#f2f2f2] dark:bg-[rgba(255,255,255,0.04)]" />
                ) : (
                  <Input
                    id="accountEmail"
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Change password section */}
            <div className="space-y-4 pt-4 border-t border-[#dddddd] dark:border-[rgba(255,255,255,0.06)]">
              <h3 className="text-sm flex items-center gap-2 font-semibold text-[#3f3f3f] dark:text-[#d0d6e0]">
                <Lock className="w-4 h-4 text-[#6a6a6a] dark:text-[#8a8f98]" />
                Alterar Senha
              </h3>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword" className="text-sm font-medium text-[#3f3f3f] dark:text-[#d0d6e0]">
                    Senha Atual
                  </Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    placeholder="Digite sua senha atual"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-[#3f3f3f] dark:text-[#d0d6e0]">
                    Nova Senha
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Digite a nova senha (mín. 8 caracteres)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#3f3f3f] dark:text-[#d0d6e0]">
                    Confirmar Nova Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Digite novamente a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleChangePassword}
                  className="w-full"
                  disabled={isSubmitting || !oldPassword || !newPassword || !confirmPassword}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#222222] dark:border-[#8a8f98] mr-2" />
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

            {/* Action buttons */}
            <div className="flex gap-3 pt-4 border-t border-[#dddddd] dark:border-[rgba(255,255,255,0.06)]">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleSaveAccount}
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
