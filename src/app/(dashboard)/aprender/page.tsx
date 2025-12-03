"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/layout/Header";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  GraduationCap,
  BookOpen,
  Trophy,
  Lock,
  CheckCircle,
  Play,
  Pause,
  Volume2,
  ChevronRight,
  Sparkles,
  Target,
  PiggyBank,
  TrendingUp,
  Brain,
  Lightbulb,
  Clock,
  Star,
  Loader2,
} from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

// Tipos
interface LearningProgress {
  id: string;
  user_id: string;
  experience_level: "beginner" | "intermediate" | "advanced";
  started_at: string;
  current_week: number;
  completed_lessons: string[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  content: string;
}

interface Week {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  lessons: Lesson[];
}

// Contenido del curso
const COURSE_CONTENT: Week[] = [
  {
    number: 1,
    title: "Los Fundamentos del Dinero",
    description: "Aprende a entender tu relación con el dinero y sienta las bases para una vida financiera saludable.",
    icon: <Lightbulb className="w-6 h-6" />,
    color: "#02EAFF",
    lessons: [
      {
        id: "w1-l1",
        title: "¡Bienvenido a tu viaje financiero!",
        description: "Descubre por qué el dinero no es solo números",
        duration: "5 min",
        icon: <Sparkles className="w-5 h-5" />,
        content: `¡Hola! Soy FinyBuddy, tu compañero en este emocionante viaje hacia la libertad financiera.

Antes de hablar de números, quiero que entiendas algo importante: el dinero es una herramienta, no un fin. Es como un martillo: puede construir una casa hermosa o... bueno, mejor no pensemos en eso.

La mayoría de personas nunca aprendieron sobre finanzas en la escuela. ¿Te enseñaron a resolver ecuaciones de segundo grado? Seguro que sí. ¿Te enseñaron a hacer un presupuesto o a entender qué es el interés compuesto? Probablemente no.

Pero aquí estás, tomando el control. Y eso ya te pone por delante del 80% de la población.

En las próximas semanas vas a aprender:
• Cómo funciona realmente el dinero
• Por qué algunos ahorran sin esfuerzo y otros no pueden
• La regla del 50/30/20 que cambiará tu vida
• Cómo hacer que tu dinero trabaje para ti

¿Listo para empezar? ¡Vamos allá!`,
      },
      {
        id: "w1-l2",
        title: "Tu relación con el dinero",
        description: "Entiende tus creencias y hábitos financieros",
        duration: "7 min",
        icon: <Brain className="w-5 h-5" />,
        content: `Vamos a hacer un pequeño experimento. Piensa en la primera memoria que tienes relacionada con el dinero. ¿Qué te decían tus padres sobre él? ¿Era "el dinero no crece en los árboles"? ¿O quizás "los ricos son malas personas"?

Estas creencias que absorbimos de pequeños forman nuestra "programación financiera". Y aquí viene lo interesante: muchas de estas creencias nos limitan sin que lo sepamos.

Hay tres tipos de mentalidad financiera:

1. Mentalidad de escasez: "Nunca hay suficiente". Estas personas viven con miedo constante, incluso cuando tienen dinero.

2. Mentalidad de gasto: "El dinero es para disfrutarlo YA". Viven el momento pero el futuro les da una bofetada.

3. Mentalidad de abundancia: "El dinero es una herramienta que puedo aprender a manejar". Estas personas equilibran el presente y el futuro.

La buena noticia es que tu mentalidad NO es fija. Puedes cambiarla. Y el primer paso es ser consciente de ella.

Ejercicio práctico: Esta semana, cada vez que gastes dinero, pregúntate: "¿Esto lo hago por necesidad, por deseo o por impulso?" No te juzgues, solo observa. La consciencia es el primer paso del cambio.`,
      },
      {
        id: "w1-l3",
        title: "La regla del 50/30/20",
        description: "El método más simple y efectivo para organizar tu dinero",
        duration: "8 min",
        icon: <Target className="w-5 h-5" />,
        content: `Si tuviera que elegir UNA sola cosa que enseñarte, sería esta: la regla del 50/30/20. Es tan simple que parece mentira que funcione. Pero funciona.

Imagina que tu sueldo es un pastel (mmm, pastel). La regla dice cómo cortarlo:

50% - NECESIDADES
Son los gastos que TIENES que pagar sí o sí:
• Alquiler o hipoteca
• Comida básica
• Transporte al trabajo
• Facturas (luz, agua, internet)
• Seguros obligatorios

Si te preguntas "¿puedo vivir sin esto?", y la respuesta es NO, es una necesidad.

30% - DESEOS
Aquí viene lo divertido. Son las cosas que QUIERES pero no necesitas para sobrevivir:
• Netflix, Spotify, suscripciones
• Cenas fuera, caprichos
• Ropa nueva (más allá de lo básico)
• Hobbies y entretenimiento
• Ese café de 4 euros que te tomas cada mañana

No te sientas culpable por gastar en deseos. ¡Para eso trabajas! Pero mantenlo en ese 30%.

20% - AHORRO Y DEUDAS
Esta es la parte que construye tu futuro:
• Fondo de emergencia
• Pagar deudas extra
• Ahorrar para metas
• Inversiones (cuando llegue el momento)

El truco está en pagarte a ti primero. Cuando cobres, ese 20% se va directo a ahorro ANTES de que puedas gastarlo.

¿Y si no llego al 50% con mis necesidades? Entonces tienes dos opciones: aumentar ingresos o reducir gastos fijos. Quizás un piso más barato, un coche más económico... Decisiones difíciles, pero necesarias.

FinyBuddy está diseñado precisamente para ayudarte con esto. Cada operación que registres se clasificará automáticamente y podrás ver si estás cumpliendo la regla.`,
      },
      {
        id: "w1-l4",
        title: "El poder del fondo de emergencia",
        description: "Por qué necesitas uno y cómo crearlo",
        duration: "6 min",
        icon: <PiggyBank className="w-5 h-5" />,
        content: `Te voy a contar un secreto: la diferencia entre alguien que "siempre tiene problemas de dinero" y alguien que "siempre sale adelante" suele ser una sola cosa: el fondo de emergencia.

¿Qué es? Dinero apartado para cuando la vida te sorprende:
• Se rompe la lavadora
• El coche necesita reparación
• Te quedas sin trabajo
• Una emergencia médica

¿Cuánto necesitas? La regla clásica dice 3-6 meses de gastos. Pero empecemos por algo más realista:

Nivel 1: 1.000€ - El mini fondo
Es tu primera meta. Con 1.000€ puedes cubrir la mayoría de emergencias pequeñas sin recurrir a tarjetas de crédito o préstamos.

Nivel 2: 1 mes de gastos
Ya tienes un colchón real. Respiras más tranquilo.

Nivel 3: 3-6 meses de gastos
El objetivo final. Podrías quedarte sin trabajo y tener tiempo para encontrar otro sin agobios.

¿Dónde guardarlo?
En una cuenta SEPARADA de tu cuenta principal. Si lo ves junto a tu dinero del día a día, lo gastarás. Es psicología básica.

Algunos bancos ofrecen cuentas de ahorro sin comisiones. El interés que te den da igual ahora mismo (será bajo). Lo importante es que esté separado y accesible.

Consejo de FinyBuddy: Crea una meta de ahorro llamada "Fondo de emergencia" en la app. Verás tu progreso y te motivará a seguir.

Recuerda: el fondo de emergencia no es para vacaciones, ni para el nuevo iPhone, ni para "es que estaba de oferta". Es tu red de seguridad. Trátalo como sagrado.`,
      },
      {
        id: "w1-l5",
        title: "Resumen y tu primer reto",
        description: "Pon en práctica lo aprendido",
        duration: "4 min",
        icon: <Trophy className="w-5 h-5" />,
        content: `¡Felicidades! Has completado la primera semana del curso de FinyBuddy. Vamos a repasar lo que has aprendido:

✓ El dinero es una herramienta, no un fin
✓ Tu mentalidad financiera viene de tu pasado, pero puedes cambiarla
✓ La regla 50/30/20 es tu guía: Necesidades, Deseos, Ahorro
✓ El fondo de emergencia es tu red de seguridad

Ahora viene lo importante: ACTUAR.

Tu reto para esta semana:

1. Revisa tus últimos gastos del mes en FinyBuddy y clasifícalos en Necesidades, Deseos y Ahorro.

2. Calcula qué porcentaje real estás dedicando a cada categoría.

3. Crea tu primera meta de ahorro: "Fondo de emergencia - 1.000€"

4. Configura una transferencia automática el día que cobras (aunque sean 50€) a una cuenta de ahorro separada.

No tienes que ser perfecto. Si tu situación actual es 70/25/5, no pasa nada. El objetivo es mejorar poco a poco. Pasar a 65/25/10 el próximo mes ya es un éxito.

La semana que viene hablaremos de cómo reducir gastos sin sentir que te estás privando, y cómo aumentar tus ingresos.

¡Nos vemos en la Semana 2!

PD: Si tienes dudas, recuerda que puedes revisar estas lecciones cuando quieras. El conocimiento financiero es como un músculo: cuanto más lo uses, más fuerte se hace.`,
      },
    ],
  },
  {
    number: 2,
    title: "Domina tus Gastos",
    description: "Aprende técnicas probadas para reducir gastos sin sacrificar tu calidad de vida.",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "#9945FF",
    lessons: [
      {
        id: "w2-l1",
        title: "El arte de gastar menos sin sufrimiento",
        description: "Técnicas que realmente funcionan",
        duration: "7 min",
        icon: <Lightbulb className="w-5 h-5" />,
        content: `Contenido de la Semana 2, Lección 1. Se desbloqueará el ${format(addDays(new Date("2024-12-04"), 7), "d 'de' MMMM", { locale: es })}.`,
      },
      {
        id: "w2-l2",
        title: "Los gastos hormiga que te están arruinando",
        description: "Pequeñas fugas que suman grandes pérdidas",
        duration: "6 min",
        icon: <Target className="w-5 h-5" />,
        content: `Contenido de la Semana 2, Lección 2.`,
      },
      {
        id: "w2-l3",
        title: "Negociar como un profesional",
        description: "Cómo pagar menos por lo mismo",
        duration: "8 min",
        icon: <Star className="w-5 h-5" />,
        content: `Contenido de la Semana 2, Lección 3.`,
      },
      {
        id: "w2-l4",
        title: "Suscripciones: el enemigo silencioso",
        description: "Audita y elimina lo que no usas",
        duration: "5 min",
        icon: <Clock className="w-5 h-5" />,
        content: `Contenido de la Semana 2, Lección 4.`,
      },
      {
        id: "w2-l5",
        title: "Reto semana 2: La auditoría de gastos",
        description: "Encuentra 100€ escondidos en tu presupuesto",
        duration: "4 min",
        icon: <Trophy className="w-5 h-5" />,
        content: `Contenido de la Semana 2, Lección 5.`,
      },
    ],
  },
  {
    number: 3,
    title: "Aumenta tus Ingresos",
    description: "Descubre formas de ganar más dinero y diversificar tus fuentes de ingresos.",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "#14F195",
    lessons: [
      {
        id: "w3-l1",
        title: "La mentalidad del crecimiento financiero",
        description: "Por qué ahorrar no es suficiente",
        duration: "6 min",
        icon: <Brain className="w-5 h-5" />,
        content: `Contenido de la Semana 3, Lección 1. Se desbloqueará el ${format(addDays(new Date("2024-12-04"), 14), "d 'de' MMMM", { locale: es })}.`,
      },
      {
        id: "w3-l2",
        title: "Cómo pedir un aumento de sueldo",
        description: "Estrategias que funcionan de verdad",
        duration: "8 min",
        icon: <Target className="w-5 h-5" />,
        content: `Contenido de la Semana 3, Lección 2.`,
      },
      {
        id: "w3-l3",
        title: "Ingresos extra: ideas que puedes empezar hoy",
        description: "Side hustles para todos los perfiles",
        duration: "10 min",
        icon: <Lightbulb className="w-5 h-5" />,
        content: `Contenido de la Semana 3, Lección 3.`,
      },
      {
        id: "w3-l4",
        title: "Monetiza tus habilidades",
        description: "Todos tenemos algo valioso que ofrecer",
        duration: "7 min",
        icon: <Star className="w-5 h-5" />,
        content: `Contenido de la Semana 3, Lección 4.`,
      },
      {
        id: "w3-l5",
        title: "Reto semana 3: Tu primera fuente extra",
        description: "Gana tus primeros euros adicionales",
        duration: "5 min",
        icon: <Trophy className="w-5 h-5" />,
        content: `Contenido de la Semana 3, Lección 5.`,
      },
    ],
  },
  {
    number: 4,
    title: "Construye tu Futuro",
    description: "Introducción a la inversión y cómo hacer que tu dinero trabaje para ti.",
    icon: <Trophy className="w-6 h-6" />,
    color: "#F97316",
    lessons: [
      {
        id: "w4-l1",
        title: "El poder del interés compuesto",
        description: "La octava maravilla del mundo",
        duration: "7 min",
        icon: <Sparkles className="w-5 h-5" />,
        content: `Contenido de la Semana 4, Lección 1. Se desbloqueará el ${format(addDays(new Date("2024-12-04"), 21), "d 'de' MMMM", { locale: es })}.`,
      },
      {
        id: "w4-l2",
        title: "Introducción a la inversión",
        description: "Conceptos básicos que necesitas conocer",
        duration: "10 min",
        icon: <BookOpen className="w-5 h-5" />,
        content: `Contenido de la Semana 4, Lección 2.`,
      },
      {
        id: "w4-l3",
        title: "¿Dónde invertir tus primeros euros?",
        description: "Opciones para principiantes",
        duration: "8 min",
        icon: <Target className="w-5 h-5" />,
        content: `Contenido de la Semana 4, Lección 3.`,
      },
      {
        id: "w4-l4",
        title: "Errores de inversión que debes evitar",
        description: "Aprende de los fallos de otros",
        duration: "6 min",
        icon: <Brain className="w-5 h-5" />,
        content: `Contenido de la Semana 4, Lección 4.`,
      },
      {
        id: "w4-l5",
        title: "Tu plan financiero a largo plazo",
        description: "Diseña tu camino hacia la libertad financiera",
        duration: "8 min",
        icon: <Trophy className="w-5 h-5" />,
        content: `Contenido de la Semana 4, Lección 5.`,
      },
    ],
  },
];

const EXPERIENCE_LEVELS = [
  {
    id: "beginner",
    title: "Principiante",
    description: "Nunca he controlado mis finanzas o acabo de empezar",
    icon: "🌱",
    color: "#14F195",
  },
  {
    id: "intermediate",
    title: "Intermedio",
    description: "Controlo mis gastos pero quiero mejorar mi ahorro",
    icon: "📈",
    color: "#02EAFF",
  },
  {
    id: "advanced",
    title: "Avanzado",
    description: "Ahorro regularmente y quiero aprender a invertir",
    icon: "🚀",
    color: "#9945FF",
  },
];

export default function AprenderPage() {
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [savingLevel, setSavingLevel] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const supabase = createClient();

  const fetchProgress = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("learning_progress")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProgress(data);
    } else {
      setShowOnboarding(true);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleSelectLevel = async (level: string) => {
    setSavingLevel(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("learning_progress")
      .insert({
        user_id: user.id,
        experience_level: level,
        started_at: new Date().toISOString(),
        current_week: 1,
        completed_lessons: [],
      })
      .select()
      .single();

    if (!error && data) {
      setProgress(data);
      setShowOnboarding(false);
    }
    setSavingLevel(false);
  };

  const isWeekUnlocked = (weekNumber: number) => {
    if (!progress) return weekNumber === 1;
    const startDate = new Date(progress.started_at);
    const daysPassed = differenceInDays(new Date(), startDate);
    const unlockedWeek = Math.min(4, Math.floor(daysPassed / 7) + 1);
    return weekNumber <= unlockedWeek;
  };

  const getUnlockDate = (weekNumber: number) => {
    if (!progress) return null;
    const startDate = new Date(progress.started_at);
    return addDays(startDate, (weekNumber - 1) * 7);
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress?.completed_lessons?.includes(lessonId) || false;
  };

  const handleCompleteLesson = async (lessonId: string) => {
    if (!progress) return;

    const newCompleted = [...(progress.completed_lessons || [])];
    if (!newCompleted.includes(lessonId)) {
      newCompleted.push(lessonId);
    }

    const { error } = await supabase
      .from("learning_progress")
      .update({
        completed_lessons: newCompleted,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", progress.id);

    if (!error) {
      setProgress({ ...progress, completed_lessons: newCompleted });
    }
  };

  const handlePlayAudio = async (text: string) => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    setAudioLoading(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("Failed to generate audio");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setAudioLoading(false);
      };

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Audio error:", error);
    } finally {
      setAudioLoading(false);
    }
  };

  const getWeekProgress = (week: Week) => {
    const completed = week.lessons.filter(l => isLessonCompleted(l.id)).length;
    return Math.round((completed / week.lessons.length) * 100);
  };

  const getTotalProgress = () => {
    const totalLessons = COURSE_CONTENT.reduce((acc, w) => acc + w.lessons.length, 0);
    const completedLessons = progress?.completed_lessons?.length || 0;
    return Math.round((completedLessons / totalLessons) * 100);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Header title="Aprender" subtitle="Tu academia de finanzas personales" />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-cyan)]"></div>
        </div>
      </>
    );
  }

  // Onboarding
  if (showOnboarding) {
    return (
      <>
        <Header title="Aprender" subtitle="Tu academia de finanzas personales" />
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            {/* Welcome Card */}
            <div className="card p-8 text-center mb-8">
              <Image
                src="/assets/finybuddy-mascot.png"
                alt="FinyBuddy"
                width={120}
                height={120}
                className="mx-auto mb-6"
              />
              <h1 className="text-2xl font-bold mb-3">
                ¡Bienvenido a la Academia FinyBuddy! 🎓
              </h1>
              <p className="text-[var(--brand-gray)] mb-6 max-w-md mx-auto">
                En las próximas 4 semanas vas a transformar tu relación con el dinero.
                Cada semana desbloquearás nuevas lecciones diseñadas para ti.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--brand-cyan)]">
                <Clock className="w-4 h-4" />
                <span>4 semanas • 20 lecciones • Modo audiolibro incluido</span>
              </div>
            </div>

            {/* Level Selection */}
            <h2 className="text-lg font-semibold mb-4 text-center">
              ¿Cuál es tu nivel de experiencia con las finanzas?
            </h2>
            <div className="grid gap-4">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => handleSelectLevel(level.id)}
                  disabled={savingLevel}
                  className="card p-5 text-left hover:border-[var(--brand-cyan)] transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${level.color}20` }}
                    >
                      {level.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold group-hover:text-[var(--brand-cyan)] transition-colors">
                        {level.title}
                      </h3>
                      <p className="text-sm text-[var(--brand-gray)]">{level.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--brand-gray)] group-hover:text-[var(--brand-cyan)] transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Lesson View
  if (selectedLesson) {
    const currentWeek = COURSE_CONTENT.find(w => w.lessons.some(l => l.id === selectedLesson.id));
    const lessonIndex = currentWeek?.lessons.findIndex(l => l.id === selectedLesson.id) || 0;

    return (
      <>
        <Header
          title={selectedLesson.title}
          subtitle={`Semana ${currentWeek?.number} • Lección ${lessonIndex + 1}`}
        />
        <div className="p-6">
          <div className="max-w-3xl mx-auto">
            {/* Back button */}
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                  setIsPlaying(false);
                }
                setSelectedLesson(null);
              }}
              className="flex items-center gap-2 text-[var(--brand-gray)] hover:text-[var(--foreground)] mb-6 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Volver al curso
            </button>

            {/* Lesson Card */}
            <div className="card p-6 md:p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${currentWeek?.color}20`, color: currentWeek?.color }}
                  >
                    {selectedLesson.icon}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">{selectedLesson.title}</h1>
                    <p className="text-sm text-[var(--brand-gray)]">{selectedLesson.duration} de lectura</p>
                  </div>
                </div>

                {/* Audio Button */}
                <button
                  onClick={() => handlePlayAudio(selectedLesson.content)}
                  disabled={audioLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand-purple)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {audioLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{isPlaying ? "Pausar" : "Escuchar"}</span>
                </button>
              </div>

              {/* Content */}
              <div className="prose prose-invert max-w-none">
                {selectedLesson.content.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="text-[var(--foreground)] leading-relaxed mb-4 whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Complete Button */}
              <div className="mt-8 pt-6 border-t border-[var(--border)]">
                {isLessonCompleted(selectedLesson.id) ? (
                  <div className="flex items-center justify-center gap-2 text-[var(--success)]">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Lección completada</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleCompleteLesson(selectedLesson.id)}
                    className="w-full py-3 rounded-xl gradient-brand text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    Marcar como completada
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Main Course View
  return (
    <>
      <Header title="Aprender" subtitle="Tu academia de finanzas personales" />
      <div className="p-6 space-y-6">
        {/* Progress Overview */}
        <div className="card p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Image
              src="/assets/finybuddy-mascot.png"
              alt="FinyBuddy"
              width={80}
              height={80}
              className="shrink-0"
            />
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">¡Sigue así! 💪</h2>
              <p className="text-[var(--brand-gray)] text-sm mb-4">
                Has completado el {getTotalProgress()}% del curso. Cada lección te acerca más a la libertad financiera.
              </p>
              <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full rounded-full gradient-brand transition-all duration-500"
                  style={{ width: `${getTotalProgress()}%` }}
                />
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-3xl font-bold text-[var(--brand-cyan)]">{getTotalProgress()}%</div>
              <div className="text-sm text-[var(--brand-gray)]">completado</div>
            </div>
          </div>
        </div>

        {/* Weeks */}
        <div className="space-y-4">
          {COURSE_CONTENT.map((week) => {
            const unlocked = isWeekUnlocked(week.number);
            const weekProgress = getWeekProgress(week);
            const unlockDate = getUnlockDate(week.number);

            return (
              <div
                key={week.number}
                className={`card overflow-hidden ${!unlocked ? "opacity-60" : ""}`}
              >
                {/* Week Header */}
                <div
                  className="p-5 border-b border-[var(--border)]"
                  style={{ borderLeftWidth: 4, borderLeftColor: week.color }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${week.color}20`, color: week.color }}
                      >
                        {unlocked ? week.icon : <Lock className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">Semana {week.number}: {week.title}</h3>
                          {weekProgress === 100 && (
                            <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                          )}
                        </div>
                        <p className="text-sm text-[var(--brand-gray)]">{week.description}</p>
                      </div>
                    </div>
                    {unlocked ? (
                      <div className="text-right hidden sm:block">
                        <div className="text-lg font-bold" style={{ color: week.color }}>
                          {weekProgress}%
                        </div>
                        <div className="text-xs text-[var(--brand-gray)]">completado</div>
                      </div>
                    ) : (
                      <div className="text-right hidden sm:block">
                        <div className="text-sm text-[var(--brand-gray)]">Se desbloquea</div>
                        <div className="text-sm font-medium">
                          {unlockDate && format(unlockDate, "d MMM", { locale: es })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lessons */}
                {unlocked && (
                  <div className="divide-y divide-[var(--border)]">
                    {week.lessons.map((lesson, index) => {
                      const completed = isLessonCompleted(lesson.id);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLesson(lesson)}
                          className="w-full p-4 flex items-center gap-4 hover:bg-[var(--background-secondary)] transition-colors text-left"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                              completed
                                ? "bg-[var(--success)] text-white"
                                : "bg-[var(--background-secondary)] text-[var(--brand-gray)]"
                            }`}
                          >
                            {completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{lesson.title}</h4>
                            <p className="text-sm text-[var(--brand-gray)] truncate">
                              {lesson.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-[var(--brand-gray)]">{lesson.duration}</span>
                            <ChevronRight className="w-4 h-4 text-[var(--brand-gray)]" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
