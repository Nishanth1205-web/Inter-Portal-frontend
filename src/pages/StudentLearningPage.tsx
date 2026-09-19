import React, { useState, useEffect } from 'react';
import { materialApi } from '../services/api';
import {
  BookOpen,
  Presentation,
  Video,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Award,
} from 'lucide-react';

export const StudentLearningPage: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMaterial, setActiveMaterial] = useState<any>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    loadLearningMaterials();
  }, []);

  const loadLearningMaterials = async () => {
    setLoading(true);
    try {
      const res = await materialApi.getStudentMaterials();
      if (res.data?.data) {
        setAssignments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openMaterialViewer = (asgn: any) => {
    setActiveMaterial(asgn.material);
    setCurrentSlide(0);
    setShowViewer(true);

    // Record access activity
    materialApi.recordActivity(asgn.material.id, {
      progress: 50,
      timeSpent: 30,
    }).catch(() => {});
  };

  const markComplete = async (materialId: string) => {
    try {
      await materialApi.recordActivity(materialId, {
        isCompleted: true,
        progress: 100,
        timeSpent: 120,
      });
      alert('Module marked as completed! 🎉');
      loadLearningMaterials();
    } catch (err) {
      console.error(err);
    }
  };

  const getSlides = (content?: string) => {
    if (!content) return [];
    const parts = content.split(/## Slide \d+:?|---/g).filter(s => s.trim().length > 0);
    return parts.length > 0 ? parts : [content];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PPT': return <Presentation size={18} color="#818cf8" />;
      case 'VIDEO': return <Video size={18} color="#f43f5e" />;
      case 'IMAGE': return <ImageIcon size={18} color="#10b981" />;
      default: return <FileText size={18} color="#38bdf8" />;
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Assigned Learning Hub</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Interactive slide decks, lecture tutorials, and personalized study guides tailored to your subjects.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          Loading your learning materials...
        </div>
      ) : assignments.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
          <BookOpen size={48} style={{ marginBottom: '12px' }} />
          <h3>No study materials assigned yet</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
            Your instructors will map course materials directly to your student cohort.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {assignments.map((asgn) => {
            const mat = asgn.material;
            const activity = asgn.activities?.[0];
            const isCompleted = activity?.isCompleted;

            return (
              <div
                key={asgn.id}
                className="glass-card glass-card-hover"
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {getTypeIcon(mat.type)}
                      <span className="badge badge-secondary">{mat.type}</span>
                    </div>
                    {isCompleted ? (
                      <span className="badge badge-success"><CheckCircle2 size={12} /> Completed</span>
                    ) : (
                      <span className="badge badge-primary">In Progress</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>{mat.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineClamp: 3, WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {mat.description || 'Structured study resource.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <button
                    onClick={() => openMaterialViewer(asgn)}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Eye size={14} /> Open Module
                  </button>
                  {!isCompleted && (
                    <button
                      onClick={() => markComplete(mat.id)}
                      className="btn btn-secondary btn-sm"
                      title="Mark Done"
                    >
                      <CheckCircle2 size={14} /> Done
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Viewer Modal */}
      {showViewer && activeMaterial && (
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
              <button onClick={() => setShowViewer(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto' }}>
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
                            position: 'relative',
                          }}
                        >
                          <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            Slide {currentSlide + 1} of {slides.length}
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '1.05rem' }}>
                            {currentSlideContent}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                          <button
                            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                            disabled={currentSlide === 0}
                            className="btn btn-secondary btn-sm"
                          >
                            <ChevronLeft size={16} /> Previous
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
                            Next <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {activeMaterial.content}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => {
                  markComplete(activeMaterial.id);
                  setShowViewer(false);
                }}
                className="btn btn-primary"
              >
                <CheckCircle2 size={16} /> Mark as Finished
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
