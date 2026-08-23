import { BookOpenCheck, Database, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiénes somos y fuentes de datos",
  description:
    "Cómo ColumnaLATAM obtiene los datos de congresos de columna y verifica los perfiles de cirujanos en Latinoamérica.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        Sobre ColumnaLATAM
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        ColumnaLATAM es un directorio editorial independiente de congresos de cirugía de columna y
        cirujanos de columna verificados en Latinoamérica. Lo creamos porque la información sobre
        eventos y especialistas de columna en la región está dispersa en decenas de sitios de
        sociedades, páginas de hospitales y redes sociales — nosotros la reunimos en un solo lugar
        confiable.
      </p>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <Database className="size-5 text-primary" aria-hidden="true" />
          Metodología de datos de congresos
        </h2>
        <div className="mt-3 space-y-3 text-muted-foreground">
          <p>
            Todo congreso, conferencia, curso, taller o webinar listado acá proviene de una fuente
            real y pública — la página oficial de una sociedad, un calendario de educación médica
            continua de un hospital o universidad, el sitio propio de un organizador de eventos, o
            un feed RSS/API pública abierta. No inventamos eventos, fechas, organizadores ni URLs.
          </p>
          <p>
            Cada página de evento lista su(s) fuente(s) de datos y una fecha de &ldquo;última
            verificación&rdquo;. Cuando una fuente solo publica mes/año, o dice que un evento es
            anual con fechas aún no anunciadas, lo indicamos explícitamente (a través de una nota
            de fecha) en vez de inventar un día específico.
          </p>
          <p>
            El proceso de carga de eventos es intencionalmente simple y auditable: los
            administradores agregan y re-verifican periódicamente los eventos a través del panel
            de administración, y cada evento enlaza a al menos una fuente que podés verificar vos
            mismo. No hacemos scraping de sitios que lo prohíben, no evadimos controles de acceso
            ni generamos volúmenes de solicitudes abusivos contra ninguna fuente.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <Users className="size-5 text-primary" aria-hidden="true" />
          Directorio de cirujanos y verificación
        </h2>
        <div className="mt-3 space-y-3 text-muted-foreground">
          <p>
            Los cirujanos crean su propia cuenta y envían su perfil. Un perfil{" "}
            <strong>nunca es visible públicamente</strong> hasta que un administrador lo revisa y
            aprueba — los perfiles en borrador o enviados solo son visibles para su dueño y para
            los administradores.
          </p>
          <p>
            No inventamos identidades de cirujanos, títulos, números de matrícula, datos de
            contacto ni fotos. Cualquier perfil de muestra usado para ilustrar el directorio antes
            de que se incorporen envíos reales está claramente identificado como &ldquo;Perfil de
            muestra&rdquo; en todos los lugares donde aparece, incluida su propia página.
          </p>
          <p>
            Una insignia de &ldquo;verificado&rdquo; significa que el perfil pasó nuestro proceso
            de revisión de completitud y consistencia interna — no reemplaza confirmar de forma
            independiente la matrícula y credenciales de un cirujano con su colegio médico local o
            institución antes de tomar cualquier decisión de atención.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
          Seguridad y manejo de datos
        </h2>
        <div className="mt-3 space-y-3 text-muted-foreground">
          <p>
            La autenticación, el almacenamiento de contraseñas y el manejo de sesiones están
            delegados enteramente a Supabase Auth — nunca vemos ni guardamos contraseñas en texto
            plano. Cada tabla está protegida por Row Level Security, de modo que,
            independientemente de errores en la aplicación, es la propia base de datos la que
            impone quién puede leer o escribir cada fila.
          </p>
          <p>
            Las acciones administrativas sensibles (aprobar, rechazar, suspender o eliminar un
            perfil; crear o editar eventos) se registran en un historial de auditoría de solo
            escritura que ningún rol, ni siquiera los administradores, puede editar o borrar desde
            la aplicación.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <BookOpenCheck className="size-5 text-primary" aria-hidden="true" />
          Correcciones
        </h2>
        <p className="mt-3 text-muted-foreground">
          ¿Encontraste un error en un evento o en un perfil de cirujano? Iniciá sesión y usá tu
          panel para solicitar cambios en tu propio perfil, o contactanos a través de los datos de
          contacto publicados en el sitio oficial del evento correspondiente para que corrijamos
          la información.
        </p>
      </section>
    </div>
  );
}
