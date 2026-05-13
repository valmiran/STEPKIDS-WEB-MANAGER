import { useEffect, useMemo, useState } from 'react';
import { Baby, Eye, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { adminDatabaseService } from '../services/adminDatabaseService';
import { Child } from '../types/child';

export default function ChildrenPage() {
  const navigate = useNavigate();

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function loadChildren() {
    try {
      setLoading(true);
      const data = await adminDatabaseService.getAllChildren();
      setChildren(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChildren();
  }, []);

  const filteredChildren = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return children;

    return children.filter((child) => {
      return (
        child.name?.toLowerCase().includes(term) ||
        child.diagnosis?.toLowerCase().includes(term) ||
        child.parentName?.toLowerCase().includes(term) ||
        child.parentEmail?.toLowerCase().includes(term)
      );
    });
  }, [children, search]);

  function handleOpenDetails(child: Child) {
    if (!child.parentUid) return;

    navigate(`/children/${child.parentUid}/${child.id}`);
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h2 className="page-title">Crianças</h2>
          <p className="page-description">
            Acompanhe as crianças cadastradas, progresso, EXP, moedas e adesão ao tratamento.
          </p>
        </div>

        <button className="secondary-button" onClick={loadChildren}>
          Atualizar
        </button>
      </div>

      <section className="children-summary-grid">
        <SummaryCard
          icon="👶"
          title="Total de crianças"
          value={children.length}
          color="white"
        />

        <SummaryCard
          icon="⭐"
          title="EXP acumulado"
          value={children.reduce(
            (sum, child) => sum + Number(child.totalExp || child.totalPoints || 0),
            0
          )}
          color="lilac"
        />

        <SummaryCard
          icon="🪙"
          title="Moedas acumuladas"
          value={children.reduce(
            (sum, child) => sum + Number(child.goldCoins || 0),
            0
          )}
          color="yellow"
        />

        <SummaryCard
          icon="🦶"
          title="Horas de órtese"
          value={`${children.reduce(
            (sum, child) => sum + Number(child.totalOrthosisHours || 0),
            0
          )}h`}
          color="blue"
        />
      </section>

      <section className="table-card">
        <div className="table-toolbar">
          <div>
            <h3>Lista de crianças</h3>
            <p>Dados vindos do Firebase Realtime Database.</p>
          </div>

          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Buscar criança, responsável ou diagnóstico..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Carregando crianças...</div>
        ) : filteredChildren.length === 0 ? (
          <div className="empty-state">
            Nenhuma criança encontrada.
          </div>
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Criança</th>
                  <th>Responsável</th>
                  <th>Idade</th>
                  <th>Diagnóstico</th>
                  <th>Nível</th>
                  <th>EXP</th>
                  <th>Moedas</th>
                  <th>Órtese</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {filteredChildren.map((child) => (
                  <tr key={`${child.parentUid}-${child.id}`}>
                    <td>
                      <div className="child-cell">
                        <div className="child-avatar">
                          {child.name?.charAt(0).toUpperCase() || <Baby size={18} />}
                        </div>

                        <div>
                          <strong>{child.name || 'Sem nome'}</strong>
                          <span>ID: {child.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="parent-cell">
                        <strong>{child.parentName || 'Não informado'}</strong>
                        <span>{child.parentEmail || 'Sem e-mail'}</span>
                      </div>
                    </td>

                    <td>{child.age || '-'}</td>

                    <td>{child.diagnosis || 'Não informado'}</td>

                    <td>
                      <span className="badge badge-lilac">
                        Nível {child.level || 1}
                      </span>
                    </td>

                    <td>
                      <span className="badge badge-blue">
                        {child.totalExp || child.totalPoints || 0} EXP
                      </span>
                    </td>

                    <td>
                      <span className="badge badge-yellow">
                        🪙 {child.goldCoins || 0}
                      </span>
                    </td>

                    <td>{child.totalOrthosisHours || 0}h</td>

                    <td>
                      <button
                        className="icon-button"
                        onClick={() => handleOpenDetails(child)}
                        title="Ver detalhes"
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  color,
}: {
  icon: string;
  title: string;
  value: string | number;
  color: 'white' | 'lilac' | 'yellow' | 'blue';
}) {
  return (
    <div className={`summary-card summary-${color}`}>
      <span className="summary-icon">{icon}</span>
      <div>
        <strong>{value}</strong>
        <p>{title}</p>
      </div>
    </div>
  );
}