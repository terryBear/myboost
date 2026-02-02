import { createRoot } from "react-dom/client";
import CoffeeApp from "./CoffeeApp";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";

createRoot(document.getElementById("coffee-root")!).render(
  <ThemeProvider>
    <CoffeeApp />
  </ThemeProvider>
);
