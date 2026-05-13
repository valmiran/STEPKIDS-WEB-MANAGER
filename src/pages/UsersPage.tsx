import { useEffect, useMemo, useState } from 'react';
import { Baby, Mail, Phone, Search, UserRound } from 'lucide-react';

import { adminDatabaseService } from '../services/adminDatabaseService';

type DashboardUser = {
  uid: string;
  profile?: {
    full_name?: string;
    email?: string;
    phone?: string;
    cpf?: string;
    role?: string;
  };
  children: any[];
  orthosisUsage: any[];
  checklists: any[];
  symptoms: any[];
};

export default function UsersPage() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await adminDatabaseService.getAllUsers();
      setUsers(data as DashboardUser[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return users;

    return users.filter((user) => {
      return (
        user.profile?.full_name?.toLowerCase().includes(term) ||
        user.profile?.email?.toLowerCase().includes(term) ||
        user.profile?.phone?.toLowerCase().includes(term) ||
        user.profile?.cpf?.toLowerCase().includes(term)
      );
    });
  }, [users, search]);

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h2 className="page-title">Responsáveis</h2>
          <p className="page-description">
            Visualize os pais/responsáveis cadastrados e os dados vinculados às crianças.
          </p>
        </div>

        <button className="secondary-button" onClick={loadUsers}>
          Atualizar
        </button>
      </div>

      <section className="children-summary-grid">
        <SummaryCard
          icon="👨‍👩‍👧"
          title="Responsáveis"
          value={users.length}
          color="white"
        />

        <SummaryCard
          icon="👶"
          title="Crianças vinculadas"
          value={users.reduce((sum, user) => sum + user.children.length, 0)}
          color="lilac"
        />

        <SummaryCard
          icon="📋"
          title="Checklists"
          value={users.reduce((sum, user) => sum + user.checklists.length, 0)}
          color="yellow"
        />

        <SummaryCard
          icon="😟"
          title="Sintomas"
          value={users.reduce((sum, user) => sum + user.symptoms.length, 0)}
          color="blue"
        />
      </section>

      <section className="table-card">
        <div className="table-toolbar">
          <div>
            <h3>Lista de responsáveis</h3>
            <p>Usuários responsáveis cadastrados pelo app mobile.</p>
          </div>

          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Buscar por nome, e-mail, telefone ou CPF..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Carregando responsáveis...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">Nenhum responsável encontrado.</div>
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Responsável</th>
                  <th>Contato</th>
                  <th>CPF</th>
                  <th>Tipo</th>
                  <th>Crianças</th>
                  <th>Órtese</th>
                  <th>Checklists</th>
                  <th>Sintomas</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const totalHours = user.orthosisUsage.reduce(
                    (sum, item) => sum + Number(item.usage_hours || 0),
                    0
                  );

                  return (
                    <tr key={user.uid}>
                      <td>
                        <div className="child-cell">
                          <div className="child-avatar">
                            {user.profile?.full_name?.charAt(0).toUpperCase() || (
                              <UserRound size={18} />
                            )}
                          </div>

                          <div>
                            <strong>
                              {user.profile?.full_name || 'Nome não informado'}
                            </strong>
                            <span>UID: {user.uid}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="contact-cell">
                          <span>
                            <Mail size={14} />
                            {user.profile?.email || 'Sem e-mail'}
                          </span>

                          <span>
                            <Phone size={14} />
                            {user.profile?.phone || 'Sem telefone'}
                          </span>
                        </div>
                      </td>

                      <td>{user.profile?.cpf || 'Não informado'}</td>

                      <td>
                        <span className="badge badge-lilac">
                          {user.profile?.role || 'parent'}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-blue">
                          <Baby size={13} />
                          {user.children.length}
                        </span>
                      </td>

                      <td>{totalHours}h</td>

                      <td>{user.checklists.length}</td>

                      <td>{user.symptoms.length}</td>
                    </tr>
                  );
                })}
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