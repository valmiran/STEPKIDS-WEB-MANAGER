import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ClipboardList,
  Footprints,
  HeartPulse,
  RefreshCcw,
  Stethoscope,
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

type ClinicalUser = {
  uid: string;
  profile?: {
    full_name?: string;
    email?: string;
  };
  children: any[];
  orthosisUsage: any[];
  checklists: any[];
  symptoms: any[];
};

type ClinicalChild = {
  id: string;
  parentUid: string;
  name: string;
  parentName: string;
  parentEmail: string;
  usageCount: number;
  checklistCount: number;
  symptomCount: number;
  totalHours: number;
  risk: 'Baixo' | 'Moderado' | 'Alto';
  riskReason: string;
  score: number;
  alerts: string[];
  summary: string;
  color: 'success' | 'warning' | 'danger';
};

export default function ClinicalPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<ClinicalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('all');

  async function loadClinicalData() {
    try {
      setLoading(true);
      const data = await adminDatabaseService.getAllUsers();
      setUsers(data as ClinicalUser[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClinicalData();
  }, []);

  const clinicalChildren = useMemo<ClinicalChild[]>(() => {
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
          id: child.id,
          parentUid: user.uid,
          name: child.name,
          parentName: user.profile?.full_name || 'Responsável não informado',
          parentEmail: user.profile?.email || 'E-mail não informado',
          usageCount: childUsage.length,
          checklistCount: childChecklists.length,
          symptomCount: childSymptoms.length,
          totalHours,
          risk: analysis.risk,
          riskReason: analysis.summary,
          score: analysis.score,
          alerts: analysis.alerts,
          summary: analysis.summary,
          color: analysis.color,
        };
      }),
    );
  }, [users]);

  const filteredChildren = useMemo(() => {
    if (riskFilter === 'all') return clinicalChildren;

    return clinicalChildren.filter((child) => child.risk === riskFilter);
  }, [clinicalChildren, riskFilter]);

  const metrics = useMemo(() => {
    return {
      total: clinicalChildren.length,
      highRisk: clinicalChildren.filter((child) => child.risk === 'Alto').length,
      moderateRisk: clinicalChildren.filter((child) => child.risk === 'Moderado')
        .length,
      lowRisk: clinicalChildren.filter((child) => child.risk === 'Baixo').length,
      symptoms: clinicalChildren.reduce(
        (sum, child) => sum + child.symptomCount,
        0,
      ),
    };
  }, [clinicalChildren]);

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
    return clinicalChildren
      .slice(0, 8)
      .map((child) => ({
        name: child.name || 'Criança',
        score: child.score,
      }));
  }, [clinicalChildren]);

  if (loading) {
    return (
      <div>
        <h2 className="page-title">Integração Clínica</h2>
        <p className="page-description">Carregando dados clínicos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h2 className="page-title">Integração Clínica</h2>

          <p className="page-description">
            Monitoramento inteligente de risco, sintomas, adesão e necessidade de acompanhamento.
          </p>
        </div>

        <button
          className="secondary-button reports-refresh"
          onClick={loadClinicalData}
        >
          <RefreshCcw size={17} />
          Atualizar
        </button>
      </div>

      <section className="reports-filter-card">
        <div>
          <label htmlFor="clinical-risk-filter">Filtro de risco</label>

          <select
            id="clinical-risk-filter"
            title="Selecionar filtro de risco clínico"
            aria-label="Selecionar filtro de risco clínico"
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
          >
            <option value="all">Todos</option>
            <option value="Baixo">Baixo</option>
            <option value="Moderado">Moderado</option>
            <option value="Alto">Alto</option>
          </select>
        </div>
      </section>

      <section className="metrics-grid">
        <div className="metric-card metric-blue">
          <div className="metric-icon">
            <Stethoscope size={22} />
          </div>

          <div>
            <span>Crianças monitoradas</span>
            <strong>{metrics.total}</strong>
            <p>Total em acompanhamento</p>
          </div>
        </div>

        <div className="metric-card metric-yellow">
          <div className="metric-icon">
            <AlertTriangle size={22} />
          </div>

          <div>
            <span>Risco alto</span>
            <strong>{metrics.highRisk}</strong>
            <p>Necessitam atenção clínica</p>
          </div>
        </div>

        <div className="metric-card metric-lilac">
          <div className="metric-icon">
            <ClipboardList size={22} />
          </div>

          <div>
            <span>Risco moderado</span>
            <strong>{metrics.moderateRisk}</strong>
            <p>Acompanhamento preventivo</p>
          </div>
        </div>

        <div className="metric-card metric-white">
          <div className="metric-icon">
            <HeartPulse size={22} />
          </div>

          <div>
            <span>Sintomas totais</span>
            <strong>{metrics.symptoms}</strong>
            <p>Dor ou desconforto registrados</p>
          </div>
        </div>
      </section>

      <section className="reports-grid">
        <div className="panel-card chart-card">
          <div className="panel-title-row">
            <div>
              <h3>Distribuição de risco</h3>
              <p>Classificação automática dos pacientes monitorados.</p>
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
              <h3>Score por criança</h3>
              <p>Comparativo do score clínico de adesão.</p>
            </div>

            <ClipboardList size={22} />
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

      <section className="table-card reports-table-card">
        <div className="table-toolbar">
          <div>
            <h3>Triagem clínica inteligente</h3>

            <p>
              Lista de crianças com score automático de risco com base nos registros.
            </p>
          </div>
        </div>

        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Criança</th>
                <th>Responsável</th>
                <th>Uso da órtese</th>
                <th>Checklists</th>
                <th>Sintomas</th>
                <th>Score</th>
                <th>Risco</th>
                <th>Motivo e alertas</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              {filteredChildren.map((child) => (
                <tr key={`${child.parentUid}-${child.id}`}>
                  <td>
                    <div className="child-cell">
                      <div className="child-avatar">
                        {child.name?.charAt(0).toUpperCase() || 'C'}
                      </div>

                      <div>
                        <strong>{child.name}</strong>
                        <span>Paciente monitorado</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="parent-cell">
                      <strong>{child.parentName}</strong>
                      <span>{child.parentEmail}</span>
                    </div>
                  </td>

                  <td>
                    <strong>{child.totalHours}h</strong>
                    <br />
                    <span>{child.usageCount} registros</span>
                  </td>

                  <td>{child.checklistCount}</td>

                  <td>
                    <span className="badge badge-lilac">
                      {child.symptomCount} sintomas
                    </span>
                  </td>

                  <td>
                    <strong>{child.score}/100</strong>
                  </td>

                  <td>
                    <span className={`badge badge-${child.color}`}>
                      {child.risk}
                    </span>
                  </td>

                  <td className="clinical-reason">
                    <p className="clinical-text">{child.summary}</p>

                    <div className="clinical-alert-list">
                      {child.alerts.length > 0 ? (
                        child.alerts.map((alert) => (
                          <div
                            key={alert}
                            className={`clinical-alert-chip clinical-alert-${child.color}`}
                          >
                            {alert}
                          </div>
                        ))
                      ) : (
                        <div className="clinical-alert-chip clinical-alert-success">
                          Sem alertas críticos
                        </div>
                      )}
                    </div>
                  </td>

                  <td>
                    <button
                      className="secondary-button small-action-button"
                      onClick={() =>
                        navigate(`/children/${child.parentUid}/${child.id}`)
                      }
                    >
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredChildren.length === 0 && (
            <div className="empty-state">
              Nenhuma criança encontrada para o filtro selecionado.
            </div>
          )}
        </div>
      </section>

      <section className="reports-grid">
        <div className="panel-card">
          <div className="panel-title-row">
            <div>
              <h3>Critério de score clínico</h3>
              <p>Como o sistema interpreta os registros clínicos.</p>
            </div>

            <Footprints size={22} />
          </div>

          <div className="clinical-criteria-list">
            <div>
              <strong>80 a 100 pontos — risco baixo</strong>
              <span>
                Boa adesão, boa frequência de registros e ausência de sintomas recorrentes.
              </span>
            </div>

            <div>
              <strong>50 a 79 pontos — risco moderado</strong>
              <span>
                Acompanhamento recomendado por adesão parcial, sintomas leves ou registros incompletos.
              </span>
            </div>

            <div>
              <strong>Abaixo de 50 pontos — risco alto</strong>
              <span>
                Baixa adesão, sintomas recorrentes ou tempo insuficiente de uso da órtese.
              </span>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-title-row">
            <div>
              <h3>Finalidade clínica</h3>
              <p>Uso da plataforma no acompanhamento profissional.</p>
            </div>

            <Stethoscope size={22} />
          </div>

          <p className="clinical-text">
            Esta área apoia a tomada de decisão clínica ao consolidar informações
            de adesão, sintomas, checklists e evolução do tratamento. O objetivo é
            facilitar o acompanhamento longitudinal da criança e identificar rapidamente
            situações que exigem contato com o responsável ou avaliação profissional.
          </p>
        </div>
      </section>
    </div>
  );
}