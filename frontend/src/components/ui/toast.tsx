import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";

export type ToastMessage = { type: "success" | "error"; title: string; text: string };

const TOAST_MS = 4000;

// Popup shown at the top of the page. Usage:
//   const { showToast, clearToast, toastElement } = useToast();
//   showToast({ type: "success", title: "Saved", text: "..." });
//   return <>{toastElement} ...</>;
export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Start the fade-out after TOAST_MS; the popup is removed when the fade-out ends
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setLeaving(true), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  function showToast(next: ToastMessage) {
    setLeaving(false);
    setToast(next);
  }

  function clearToast() {
    setToast(null);
  }

  const toastElement = toast && (
    <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4 pointer-events-none">
      <div
        role={toast.type === "error" ? "alert" : "status"}
        onAnimationEnd={(e) => {
          if (e.animationName === "toast-out") setToast(null);
        }}
        className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg ${
          leaving ? "toast-leave" : "toast-enter"
        }`}
      >
        <div className="flex items-start gap-3 px-4 py-3">
          {toast.type === "success" ? (
            <CircleCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          ) : (
            <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
            <p className="text-sm text-slate-600">{toast.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setLeaving(true)}
            aria-label="Close"
            className="-m-1 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div
          aria-hidden="true"
          style={{ animationDuration: `${TOAST_MS}ms` }}
          className={`toast-progress absolute bottom-0 left-0 h-1 w-full ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        />
      </div>
    </div>
  );

  return { showToast, clearToast, toastElement };
}
