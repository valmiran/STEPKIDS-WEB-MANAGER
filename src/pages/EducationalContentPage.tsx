import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  Trash2,
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { educationalContentService } from '../services/educationalContentService';
import { EducationalContent } from '../types/educationalContent';

export default function EducationalContentPage() {
  const { user } = useAuth();

  const [contents, setContents] = useState<EducationalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Tratamento');
  const [audience, setAudience] = useState('Responsáveis');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadContents();
  }, []);

  async function loadContents() {
    try {
      setLoading(true);
      const data = await educationalContentService.getAll();
      setContents(data.reverse());
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar conteúdos educativos.');
    } finally {
      setLoading(false);
    }
  }

  const filteredContents = useMemo(() => {
    const normalizedSearch = search.toLowerCase();

    return contents.filter((item) => {
      return (
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch) ||
        item.audience.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [contents, search]);

  async function handleAddContent() {
    if (!title.trim() || !description.trim()) {
      alert('Preencha o título e a descrição do conteúdo.');
      return;
    }

    try {
      setSaving(true);

      const newContent = await educationalContentService.create({
        title: title.trim(),
        category,
        audience,
        description: description.trim(),
        createdAt: new Date().toISOString(),
        createdBy: user?.uid,
      });

      setContents((current) => [newContent, ...current]);

      setTitle('');
      setDescription('');
      setCategory('Tratamento');
      setAudience('Responsáveis');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar conteúdo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteContent(id?: string) {
    if (!id) return;

    const confirmDelete = confirm('Deseja remover este conteúdo?');

    if (!confirmDelete) return;

    try {
      await educationalContentService.delete(id);

      setContents((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      alert('Erro ao remover conteúdo.');
    }
  }

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h2 className="page-title">Conteúdos Educativos</h2>

          <p className="page-description">
            Materiais para orientar responsáveis, apoiar a criança e reforçar a adesão ao tratamento.
          </p>
        </div>

        <div className="status-pill">
          <BookOpen size={16} />
          Firebase ativo
        </div>
      </div>

      <section className="metrics-grid">
        <div className="metric-card metric-lilac">
          <div className="metric-icon">
            <BookOpen size={22} />
          </div>

          <div>
            <span>Conteúdos</span>
            <strong>{contents.length}</strong>
            <p>Materiais cadastrados</p>
          </div>
        </div>

        <div className="metric-card metric-blue">
          <div className="metric-icon">
            <ShieldCheck size={22} />
          </div>

          <div>
            <span>Responsáveis</span>
            <strong>
              {contents.filter((item) => item.audience === 'Responsáveis').length}
            </strong>
            <p>Orientações para pais</p>
          </div>
        </div>

        <div className="metric-card metric-yellow">
          <div className="metric-icon">
            <Stethoscope size={22} />
          </div>

          <div>
            <span>Sintomas</span>
            <strong>
              {contents.filter((item) => item.category === 'Sintomas').length}
            </strong>
            <p>Conteúdos clínicos</p>
          </div>
        </div>

        <div className="metric-card metric-white">
          <div className="metric-icon">
            <Plus size={22} />
          </div>

          <div>
            <span>Gamificação</span>
            <strong>
              {contents.filter((item) => item.category === 'Gamificação').length}
            </strong>
            <p>Missões e incentivo infantil</p>
          </div>
        </div>
      </section>

      <section className="content-form-card">
        <div>
          <h3>Novo conteúdo</h3>
          <p>Cadastre uma orientação que ficará salva no Firebase.</p>
        </div>

        <div className="content-form-grid">
          <label>
            Título
            <input
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex: Cuidados com a órtese"
            />
          </label>

          <label>
            Categoria
            <select
              className="input"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option>Tratamento</option>
              <option>Sintomas</option>
              <option>Gamificação</option>
              <option>Rotina</option>
            </select>
          </label>

          <label>
            Público
            <select
              className="input"
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
            >
              <option>Responsáveis</option>
              <option>Crianças</option>
              <option>Profissionais</option>
            </select>
          </label>

          <label className="content-description-field">
            Descrição
            <textarea
              className="input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Escreva uma orientação clara e objetiva..."
              rows={4}
            />
          </label>
        </div>

        <button
          className="primary-button content-add-button"
          onClick={handleAddContent}
          disabled={saving}
        >
          {saving ? <Loader2 size={17} /> : <Plus size={17} />}
          {saving ? 'Salvando...' : 'Adicionar conteúdo'}
        </button>
      </section>

      <section className="table-card">
        <div className="table-toolbar">
          <div>
            <h3>Biblioteca educativa</h3>
            <p>Conteúdos cadastrados para apoio ao tratamento.</p>
          </div>

          <div className="search-box">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar conteúdo..."
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Carregando conteúdos...</div>
        ) : (
          <>
            <div className="content-grid">
              {filteredContents.map((item) => (
                <article className="content-card" key={item.id}>
                  <div className="content-card-header">
                    <div className="content-icon">
                      <BookOpen size={22} />
                    </div>

                    <button
                      className="content-delete-button"
                      onClick={() => handleDeleteContent(item.id)}
                      title="Remover conteúdo"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <h3>{item.title}</h3>

                  <div className="profile-badges">
                    <span className="badge badge-lilac">{item.category}</span>
                    <span className="badge badge-blue">{item.audience}</span>
                  </div>

                  <p>{item.description}</p>
                </article>
              ))}
            </div>

            {filteredContents.length === 0 && (
              <div className="empty-state empty-state-spaced">
                Nenhum conteúdo encontrado.
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}