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

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { adminDatabaseService } from '../services/adminDatabaseService';
import { clinicalScoreService } from '../services/clinicalScoreService';

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

type DashboardChildAnalysis = {
  id: string;
  name: string;
  parentName: string;
  totalHours: number;
  score: number;
  risk: 'Baixo' | 'Moderado' | 'Alto';
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

  const childrenAnalysis = useMemo<DashboardChildAnalysis[]>(() => {
    return users.flatMap((user) =>
      user.children.map((child) => {
        const childUsage = user.orthosisUsage.filter(
          (item) => item.child === child.id,
        );

        const childChecklists = user.checklists.filter(
          (item) => item.child === child.id,
        );

        const childSymptoms = user.symptoms.filter(
          (item) => item.child === child.id,
        );

        const totalHours = childUsage.reduce(
          (sum, item) => sum + Number(item.usage_hours || 0),
          0,
        );

        const analysis = clinicalScoreService.analyze({
          usageCount: childUsage.length,
          checklistCount: childChecklists.length,
          symptomCount: childSymptoms.length,
          totalHours,
        });

        return {
          id: `${user.uid}-${child.id}`,
          name: child.name || 'Criança',
          parentName: user.profile?.full_name || 'Responsável',
          totalHours,
          score: analysis.score,
          risk: analysis.risk,
        };
      }),
    );
  }, [users]);

  const metrics = useMemo(() => {
    const totalUsers = users.length;

    const totalChildren = users.reduce(
      (sum, user) => sum + user.children.length,
      0,
    );

    const totalOrthosisHours = users.reduce((sum, user) => {
      const totalUserHours = user.orthosisUsage.reduce(
        (usageSum, item) => usageSum + Number(item.usage_hours || 0),
        0,
      );

      return sum + totalUserHours;
    }, 0);

    const totalChecklists = users.reduce(
      (sum, user) => sum + user.checklists.length,
      0,
    );

    const totalSymptoms = users.reduce(
      (sum, user) => sum + user.symptoms.length,
      0,
    );

    const totalMissions = users.reduce((sum, user) => {
      const completions = user.activityCompletions || {};

      const totalByChildren = Object.values(completions).reduce(
        (childSum: number, childCompletions: any) => {
          if (!childCompletions) return childSum;

          return childSum + Object.keys(childCompletions).length;
        },
        0,
      );

      return sum + totalByChildren;
    }, 0);

    const children = users.flatMap((user) => user.children);

    const totalExp = children.reduce(
      (sum, child) => sum + Number(child.totalExp || child.totalPoints || 0),
      0,
    );

    const totalGold = children.reduce(
      (sum, child) => sum + Number(child.goldCoins || 0),
      0,
    );

    const highRisk = childrenAnalysis.filter((child) => child.risk === 'Alto').length;
    const moderateRisk = childrenAnalysis.filter(
      (child) => child.risk === 'Moderado',
    ).length;
    const lowRisk = childrenAnalysis.filter((child) => child.risk === 'Baixo').length;

    const averageScore =
      childrenAnalysis.length > 0
        ? Math.round(
            childrenAnalysis.reduce((sum, child) => sum + child.score, 0) /
              childrenAnalysis.length,
          )
        : 0;

    return {
      totalUsers,
      totalChildren,
      totalOrthosisHours,
      totalChecklists,
      totalSymptoms,
      totalMissions,
      totalExp,
      totalGold,
      highRisk,
      moderateRisk,
      lowRisk,
      averageScore,
    };
  }, [users, childrenAnalysis]);

  const recentSymptoms = useMemo(() => {
    return users
      .flatMap((user) =>
        user.symptoms.map((symptom) => ({
          ...symptom,
          parentName: user.profile?.full_name || 'Responsável',
          parentEmail: user.profile?.email || '',
        })),
      )
      .slice(-5)
      .reverse();
  }, [users]);

  const lowAdherenceChildren = useMemo(() => {
    return childrenAnalysis
      .filter((child) => child.risk === 'Alto' || child.score < 50)
      .slice(0, 5);
  }, [childrenAnalysis]);

  const riskChartData = useMemo(() => {
    return [
      {
        name: 'Baixo',
        value: metrics.lowRisk,
        color: '#22c55e',
      },
      {
        name: 'Moderado',
        value: metrics.moderateRisk,
        color: '#f59e0b',
      },
      {
        name: 'Alto',
        value: metrics.highRisk,
        color: '#ef4444',
      },
    ];
  }, [metrics]);

  const scoreChartData = useMemo(() => {
    return childrenAnalysis.slice(0, 8).map((child) => ({
      name: child.name,
      score: child.score,
    }));
  }, [childrenAnalysis]);

  const hoursChartData = useMemo(() => {
    return childrenAnalysis.slice(0, 8).map((child) => ({
      name: child.name,
      horas: child.totalHours,
    }));
  }, [childrenAnalysis]);

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
            Visão geral do acompanhamento clínico, gamificado e analítico do StepKids.
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
          title="Score médio"
          value={`${metrics.averageScore}/100`}
          description="Média clínica geral"
          icon={<ClipboardCheck size={22} />}
          tone="yellow"
        />

        <MetricCard
          title="Risco alto"
          value={metrics.highRisk}
          description="Prioridade clínica"
          icon={<AlertTriangle size={22} />}
          tone="white"
        />

        <MetricCard
          title="Sintomas"
          value={metrics.totalSymptoms}
          description="Relatos de dor/desconforto"
          icon={<HeartPulse size={22} />}
          tone="lilac"
        />

        <MetricCard
          title="Missões"
          value={metrics.totalMissions}
          description="Missões concluídas"
          icon={<Target size={22} />}
          tone="blue"
        />

        <MetricCard
          title="EXP total"
          value={metrics.totalExp}
          description="Evolução gamificada"
          icon={<Activity size={22} />}
          tone="yellow"
        />
      </section>

      <section className="reports-grid">
        <div className="panel-card chart-card">
          <div className="panel-title-row">
            <div>
              <h3>Distribuição de risco</h3>
              <p>Quantidade de crianças por classificação clínica.</p>
            </div>

            <AlertTriangle size={22} />
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  label
                >
                  {riskChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel-card chart-card">
          <div className="panel-title-row">
            <div>
              <h3>Score clínico por criança</h3>
              <p>Comparativo de adesão e risco clínico.</p>
            </div>

            <ClipboardCheck size={22} />
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#7b4fd6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="panel-card full-chart-card chart-card">
        <div className="panel-title-row">
          <div>
            <h3>Horas de órtese por criança</h3>
            <p>Comparativo dos registros de uso da órtese.</p>
          </div>

          <Footprints size={22} />
        </div>

        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hoursChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="horas" fill="#38bdf8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
              <h3>Prioridades clínicas</h3>
              <p>Crianças com risco alto ou score abaixo do esperado.</p>
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

                  <small>{child.score}/100 • {child.risk}</small>
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