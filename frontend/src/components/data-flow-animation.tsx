"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  speed: number
  opacity: number
  size: number
}

export function DataFlowAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let particles: Particle[] = []
    let animationId: number

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }

    const initParticles = () => {
      particles = []
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 0.2 + Math.random() * 0.5,
          opacity: 0.1 + Math.random() * 0.3,
          size: 1 + Math.random() * 2
        })
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const animate = () => {
      // Clear with near-black — match #08090a
      ctx.fillStyle = "rgba(8, 9, 10, 0.18)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        particle.y -= particle.speed

        if (particle.y < -10) {
          particle.y = canvas.height + 10
          particle.x = Math.random() * canvas.width
        }

        ctx.beginPath()
        // Use Linear brand indigo #5e6ad2 for particles
        ctx.fillStyle = `rgba(94, 106, 210, ${particle.opacity})`
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Conecta partículas próximas com linhas graduais baseadas na distância
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(94, 106, 210, ${0.08 * (1 - distance / 100)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Linear dark-mode background */}
      <div className="absolute inset-0" style={{ background: "#08090a" }} />
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
