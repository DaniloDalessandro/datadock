import { LoginForm as ModernLoginForm } from "@/components/auth"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#ffffff] flex">
      {/* Left panel — dark tile */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-16 bg-[#272729]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#ffffff] rounded-[8px] flex items-center justify-center">
            <span className="font-semibold text-[#1d1d1f] text-base">D</span>
          </div>
          <span className="text-[#ffffff] font-semibold text-xl tracking-[-0.374px]">DataDock</span>
        </div>

        <div>
          <h1 className="text-[56px] font-semibold text-[#ffffff] leading-[1.07] mb-6 tracking-[-0.28px]">
            Dados organizados.<br />Decisões precisas.
          </h1>
          <p className="text-[#cccccc] text-[17px] leading-[1.47] tracking-[-0.374px] max-w-md font-normal">
            Centralize datasets, monitore estruturas e disponibilize consultas em uma interface simples e eficiente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#2997ff] rounded-full" />
          <span className="text-[#cccccc] text-[12px] tracking-[-0.12px]">Sistema de Gestão de Dados</span>
        </div>
      </div>

      {/* Right panel — white canvas */}
      <div className="flex-1 flex items-center justify-center bg-[#ffffff] p-8 lg:p-16">
        <ModernLoginForm />
      </div>
    </div>
  )
}
