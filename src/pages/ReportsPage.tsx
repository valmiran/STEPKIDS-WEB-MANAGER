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
          (item) => item.child === child.id
        );

        const childChecklists = user.checklists.filter(
          (item) => item.child === child.id
        );

        const childSymptoms = user.symptoms.filter(
          (item) => item.child === child.id
        );

        const totalHours = childUsage.reduce(
          (sum, item) => sum + Number(item.usage_hours || 0),
          0
        );

        const expectedDays = Number(period);
        const adherence = Math.min(
          100,
          Math.round((childUsage.length / expectedDays) * 100)
        );

        const status =
          adherence >= 70
            ? 'Boa adesão'
            : adherence >= 40
              ? 'Atenção'
              : 'Crítico';

        return {
          id: child.id,
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
        };
      })
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
              totalChildren
          );

    const totalHours = childrenReports.reduce(
      (sum, child) => sum + child.totalHours,
      0
    );

    const totalSymptoms = childrenReports.reduce(
      (sum, child) => sum + child.symptomCount,
      0
    );

    const totalExp = childrenReports.reduce(
      (sum, child) => sum + child.totalExp,
      0
    );

    return {
      totalChildren,
      averageAdherence,
      totalHours,
      totalSymptoms,
      totalExp,
    };
  }, [childrenReports]);

  const topGamification = useMemo(() => {
    return [...childrenReports]
      .sort((a, b) => b.totalExp - a.totalExp)
      .slice(0, 5);
  }, [childrenReports]);

  const criticalChildren = useMemo(() => {
    return [...childrenReports]
      .filter((child) => child.status !== 'Boa adesão')
      .sort((a, b) => a.adherence - b.adherence)
      .slice(0, 5);
  }, [childrenReports]);

  const symptomRanking = useMemo(() => {
    return [...childrenReports]
      .sort((a, b) => b.symptomCount - a.symptomCount)
      .slice(0, 5);
  }, [childrenReports]);

  const adherenceChartData = useMemo(() => {
    return filteredChildren.slice(0, 8).map((child) => ({
      name: child.name,
      adesao: child.adherence,
    }));
  }, [filteredChildren]);

  const symptomsChartData = useMemo(() => {
    return symptomRanking.map((child) => ({
      name: child.name,
      sintomas: child.symptomCount,
    }));
  }, [symptomRanking]);

  const gamificationChartData = useMemo(() => {
    return topGamification.map((child) => ({
      name: child.name,
      exp: child.totalExp,
    }));
  }, [topGamification]);

  function exportReportsCsv() {
    const headers = [
      'Crianca',
      'Responsavel',
      'Email',
      'Adesao',
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
            Relatório visual de adesão à órtese, sintomas e gamificação.
          </p>
        </div>

        <div className="reports-actions">
          <button
            className="secondary-button reports-refresh"
            onClick={loadReports}
          >
            <RefreshCcw size={17} />
            Atualizar
          </button>

          <button
            className="secondary-button reports-refresh"
            onClick={exportReportsCsv}
          >
            Exportar CSV
          </button>

          <button
            className="primary-button reports-refresh"
            onClick={printReportsPage}
          >
            Imprimir PDF
          </button>
        </div>
      </div>

      <section className="reports-filter-card">
        <div>
          <label htmlFor="reports-period">Período analisado</label>
          <select
            id="reports-period"
            title="Selecionar período analisado"
            aria-label="Selecionar período analisado"
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
            title="Selecionar status de adesão"
            aria-label="Selecionar status de adesão"
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
        <MetricCard title="Adesão média" value={`${metrics.averageAdherence}%`} description="Média geral no período" icon={<BarChart3 size={22} />} tone="lilac" />
        <MetricCard title="Horas de órtese" value={`${metrics.totalHours}h`} description="Total registrado" icon={<Footprints size={22} />} tone="blue" />
        <MetricCard title="Sintomas" value={metrics.totalSymptoms} description="Relatos de dor/desconforto" icon={<HeartPulse size={22} />} tone="white" />
        <MetricCard title="EXP total" value={metrics.totalExp} description="Engajamento gamificado" icon={<Star size={22} />} tone="yellow" />
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
            {adherenceChartData.length === 0 ? (
              <EmptyState text="Nenhum dado de adesão disponível." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={adherenceChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="adesao" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="panel-card chart-card">
          <div className="panel-title-row">
            <div>
              <h3>Sintomas registrados</h3>
              <p>Quantidade de sintomas/desconfortos relatados.</p>
            </div>
            <HeartPulse size={22} />
          </div>

          <div className="chart-wrapper">
            {symptomsChartData.length === 0 ? (
              <EmptyState text="Nenhum sintoma registrado." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={symptomsChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sintomas" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="panel-card chart-card full-chart-card">
        <div className="panel-title-row">
          <div>
            <h3>Evolução gamificada</h3>
            <p>Comparação de EXP acumulado entre as crianças.</p>
          </div>
          <Trophy size={22} />
        </div>

        <div className="chart-wrapper">
          {gamificationChartData.length === 0 ? (
            <EmptyState text="Nenhum dado de gamificação disponível." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={gamificationChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="exp" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="reports-grid">
        <div className="panel-card">
          <div className="panel-title-row">
            <div>
              <h3>Adesão ao tratamento</h3>
              <p>Percentual de registros de uso da órtese por criança.</p>
            </div>
            <Footprints size={22} />
          </div>

          <div className="report-bars">
            {filteredChildren.length === 0 ? (
              <EmptyState text="Nenhum dado encontrado para o filtro atual." />
            ) : (
              filteredChildren.slice(0, 8).map((child) => (
                <ProgressRow
                  key={child.id}
                  label={child.name}
                  value={child.adherence}
                  helper={`${child.usageCount} registros • ${child.totalHours}h`}
                />
              ))
            )}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-title-row">
            <div>
              <h3>Sintomas e desconfortos</h3>
              <p>Crianças com maior número de relatos clínicos.</p>
            </div>
            <HeartPulse size={22} />
          </div>

          <div className="simple-list">
            {symptomRanking.length === 0 ? (
              <EmptyState text="Nenhum sintoma registrado." />
            ) : (
              symptomRanking.map((child) => (
                <div className="simple-list-item" key={child.id}>
                  <div>
                    <strong>{child.name}</strong>
                    <span>{child.parentName}</span>
                  </div>
                  <small>{child.symptomCount} sintomas</small>
                </div>
              ))
            )}
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
            <ShieldAlert size={22} />
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
                    <span>{child.parentName} • {child.adherence}% de adesão</span>
                  </div>
                  <span className={child.status === 'Crítico' ? 'badge badge-danger' : 'badge badge-warning'}>
                    {child.status}
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
            <p>Visão consolidada de adesão, sintomas e gamificação.</p>
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

                  <td><strong>{child.adherence}%</strong></td>
                  <td>{child.totalHours}h</td>
                  <td>{child.checklistCount}</td>
                  <td>{child.symptomCount}</td>
                  <td><span className="badge badge-lilac">{child.totalExp} EXP</span></td>
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

function ProgressRow({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value / 10) * 10));

  return (
    <div className="progress-row">
      <div className="progress-row-header">
        <strong>{label}</strong>
        <span>{value}%</span>
      </div>

      <div className="progress-track">
        <div className={`progress-fill progress-fill-${safeValue}`} />
      </div>

      <small>{helper}</small>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}