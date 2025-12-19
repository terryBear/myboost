import { createRoot } from "react-dom/client";
import ClientApp from "./ClientApp.tsx";
import "./index.css";

createRoot(document.getElementById("client-root")!).render(<ClientApp />);
