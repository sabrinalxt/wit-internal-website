import { useEffect, useState } from "react";
import { getHealth } from "../api/client";

export default function HealthPage() {
  const [message, setMessage] = useState<string>("Loading...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getHealth()
      .then((text) => {
        if (active) setMessage(text);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) return <div>Health check failed: {error}</div>;
  return <div>{message}</div>;
}
