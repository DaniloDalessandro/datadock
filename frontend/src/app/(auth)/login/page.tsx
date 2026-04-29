import { LoginForm as ModernLoginForm } from "@/components/auth"
import { Database, BarChart3, ShieldCheck, Zap } from "lucide-react"

const sparkData = [32, 48, 38, 62, 70, 80, 58, 84, 68, 92]

const features = [
  { Icon: BarChart3,   label: "Análise de dados em tempo real" },
  { Icon: ShieldCheck, label: "Controle de acesso granular"    },
  { Icon: Zap,         label: "Assistente Alice com IA"        },
]

const stats = [
  { value: "99.9%",   label: "Uptime"       },
  { value: "< 200ms", label: "Latência"     },
  { value: "256-bit", label: "Criptografia" },
]

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#ffffff", fontFeatureSettings: '"cv01", "ss03"' }}
    >
      <div className="min-h-screen w-full flex">

        {/* ═══════════════════════════════════════
            LEFT BRAND PANEL  — hidden below lg
        ═══════════════════════════════════════ */}
        <div
          className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col justify-between p-12"
          style={{ borderRight: "1px solid #dddddd" }}
        >
          {/* ── Base background — surface-soft ── */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #f7f7f7 0%, #ffffff 50%, #f2f2f2 100%)",
            }}
          />

          {/* ── Rausch glow blob ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,56,92,0.06) 0%, transparent 70%)",
            }}
          />

          {/* ── Color blobs — warm, subtle ── */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: "-80px", right: "-80px",
              width: "480px", height: "480px",
              background: "radial-gradient(circle, rgba(255,56,92,0.12) 0%, transparent 68%)",
              filter: "blur(60px)",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              top: "35%", left: "-48px",
              width: "340px", height: "340px",
              background: "radial-gradient(circle, rgba(255,56,92,0.06) 0%, transparent 68%)",
              filter: "blur(52px)",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: "-48px", right: "80px",
              width: "400px", height: "400px",
              background: "radial-gradient(circle, rgba(255,56,92,0.08) 0%, transparent 68%)",
              filter: "blur(56px)",
            }}
          />

          {/* ── Dot grid overlay ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(34,34,34,0.06) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              opacity: 0.50,
            }}
          />

          {/* ── Grid lines overlay ── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(34,34,34,0.03) 1px, transparent 1px)," +
                "linear-gradient(90deg, rgba(34,34,34,0.03) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />

          {/* ── Right-edge fade ── */}
          <div
            className="absolute inset-y-0 right-0 w-28 pointer-events-none"
            style={{ background: "linear-gradient(to right, transparent, rgba(247,247,247,0.80))" }}
          />

          {/* ════════════════════════════════
              FLOATING LIGHT CARDS
          ════════════════════════════════ */}

          {/* Card A — Dataset count + sparkline */}
          <div
            className="absolute z-10"
            style={{
              top: "13%", right: "-16px",
              width: "208px",
              background: "#ffffff",
              border: "1px solid #dddddd",
              borderRadius: "14px",
              padding: "16px 18px",
              boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px",
              animation: "loginFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s both",
            }}
          >
            <div style={{ color: "#929292", fontSize: "11px", letterSpacing: "0.01em", marginBottom: "10px" }}>
              Datasets Ativos
            </div>
            <div style={{ color: "#222222", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>
              1.247
            </div>
            <div style={{ color: "#27a644", fontSize: "11px", marginTop: "5px" }}>
              ↑ +12,5% este mês
            </div>

            {/* Sparkline bar chart */}
            <div
              style={{
                display: "flex", alignItems: "flex-end",
                gap: "3px", marginTop: "14px", height: "30px",
              }}
            >
              {sparkData.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    background:
                      i === sparkData.length - 1
                        ? "#ff385c"
                        : `rgba(255,56,92,${0.10 + (i / sparkData.length) * 0.35})`,
                    borderRadius: "2px 2px 0 0",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Card B — Data quality + progress */}
          <div
            className="absolute z-10"
            style={{
              top: "52%", right: "18px",
              width: "180px",
              background: "#ffffff",
              border: "1px solid #dddddd",
              borderRadius: "14px",
              padding: "14px 16px",
              boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px",
              animation: "loginFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both",
            }}
          >
            <div style={{ color: "#929292", fontSize: "11px", marginBottom: "9px" }}>
              Qualidade dos Dados
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ color: "#222222", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em" }}>
                94,2%
              </span>
              <span style={{ color: "#ff385c", fontSize: "11px" }}>↑</span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                marginTop: "10px", height: "3px",
                background: "#ebebeb", borderRadius: "99px",
              }}
            >
              <div
                style={{
                  width: "94.2%", height: "100%",
                  background: "linear-gradient(90deg, #ff385c, #e00b41)",
                  borderRadius: "99px",
                }}
              />
            </div>

            {/* Mini metric row */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
              {(["100%", "95%", "87%"] as const).map((v, i) => (
                <div key={v} style={{ textAlign: "center" }}>
                  <div style={{ color: "#222222", fontSize: "12px", fontWeight: 500 }}>{v}</div>
                  <div style={{ color: "#929292", fontSize: "9px", marginTop: "2px" }}>
                    {["Completo", "Válido", "Único"][i]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card C — Status pill */}
          <div
            className="absolute z-10"
            style={{
              bottom: "19%", right: "18px",
              background: "#ffffff",
              border: "1px solid #dddddd",
              borderRadius: "9999px",
              padding: "7px 14px",
              display: "flex", alignItems: "center", gap: "8px",
              boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.08) 0 4px 8px",
              animation: "loginFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.7s both",
            }}
          >
            {/* Animated pulse dot */}
            <span style={{ position: "relative", flexShrink: 0, width: "8px", height: "8px" }}>
              <span
                style={{
                  position: "absolute", inset: 0,
                  borderRadius: "50%",
                  background: "rgba(39,166,68,0.3)",
                  animation: "ping 1.6s cubic-bezier(0,0,0.2,1) infinite",
                }}
              />
              <span
                style={{
                  position: "absolute", inset: "1px",
                  borderRadius: "50%",
                  background: "#27a644",
                  boxShadow: "0 0 6px rgba(39,166,68,0.5)",
                }}
              />
            </span>
            <span style={{ color: "#3f3f3f", fontSize: "12px", whiteSpace: "nowrap" }}>
              Todos os sistemas operacionais
            </span>
          </div>

          {/* ════════════════════════════════
              BRAND CONTENT
          ════════════════════════════════ */}

          {/* Logo */}
          <div className="relative z-20 flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
              style={{
                background: "rgba(255,56,92,0.10)",
                border: "1px solid rgba(255,56,92,0.20)",
              }}
            >
              <Database className="w-4 h-4" style={{ color: "#ff385c" }} />
            </div>
            <span
              className="text-base tracking-tight font-semibold"
              style={{ color: "#222222" }}
            >
              DataDock
            </span>
          </div>

          {/* Headline + features */}
          <div className="relative z-20 login-brand-body" style={{ maxWidth: "380px" }}>
            <div className="mb-5">
              <span
                className="inline-block text-xs font-medium uppercase px-3 py-1 rounded-full"
                style={{
                  background: "rgba(255,56,92,0.08)",
                  color: "#ff385c",
                  border: "1px solid rgba(255,56,92,0.15)",
                  letterSpacing: "0.10em",
                  fontSize: "10px",
                }}
              >
                Plataforma de Dados
              </span>
            </div>

            <h2
              className="leading-[1.12] mb-4"
              style={{
                color: "#222222",
                fontWeight: 700,
                letterSpacing: "-0.044rem",
                fontSize: "2.625rem",
              }}
            >
              Transforme dados<br />
              em decisões<br />
              <span style={{ color: "#ff385c" }}>inteligentes</span>
            </h2>

            <p
              className="leading-relaxed mb-8"
              style={{ color: "#6a6a6a", fontSize: "15px" }}
            >
              Centralize, analise e explore conjuntos de dados com
              inteligência artificial e visualizações avançadas.
            </p>

            <div className="flex flex-col gap-3.5">
              {features.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0"
                    style={{
                      background: "rgba(255,56,92,0.08)",
                      border: "1px solid rgba(255,56,92,0.15)",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: "#ff385c" }} />
                  </div>
                  <span style={{ color: "#3f3f3f", fontSize: "13px", fontWeight: 500 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="relative z-20 login-brand-stats flex gap-10">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <div
                  style={{
                    color: "#222222",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    fontSize: "1.2rem",
                  }}
                >
                  {value}
                </div>
                <div style={{ color: "#929292", fontSize: "11px", marginTop: "2px" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════
            RIGHT FORM PANEL
        ═══════════════════════════════════════ */}
        <div
          className="flex-1 flex items-center justify-center p-6 sm:p-10 relative login-form-side"
          style={{ background: "#ffffff" }}
        >
          {/* Subtle top glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,56,92,0.04) 0%, transparent 60%)",
            }}
          />

          <div className="relative z-10 w-full max-w-[380px]">
            <ModernLoginForm />
          </div>
        </div>

      </div>
    </div>
  )
}
