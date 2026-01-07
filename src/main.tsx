import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./hooks/useAuth";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <ThemeProvider defaultTheme="dark" storageKey="rava-fit-theme">
        <AuthProvider>
            <App />
            <Analytics />
            <SpeedInsights />
        </AuthProvider>
    </ThemeProvider>
);
