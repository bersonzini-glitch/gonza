import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidad y aviso médico",
  description: "Prácticas de privacidad y aviso médico de ColumnaLATAM.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        Privacidad y aviso médico
      </h1>

      <div className="mt-6 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden="true" />
        <div className="text-sm text-foreground">
          <p className="font-semibold">Este no es un servicio de emergencias médicas.</p>
          <p className="mt-1 text-muted-foreground">
            Si estás atravesando una emergencia médica, contactá a los servicios de emergencia
            locales de inmediato. No uses este sitio para buscar atención urgente o de emergencia.
          </p>
        </div>
      </div>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">Aviso médico</h2>
        <p className="text-muted-foreground">
          ColumnaLATAM es solo un directorio informativo. No brinda consejo médico, diagnóstico ni
          tratamiento, y que un cirujano figure en el listado no constituye un aval ni una
          garantía de sus calificaciones, disponibilidad o idoneidad para ningún caso en
          particular. La información de congresos y eventos se ofrece con fines de descubrimiento
          y puede cambiar sin previo aviso — siempre confirmá fechas, modalidad y datos de
          inscripción directamente con el organizador del evento antes de hacer planes de viaje o
          asistencia.
        </p>
        <p className="text-muted-foreground">
          Siempre verificá de forma independiente la matrícula, credenciales y estado de ejercicio
          actual de un cirujano con el colegio médico o institución correspondiente, y consultá
          directamente con un profesional de la salud calificado antes de tomar cualquier decisión
          sobre tu atención.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Qué información recopilamos
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong>Datos de cuenta:</strong> tu email, nombre de usuario y nombre completo,
            gestionados por Supabase Auth, usados para autenticarte y permitirte administrar tus
            propios envíos.
          </li>
          <li>
            <strong>Datos de perfil de cirujano:</strong> la información que elegís enviar
            (biografía, afiliaciones, idiomas, enlaces de contacto y una foto opcional). Esto se
            mantiene privado (borrador/enviado) hasta que un administrador lo aprueba para
            mostrarlo públicamente.
          </li>
          <li>
            <strong>Datos técnicos básicos:</strong> dirección IP y marcas de tiempo usadas solo
            para protección contra abuso (limitación de intentos en registro, inicio de sesión y
            envío de formularios) y que no se venden ni comparten con terceros.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Cómo la protegemos
        </h2>
        <p className="text-muted-foreground">
          Las contraseñas son gestionadas enteramente por Supabase Auth y nunca se almacenan en
          texto plano ni son vistas por nuestro código de aplicación. El acceso a la base de datos
          está gobernado por políticas de Row Level Security, de modo que tu perfil en borrador o
          enviado no puede ser leído por otros usuarios, y solo los administradores pueden
          revisarlo antes de la aprobación. Podés solicitar la eliminación de tu cuenta y perfil
          en cualquier momento desde tu panel, o contactando a un administrador.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">Tus opciones</h2>
        <p className="text-muted-foreground">
          Vos controlás qué aparece en tu perfil público de cirujano antes de enviarlo a revisión,
          y podés editarlo nuevamente si vuelve a estado borrador. Podés retirar tu perfil del
          directorio en cualquier momento contactando a un administrador.
        </p>
      </section>
    </div>
  );
}
