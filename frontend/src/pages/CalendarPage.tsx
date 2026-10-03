import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const mockEvents = [
  { title: "Welcome Week", start: "2025-06-01", color: "#A0A0DB" },
  { title: "Tech Exchange", start: "2025-06-06", color: "#F4B400" },
  { title: "Mentor Meeting", start: "2025-06-15", color: "#87D37C" },
];

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-[#F6F1E7] px-2 py-8 md:p-12 flex justify-center items-start">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-soft border border-slate-200 overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev today next",
            center: "title",
            right: "",
          }}
          events={mockEvents}
          height="auto"
        />
      </div>
    </div>
  );
}
