import React, { useState, useEffect } from 'react';
import { materialApi, academicApi, userApi } from '../services/api';
import { LearningMaterial, Subject, Batch, User, MaterialType } from '../types';
import {
  BookOpen,
  Plus,
  Sparkles,
  Search,
  Presentation,
  Video,
  FileText,
  Image as ImageIcon,
  Share2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
} from 'lucide-react';

export const LearningMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  // Modals
  const [showAIModal, setShowAIModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState<LearningMaterial | null>(null);

  // Slide viewer state for PPT
  const [currentSlide, setCurrentSlide] = useState(0);

  // AI Generator Form
  const [aiForm, setAiForm] = useState({
    subjectId: '',
    topic: '',
    type: 'PPT' as MaterialType,
    difficulty: 'MEDIUM',
  });
  const [aiGenerating, setAiGenerating] = useState(false);

  // Map Material Form
  const [mapType, setMapType] = useState<'batch' | 'individual'>('batch');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [typeFilter, subjectFilter]);

  const loadInitialData = async () => {
    try {
      const [subRes, batchRes, stuRes] = await Promise.all([
        academicApi.getSubjects(),
        academicApi.getBatches(),
        userApi.getUsers({ role: 'STUDENT', limit: 100 }),
      ]);
      if (subRes.data?.data) {
        setSubjects(subRes.data.data);
        if (subRes.data.data.length > 0) {
          setAiForm(f => ({ ...f, subjectId: subRes.data.data[0].id }));
        }
      }
      if (batchRes.data?.data) setBatches(batchRes.data.data);
      if (stuRes.data?.data?.users) setStudents(stuRes.data.data.users);
      loadMaterials();
    } catch (err) { console.error(err); }
  };

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (typeFilter) params.type = typeFilter;
      if (subjectFilter) params.subjectId = subjectFilter;
      if (search) params.search = search;
      const res = await materialApi.getMaterials(params);
      if (res.data?.data?.materials) {
        setMaterials(res.data.data.materials);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger AI generation
  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiGenerating(true);
    try {
      const sub = subjects.find(s => s.id === aiForm.subjectId);
      await materialApi.generateMaterial({
        subject: sub?.name || 'Computer Science',
        topic: aiForm.topic || undefined,
        type: aiForm.type,
        difficulty: aiForm.difficulty,
      });
      setShowAIModal(false);
      loadMaterials();
      alert('AI Learning Material generated and added to library!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate material');
    } finally {
      setAiGenerating(false);
    }
  };

  const openViewer = (mat: LearningMaterial) => {
    setActiveMaterial(mat);
    setCurrentSlide(0);
    setShowViewModal(true);
  };

  const openMapModal = (mat: LearningMaterial) => {
    setActiveMaterial(mat);
    setSelectedBatchId(batches[0]?.id || '');
    setSelectedStudentIds([]);
    setShowMapModal(true);
  };

  const handleMapMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMaterial) return;
    try {
      const payload: any = {};
      if (mapType === 'batch') {
        payload.batchId = selectedBatchId;
      } else {
        payload.studentIds = selectedStudentIds;
      }
      await materialApi.mapMaterial(activeMaterial.id, payload);
      alert('Material mapped to students successfully!');
      setShowMapModal(false);
      loadMaterials();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to map material');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this learning material?')) return;
    try {
      await materialApi.deleteMaterial(id);
      loadMaterials();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const getTypeIcon = (type: MaterialType) => {
    switch (type) {
      case 'PPT': return <Presentation size={18} color="#818cf8" />;
      case 'VIDEO': return <Video size={18} color="#f43f5e" />;
      case 'IMAGE': return <ImageIcon size={18} color="#10b981" />;
      default: return <FileText size={18} color="#38bdf8" />;
    }
  };

  // Helper to split markdown sections into slides for PPT presentation viewer
  const getSlides = (content?: string) => {
    if (!content) return [];
    const parts = content.split(/## Slide \d+:?|---/g).filter(s => s.trim().length > 0);
    return parts.length > 0 ? parts : [content];
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Learning Materials Hub</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Generate and distribute multi-format study materials: Presentations, Video Scripts, Notes & Diagrams.
          </p>
        </div>
        <button onClick={() => setShowAIModal(true)} className="btn btn-primary">
          <Sparkles size={16} />
          <span>AI Generate Material</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadMaterials()}
            placeholder="Search materials by title or topic..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="form-select"
          style={{ width: 'auto', minWidth: '150px' }}
        >
          <option value="">All Formats</option>
          <option value="PPT">PPT Presentation</option>
          <option value="VIDEO">Video Tutorial</option>
          <option value="DOCUMENT">Document / Notes</option>
          <option value="IMAGE">Visual Diagram</option>
        </select>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="form-select"
          style={{ width: 'auto', minWidth: '160px' }}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <button onClick={loadMaterials} className="btn btn-secondary">
          Filter
        </button>
      </div>

      {/* Material Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          Loading learning modules...
        </div>
      ) : materials.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <BookOpen size={48} style={{ color: 'var(--text-dim)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No Materials Available</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
            Click "AI Generate Material" to auto-create presentations, video scripts, or guides in seconds.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="glass-card glass-card-hover"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                position: 'relative',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getTypeIcon(mat.type)}
                    <span className="badge badge-secondary">{mat.type}</span>
                    <span className="badge badge-secondary">{mat.subject?.name || 'General'}</span>
                  </div>
                  {mat.isAIGenerated && (
                    <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderColor: 'rgba(99,102,241,0.3)' }}>
                      <Sparkles size={10} /> AI
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.35, marginBottom: '6px' }}>
                  {mat.title}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineClamp: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {mat.description || 'Comprehensive learning resource.'}
                </p>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {new Date(mat.createdAt).toLocaleDateString()}
                  </span>
                  <span>{mat.assignments?.length || 0} mapped</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <button
                  onClick={() => openViewer(mat)}
                  className="btn btn-secondary btn-sm"
                >
                  <Eye size={14} /> View
                </button>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => openMapModal(mat)}
                    className="btn btn-primary btn-sm"
                    title="Map to Students"
                  >
                    <Share2 size={14} /> Map
                  </button>
                  <button
                    onClick={() => handleDelete(mat.id)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#f87171' }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==========================================================================
          AI MATERIAL GENERATOR MODAL
          ========================================================================== */}
      {showAIModal && (
        <div className="modal-backdrop">
          <div className="modal-card animate-slide">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#818cf8" />
                <h2 className="modal-title">AI Learning Material Generator</h2>
              </div>
              <button onClick={() => setShowAIModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAIGenerate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select
                    value={aiForm.subjectId}
                    onChange={(e) => setAiForm({ ...aiForm, subjectId: e.target.value })}
                    className="form-select"
                  >
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Topic / Concepts</label>
                  <input
                    type="text"
                    required
                    value={aiForm.topic}
                    onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                    placeholder="e.g. Asynchronous Javascript & Promises, Neural Networks, Docker"
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Material Format</label>
                    <select
                      value={aiForm.type}
                      onChange={(e) => setAiForm({ ...aiForm, type: e.target.value as MaterialType })}
                      className="form-select"
                    >
                      <option value="PPT">Presentation (Slides)</option>
                      <option value="VIDEO">Video Tutorial Script</option>
                      <option value="DOCUMENT">Document / Study Notes</option>
                      <option value="IMAGE">Visual Diagram / Infographic</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Difficulty</label>
                    <select
                      value={aiForm.difficulty}
                      onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}
                      className="form-select"
                    >
                      <option value="EASY">Beginner</option>
                      <option value="MEDIUM">Intermediate</option>
                      <option value="HARD">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowAIModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={aiGenerating} className="btn btn-primary">
                  {aiGenerating ? 'AI Generating Content...' : 'Generate with AI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          INTERACTIVE MATERIAL VIEWER (PPT SLIDES / VIDEO SCRIPT / NOTES)
          ========================================================================== */}
      {showViewModal && activeMaterial && (
        <div className="modal-backdrop">
          <div className="modal-card animate-slide" style={{ maxWidth: '850px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {getTypeIcon(activeMaterial.type)}
                <div>
                  <h2 className="modal-title" style={{ fontSize: '1.1rem' }}>{activeMaterial.title}</h2>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    {activeMaterial.type} • {activeMaterial.subject?.name || 'General'}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto' }}>
              {/* PPT Slide Deck Presentation Viewer */}
              {activeMaterial.type === 'PPT' ? (
                <div>
                  {(() => {
                    const slides = getSlides(activeMaterial.content);
                    const currentSlideContent = slides[currentSlide] || 'No content';
                    return (
                      <div>
                        <div
                          style={{
                            minHeight: '320px',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(15,20,32,0.9))',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '36px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                            position: 'relative',
                          }}
                        >
                          <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            Slide {currentSlide + 1} of {slides.length}
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                            {currentSlideContent}
                          </div>
                        </div>

                        {/* Slide Deck Nav */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                          <button
                            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                            disabled={currentSlide === 0}
                            className="btn btn-secondary btn-sm"
                          >
                            <ChevronLeft size={16} /> Previous Slide
                          </button>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            {slides.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  border: '1px solid var(--border)',
                                  background: i === currentSlide ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                  color: 'white',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                }}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                            disabled={currentSlide === slides.length - 1}
                            className="btn btn-secondary btn-sm"
                          >
                            Next Slide <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Video script, Document, or Visual Diagram */
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '24px',
                    whiteSpace: 'pre-wrap',
                    fontFamily: activeMaterial.type === 'VIDEO' ? 'var(--font-mono)' : 'inherit',
                    lineHeight: 1.7,
                    fontSize: '0.95rem',
                  }}
                >
                  {activeMaterial.content}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowViewModal(false)} className="btn btn-secondary">
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
          MAP MATERIAL TO STUDENTS / BATCH MODAL
          ========================================================================== */}
      {showMapModal && activeMaterial && (
        <div className="modal-backdrop">
          <div className="modal-card animate-slide" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Map Material to Students</h2>
              <button onClick={() => setShowMapModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleMapMaterial}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Mapping <strong>{activeMaterial.title}</strong>
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setMapType('batch')}
                    className={`btn btn-sm ${mapType === 'batch' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Cohort / Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapType('individual')}
                    className={`btn btn-sm ${mapType === 'individual' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Individual Students
                  </button>
                </div>

                {mapType === 'batch' ? (
                  <div className="form-group">
                    <label className="form-label">Batch</label>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="form-select"
                      required
                    >
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.year})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Students ({selectedStudentIds.length} selected)</label>
                    <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px' }}>
                      {students.map(s => (
                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(s.student?.id || '')}
                            onChange={(e) => {
                              const sId = s.student?.id;
                              if (!sId) return;
                              setSelectedStudentIds(prev =>
                                e.target.checked ? [...prev, sId] : prev.filter(id => id !== sId)
                              );
                            }}
                          />
                          <span style={{ fontSize: '0.85rem' }}>{s.firstName} {s.lastName} ({s.student?.enrollmentNo})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowMapModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
