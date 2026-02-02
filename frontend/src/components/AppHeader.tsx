import { useTheme } from "@/contexts/ThemeContext";
import { BOOST_LOGO_URL } from "@/lib/constants";
import { MessageCircle, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CustomerFilterDropdown } from "@/components/CustomerFilterDropdown";
import { useReportHeader } from "@/contexts/ReportHeaderContext";

export type AppHeaderProps = {
  basePath: string;
  onContactClick: () => void;
};

export function AppHeader({ basePath, onContactClick }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { headerRight } = useReportHeader();

  const appTitle =
    basePath === "/coffee" ? "MyBoost Compliance Report" : "MyBoost MSP Report";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-4 py-3">
      <div className="flex h-12 items-center gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <img
            src={BOOST_LOGO_URL}
            alt="MyBoost"
            className="h-8 w-auto object-contain dark:invert-0"
          />
          <span className="font-semibold text-foreground truncate hidden sm:inline">
            {appTitle}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          <CustomerFilterDropdown />
          {headerRight}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 shrink-0"
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onContactClick}
            className="shrink-0"
            title="Report a fault / Contact us"
          >
            <MessageCircle className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Contact</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
