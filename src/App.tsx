import { useState, useEffect } from "react";
import { DataTab } from "./components/DataTab";
import { MapTab } from "./components/MapTab";
import { RadioTab } from "./components/RadioTab";
import { GameTab } from "./components/GameTab";

type Tab = "TASKS" | "MAP" | "RADIO" | "GAME";

export interface Stats {
  STRENGTH: number;
  PERCEPTION: number;
  ENDURANCE: number;
  CHARISMA: number;
  INTELLIGENCE: number;
  AGILITY: number;
  LUCK: number;
}

const defaultStats: Stats = {
  STRENGTH: 7,
  PERCEPTION: 6,
  ENDURANCE: 8,
  CHARISMA: 5,
  INTELLIGENCE: 9,
  AGILITY: 7,
  LUCK: 6,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("TASKS");
  const [isLoading, setIsLoading] = useState(false);
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState<Stats>(() => {
    // Load stats from localStorage on initial render
    const saved = localStorage.getItem("pipboy-stats");
    return saved ? JSON.parse(saved) : defaultStats;
  });

  // Save stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("pipboy-stats", JSON.stringify(stats));
  }, [stats]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabs: Tab[] = ["TASKS", "MAP", "RADIO", "GAME"];

  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab || isLoading) return;

    setIsLoading(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsLoading(false);
    }, 800);
  };

  const updateStats = (statUpdates: Partial<Stats>) => {
    setStats((prev) => {
      const updated = { ...prev };
      Object.entries(statUpdates).forEach(([key, value]) => {
        updated[key as keyof Stats] = Math.min(
          10,
          updated[key as keyof Stats] + value,
        );
      });
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Pip-Boy Screen - Full Screen */}
      <div className="relative w-full h-screen bg-black overflow-hidden">
        {/* CRT Scanlines Effect */}
        <div
          className="absolute inset-0 pointer-events-none z-50 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.03) 2px, rgba(0, 255, 0, 0.03) 4px)",
          }}
        />

        {/* Screen Glow Effect */}
        <div
          className="absolute inset-0 pointer-events-none z-40"
          style={{
            boxShadow: "inset 0 0 100px rgba(0, 255, 0, 0.1)",
          }}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col text-green-400 font-mono p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 pb-3 border-b-2 border-green-400/30">
            <div>
              <div
                className="text-2xl tracking-wider font-bold mb-1"
                style={{
                  textShadow: "0 0 10px rgba(0, 255, 0, 0.5)",
                }}
              >
                PIP-BOY 3000 MARK IV
              </div>
              <div className="text-sm opacity-70">
                ROBCO INDUSTRIES (TM)
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg">
                {time.toLocaleTimeString()}
              </div>
              <div className="text-sm opacity-70">
                {new Date(
                  2177,
                  time.getMonth(),
                  time.getDate(),
                ).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-6 mb-6 pb-3 border-green-400/30">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                disabled={isLoading}
                className={`relative px-4 py-2 transition-all ${
                  activeTab === tab
                    ? "text-green-400"
                    : "text-green-400/40 hover:text-green-400/70"
                } ${isLoading ? "cursor-wait" : ""}`}
                style={
                  activeTab === tab
                    ? {
                        textShadow:
                          "0 0 10px rgba(0, 255, 0, 0.7)",
                      }
                    : {}
                }
              >
                {tab}
                {activeTab === tab && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400"
                    style={{
                      boxShadow: "0 0 5px rgba(0, 255, 0, 0.7)",
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-green-400/30 scrollbar-track-transparent relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
                <div className="text-center space-y-4">
                  <div
                    className="text-xl tracking-wider animate-pulse"
                    style={{
                      textShadow:
                        "0 0 10px rgba(0, 255, 0, 0.7)",
                    }}
                  >
                    LOADING...
                  </div>
                  <div className="flex justify-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                        style={{
                          animationDelay: `${i * 0.15}s`,
                          boxShadow:
                            "0 0 8px rgba(0, 255, 0, 0.7)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {activeTab === "TASKS" && (
                  <DataTab updateStats={updateStats} />
                )}
                {activeTab === "MAP" && <MapTab />}
                {activeTab === "RADIO" && <RadioTab />}
                {activeTab === "GAME" && <GameTab />}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-green-400/30 flex justify-between text-xs opacity-70">
            <div>HP: 100/100</div>
            <div>AP: 85/85</div>
            <div>RADS: 0</div>
            <div>LVL: 25</div>
          </div>
        </div>
      </div>
    </div>
  );
}