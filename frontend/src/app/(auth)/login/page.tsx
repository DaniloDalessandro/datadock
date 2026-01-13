import { LoginForm as ModernLoginForm } from "@/components/auth"
import { DataFlowAnimation } from "@/components/data-flow-animation"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Animation */}
      <DataFlowAnimation />

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-md">
        <ModernLoginForm />
      </div>
    </div>
  )
}
