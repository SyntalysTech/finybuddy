import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
        <p className="text-sm text-[var(--brand-gray)] mb-10">
          Última actualización: 23 de febrero de 2026
        </p>

        <div className="space-y-8 text-[var(--brand-gray)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              1. Información que recopilamos
            </h2>
            <p className="mb-3">Recopilamos la siguiente información cuando utilizas FinyBuddy:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-[var(--foreground)]">Datos de registro:</strong> nombre,
                dirección de correo electrónico y contraseña (almacenada de forma cifrada).
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Datos financieros:</strong> ingresos,
                gastos, categorías, metas de ahorro y deudas que introduces voluntariamente en la
                aplicación.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Datos de pago:</strong> procesados
                directamente por Stripe. No almacenamos números de tarjeta de crédito ni datos
                bancarios en nuestros servidores.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Datos de uso:</strong> información
                sobre cómo interactúas con el Servicio para mejorar la experiencia de usuario.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              2. Cómo utilizamos tu información
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Proporcionar y mantener el Servicio.</li>
              <li>Procesar transacciones y gestionar suscripciones.</li>
              <li>Enviar comunicaciones relacionadas con el Servicio (confirmaciones, alertas, actualizaciones).</li>
              <li>Enviar newsletter y consejos financieros (solo si te has suscrito voluntariamente).</li>
              <li>Mejorar y personalizar la experiencia de usuario.</li>
              <li>Prevenir fraude y abusos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              3. Almacenamiento y seguridad
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Tus datos se almacenan de forma segura en servidores de Supabase con cifrado en
                reposo y en tránsito.
              </li>
              <li>Las contraseñas se almacenan con hash criptográfico (bcrypt).</li>
              <li>
                Los pagos se procesan a través de Stripe, certificado PCI DSS Nivel 1, el nivel más
                alto de seguridad en la industria de pagos.
              </li>
              <li>Utilizamos HTTPS para todas las comunicaciones.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              4. Compartición de datos
            </h2>
            <p className="mb-3">
              No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-[var(--foreground)]">Proveedores de servicio:</strong>{" "}
                Supabase (base de datos), Stripe (pagos) y OpenAI (funcionalidad de chat IA), que
                procesan datos en nuestro nombre y bajo nuestras instrucciones.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Obligación legal:</strong> cuando sea
                requerido por ley o en respuesta a solicitudes legales válidas.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              5. Tus derechos (RGPD)
            </h2>
            <p className="mb-3">
              De acuerdo con el Reglamento General de Protección de Datos (RGPD), tienes derecho a:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-[var(--foreground)]">Acceso:</strong> solicitar una copia de
                tus datos personales.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Rectificación:</strong> corregir datos
                inexactos o incompletos.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Supresión:</strong> solicitar la
                eliminación de tus datos personales.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Portabilidad:</strong> recibir tus
                datos en un formato estructurado y legible por máquina.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Oposición:</strong> oponerte al
                tratamiento de tus datos en determinadas circunstancias.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Retirar consentimiento:</strong> para
                el envío de comunicaciones comerciales en cualquier momento.
              </li>
            </ul>
            <p className="mt-3">
              Para ejercer cualquiera de estos derechos, contacta con nosotros en{" "}
              <a
                href="mailto:soporte@finybuddy.com"
                className="text-[var(--brand-cyan)] hover:underline"
              >
                soporte@finybuddy.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              6. Cookies
            </h2>
            <p>
              FinyBuddy utiliza cookies esenciales para el funcionamiento del Servicio (autenticación
              y preferencias de tema). No utilizamos cookies de seguimiento ni de publicidad de
              terceros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              7. Retención de datos
            </h2>
            <p>
              Conservamos tus datos mientras mantengas una cuenta activa. Si solicitas la eliminación
              de tu cuenta, eliminaremos tus datos personales en un plazo máximo de 30 días, excepto
              cuando la ley exija su conservación.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              8. Menores de edad
            </h2>
            <p>
              FinyBuddy no está dirigido a menores de 16 años. No recopilamos conscientemente
              información personal de menores de 16 años. Si descubrimos que hemos recopilado datos
              de un menor, los eliminaremos de inmediato.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              9. Cambios en esta política
            </h2>
            <p>
              Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos de
              cambios significativos por correo electrónico o mediante un aviso en el Servicio. Te
              recomendamos revisar esta política regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
              10. Contacto
            </h2>
            <p>
              Si tienes preguntas sobre esta Política de Privacidad o sobre el tratamiento de tus
              datos, puedes contactarnos en{" "}
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
          <Link href="/terms" className="text-[var(--brand-cyan)] hover:underline">
            Términos de Servicio
          </Link>
          <p>© {new Date().getFullYear()} FinyBuddy</p>
        </div>
      </main>
    </div>
  );
}
