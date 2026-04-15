import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Importar funções de teste do Discord (disponíveis no console)
if (import.meta.env.DEV) {
  import('./lib/testDiscordWebhook');
}

createRoot(document.getElementById("root")!).render(<App />);
