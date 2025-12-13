import { User, Heart, Zap, Shield, Target, Eye, Brain } from 'lucide-react';
import { Stats } from '../App';

interface StatsTabProps {
  stats: Stats;
}

export function StatsTab({ stats }: StatsTabProps) {
  const statsList = [
    { name: 'STRENGTH', value: stats.STRENGTH, description: 'Raw physical power' },
    { name: 'PERCEPTION', value: stats.PERCEPTION, description: 'Environmental awareness' },
    { name: 'ENDURANCE', value: stats.ENDURANCE, description: 'Stamina and health' },
    { name: 'CHARISMA', value: stats.CHARISMA, description: 'Charm and leadership' },
    { name: 'INTELLIGENCE', value: stats.INTELLIGENCE, description: 'Intellect and skill' },
    { name: 'AGILITY', value: stats.AGILITY, description: 'Speed and reflexes' },
    { name: 'LUCK', value: stats.LUCK, description: 'Fortune and fate' },
  ];

  return (
    <div className="space-y-4">
      <div className="text-xl mb-6 tracking-wider" style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.5)' }}>
        {'>'} S.P.E.C.I.A.L. ATTRIBUTES
      </div>

      {statsList.map((stat, index) => {
        return (
          <div key={index} className="border border-green-400/30 p-4 hover:border-green-400/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="tracking-wider">{stat.name}</span>
              </div>
              <span className="text-xl">{stat.value}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-2 bg-green-400/10 mb-2">
              <div 
                className="h-full bg-green-400 transition-all duration-500"
                style={{ 
                  width: `${(stat.value / 10) * 100}%`,
                  boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)'
                }}
              />
            </div>
            
            <div className="text-xs opacity-60">{stat.description}</div>
          </div>
        );
      })}

      <div className="mt-6 p-4 border border-green-400/30">
        <div className="text-sm opacity-70">
          {'>'} SPECIAL points determine your character's aptitudes and capabilities.
        </div>
      </div>
    </div>
  );
}