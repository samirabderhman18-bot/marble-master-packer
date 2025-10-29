import { Card } from '@/components/ui/card';
import { OptimizationResult } from '@/types/shapes';
import { BarChart3, TrendingUp, Package, AlertCircle } from 'lucide-react';

interface StatisticsProps {
  result: OptimizationResult | null;
  totalArea: number;
}

export const Statistics = ({ result, totalArea }: StatisticsProps) => {
  if (!result) {
    return (
      <Card className="p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Statistiques d'Optimisation</h3>
        <p className="text-sm text-muted-foreground">Ajoutez des pièces pour voir les statistiques</p>
      </Card>
    );
  }

  const efficiencyColor = result.efficiency >= 70 && result.efficiency <= 85 
    ? 'text-green-500' 
    : result.efficiency > 85 
      ? 'text-blue-500' 
      : 'text-orange-500';
  
  const stats = [
    {
      icon: BarChart3,
      label: 'Efficacité (cible: 70-85%)',
      value: `${result.efficiency}%`,
      color: efficiencyColor,
    },
    {
      icon: Package,
      label: 'Surface Utilisée',
      value: `${Math.round(result.usedArea)} cm²`,
      color: 'text-green-500',
    },
    {
      icon: TrendingUp,
      label: 'Chutes',
      value: `${Math.round(result.wasteArea)} cm²`,
      color: 'text-orange-500',
    },
    {
      icon: AlertCircle,
      label: 'Combinaisons Testées',
      value: result.combinationsTested.toLocaleString(),
      color: 'text-blue-500',
    },
  ];

  return (
    <Card className="p-6 shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Statistiques d'Optimisation</h3>
      <div className="space-y-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-sm font-medium">{stat.label}</span>
              </div>
              <span className="text-lg font-bold">{stat.value}</span>
            </div>
          );
        })}
      </div>
      
      {result.unplacedPieces.length > 0 && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive font-medium">
            ⚠️ {result.unplacedPieces.length} pièce(s) ne peuvent pas être placées
          </p>
        </div>
      )}
    </Card>
  );
};
