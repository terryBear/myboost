import { createRoot } from "react-dom/client";
import ClientApp from "./ClientApp.tsx";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";

createRoot(document.getElementById("client-root")!).render(
  <ThemeProvider>
    <ClientApp />
  </ThemeProvider>
);
