import { FormEvent, useState } from 'react';
import { HeartPulse, ShieldCheck, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await login(email, password);
    navigate('/');
  }

  return (
    <main className="login-page">
      <section className="login-illustration">
        <div className="brand-badge">
          <HeartPulse size={22} />
          <span>Pé de Herói</span>
        </div>

        <div className="illustration-card">
          <div className="hero-circle">
            <Stethoscope size={72} />
          </div>

          <h1>Gerenciador Clínico StepKids</h1>

          <p>
            Acompanhe crianças, responsáveis, adesão ao uso da órtese, sintomas,
            missões, progresso e relatórios em um único painel.
          </p>

          <div className="feature-list">
            <span>Dashboard médico</span>
            <span>Relatórios</span>
            <span>Monitoramento</span>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-icon">
            <ShieldCheck size={34} />
          </div>

          <h2>Entrar</h2>

          <p className="login-description">
            Acesse o painel administrativo do Pé de Herói.
          </p>

          <label>
            E-mail
            <input
              className="input"
              type="email"
              placeholder="admin@stepkids.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Senha
            <input
              className="input"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button className="primary-button" type="submit">
            Entrar
          </button>

          <p className="login-footer">
            Use um usuário cadastrado no Firebase Authentication.
          </p>
        </form>
      </section>
    </main>
  );
}