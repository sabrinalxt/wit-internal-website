import { useEffect, useLayoutEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { CalendarDays, Clock, FileText, Tag, UserRound, X } from "lucide-react";
import { getEvents } from "../api/client";
import { useToast } from "../components/ui/toast";
import type { CalendarEvent } from "../types";

// Soft background, accent border and dark text per pillar, like Apple Calendar
const PILLAR_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Tech: { bg: "#e3e4fb", border: "#7c83db", text: "#3b3f8f" },
  Community: { bg: "#ecebf8", border: "#a0a0db", text: "#4a4790" },
  Career: { bg: "#f8e4ef", border: "#d48fb5", text: "#8a3a66" },
  Mentorship: { bg: "#dff2ef", border: "#5fb3a8", text: "#25665d" },
};
const DEFAULT_COLORS = { bg: "#f0eef6", border: "#9990ce", text: "#4b4763" };

function pillarColors(pillar: string | null) {
  return (pillar && PILLAR_COLORS[pillar]) || DEFAULT_COLORS;
}

// Dates and times use the viewer's own locale and time zone
function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// e.g. "6:00 pm – 8:00 pm", or "9:00 am – Sun 1 Nov, 5:00 pm" when it ends on another day
function formatTimeRange(start: Date, end: Date | null) {
  if (!end) return formatTime(start);
  const sameDay = start.toDateString() === end.toDateString();
  const endText = sameDay
    ? formatTime(end)
    : `${end.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}, ${formatTime(end)}`;
  return `${formatTime(start)} – ${endText}`;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  // The clicked event, and where it is on screen so the popup can sit beside it
  const [selected, setSelected] = useState<{ event: CalendarEvent; anchor: DOMRect } | null>(null);
  const { showToast, toastElement } = useToast();

  useEffect(() => {
    let active = true;
    getEvents()
      .then((data) => {
        if (active) setEvents(data);
      })
      .catch((err) => {
        if (!active) return;
        // fetch throws a TypeError when the server can't be reached
        const text =
          err instanceof TypeError
            ? "Can't reach the server. Please try again later."
            : err instanceof Error
              ? err.message
              : "Please try again later.";
        showToast({ type: "error", title: "Couldn't load events", text });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const calendarEvents = events.map((e) => {
    const colors = pillarColors(e.pillar);
    return {
      id: String(e.event_id),
      title: e.event_name,
      start: e.start_at,
      ...(e.end_at && { end: e.end_at }),
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: { event: e },
    };
  });

  return (
    <div className="min-h-screen bg-[#F6F1E7] px-2 py-8 md:p-12 flex justify-center items-start">
      {toastElement}
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
        {loading && (
          <div className="absolute right-6 top-6 z-10 flex items-center gap-2 text-sm text-slate-500">
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-[#a0a0db] border-t-transparent"
            />
            Loading events…
          </div>
        )}
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev today next",
            center: "title",
            right: "",
          }}
          events={calendarEvents}
          eventDisplay="block"
          displayEventTime={false}
          eventClick={(info) =>
            setSelected({
              event: info.event.extendedProps.event as CalendarEvent,
              anchor: info.el.getBoundingClientRect(),
            })
          }
          dayMaxEvents={3}
          height="auto"
        />
      </div>

      {selected && (
        <EventPopover
          event={selected.event}
          anchor={selected.anchor}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

const GAP = 8; // space between the event and the popup
const MARGIN = 16; // keep the popup this far from the window edges

// Small card beside the clicked event (like Apple Calendar), with no overlay behind it
function EventPopover({
  event,
  anchor,
  onClose,
}: {
  event: CalendarEvent;
  anchor: DOMRect;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const start = new Date(event.start_at);
  const end = event.end_at ? new Date(event.end_at) : null;
  const colors = pillarColors(event.pillar);

  // Place it to the right of the event, else to the left, else below (narrow screens),
  // then keep it inside the window. Runs before paint so it never flashes in the wrong spot.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left: number;
    let top = anchor.top;
    if (anchor.right + GAP + w <= vw - MARGIN) {
      left = anchor.right + GAP;
    } else if (anchor.left - GAP - w >= MARGIN) {
      left = anchor.left - GAP - w;
    } else {
      left = Math.min(Math.max(anchor.left, MARGIN), vw - MARGIN - w);
      top = anchor.bottom + GAP;
      if (top + h > vh - MARGIN) top = anchor.top - GAP - h;
    }
    top = Math.min(Math.max(top, MARGIN), vh - MARGIN - h);

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.visibility = "visible";
    el.focus({ preventScroll: true });
  }, [anchor]);

  // Close on Escape, on a click outside, or when the page scrolls or resizes
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Element;
      // Clicks on another event are handled by eventClick, which switches the popup
      if (ref.current?.contains(target) || target.closest(".fc-event")) return;
      onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-labelledby="event-title"
      tabIndex={-1}
      style={{ visibility: "hidden" }}
      className="popover-enter fixed z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg outline-none"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
          style={{ background: colors.border }}
        />
        <h3 id="event-title" className="flex-1 text-lg font-semibold text-slate-900">
          {event.event_name}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-m-1 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <dl className="mt-4 space-y-3 text-sm text-slate-700">
        <div className="flex items-start gap-3">
          <dt className="sr-only">Date</dt>
          <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
          <dd>{formatDate(start)}</dd>
        </div>
        <div className="flex items-start gap-3">
          <dt className="sr-only">Time</dt>
          <Clock aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
          <dd>{formatTimeRange(start, end)}</dd>
        </div>
        {event.pillar && (
          <div className="flex items-start gap-3">
            <dt className="sr-only">Pillar</dt>
            <Tag aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
            <dd>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ background: colors.bg, color: colors.text }}
              >
                {event.pillar}
              </span>
            </dd>
          </div>
        )}
        {event.proposal && (
          <div className="flex items-start gap-3">
            <dt className="sr-only">Proposal</dt>
            <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
            <dd>
              From proposal: {event.proposal.proposal_name} ({event.proposal.proposal_type})
            </dd>
          </div>
        )}
        <div className="flex items-start gap-3">
          <dt className="sr-only">Added by</dt>
          <UserRound aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
          <dd>
            Added by {event.admin.first_name} {event.admin.last_name}
          </dd>
        </div>
      </dl>
    </div>
  );
}
