import {
  Baby,
  BarChart3,
  ClipboardList,
  Home,
  LogOut,
  Stethoscope,
  Users,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

const menuItems = [
  { label: 'Dashboard', path: '/', icon: Home },
  { label: 'Crianças', path: '/children', icon: Baby },
  { label: 'Responsáveis', path: '/users', icon: Users },
  { label: 'Relatórios', path: '/reports', icon: BarChart3 },
];

export default function DashboardLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Stethoscope size={24} />
          </div>

          <div>
            <strong>Pé de Herói</strong>
            <span>Gerenciador Web</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  isActive ? 'nav-item nav-item-active' : 'nav-item'
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-mini">
            <div className="user-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>

            <div>
              <strong>Usuário logado</strong>
              <span>{user?.email}</span>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            <h1>Gerenciador StepKids</h1>
            <p>Monitoramento clínico e gamificado do Pé de Herói</p>
          </div>

          <div className="status-pill">
            <ClipboardList size={16} />
            Sistema ativo
          </div>
        </header>

        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}