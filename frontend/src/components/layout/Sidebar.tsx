import { NavLink } from "react-router-dom";
import {
  MessageSquare,
  Database,
  GitBranch,
  FileBarChart,
  Bell,
  Compass,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: MessageSquare, label: "Queries" },
  { to: "/datasets", icon: Database, label: "Datasets" },
  { to: "/metrics", icon: GitBranch, label: "Metrics" },
  { to: "/reports", icon: FileBarChart, label: "Reports" },
  { to: "/alarms", icon: Bell, label: "Alarms" },
] as const;

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#121010] border-r border-border-dim flex flex-col z-40">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold-dim border border-gold/20 flex items-center justify-center">
            <Compass className="w-4 h-4 text-gold" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-text" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem" }}>
              QueryPilot
            </h1>
          </div>
        </div>
        <p className="text-[11px] text-text-muted mt-1.5 tracking-wide uppercase" style={{ fontFamily: "'Azeret Mono', monospace" }}>
          Navigate your data
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item, i) => (
            <li key={item.to} className={`animate-fade-in stagger-${i + 1}`}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-gold-dim text-gold border border-gold/10"
                      : "text-text-secondary hover:text-text hover:bg-elevated border border-transparent"
                  }`
                }
              >
                <item.icon className="w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-110" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border-dim">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-sage animate-[atlas-pulse_2s_ease-in-out_infinite]" />
          <span className="text-[11px] text-text-muted" style={{ fontFamily: "'Azeret Mono', monospace" }}>
            System ready
          </span>
        </div>
      </div>
    </aside>
  );
}
