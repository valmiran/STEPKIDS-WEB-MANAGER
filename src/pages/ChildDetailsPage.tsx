import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Baby,
  CheckCircle2,
  Footprints,
  HeartPulse,
  Star,
} from 'lucide-react';

import { adminDatabaseService } from '../services/adminDatabaseService';
import { Child } from '../types/child';
import { DailyChecklist, OrthosisUsage, Symptom } from '../types/monitoring';

type ChildDetails = {
  child: Child;
  parent?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
  orthosisUsage: OrthosisUsage[];
  checklists: DailyChecklist[];
  symptoms: Symptom[];
};

export default function ChildDetailsPage() {
  const { parentUid, childId } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState<ChildDetails | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDetails() {
    if (!parentUid || !childId) return;

    try {
      setLoading(true);
      const data = await adminDatabaseService.getChildDetails(parentUid, childId);
      setDetails(data as ChildDetails | null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [parentUid, childId]);

  const totalHours = useMemo(() => {
    return details?.orthosisUsage.reduce(
      (sum, item) => sum + Number(item.usage_hours || 0),
      0
    ) || 0;
  }, [details]);

  if (loading) {
    return <div className="empty-state">Carregando detalhes da criança...</div>;
  }

  if (!details) {
    return (
      <div>
        <button className="secondary-button" onClick={() => navigate('/children')}>
          Voltar
        </button>

        <div className="empty-state empty-state-spaced">
          Criança não encontrada.
        </div>
      </div>
    );
  }

  const { child, parent, symptoms, checklists, orthosisUsage } = details;

  return (
    <div>
      <button className="secondary-button back-button" onClick={() => navigate('/children')}>
        <ArrowLeft size={17} />
        Voltar
      </button>

      <section className="child-profile-header">
        <div className="child-profile-avatar">
          {child.name?.charAt(0).toUpperCase() || <Baby size={34} />}
        </div>

        <div>
          <h2>{child.name}</h2>
          <p>{child.diagnosis || 'Diagnóstico não informado'}</p>

          <div className="profile-badges">
            <span className="badge badge-lilac">Nível {child.level || 1}</span>
            <span className="badge badge-blue">
              {child.totalExp || child.totalPoints || 0} EXP
            </span>
            <span className="badge badge-yellow">🪙 {child.goldCoins || 0}</span>
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard
          title="Idade"
          value={`${child.age || '-'} anos`}
          description="Idade cadastrada"
          icon={<Baby size={22} />}
          tone="white"
        />

        <MetricCard
          title="Órtese"
          value={`${totalHours}h`}
          description="Horas registradas"
          icon={<Footprints size={22} />}
          tone="blue"
        />

        <MetricCard
          title="Checklists"
          value={checklists.length}
          description="Registros diários"
          icon={<CheckCircle2 size={22} />}
          tone="yellow"
        />

        <MetricCard
          title="Sintomas"
          value={symptoms.length}
          description="Relatos registrados"
          icon={<HeartPulse size={22} />}
          tone="lilac"
        />
      </section>

      <section className="details-grid">
        <div className="panel-card">
          <div className="panel-title-row">
            <div>
              <h3>Responsável</h3>
              <p>Dados do usuário vinculado.</p>
            </div>
          </div>

          <div className="info-list">
            <InfoItem label="Nome" value={parent?.full_name || 'Não informado'} />
            <InfoItem label="E-mail" value={parent?.email || 'Não informado'} />
            <InfoItem label="Telefone" value={parent?.phone || 'Não informado'} />
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-title-row">
            <div>
              <h3>Gamificação</h3>
              <p>Resumo de progresso no Pé de Herói.</p>
            </div>
            <Star size={22} />
          </div>

          <div className="info-list">
            <InfoItem label="Nível" value={String(child.level || 1)} />
            <InfoItem label="EXP" value={String(child.totalExp || child.totalPoints || 0)} />
            <InfoItem label="Moedas" value={String(child.goldCoins || 0)} />
            <InfoItem label="Missões concluídas" value={String(child.completedMissions || 0)} />
          </div>
        </div>
      </section>

      <section className="details-grid">
        <RecordsPanel
          title="Uso da órtese"
          empty="Nenhum uso de órtese registrado."
          records={orthosisUsage.map((item) => ({
            title: item.used_today ? 'Usou a órtese' : 'Não usou a órtese',
            subtitle: `${item.usage_hours || 0}h • ${item.date || 'sem data'}`,
            description: item.notes || '',
          }))}
        />

        <RecordsPanel
          title="Checklists"
          empty="Nenhum checklist registrado."
          records={checklists.map((item) => ({
            title: item.used_today ? 'Checklist positivo' : 'Checklist registrado',
            subtitle: `${item.date || 'sem data'} • ${item.pointsEarned || 0} pts`,
            description: `Dor: ${item.felt_pain ? 'Sim' : 'Não'} | Dormiu com órtese: ${
              item.slept_with_orthosis ? 'Sim' : 'Não'
            }`,
          }))}
        />
      </section>

      <section className="panel-card">
        <div className="panel-title-row">
          <div>
            <h3>Sintomas registrados</h3>
            <p>Relatos de dor, desconforto e observações.</p>
          </div>
          <HeartPulse size={22} />
        </div>

        {symptoms.length === 0 ? (
          <div className="empty-state">Nenhum sintoma registrado.</div>
        ) : (
          <div className="simple-list">
            {symptoms.map((item) => (
              <div className="simple-list-item" key={item.id}>
                <div>
                  <strong>{item.symptom_type || 'Sintoma'}</strong>
                  <span>
                    Intensidade {item.intensity || '-'} • {item.date || 'sem data'}
                  </span>
                  {item.description ? <span>{item.description}</span> : null}
                </div>

                <small>{item.mood || 'Sem humor'}</small>
              </div>
            ))}
          </div>
        )}
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RecordsPanel({
  title,
  empty,
  records,
}: {
  title: string;
  empty: string;
  records: Array<{
    title: string;
    subtitle: string;
    description?: string;
  }>;
}) {
  return (
    <div className="panel-card">
      <div className="panel-title-row">
        <div>
          <h3>{title}</h3>
          <p>Últimos registros vinculados à criança.</p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">{empty}</div>
      ) : (
        <div className="simple-list">
          {records.slice().reverse().slice(0, 6).map((item, index) => (
            <div className="simple-list-item" key={`${item.title}-${index}`}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
                {item.description ? <span>{item.description}</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}