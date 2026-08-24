import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import {
  EVENT_FORMATS,
  EVENT_SOURCE_TYPES,
  EVENT_TOPICS,
  EVENT_TYPES,
  LATAM_COUNTRIES,
} from "@/lib/validation/event";

export interface AiEventSourceCandidate {
  sourceName?: unknown;
  sourceUrl?: unknown;
  sourceType?: unknown;
  notes?: unknown;
}

/**
 * Shape Claude is asked to produce via the record_events tool. Deliberately
 * untyped/loose (every field `unknown`-ish) — this is raw model output, not
 * yet validated. lib/actions/admin.ts runs each candidate through
 * makeEventSchema() before it ever reaches the database, so this interface
 * only needs to describe what we *ask for*, not guarantee what we get.
 */
export interface AiEventCandidate {
  title?: unknown;
  description?: unknown;
  eventType?: unknown;
  format?: unknown;
  country?: unknown;
  city?: unknown;
  venue?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  timezone?: unknown;
  dateNote?: unknown;
  topics?: unknown;
  organizer?: unknown;
  officialUrl?: unknown;
  registrationUrl?: unknown;
  sourceUrl?: unknown;
  sources?: AiEventSourceCandidate[];
}

export interface AiEventSearchResult {
  candidates: AiEventCandidate[];
  webSearchesUsed: number;
  stopReason: string | null;
}

export interface KnownEvent {
  title: string;
  officialUrl: string;
  startDate: string;
}

const RECORD_EVENTS_TOOL: Anthropic.Tool = {
  name: "record_events",
  description:
    "Registra los congresos, cursos, talleres o webinars de cirugía de columna que encontraste y pudiste verificar, listos para revisión editorial. Llamala una sola vez, al final, con todo lo que encontraste (un array vacío si no encontraste ninguno confiable).",
  input_schema: {
    type: "object",
    properties: {
      events: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: {
              type: "string",
              description: "Resumen factual en español, al menos 30 caracteres, sin opiniones.",
            },
            eventType: { type: "string", enum: [...EVENT_TYPES] },
            format: { type: "string", enum: [...EVENT_FORMATS] },
            country: { type: "string", enum: [...LATAM_COUNTRIES] },
            city: { type: "string" },
            venue: { type: "string" },
            startDate: { type: "string", description: "YYYY-MM-DD" },
            endDate: { type: "string", description: "YYYY-MM-DD" },
            timezone: { type: "string", description: "Ej: America/Sao_Paulo" },
            dateNote: {
              type: "string",
              description:
                "Solo si la fuente no da fechas exactas (ej: 'Curso anual, fechas 2027 aún no publicadas'). Igual completá startDate/endDate con tu mejor estimación.",
            },
            topics: { type: "array", items: { type: "string" } },
            organizer: { type: "string" },
            officialUrl: { type: "string" },
            registrationUrl: { type: "string" },
            sourceUrl: { type: "string" },
            sources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sourceName: { type: "string" },
                  sourceUrl: { type: "string" },
                  sourceType: { type: "string", enum: [...EVENT_SOURCE_TYPES] },
                  notes: { type: "string" },
                },
                required: ["sourceName", "sourceUrl", "sourceType"],
              },
            },
          },
          required: [
            "title",
            "description",
            "eventType",
            "format",
            "country",
            "startDate",
            "endDate",
            "organizer",
            "officialUrl",
            "sourceUrl",
            "topics",
            "sources",
          ],
        },
      },
    },
    required: ["events"],
  },
};

function buildSystemPrompt(knownEvents: KnownEvent[], maxEvents: number, today: string): string {
  const knownList =
    knownEvents.length > 0
      ? knownEvents.map((e) => `- "${e.title}" (${e.startDate}) — ${e.officialUrl}`).join("\n")
      : "(ninguno todavía)";

  return `Sos un investigador que ayuda a mantener ColumnaLATAM, un directorio editorial independiente de congresos, cursos, talleres y webinars de cirugía de columna (ortopedia y neurocirugía) en Latinoamérica.

Reglas estrictas, las mismas que ya sigue el sitio:
- Solo eventos REALES que puedas verificar con una fuente pública concreta: la página oficial de una sociedad científica, un calendario de educación médica continua de un hospital o universidad, el sitio propio del organizador, o un feed/API pública. Nunca inventes eventos, fechas, organizadores ni URLs.
- officialUrl, sourceUrl y las URLs en "sources" tienen que ser URLs reales que hayas encontrado en tu búsqueda — nunca las inventes ni las adivines a partir del nombre del evento.
- Si una fuente solo da mes/año, o dice que el evento es anual con fechas todavía no anunciadas, usá "dateNote" para aclararlo y de todas formas completá startDate/endDate con tu mejor estimación (por ejemplo el primer y último día del mes indicado).
- No repitas ninguno de estos eventos que ya están cargados en el sitio:
${knownList}
- Priorizá congresos, cursos y talleres organizados por sociedades científicas, hospitales o universidades reconocidas en toda Latinoamérica (Argentina, Brasil, México, Chile, Colombia, Perú, Uruguay, y el resto de la región).
- Hoy es ${today}. Buscá únicamente eventos cuya fecha de inicio sea hoy o en el futuro, dentro de los próximos 12 meses aproximadamente.
- Encontrá como máximo ${maxEvents} eventos. Preferí calidad y verificación por sobre cantidad: es mejor traer menos eventos bien verificados que muchos dudosos, y está bien devolver menos de ${maxEvents} (o ninguno) si no encontrás suficientes que puedas verificar.
- "country" tiene que ser exactamente uno de: ${LATAM_COUNTRIES.join(", ")}.
- "eventType" tiene que ser exactamente uno de: ${EVENT_TYPES.join(", ")}.
- "format" tiene que ser exactamente uno de: ${EVENT_FORMATS.join(", ")}.
- "topics": elegí de esta lista cuando aplique (podés incluir además algún término libre si no encaja ninguno): ${EVENT_TOPICS.join(", ")}.
- Cada evento necesita al menos una fuente en "sources", con "sourceType" uno de: ${EVENT_SOURCE_TYPES.join(", ")}.
- Escribí "description" en español.

Cuando termines de investigar, llamá a la herramienta "record_events" una sola vez con todos los eventos que encontraste.`;
}

/**
 * Runs a single Anthropic Messages API call with the server-side web_search
 * tool enabled, asking Claude to research upcoming LATAM spine-surgery
 * events and report them back via the custom "record_events" tool (used
 * purely as a structured-output mechanism, not actually executed by us).
 *
 * Throws if ANTHROPIC_API_KEY isn't configured or the API call fails —
 * callers are expected to catch this and log it rather than let it bubble
 * up as an unhandled rejection inside a background `after()` task.
 */
export async function searchUpcomingEvents(options: {
  knownEvents: KnownEvent[];
  maxEvents: number;
}): Promise<AiEventSearchResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY no está configurada. Agregala como variable de entorno para usar la búsqueda con IA.",
    );
  }

  const anthropic = new Anthropic({ apiKey });
  const today = new Date().toISOString().slice(0, 10);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 16000,
    system: buildSystemPrompt(options.knownEvents, options.maxEvents, today),
    tools: [
      {
        type: "web_search_20260318",
        name: "web_search",
        max_uses: Math.max(15, options.maxEvents * 2),
      },
      RECORD_EVENTS_TOOL,
    ],
    messages: [
      {
        role: "user",
        content:
          "Buscá próximos congresos, cursos, talleres y webinars de cirugía de columna en Latinoamérica para agregar a ColumnaLATAM, siguiendo exactamente las reglas del system prompt.",
      },
    ],
  });

  const webSearchesUsed = response.content.filter(
    (block) => block.type === "server_tool_use" && block.name === "web_search",
  ).length;

  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use" && block.name === "record_events",
  );

  const rawEvents =
    toolUseBlock && typeof toolUseBlock.input === "object" && toolUseBlock.input !== null
      ? (toolUseBlock.input as { events?: unknown }).events
      : undefined;

  const candidates = Array.isArray(rawEvents) ? (rawEvents as AiEventCandidate[]) : [];

  return {
    candidates: candidates.slice(0, options.maxEvents),
    webSearchesUsed,
    stopReason: response.stop_reason,
  };
}
