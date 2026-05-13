import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Baby,
  ClipboardCheck,
  Footprints,
  HeartPulse,
  Target,
  Users,
} from 'lucide-react';

import { adminDatabaseService } from '../services/adminDatabaseService';

type DashboardUser = {
  uid: string;
  profile?: {
    full_name?: string;
    email?: string;
  };
  children: any[];
  orthosisUsage: any[];
  checklists: any[];
  symptoms: any[];
  activityCompletions?: Record<string, any>;
};

export default function DashboardPage() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      setLoading(true);
      const data = await adminDatabaseService.getAllUsers();
      setUsers(data as DashboardUser[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const totalUsers = users.length;

    const totalChildren = users.reduce(
      (sum, user) => sum + user.children.length,
      0
    );

    const totalOrthosisHours = users.reduce((sum, user) => {
      const totalUserHours = user.orthosisUsage.reduce(
        (usageSum, item) => usageSum + Number(item.usage_hours || 0),
        0
      );

      return sum + totalUserHours;
    }, 0);

    const totalChecklists = users.reduce(
      (sum, user) => sum + user.checklists.length,
      0
    );

    const totalSymptoms = users.reduce(
      (sum, user) => sum + user.symptoms.length,
      0
    );

    const totalMissions = users.reduce((sum, user) => {
      const completions = user.activityCompletions || {};

      const totalByChildren = Object.values(completions).reduce(
        (childSum: number, childCompletions: any) => {
          if (!childCompletions) return childSum;

          return childSum + Object.keys(childCompletions).length;
        },
        0
      );

      return sum + totalByChildren;
    }, 0);

    const children = users.flatMap((user) => user.children);

    const totalExp = children.reduce(
      (sum, child) => sum + Number(child.totalExp || child.totalPoints || 0),
      0
    );

    const totalGold = children.reduce(
      (sum, child) => sum + Number(child.goldCoins || 0),
      0
    );

    return {
      totalUsers,
      totalChildren,
      totalOrthosisHours,
      totalChecklists,
      totalSymptoms,
      totalMissions,
      totalExp,
      totalGold,
    };
  }, [users]);

  const recentSymptoms = useMemo(() => {
    return users
      .flatMap((user) =>
        user.symptoms.map((symptom) => ({
          ...symptom,
          parentName: user.profile?.full_name || 'Responsável',
          parentEmail: user.profile?.email || '',
        }))
      )
      .slice(-5)
      .reverse();
  }, [users]);

  const lowAdherenceChildren = useMemo(() => {
    return users
      .flatMap((user) =>
        user.children.map((child) => ({
          ...child,
          parentName: user.profile?.full_name || 'Responsável',
          usageCount: user.orthosisUsage.filter(
            (item) => item.child === child.id
          ).length,
        }))
      )
      .filter((child) => child.usageCount === 0)
      .slice(0, 5);
  }, [users]);

  if (loading) {
    return (
      <div>
        <h2 className="page-title">Dashboard</h2>
        <p className="page-description">Carregando dados do Firebase...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-description">
            Visão geral do acompanhamento clínico e gamificado do Pé de Herói.
          </p>
        </div>

        <button className="secondary-button" onClick={loadDashboard}>
          Atualizar dados
        </button>
      </div>

      <section className="metrics-grid">
        <MetricCard
          title="Responsáveis"
          value={metrics.totalUsers}
          description="Usuários cadastrados"
          icon={<Users size={22} />}
          tone="white"
        />

        <MetricCard
          title="Crianças"
          value={metrics.totalChildren}
          description="Perfis infantis cadastrados"
          icon={<Baby size={22} />}
          tone="lilac"
        />

        <MetricCard
          title="Horas de órtese"
          value={`${metrics.totalOrthosisHours}h`}
          description="Total registrado no app"
          icon={<Footprints size={22} />}
          tone="blue"
        />

        <MetricCard
          title="Checklists"
          value={metrics.totalChecklists}
          description="Rotinas diárias preenchidas"
          icon={<ClipboardCheck size={22} />}
          tone="yellow"
        />

        <MetricCard
          title="Sintomas"
          value={metrics.totalSymptoms}
          description="Relatos de dor/desconforto"
          icon={<HeartPulse size={22} />}
          tone="white"
        />

        <MetricCard
          title="Missões"
          value={metrics.totalMissions}
          description="Missões concluídas"
          icon={<Target size={22} />}
          tone="lilac"
        />

        <MetricCard
          title="EXP total"
          value={metrics.totalExp}
          description="Evolução gamificada"
          icon={<Activity size={22} />}
          tone="blue"
        />

        <MetricCard
          title="Moedas"
          value={metrics.totalGold}
          description="Economia da loja"
          icon={<Target size={22} />}
          tone="yellow"
        />
      </section>

      <section className="dashboard-panels">
        <div className="panel-card">
          <div className="panel-title-row">
            <div>
              <h3>Sintomas recentes</h3>
              <p>Últimos relatos registrados pelos responsáveis.</p>
            </div>
            <HeartPulse size={22} />
          </div>

          {recentSymptoms.length === 0 ? (
            <EmptyState text="Nenhum sintoma registrado ainda." />
          ) : (
            <div className="simple-list">
              {recentSymptoms.map((item) => (
                <div className="simple-list-item" key={item.id}>
                  <div>
                    <strong>{item.symptom_type || 'Sintoma'}</strong>
                    <span>
                      Intensidade {item.intensity || '-'} • {item.date || 'sem data'}
                    </span>
                  </div>

                  <small>{item.parentName}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel-card">
          <div className="panel-title-row">
            <div>
              <h3>Alertas de acompanhamento</h3>
              <p>Crianças sem registros de uso da órtese.</p>
            </div>
            <AlertTriangle size={22} />
          </div>

          {lowAdherenceChildren.length === 0 ? (
            <EmptyState text="Nenhum alerta crítico no momento." />
          ) : (
            <div className="simple-list">
              {lowAdherenceChildren.map((child) => (
                <div className="simple-list-item" key={child.id}>
                  <div>
                    <strong>{child.name}</strong>
                    <span>{child.parentName}</span>
                  </div>

                  <small>Sem uso registrado</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
  tone,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  tone: 'white' | 'lilac' | 'blue' | 'yellow';
}) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <div className="metric-icon">{icon}</div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}