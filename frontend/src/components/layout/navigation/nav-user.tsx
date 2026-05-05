'use client'

import { useState } from "react"
import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  User,
  Mail,
  Lock,
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

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email }),
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword, new_password_confirm: confirmPassword }),
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
          const errs = errorData.details
          if (errs.old_password) toast.error("Senha atual incorreta")
          else if (errs.new_password_confirm) toast.error("As novas senhas não conferem")
          else if (errs.new_password) toast.error(errs.new_password[0] || "Senha inválida")
          else toast.error(errorData.error || "Erro ao alterar senha")
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
    if (words.length === 1) return words[0][0].toUpperCase()
    return words[0][0].toUpperCase() + words[words.length - 1][0].toUpperCase()
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
              className="bg-[#f5f5f7] hover:bg-[#e8e8ed] data-[state=open]:bg-[#e8e8ed] text-[#1d1d1f] rounded-[8px]"
            >
              <Avatar className="h-8 w-8 rounded-[6px]">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-[6px] bg-[#1d1d1f] text-[#ffffff] font-semibold text-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-[#1d1d1f] tracking-[-0.374px]">
                  {capitalizeFirstLetter(user.name)}
                </span>
                <span className="truncate text-xs text-[#7a7a7a] tracking-[-0.224px]">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-[#7a7a7a]" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 bg-[#ffffff] border border-[#e0e0e0] rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-[6px]">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-[6px] bg-[#1d1d1f] text-[#ffffff] font-semibold text-sm">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-[#1d1d1f] tracking-[-0.374px]">
                    {capitalizeFirstLetter(user.name)}
                  </span>
                  <span className="truncate text-xs text-[#7a7a7a] tracking-[-0.224px]">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleOpenAccountDialog} className="cursor-pointer text-[#1d1d1f] tracking-[-0.374px]">
                <BadgeCheck />
                Minha conta
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-[#e0e0e0]" />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-[#cc0000] tracking-[-0.374px]">
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[18px] border-[#e0e0e0]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-semibold text-[#1d1d1f] tracking-[-0.374px]">
              <User className="w-6 h-6" />
              Minha Conta
            </DialogTitle>
            <DialogDescription className="text-[#7a7a7a] tracking-[-0.374px]">
              Visualize e edite suas informações pessoais.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="flex items-center gap-4 p-4 bg-[#f5f5f7] rounded-[12px]">
              <Avatar className="h-16 w-16 rounded-[10px]">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-xl bg-[#1d1d1f] text-[#ffffff] font-semibold rounded-[10px]">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg text-[#1d1d1f] tracking-[-0.374px]">
                  {capitalizeFirstLetter(user.name)}
                </h3>
                <p className="text-sm text-[#7a7a7a] tracking-[-0.224px]">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="flex items-center gap-2 text-[#1d1d1f] font-semibold text-xs uppercase tracking-widest">
                    <User className="w-4 h-4" />
                    Nome
                  </Label>
                  {isLoadingProfile ? (
                    <div className="h-[44px] bg-[#f5f5f7] animate-pulse rounded-[8px]" />
                  ) : (
                    <Input id="firstName" placeholder="Digite seu nome" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="flex items-center gap-2 text-[#1d1d1f] font-semibold text-xs uppercase tracking-widest">
                    <User className="w-4 h-4" />
                    Sobrenome
                  </Label>
                  {isLoadingProfile ? (
                    <div className="h-[44px] bg-[#f5f5f7] animate-pulse rounded-[8px]" />
                  ) : (
                    <Input id="lastName" placeholder="Digite seu sobrenome" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountEmail" className="flex items-center gap-2 text-[#1d1d1f] font-semibold text-xs uppercase tracking-widest">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                {isLoadingProfile ? (
                  <div className="h-[44px] bg-[#f5f5f7] animate-pulse rounded-[8px]" />
                ) : (
                  <Input id="accountEmail" type="email" placeholder="seu.email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#e0e0e0]">
              <h3 className="text-sm font-semibold text-[#1d1d1f] flex items-center gap-2 uppercase tracking-widest">
                <Lock className="w-4 h-4" />
                Alterar Senha
              </h3>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword" className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-widest">Senha Atual</Label>
                  <Input id="oldPassword" type="password" placeholder="Digite sua senha atual" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-widest">Nova Senha</Label>
                  <Input id="newPassword" type="password" placeholder="Mínimo 8 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-widest">Confirmar Nova Senha</Label>
                  <Input id="confirmPassword" type="password" placeholder="Digite novamente a nova senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>

                <Button
                  type="button"
                  onClick={handleChangePassword}
                  variant="secondary"
                  className="w-full"
                  disabled={isSubmitting || !oldPassword || !newPassword || !confirmPassword}
                >
                  {isSubmitting ? "Alterando..." : (
                    <><Lock className="w-4 h-4" />Alterar Senha</>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#e0e0e0]">
              <Button type="button" variant="ghost" onClick={handleCloseDialog} className="flex-1" disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSaveAccount} className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarMenu>
  )
}
