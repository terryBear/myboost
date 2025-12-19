import { createRoot } from "react-dom/client";
import CoffeeApp from "./CoffeeApp";
import "./index.css";

createRoot(document.getElementById("coffee-root")!).render(<CoffeeApp />);
