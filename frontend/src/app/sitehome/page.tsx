'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
  Truck,
  Users,
  Shield,
  BarChart3,
  User,
  Car,
  Menu,
  X,
  LogIn,
  FileText,
  Hash,
  Calendar,
  Palette,
  Fuel,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Activity,
  Camera
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { config as appConfig } from '@/lib/config';

// Types for site configuration
interface SiteConfig {
  company_name: string;
  logo_url?: string;
  hero_title: string;
  hero_subtitle: string;
  about_text: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
}

// Helper functions
const formatWhatsAppLink = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

const formatPhoneDisplay = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

// Authenticated fetch helper (for client-side authenticated API calls)
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });

  return response;
};

// Zod validation schemas
const driverSchema = z.object({
  fullName: z.string().min(3, 'Nome completo é obrigatório'),
  cpf: z.string()
    .min(11, 'CPF deve ter 11 dígitos')
    .regex(/^\d{11}$/, 'CPF deve conter apenas números'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  cnhNumber: z.string().min(5, 'Número da CNH é obrigatório'),
  cnhCategory: z.string().min(1, 'Categoria da CNH é obrigatória'),
  message: z.string().optional(),
});

const vehicleSchema = z.object({
  plate: z.string()
    .min(7, 'Placa deve ter 7 caracteres')
    .max(7, 'Placa deve ter 7 caracteres')
    .toUpperCase(),
  brand: z.string().min(2, 'Marca é obrigatória'),
  model: z.string().min(2, 'Modelo é obrigatório'),
  year: z.string()
    .regex(/^\d{4}$/, 'Ano deve ter 4 dígitos')
    .refine((val) => {
      const year = parseInt(val);
      return year >= 1900 && year <= new Date().getFullYear() + 1;
    }, 'Ano inválido'),
  color: z.string().min(3, 'Cor é obrigatória'),
  fuelType: z.string().min(1, 'Tipo de combustível é obrigatório'),
  message: z.string().optional(),
});

const complaintSchema = z.object({
  vehiclePlate: z.string()
    .min(7, 'Placa deve ter pelo menos 7 caracteres')
    .max(10, 'Placa deve ter no máximo 10 caracteres')
    .toUpperCase(),
  complaintType: z.string().min(1, 'Selecione o tipo de denúncia'),
  description: z.string()
    .min(20, 'A descrição deve ter pelo menos 20 caracteres')
    .max(1000, 'A descrição deve ter no máximo 1000 caracteres'),
  occurrenceDate: z.string().optional(),
  occurrenceLocation: z.string().optional(),
  complainantName: z.string().optional(),
  complainantEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  complainantPhone: z.string().optional(),
});

type DriverFormData = z.infer<typeof driverSchema>;
type VehicleFormData = z.infer<typeof vehicleSchema>;
type ComplaintFormData = z.infer<typeof complaintSchema>;

// Animated Counter Component
function AnimatedCounter({ end, duration = 2000, label }: { end: number; duration?: number; label: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const counterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, isVisible]);

  return (
    <div ref={counterRef}>
      {count.toLocaleString('pt-BR')}
      {label && <div className="text-xl text-blue-100">{label}</div>}
    </div>
  );
}

interface VehicleData {
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  fuel_type: string;
  current_conductor: {
    full_name: string;
    cpf: string;
    cnh_number: string;
    cnh_category: string;
  } | null;
}

export default function SiteHomePage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [isComplaintDialogOpen, setIsComplaintDialogOpen] = useState(false);
  const [isVehicleSearchDialogOpen, setIsVehicleSearchDialogOpen] = useState(false);
  const [plateOptions, setPlateOptions] = useState<Array<{plate: string, label: string}>>([]);
  const [isLoadingPlates, setIsLoadingPlates] = useState(false);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [conductorCount, setConductorCount] = useState(0);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [searchPlate, setSearchPlate] = useState('');
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [isSearchingVehicle, setIsSearchingVehicle] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Driver form
  const driverForm = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      fullName: '',
      cpf: '',
      email: '',
      phone: '',
      cnhNumber: '',
      cnhCategory: '',
      message: '',
    },
  });

  // Vehicle form
  const vehicleForm = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      plate: '',
      brand: '',
      model: '',
      year: '',
      color: '',
      fuelType: '',
      message: '',
    },
  });

  // Complaint form
  const complaintForm = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      vehiclePlate: '',
      complaintType: '',
      description: '',
      occurrenceDate: '',
      occurrenceLocation: '',
      complainantName: '',
      complainantEmail: '',
      complainantPhone: '',
    },
  });

  // Busca configuração do site
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const API_URL = appConfig.apiUrl;
        const response = await fetch(`${API_URL}/api/site/configuration/`);
        if (response.ok) {
          const result = await response.json();
          const data = result.success ? result.data : result;
          setConfig(data);
        }
      } catch (error) {
        console.error('Error fetching site config:', error);
        // Define config padrão se API falhar
        setConfig({
          company_name: 'Sys Passo',
          hero_title: 'Gestão Inteligente de Frotas',
          hero_subtitle: 'Controle completo da sua frota com tecnologia de ponta',
          about_text: 'Sistema de gestão de frotas e veículos',
          phone: '(00) 00000-0000',
          email: 'contato@syspasso.com',
          address: 'Endereço da empresa',
          whatsapp: '00000000000',
        });
      }
    };

    fetchConfig();
  }, []);

  // Busca contagens
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const API_URL = appConfig.apiUrl;

        // Try to fetch counts with authentication (will work if user is logged in)
        // If not authenticated, these will gracefully fail and show 0
        try {
          const vehiclesResponse = await fetchWithAuth(`${API_URL}/api/vehicles/`);
          if (vehiclesResponse.ok) {
            const vehiclesData = await vehiclesResponse.json();
            const count = vehiclesData.count || vehiclesData.length || 0;
            setVehicleCount(count);
          }
        } catch (error) {
          console.log('Could not fetch vehicle count (may require authentication)');
        }

        try {
          const conductorsResponse = await fetchWithAuth(`${API_URL}/api/conductors/`);
          if (conductorsResponse.ok) {
            const conductorsData = await conductorsResponse.json();
            const count = conductorsData.count || conductorsData.length || 0;
            setConductorCount(count);
          }
        } catch (error) {
          console.log('Could not fetch conductor count (may require authentication)');
        }
      } catch (error) {
        console.error('Error fetching counts:', error);
      } finally {
        setIsLoadingCounts(false);
      }
    };

    fetchCounts();
  }, []);

  // Gerencia scroll do navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Height of navbar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
    setIsMobileMenuOpen(false);
  };

  // Driver form submission
  const onDriverSubmit = async (data: DriverFormData) => {
    try {
      const API_URL = appConfig.apiUrl;

      const response = await fetch(`${API_URL}/api/requests/drivers/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: data.fullName,
          cpf: data.cpf,
          email: data.email,
          phone: data.phone,
          cnh_number: data.cnhNumber,
          cnh_category: data.cnhCategory,
          message: data.message || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Tratar erros específicos
        if (response.status === 400) {
          // Erros de validação
          const errorMessage = errorData.detail ||
                             errorData.cpf?.[0] ||
                             errorData.email?.[0] ||
                             'Erro na validação dos dados. Verifique as informações.';
          throw new Error(errorMessage);
        }

        throw new Error('Erro ao enviar solicitação. Tente novamente.');
      }

      toast.success('Solicitação enviada com sucesso!', {
        description: 'Sua solicitação de cadastro de motorista será analisada em breve.',
      });

      driverForm.reset();
      setIsDriverDialogOpen(false);
    } catch (error) {
      console.error('Error submitting driver request:', error);

      toast.error('Erro ao enviar solicitação', {
        description: error instanceof Error ? error.message : 'Por favor, tente novamente mais tarde.',
      });
    }
  };

  // Vehicle form submission
  const onVehicleSubmit = async (data: VehicleFormData) => {
    try {
      const API_URL = appConfig.apiUrl;

      const response = await fetch(`${API_URL}/api/requests/vehicles/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plate: data.plate.toUpperCase(),
          brand: data.brand,
          model: data.model,
          year: parseInt(data.year),
          color: data.color,
          fuel_type: data.fuelType,
          message: data.message || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Tratar erros específicos
        if (response.status === 400) {
          // Erros de validação
          const errorMessage = errorData.detail ||
                             errorData.plate?.[0] ||
                             'Erro na validação dos dados. Verifique as informações.';
          throw new Error(errorMessage);
        }

        throw new Error('Erro ao enviar solicitação. Tente novamente.');
      }

      toast.success('Solicitação enviada com sucesso!', {
        description: 'Sua solicitação de cadastro de veículo será analisada em breve.',
      });

      vehicleForm.reset();
      setIsVehicleDialogOpen(false);
    } catch (error) {
      console.error('Error submitting vehicle request:', error);

      toast.error('Erro ao enviar solicitação', {
        description: error instanceof Error ? error.message : 'Por favor, tente novamente mais tarde.',
      });
    }
  };

  // Autocomplete de placas
  const searchPlates = async (query: string) => {
    if (query.length < 2) {
      setPlateOptions([]);
      return;
    }

    setIsLoadingPlates(true);
    try {
      const API_URL = appConfig.apiUrl;
      const response = await fetch(`${API_URL}/api/complaints/vehicles/autocomplete/?q=${encodeURIComponent(query)}`);

      if (response.ok) {
        const data = await response.json();
        setPlateOptions(data);
      }
    } catch (error) {
      console.error('Error searching plates:', error);
    } finally {
      setIsLoadingPlates(false);
    }
  };

  // Debounce para autocomplete
  const debouncedSearchPlates = useCallback((query: string) => {
    const timer = setTimeout(() => searchPlates(query), 300);
    return () => clearTimeout(timer);
  }, []);

  // Complaint form submission
  const onComplaintSubmit = async (data: ComplaintFormData) => {
    try {
      const API_URL = appConfig.apiUrl;

      const response = await fetch(`${API_URL}/api/complaints/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicle_plate: data.vehiclePlate.toUpperCase(),
          complaint_type: data.complaintType,
          description: data.description,
          occurrence_date: data.occurrenceDate || null,
          occurrence_location: data.occurrenceLocation || null,
          complainant_name: data.complainantName || null,
          complainant_email: data.complainantEmail || null,
          complainant_phone: data.complainantPhone || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 400) {
          const errorMessage = errorData.detail ||
                             errorData.vehicle_plate?.[0] ||
                             errorData.description?.[0] ||
                             'Erro na validação dos dados. Verifique as informações.';
          throw new Error(errorMessage);
        }

        throw new Error('Erro ao enviar denúncia. Tente novamente.');
      }

      toast.success('Denúncia enviada com sucesso!', {
        description: 'Sua denúncia será analisada pela equipe responsável.',
      });

      complaintForm.reset();
      setIsComplaintDialogOpen(false);
    } catch (error) {
      console.error('Error submitting complaint:', error);

      toast.error('Erro ao enviar denúncia', {
        description: error instanceof Error ? error.message : 'Por favor, tente novamente mais tarde.',
      });
    }
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar - Minimalista */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white border-b border-gray-100'
            : 'bg-white/80 backdrop-blur-md'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              {config.logo_url ? (
                <Image
                  src={config.logo_url}
                  alt={config.company_name}
                  width={100}
                  height={32}
                  className="h-8 w-auto"
                  priority
                />
              ) : (
                <span className="text-lg font-semibold text-gray-900">
                  {config.company_name}
                </span>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => scrollToSection('inicio')}
                className="relative text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all group"
              >
                Início
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-3/4 transition-all duration-300"></span>
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="relative text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all group"
              >
                Sobre
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-3/4 transition-all duration-300"></span>
              </button>
              <button
                onClick={() => scrollToSection('cadastro')}
                className="relative text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all group"
              >
                Cadastros
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-3/4 transition-all duration-300"></span>
              </button>
              <button
                onClick={() => scrollToSection('denuncias')}
                className="relative text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all group"
              >
                Denúncias
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-3/4 transition-all duration-300"></span>
              </button>
              <button
                onClick={() => {
                  const section = document.querySelector('section.py-20.bg-gradient-to-br.from-gray-50.to-white');
                  if (section) {
                    const offset = 80;
                    const elementPosition = section.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth',
                    });
                  }
                }}
                className="relative text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all group"
              >
                Contato
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-3/4 transition-all duration-300"></span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => scrollToSection('inicio')}
                  className="text-left text-sm px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                >
                  Início
                </button>
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-left text-sm px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                >
                  Sobre
                </button>
                <button
                  onClick={() => scrollToSection('cadastro')}
                  className="text-left text-sm px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                >
                  Cadastros
                </button>
                <button
                  onClick={() => scrollToSection('denuncias')}
                  className="text-left text-sm px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                >
                  Denúncias
                </button>
                <button
                  onClick={() => {
                    const section = document.querySelector('section.py-20.bg-gradient-to-br.from-gray-50.to-white');
                    if (section) {
                      const offset = 80;
                      const elementPosition = section.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - offset;
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth',
                      });
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left text-sm px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                >
                  Contato
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="inicio" className="relative min-h-[75vh] bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-24 pb-12 overflow-hidden">
        {/* Enhanced Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-200/15 to-purple-200/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

          {/* Animated gradient mesh overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-gradient-shift"></div>
        </div>

        {/* Floating Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 animate-float-icon-1">
            <Users className="w-12 h-12 text-blue-300/20" />
          </div>

          <div className="absolute bottom-1/4 right-1/4 animate-float-icon-2">
            <Shield className="w-10 h-10 text-purple-300/20" />
          </div>

          <div className="absolute top-2/3 left-1/3 animate-float-icon-3" style={{ animationDelay: '2s' }}>
            <Activity className="w-10 h-10 text-indigo-300/20" />
          </div>

          <div className="absolute top-1/4 right-1/3 animate-float-icon-1" style={{ animationDelay: '1s' }}>
            <Car className="w-16 h-16 text-blue-300/10" />
          </div>

          <div className="absolute bottom-1/3 left-1/2 animate-float-icon-2" style={{ animationDelay: '3s' }}>
            <Car className="w-10 h-10 text-purple-300/10" />
          </div>

          <div className="absolute top-1/2 right-1/2 animate-float-icon-3" style={{ animationDelay: '4s' }}>
            <Car className="w-12 h-12 text-indigo-300/10" />
          </div>

          <div className="absolute bottom-1/2 left-1/4 animate-float-icon-1" style={{ animationDelay: '5s' }}>
            <Car className="w-8 h-8 text-blue-300/10" />
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight animate-slide-up">
                {config.hero_title}
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {config.hero_subtitle}
              </p>
            </div>

            <div className="w-full max-w-2xl mx-auto pt-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative flex items-center">
                <div className="absolute top-1/2 left-2 -translate-y-1/2 flex items-center">
                    <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-gray-500 hover:text-gray-800">
                        <Camera className="w-6 h-6" />
                    </Button>
                </div>
                <Input
                  type="text"
                  placeholder="Digite a placa do veículo"
                  className="w-full pl-16 pr-6 py-5 text-lg text-gray-700 bg-white border-2 border-gray-200 rounded-full focus:outline-none focus:border-blue-500 transition-all"
                  value={searchPlate}
                  onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsVehicleSearchDialogOpen(true);
                    }
                  }}
                />
              </div>
            </div>

            {/* Animated Counters */}
            {!isLoadingCounts && (vehicleCount > 0 || conductorCount > 0) && (
              <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto pt-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                {vehicleCount > 0 && (
                  <div className="group relative text-center p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
                    {/* Animated background pulse */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse"></div>

                    {/* Rotating border effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-sm animate-spin-slow"></div>

                    <div className="relative z-10">
                      <Car className="w-8 h-8 mx-auto mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                      <div className="text-5xl font-bold text-gray-800 mb-2 group-hover:scale-110 transition-transform">
                        <AnimatedCounter end={vehicleCount} label="" />
                      </div>
                      <div className="text-sm font-medium text-gray-600">Veículos Cadastrados</div>
                    </div>
                  </div>
                )}
                {conductorCount > 0 && (
                  <div className="group relative text-center p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
                    {/* Animated background pulse */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse"></div>

                    {/* Rotating border effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-sm animate-spin-slow"></div>

                    <div className="relative z-10">
                      <Users className="w-8 h-8 mx-auto mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
                      <div className="text-5xl font-bold text-gray-800 mb-2 group-hover:scale-110 transition-transform">
                        <AnimatedCounter end={conductorCount} label="" />
                      </div>
                      <div className="text-sm font-medium text-gray-600">Motoristas Ativos</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        @keyframes gradient-shift {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes float-main {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
          }
          33% {
            transform: translateY(-25px) translateX(8px) scale(1.015);
          }
          66% {
            transform: translateY(-15px) translateX(-5px) scale(1.008);
          }
        }

        @keyframes float-secondary {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) translateX(-10px) rotate(-1deg);
          }
        }

        @keyframes float-tertiary {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          50% {
            transform: translateY(-18px) translateX(12px) rotate(1deg);
          }
        }

        @keyframes float-icon-1 {
          0%, 100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          50% {
            transform: translateY(-22px) rotate(8deg) scale(1.1);
          }
        }

        @keyframes float-icon-2 {
          0%, 100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          50% {
            transform: translateY(-18px) rotate(-8deg) scale(1.08);
          }
        }

        @keyframes float-icon-3 {
          0%, 100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          50% {
            transform: translateY(-20px) rotate(5deg) scale(1.12);
          }
        }

        

        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out backwards;
        }

        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }

        .animate-gradient-shift {
          animation: gradient-shift 8s ease-in-out infinite;
        }

        .animate-float-main {
          animation: float-main 10s ease-in-out infinite;
        }

        .animate-float-secondary {
          animation: float-secondary 12s ease-in-out infinite;
        }

        .animate-float-tertiary {
          animation: float-tertiary 14s ease-in-out infinite 1s;
        }

        .animate-float-icon-1 {
          animation: float-icon-1 7s ease-in-out infinite;
        }

        .animate-float-icon-2 {
          animation: float-icon-2 8s ease-in-out infinite 0.5s;
        }

        .animate-float-icon-3 {
          animation: float-icon-3 9s ease-in-out infinite 1s;
        }

        

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>

      {/* About Section - Moderno (Logo após Hero) */}
      <section id="about" className="py-16 bg-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                Sobre Nós
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-gray-100 hover:border-transparent transition-all duration-500">
                <div className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                  {config.about_text}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section id="cadastro" className="py-16 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                Cadastros
              </h2>
              <p className="text-lg text-gray-600">
                Solicite cadastro de motoristas e veículos de forma rápida
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Driver Registration Card */}
              <button
                onClick={() => setIsDriverDialogOpen(true)}
                className="group relative bg-white hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 border-2 border-gray-200 hover:border-transparent rounded-3xl p-8 text-left transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 group-hover:bg-white/20 mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <User className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-white mb-3 transition-colors duration-300">
                    Cadastrar Motorista
                  </h3>
                  <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors duration-300">
                    Solicite o cadastro de um novo condutor para sua frota
                  </p>

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600 group-hover:text-white transition-colors">
                    <span>Iniciar cadastro</span>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </div>
                </div>
              </button>

              {/* Vehicle Registration Card */}
              <button
                onClick={() => setIsVehicleDialogOpen(true)}
                className="group relative bg-white hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 border-2 border-gray-200 hover:border-transparent rounded-3xl p-8 text-left transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 group-hover:bg-white/20 mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Car className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-white mb-3 transition-colors duration-300">
                    Cadastrar Veículo
                  </h3>
                  <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors duration-300">
                    Adicione um novo veículo à sua frota de forma simples
                  </p>

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-purple-600 group-hover:text-white transition-colors">
                    <span>Iniciar cadastro</span>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Denúncias Section - Compacto */}
      <section id="denuncias" className="py-12 bg-gradient-to-br from-red-50 via-orange-50 to-white relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-48 h-48 bg-red-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-2xl mb-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Canal de Denúncias
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Ajude a manter a segurança no trânsito
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-lg border border-gray-100 mb-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Como funciona?</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-red-600">1</span>
                  </div>
                  <p>Identifique a placa do veículo envolvido na situação irregular</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-red-600">2</span>
                  </div>
                  <p>Selecione o tipo de denúncia (excesso de velocidade, direção perigosa, etc.)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-red-600">3</span>
                  </div>
                  <p>Descreva detalhadamente o ocorrido (data, local e circunstâncias)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-red-600">4</span>
                  </div>
                  <p>Você pode fazer a denúncia de forma anônima ou identificada</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-900">
                  <strong>Importante:</strong> Todas as denúncias são analisadas pela equipe responsável.
                  Denúncias falsas podem ser enquadradas como crime de denunciação caluniosa.
                </p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setIsComplaintDialogOpen(true)}
                className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <AlertTriangle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Fazer Denúncia
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section - Completo e Expandido */}
      <section id="contato" className="py-14 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                Entre em Contato
              </h2>
              <p className="text-lg text-gray-600">
                Estamos prontos para atender você
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Telefone */}
              <a
                href={`tel:${config.phone.replace(/\D/g, '')}`}
                className="group flex items-center gap-4 p-6 rounded-2xl bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100"
              >
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">Telefone</div>
                  <div className="text-lg font-bold text-gray-900">{formatPhoneDisplay(config.phone)}</div>
                </div>
              </a>

              {/* E-mail */}
              <a
                href={`mailto:${config.email}`}
                className="group flex items-center gap-4 p-6 rounded-2xl bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100"
              >
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-500 mb-1">E-mail</div>
                  <div className="text-lg font-bold text-gray-900 break-all">{config.email}</div>
                </div>
              </a>

              {/* Endereço */}
              <div className="flex items-center gap-4 p-6 rounded-2xl bg-white border border-gray-100">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">Endereço</div>
                  <div className="text-lg font-bold text-gray-900">{config.address}</div>
                </div>
              </div>

              {/* WhatsApp */}
              <a
                href={formatWhatsAppLink(
                  config.whatsapp,
                  'Olá! Gostaria de saber mais sobre os serviços.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <div className="flex-shrink-0 w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-green-100 mb-1">WhatsApp</div>
                  <div className="text-lg font-bold text-white">Iniciar conversa agora</div>
                </div>
                <span className="text-white text-2xl group-hover:translate-x-2 transition-transform">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Driver Registration Dialog */}
      <Dialog open={isDriverDialogOpen} onOpenChange={setIsDriverDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <User className="w-6 h-6 text-blue-600" />
              Cadastro de Motorista
            </DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para solicitar o cadastro de um novo motorista.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={driverForm.handleSubmit(onDriverSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome Completo *
              </Label>
              <Input
                id="fullName"
                placeholder="Digite o nome completo"
                {...driverForm.register('fullName')}
              />
              {driverForm.formState.errors.fullName && (
                <p className="text-sm text-red-600">
                  {driverForm.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf" className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                CPF *
              </Label>
              <Input
                id="cpf"
                placeholder="00000000000"
                maxLength={11}
                {...driverForm.register('cpf')}
              />
              {driverForm.formState.errors.cpf && (
                <p className="text-sm text-red-600">
                  {driverForm.formState.errors.cpf.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                {...driverForm.register('email')}
              />
              {driverForm.formState.errors.email && (
                <p className="text-sm text-red-600">
                  {driverForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone *
              </Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                {...driverForm.register('phone')}
              />
              {driverForm.formState.errors.phone && (
                <p className="text-sm text-red-600">
                  {driverForm.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnhNumber" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Número da CNH *
                </Label>
                <Input
                  id="cnhNumber"
                  placeholder="00000000000"
                  {...driverForm.register('cnhNumber')}
                />
                {driverForm.formState.errors.cnhNumber && (
                  <p className="text-sm text-red-600">
                    {driverForm.formState.errors.cnhNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnhCategory" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Categoria CNH *
                </Label>
                <Select
                  onValueChange={(value) => driverForm.setValue('cnhCategory', value)}
                >
                  <SelectTrigger id="cnhCategory">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="AB">AB</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="E">E</SelectItem>
                  </SelectContent>
                </Select>
                {driverForm.formState.errors.cnhCategory && (
                  <p className="text-sm text-red-600">
                    {driverForm.formState.errors.cnhCategory.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverMessage" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Mensagem / Observações
              </Label>
              <Textarea
                id="driverMessage"
                placeholder="Informações adicionais (opcional)"
                rows={3}
                {...driverForm.register('message')}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDriverDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={driverForm.formState.isSubmitting}
              >
                {driverForm.formState.isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  'Enviar Solicitação'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Vehicle Registration Dialog */}
      <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Car className="w-6 h-6 text-blue-600" />
              Cadastro de Veículo
            </DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para solicitar o cadastro de um novo veículo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={vehicleForm.handleSubmit(onVehicleSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="plate" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Placa do Veículo *
              </Label>
              <Input
                id="plate"
                placeholder="ABC1D23"
                maxLength={7}
                {...vehicleForm.register('plate')}
                className="uppercase"
              />
              {vehicleForm.formState.errors.plate && (
                <p className="text-sm text-red-600">
                  {vehicleForm.formState.errors.plate.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand" className="flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Marca *
                </Label>
                <Input
                  id="brand"
                  placeholder="Ex: Volkswagen"
                  {...vehicleForm.register('brand')}
                />
                {vehicleForm.formState.errors.brand && (
                  <p className="text-sm text-red-600">
                    {vehicleForm.formState.errors.brand.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Modelo *
                </Label>
                <Input
                  id="model"
                  placeholder="Ex: Gol"
                  {...vehicleForm.register('model')}
                />
                {vehicleForm.formState.errors.model && (
                  <p className="text-sm text-red-600">
                    {vehicleForm.formState.errors.model.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Ano *
                </Label>
                <Input
                  id="year"
                  placeholder="2024"
                  maxLength={4}
                  {...vehicleForm.register('year')}
                />
                {vehicleForm.formState.errors.year && (
                  <p className="text-sm text-red-600">
                    {vehicleForm.formState.errors.year.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Cor *
                </Label>
                <Input
                  id="color"
                  placeholder="Ex: Branco"
                  {...vehicleForm.register('color')}
                />
                {vehicleForm.formState.errors.color && (
                  <p className="text-sm text-red-600">
                    {vehicleForm.formState.errors.color.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuelType" className="flex items-center gap-2">
                <Fuel className="w-4 h-4" />
                Tipo de Combustível *
              </Label>
              <Select
                onValueChange={(value) => vehicleForm.setValue('fuelType', value)}
              >
                <SelectTrigger id="fuelType">
                  <SelectValue placeholder="Selecione o tipo de combustível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoline">Gasolina</SelectItem>
                  <SelectItem value="ethanol">Etanol</SelectItem>
                  <SelectItem value="flex">Flex</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Elétrico</SelectItem>
                  <SelectItem value="hybrid">Híbrido</SelectItem>
                </SelectContent>
              </Select>
              {vehicleForm.formState.errors.fuelType && (
                <p className="text-sm text-red-600">
                  {vehicleForm.formState.errors.fuelType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleMessage" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Mensagem / Observações
              </Label>
              <Textarea
                id="vehicleMessage"
                placeholder="Informações adicionais (opcional)"
                rows={3}
                {...vehicleForm.register('message')}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVehicleDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={vehicleForm.formState.isSubmitting}
              >
                {vehicleForm.formState.isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  'Enviar Solicitação'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Vehicle Search Dialog */}
      <Dialog open={isVehicleSearchDialogOpen} onOpenChange={setIsVehicleSearchDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Car className="w-6 h-6 text-blue-600" />
              Consultar Veículo
            </DialogTitle>
            <DialogDescription>
              Digite a placa do veículo para consultar suas informações.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="searchPlate" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Placa do Veículo
              </Label>
              <div className="flex gap-2">
                <Input
                  id="searchPlate"
                  placeholder="ABC1D23"
                  maxLength={7}
                  value={searchPlate}
                  onChange={(e) => {
                    setSearchPlate(e.target.value.toUpperCase());
                    setSearchError('');
                    setVehicleData(null);
                  }}
                  className="uppercase"
                />
                <Button
                  onClick={async () => {
                    if (!searchPlate || searchPlate.length < 7) {
                      setSearchError('Digite uma placa válida');
                      return;
                    }

                    setIsSearchingVehicle(true);
                    setSearchError('');
                    setVehicleData(null);

                    try {
                      const API_URL = appConfig.apiUrl;
                      const response = await fetch(`${API_URL}/api/vehicles/by-plate/${searchPlate}/`);

                      if (!response.ok) {
                        if (response.status === 404) {
                          setSearchError('Veículo não encontrado');
                        } else {
                          setSearchError('Erro ao consultar veículo');
                        }
                        return;
                      }

                      const data: VehicleData = await response.json();
                      setVehicleData(data);
                    } catch (error) {
                      setSearchError('Erro ao conectar com o servidor');
                    } finally {
                      setIsSearchingVehicle(false);
                    }
                  }}
                  disabled={isSearchingVehicle}
                  className="px-6"
                >
                  {isSearchingVehicle ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    'Buscar'
                  )}
                </Button>
              </div>
              {searchError && (
                <p className="text-sm text-red-600">{searchError}</p>
              )}
            </div>

            {vehicleData && (
              <div className="space-y-4 animate-slide-up">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    Informações do Veículo
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Placa</div>
                      <div className="text-sm font-semibold text-gray-900">{vehicleData.plate}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Marca</div>
                      <div className="text-sm font-semibold text-gray-900">{vehicleData.brand}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Modelo</div>
                      <div className="text-sm font-semibold text-gray-900">{vehicleData.model}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Ano</div>
                      <div className="text-sm font-semibold text-gray-900">{vehicleData.year}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Cor</div>
                      <div className="text-sm font-semibold text-gray-900">{vehicleData.color}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Combustível</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {vehicleData.fuel_type === 'gasoline' ? 'Gasolina' :
                         vehicleData.fuel_type === 'ethanol' ? 'Etanol' :
                         vehicleData.fuel_type === 'flex' ? 'Flex' :
                         vehicleData.fuel_type === 'diesel' ? 'Diesel' :
                         vehicleData.fuel_type === 'electric' ? 'Elétrico' :
                         vehicleData.fuel_type === 'hybrid' ? 'Híbrido' : vehicleData.fuel_type}
                      </div>
                    </div>
                  </div>
                </div>

                {vehicleData.current_conductor && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-purple-600" />
                      Motorista Atual
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Nome</div>
                        <div className="text-sm font-semibold text-gray-900">{vehicleData.current_conductor.full_name}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">CPF</div>
                        <div className="text-sm font-semibold text-gray-900">{vehicleData.current_conductor.cpf}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">CNH</div>
                        <div className="text-sm font-semibold text-gray-900">{vehicleData.current_conductor.cnh_number}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Categoria</div>
                        <div className="text-sm font-semibold text-gray-900">{vehicleData.current_conductor.cnh_category}</div>
                      </div>
                    </div>
                  </div>
                )}

                {!vehicleData.current_conductor && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      Este veículo não possui motorista vinculado no momento.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsVehicleSearchDialogOpen(false);
                setSearchPlate('');
                setVehicleData(null);
                setSearchError('');
              }}
              className="flex-1"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complaint Dialog */}
      <Dialog open={isComplaintDialogOpen} onOpenChange={setIsComplaintDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              Registrar Denúncia
            </DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para registrar uma denúncia sobre um veículo.
              Suas informações pessoais são opcionais.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={complaintForm.handleSubmit(onComplaintSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="vehiclePlate" className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                Placa do Veículo *
              </Label>
              <Input
                id="vehiclePlate"
                placeholder="ABC1234"
                maxLength={10}
                {...complaintForm.register('vehiclePlate')}
                onChange={(e) => {
                  complaintForm.setValue('vehiclePlate', e.target.value.toUpperCase());
                  debouncedSearchPlates(e.target.value);
                }}
                className="uppercase"
              />
              {isLoadingPlates && (
                <p className="text-xs text-muted-foreground">Buscando veículos...</p>
              )}
              {plateOptions.length > 0 && (
                <div className="border rounded-md mt-1 max-h-32 overflow-y-auto">
                  {plateOptions.map((option, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        complaintForm.setValue('vehiclePlate', option.plate);
                        setPlateOptions([]);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              {complaintForm.formState.errors.vehiclePlate && (
                <p className="text-sm text-red-600">
                  {complaintForm.formState.errors.vehiclePlate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="complaintType" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Tipo de Denúncia *
              </Label>
              <Select
                onValueChange={(value) => complaintForm.setValue('complaintType', value)}
              >
                <SelectTrigger id="complaintType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excesso_velocidade">Excesso de Velocidade</SelectItem>
                  <SelectItem value="direcao_perigosa">Direção Perigosa</SelectItem>
                  <SelectItem value="uso_celular">Uso de Celular ao Dirigir</SelectItem>
                  <SelectItem value="veiculo_mal_conservado">Veículo Mal Conservado</SelectItem>
                  <SelectItem value="desrespeito_sinalizacao">Desrespeito à Sinalização</SelectItem>
                  <SelectItem value="embriaguez">Suspeita de Embriaguez</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              {complaintForm.formState.errors.complaintType && (
                <p className="text-sm text-red-600">
                  {complaintForm.formState.errors.complaintType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Descrição da Denúncia *
              </Label>
              <Textarea
                id="description"
                placeholder="Descreva detalhadamente o que aconteceu (mínimo 20 caracteres)..."
                rows={4}
                {...complaintForm.register('description')}
              />
              <p className="text-xs text-muted-foreground">
                {complaintForm.watch('description')?.length || 0}/20 caracteres mínimos
              </p>
              {complaintForm.formState.errors.description && (
                <p className="text-sm text-red-600">
                  {complaintForm.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occurrenceDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data da Ocorrência
                </Label>
                <Input
                  id="occurrenceDate"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  {...complaintForm.register('occurrenceDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occurrenceLocation" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Local da Ocorrência
                </Label>
                <Input
                  id="occurrenceLocation"
                  placeholder="Ex: Av. Principal, 1000"
                  {...complaintForm.register('occurrenceLocation')}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Informações do denunciante (opcional - você pode fazer denúncia anônima)
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="complainantName">Seu Nome</Label>
                  <Input
                    id="complainantName"
                    placeholder="Nome completo (opcional)"
                    {...complaintForm.register('complainantName')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complainantEmail">Seu Email</Label>
                    <Input
                      id="complainantEmail"
                      type="email"
                      placeholder="email@exemplo.com (opcional)"
                      {...complaintForm.register('complainantEmail')}
                    />
                    {complaintForm.formState.errors.complainantEmail && (
                      <p className="text-sm text-red-600">
                        {complaintForm.formState.errors.complainantEmail.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complainantPhone">Seu Telefone</Label>
                    <Input
                      id="complainantPhone"
                      placeholder="(00) 00000-0000 (opcional)"
                      {...complaintForm.register('complainantPhone')}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsComplaintDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={complaintForm.formState.isSubmitting}
              >
                {complaintForm.formState.isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  'Enviar Denúncia'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>


      {/* Footer - Moderno com Gradiente */}
      <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {config.company_name}
                </h3>
                <p className="text-sm text-gray-400">
                  Gestão Inteligente de Frotas e Veículos
                </p>
              </div>

              {/* Social Media Links */}
              {(config.facebook_url || config.instagram_url || config.linkedin_url) && (
                <div className="flex gap-3">
                  {config.facebook_url && (
                    <a
                      href={config.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-11 h-11 bg-white/10 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-500 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </a>
                  )}
                  {config.instagram_url && (
                    <a
                      href={config.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-11 h-11 bg-white/10 hover:bg-gradient-to-r hover:from-pink-600 hover:to-purple-600 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-500/50"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </a>
                  )}
                  {config.linkedin_url && (
                    <a
                      href={config.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-11 h-11 bg-white/10 hover:bg-gradient-to-r hover:from-blue-700 hover:to-blue-600 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-700/50"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-gray-400">
                &copy; {new Date().getFullYear()} {config.company_name}. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
