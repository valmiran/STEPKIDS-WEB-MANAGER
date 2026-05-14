import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Footprints,
  HeartPulse,
  RefreshCcw,
  ShieldAlert,
  Star,
  Trophy,
} from 'lucide-react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { adminDatabaseService } from '../services/adminDatabaseService';
import { clinicalScoreService } from '../services/clinicalScoreService';

type ReportUser = {
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

type ChildReport = {
  id: string;
  name: string;
  parentName: string;
  parentEmail: string;
  level: number;
  totalExp: number;
  goldCoins: number;
  usageCount: number;
  totalHours: number;
  checklistCount: number;
  symptomCount: number;
  adherence: number;
  status: 'Boa adesão' | 'Atenção' | 'Crítico';
  clinicalScore: number;
  clinicalRisk: 'Baixo' | 'Moderado' | 'Alto';
  clinicalSummary: string;
  clinicalAlerts: string[];
};

export default function ReportsPage() {
  const [users, setUsers] = useState<ReportUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [statusFilter, setStatusFilter] = useState('all');

  async function loadReports() {
    try {
      setLoading(true);
      const data = await adminDatabaseService.getAllUsers();
      setUsers(data as ReportUser[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const childrenReports = useMemo<ChildReport[]>(() => {
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

        const expectedDays = Number(period);
        const adherence = Math.min(
          100,
          Math.round((childUsage.length / expectedDays) * 100),
        );

        const status =
          adherence >= 70
            ? 'Boa adesão'
            : adherence >= 40
              ? 'Atenção'
              : 'Crítico';

        const clinicalAnalysis = clinicalScoreService.analyze({
          usageCount: childUsage.length,
          checklistCount: childChecklists.length,
          symptomCount: childSymptoms.length,
          totalHours,
        });

        return {
          id: `${user.uid}-${child.id}`,
          name: child.name,
          parentName: user.profile?.full_name || 'Responsável não informado',
          parentEmail: user.profile?.email || '',
          level: Number(child.level || 1),
          totalExp: Number(child.totalExp || child.totalPoints || 0),
          goldCoins: Number(child.goldCoins || 0),
          usageCount: childUsage.length,
          totalHours,
          checklistCount: childChecklists.length,
          symptomCount: childSymptoms.length,
          adherence,
          status,
          clinicalScore: clinicalAnalysis.score,
          clinicalRisk: clinicalAnalysis.risk,
          clinicalSummary: clinicalAnalysis.summary,
          clinicalAlerts: clinicalAnalysis.alerts,
        };
      }),
    );
  }, [users, period]);

  const filteredChildren = useMemo(() => {
    if (statusFilter === 'all') return childrenReports;
    return childrenReports.filter((child) => child.status === statusFilter);
  }, [childrenReports, statusFilter]);

  const metrics = useMemo(() => {
    const totalChildren = childrenReports.length;

    const averageAdherence =
      totalChildren === 0
        ? 0
        : Math.round(
            childrenReports.reduce((sum, child) => sum + child.adherence, 0) /
              totalChildren,
          );

    const averageClinicalScore =
      totalChildren === 0
        ? 0
        : Math.round(
            childrenReports.reduce(
              (sum, child) => sum + child.clinicalScore,
              0,
            ) / totalChildren,
          );

    const totalHours = childrenReports.reduce(
      (sum, child) => sum + child.totalHours,
      0,
    );

    const totalSymptoms = childrenReports.reduce(
      (sum, child) => sum + child.symptomCount,
      0,
    );

    return {
      totalChildren,
      averageAdherence,
      averageClinicalScore,
      totalHours,
      totalSymptoms,
    };
  }, [childrenReports]);

  const criticalChildren = useMemo(() => {
    return [...childrenReports]
      .filter(
        (child) =>
          child.status !== 'Boa adesão' || child.clinicalRisk === 'Alto',
      )
      .sort((a, b) => a.clinicalScore - b.clinicalScore)
      .slice(0, 5);
  }, [childrenReports]);

  const topGamification = useMemo(() => {
    return [...childrenReports]
      .sort((a, b) => b.totalExp - a.totalExp)
      .slice(0, 5);
  }, [childrenReports]);

  const adherenceChartData = useMemo(() => {
    return filteredChildren.slice(0, 8).map((child) => ({
      name: child.name,
      adesao: child.adherence,
    }));
  }, [filteredChildren]);

  const clinicalScoreChartData = useMemo(() => {
    return filteredChildren.slice(0, 8).map((child) => ({
      name: child.name,
      score: child.clinicalScore,
    }));
  }, [filteredChildren]);

  function exportReportsCsv() {
    const headers = [
      'Crianca',
      'Responsavel',
      'Email',
      'Adesao',
      'Score Clinico',
      'Risco Clinico',
      'Horas de Ortese',
      'Checklists',
      'Sintomas',
      'EXP',
      'Moedas',
      'Nivel',
      'Status',
    ];

    const rows = filteredChildren.map((child) => [
      child.name,
      child.parentName,
      child.parentEmail || 'Nao informado',
      `${child.adherence}%`,
      `${child.clinicalScore}/100`,
      child.clinicalRisk,
      `${child.totalHours}h`,
      child.checklistCount,
      child.symptomCount,
      child.totalExp,
      child.goldCoins,
      child.level,
      child.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(';'))
      .join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `relatorio-stepkids-${period}-dias.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  function printReportsPage() {
    window.print();
  }

  if (loading) {
    return (
      <div>
        <h2 className="page-title">Relatórios</h2>
        <p className="page-description">Carregando dados do Firebase...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h2 className="page-title">Relatórios Clínicos</h2>
          <p className="page-description">
            Relatório de adesão, score clínico, sintomas e gamificação.
          </p>
        </div>

        <div className="reports-actions">
          <button className="secondary-button reports-refresh" onClick={loadReports}>
            <RefreshCcw size={17} />
            Atualizar
          </button>

          <button className="secondary-button reports-refresh" onClick={exportReportsCsv}>
            Exportar CSV
          </button>

          <button className="primary-button reports-refresh" onClick={printReportsPage}>
            Imprimir PDF
          </button>
        </div>
      </div>

      <section className="reports-filter-card">
        <div>
          <label htmlFor="reports-period">Período analisado</label>
          <select
            id="reports-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="15">Últimos 15 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
          </select>
        </div>

        <div>
          <label htmlFor="reports-status">Status de adesão</label>
          <select
            id="reports-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="Boa adesão">Boa adesão</option>
            <option value="Atenção">Atenção</option>
            <option value="Crítico">Crítico</option>
          </select>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard
          title="Adesão média"
          value={`${metrics.averageAdherence}%`}
          description="Média geral no período"
          icon={<BarChart3 size={22} />}
          tone="lilac"
        />

        <MetricCard
          title="Score clínico"
          value={`${metrics.averageClinicalScore}/100`}
          description="Média de risco clínico"
          icon={<ShieldAlert size={22} />}
          tone="yellow"
        />

        <MetricCard
          title="Horas de órtese"
          value={`${metrics.totalHours}h`}
          description="Total registrado"
          icon={<Footprints size={22} />}
          tone="blue"
        />

        <MetricCard
          title="Sintomas"
          value={metrics.totalSymptoms}
          description="Relatos de dor/desconforto"
          icon={<HeartPulse size={22} />}
          tone="white"
        />
      </section>

      <section className="reports-grid">
        <div className="panel-card chart-card">
          <div className="panel-title-row">
            <div>
              <h3>Gráfico de adesão</h3>
              <p>Percentual de adesão ao uso da órtese por criança.</p>
            </div>
            <BarChart3 size={22} />
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={adherenceChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="adesao" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel-card chart-card">
          <div className="panel-title-row">
            <div>
              <h3>Score clínico</h3>
              <p>Comparativo do score inteligente de risco.</p>
            </div>
            <ShieldAlert size={22} />
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={clinicalScoreChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="reports-grid">
        <div className="panel-card">
          <div className="panel-title-row">
            <div>
              <h3>Alertas clínicos</h3>
              <p>Crianças que precisam de atenção no acompanhamento.</p>
            </div>
            <AlertTriangle size={22} />
          </div>

          <div className="simple-list">
            {criticalChildren.length === 0 ? (
              <EmptyState text="Nenhuma criança em situação crítica no momento." />
            ) : (
              criticalChildren.map((child) => (
                <div className="clinical-alert-row" key={child.id}>
                  <div className="clinical-alert-icon">
                    <AlertTriangle size={18} />
                  </div>

                  <div>
                    <strong>{child.name}</strong>
                    <span>
                      {child.parentName} • Score {child.clinicalScore}/100
                    </span>
                  </div>

                  <span
                    className={
                      child.clinicalRisk === 'Alto'
                        ? 'badge badge-danger'
                        : child.clinicalRisk === 'Moderado'
                          ? 'badge badge-warning'
                          : 'badge badge-success'
                    }
                  >
                    {child.clinicalRisk}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-title-row">
            <div>
              <h3>Ranking gamificado</h3>
              <p>Crianças com maior evolução por EXP.</p>
            </div>
            <Trophy size={22} />
          </div>

          <div className="simple-list">
            {topGamification.length === 0 ? (
              <EmptyState text="Nenhum dado gamificado encontrado." />
            ) : (
              topGamification.map((child, index) => (
                <div className="ranking-row" key={child.id}>
                  <div className="ranking-position">#{index + 1}</div>
                  <div>
                    <strong>{child.name}</strong>
                    <span>Nível {child.level} • {child.goldCoins} moedas</span>
                  </div>
                  <small>{child.totalExp} EXP</small>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="table-card reports-table-card">
        <div className="table-toolbar">
          <div>
            <h3>Resumo por criança</h3>
            <p>Visão consolidada de adesão, sintomas, score clínico e gamificação.</p>
          </div>

          <div className="reports-table-chip">
            <CalendarDays size={16} />
            {period} dias
          </div>
        </div>

        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Criança</th>
                <th>Responsável</th>
                <th>Adesão</th>
                <th>Score</th>
                <th>Risco</th>
                <th>Órtese</th>
                <th>Checklists</th>
                <th>Sintomas</th>
                <th>Gamificação</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredChildren.map((child) => (
                <tr key={child.id}>
                  <td>
                    <div className="child-cell">
                      <div className="child-avatar">
                        {child.name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div>
                        <strong>{child.name}</strong>
                        <span>Nível {child.level}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="parent-cell">
                      <strong>{child.parentName}</strong>
                      <span>{child.parentEmail || 'E-mail não informado'}</span>
                    </div>
                  </td>

                  <td>
                    <strong>{child.adherence}%</strong>
                  </td>

                  <td>
                    <strong>{child.clinicalScore}/100</strong>
                  </td>

                  <td>
                    <span
                      className={
                        child.clinicalRisk === 'Alto'
                          ? 'badge badge-danger'
                          : child.clinicalRisk === 'Moderado'
                            ? 'badge badge-warning'
                            : 'badge badge-success'
                      }
                    >
                      {child.clinicalRisk}
                    </span>
                  </td>

                  <td>{child.totalHours}h</td>
                  <td>{child.checklistCount}</td>
                  <td>{child.symptomCount}</td>

                  <td>
                    <span className="badge badge-lilac">{child.totalExp} EXP</span>
                  </td>

                  <td>
                    <span
                      className={
                        child.status === 'Boa adesão'
                          ? 'badge badge-success'
                          : child.status === 'Atenção'
                            ? 'badge badge-warning'
                            : 'badge badge-danger'
                      }
                    >
                      {child.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredChildren.length === 0 && (
            <EmptyState text="Nenhuma criança encontrada para o filtro selecionado." />
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
  icon: ReactNode;
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