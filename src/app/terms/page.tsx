import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/finy-mascota-minimalista.png"
              alt="FinyBuddy"
              width={36}
              height={36}
            />
            <Image
              src="/assets/logo-finybuddy-wordmark.png"
              alt="FinyBuddy"
              width={110}
              height={28}
              className="object-contain"
            />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-[var(--brand-gray)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Términos de Servicio</h1>
        <p className="text-sm text-[var(--brand-gray)] mb-10">
          Última actualización: 23 de febrero de 2026
        </p>

        <div className="space-y-8 text-[var(--brand-gray)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              1. Aceptación de los términos
            </h2>
            <p>
              Al acceder y utilizar FinyBuddy (&quot;el Servicio&quot;), aceptas quedar vinculado por estos
              Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no
              podrás acceder al Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              2. Descripción del servicio
            </h2>
            <p>
              FinyBuddy es una aplicación de gestión de finanzas personales que permite a los usuarios
              registrar ingresos, gastos, metas de ahorro y deudas. El Servicio incluye un plan
              gratuito (Basic) y un plan de pago (Pro) con funcionalidades adicionales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              3. Registro y cuenta
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Debes proporcionar información veraz y actualizada al registrarte.</li>
              <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
              <li>Debes tener al menos 16 años para utilizar el Servicio.</li>
              <li>Una cuenta solo puede ser utilizada por una persona.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              4. Periodo de prueba y suscripciones
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Al registrarte, recibes un periodo de prueba gratuito de 15 días con acceso a todas
                las funcionalidades Pro.
              </li>
              <li>
                Al finalizar el periodo de prueba, tu cuenta pasará automáticamente al plan Basic
                (gratuito) a menos que contrates una suscripción Pro.
              </li>
              <li>
                Las suscripciones Pro se facturan de forma recurrente (mensual o anual) a través de
                Stripe.
              </li>
              <li>
                Puedes cancelar tu suscripción en cualquier momento. La cancelación será efectiva al
                final del periodo de facturación actual.
              </li>
              <li>No se realizan reembolsos por periodos parciales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              5. Uso aceptable
            </h2>
            <p className="mb-2">Al utilizar FinyBuddy, te comprometes a:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>No utilizar el Servicio para actividades ilegales o no autorizadas.</li>
              <li>No intentar acceder a cuentas de otros usuarios.</li>
              <li>No intentar vulnerar la seguridad o infraestructura del Servicio.</li>
              <li>No utilizar bots, scrapers u otros métodos automatizados de acceso.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              6. Propiedad intelectual
            </h2>
            <p>
              FinyBuddy, incluyendo su diseño, logos, textos y código, es propiedad de FinyBuddy y
              está protegido por las leyes de propiedad intelectual. No se permite la reproducción,
              distribución o modificación sin autorización previa por escrito.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              7. Limitación de responsabilidad
            </h2>
            <p>
              FinyBuddy es una herramienta de gestión financiera personal y no constituye
              asesoramiento financiero profesional. No nos hacemos responsables de las decisiones
              financieras que tomes basándote en la información mostrada en la aplicación. El
              Servicio se proporciona &quot;tal cual&quot; sin garantías de ningún tipo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              8. Modificaciones del servicio
            </h2>
            <p>
              Nos reservamos el derecho de modificar o discontinuar el Servicio (o cualquier parte
              del mismo) en cualquier momento, con o sin previo aviso. No seremos responsables ante
              ti ni ante terceros por cualquier modificación, suspensión o interrupción del Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              9. Terminación
            </h2>
            <p>
              Podemos suspender o cancelar tu cuenta si consideramos que has violado estos Términos
              de Servicio. Tú también puedes eliminar tu cuenta en cualquier momento desde la
              configuración de tu perfil.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              10. Cambios en los términos
            </h2>
            <p>
              Nos reservamos el derecho de actualizar estos términos en cualquier momento. Te
              notificaremos de cambios significativos por correo electrónico o mediante un aviso en
              el Servicio. El uso continuado del Servicio tras los cambios constituye la aceptación
              de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              11. Contacto
            </h2>
            <p>
              Si tienes preguntas sobre estos Términos de Servicio, puedes contactarnos en{" "}
              <a
                href="mailto:soporte@finybuddy.com"
                className="text-[var(--brand-cyan)] hover:underline"
              >
                soporte@finybuddy.com
              </a>
              .
            </p>
          </section>
        </div>

        {/* Footer link */}
        <div className="mt-12 pt-8 border-t border-[var(--border)] flex items-center justify-between text-sm text-[var(--brand-gray)]">
          <Link href="/privacy" className="text-[var(--brand-cyan)] hover:underline">
            Política de Privacidad
          </Link>
          <p>© {new Date().getFullYear()} FinyBuddy</p>
        </div>
      </main>
    </div>
  );
}
