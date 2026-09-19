import React, { useState, useEffect } from 'react';
import { questionApi, academicApi } from '../services/api';
import { Question, Subject, Skill, Topic, QuestionType, Difficulty } from '../types';
import {
  HelpCircle,
  Plus,
  Sparkles,
  Search,
  Copy,
  Trash2,
  CheckCircle2,
  X,
  Code2,
  FileText,
  CheckSquare,
} from 'lucide-react';

export const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    questionText: '',
    questionType: 'MCQ' as QuestionType,
    difficulty: 'MEDIUM' as Difficulty,
    marks: 1,
    subjectId: '',
    skillId: '',
    topicId: '',
    explanation: '',
    correctAnswer: '',
    options: [
      { optionText: '', isCorrect: true },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
    ],
  });

  // AI Generator Form State
  const [aiForm, setAiForm] = useState({
    subjectId: '',
    topic: '',
    difficulty: 'MEDIUM',
    questionType: 'MCQ',
    count: 3,
  });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedList, setAiGeneratedList] = useState<any[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [selectedSubject, selectedType, selectedDifficulty]);

  const loadInitialData = async () => {
    try {
      const [subRes] = await Promise.all([
        academicApi.getSubjects(),
      ]);
      if (subRes.data?.data) {
        setSubjects(subRes.data.data);
        if (subRes.data.data.length > 0) {
          setForm(f => ({ ...f, subjectId: subRes.data.data[0].id }));
          setAiForm(f => ({ ...f, subjectId: subRes.data.data[0].id }));
          loadSkills(subRes.data.data[0].id);
        }
      }
      loadQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const loadSkills = async (subjectId: string) => {
    try {
      const res = await academicApi.getSkills(subjectId);
      if (res.data?.data) setSkills(res.data.data);
    } catch (err) { console.error(err); }
  };

  const loadTopics = async (skillId: string) => {
    try {
      const res = await academicApi.getTopics(skillId);
      if (res.data?.data) setTopics(res.data.data);
    } catch (err) { console.error(err); }
  };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedSubject) params.subjectId = selectedSubject;
      if (selectedType) params.questionType = selectedType;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (search) params.search = search;
      const res = await questionApi.getQuestions(params);
      if (res.data?.data?.questions) {
        setQuestions(res.data.data.questions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        questionText: form.questionText,
        questionType: form.questionType,
        difficulty: form.difficulty,
        marks: Number(form.marks),
        subjectId: form.subjectId,
        skillId: form.skillId || undefined,
        topicId: form.topicId || undefined,
        explanation: form.explanation || undefined,
      };

      if (form.questionType === 'MCQ') {
        payload.options = form.options.filter(o => o.optionText.trim() !== '');
      } else {
        payload.correctAnswer = form.correctAnswer;
      }

      await questionApi.createQuestion(payload);
      setShowCreateModal(false);
      loadQuestions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create question');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await questionApi.duplicateQuestion(id);
      loadQuestions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to duplicate question');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await questionApi.deleteQuestion(id);
      loadQuestions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete question');
    }
  };

  // AI Generator Trigger
  const handleAIGenerate = async () => {
    setAiGenerating(true);
    setAiGeneratedList([]);
    try {
      const sub = subjects.find(s => s.id === aiForm.subjectId);
      const res = await questionApi.generateAIQuestions({
        subject: sub?.name || 'General',
        topic: aiForm.topic || undefined,
        difficulty: aiForm.difficulty,
        questionType: aiForm.questionType,
        count: Number(aiForm.count),
      });
      if (res.data?.data) {
        setAiGeneratedList(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'AI Generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  // Save AI Generated Question into Question Bank
  const saveAIGeneratedQuestion = async (q: any) => {
    try {
      await questionApi.createQuestion({
        ...q,
        subjectId: aiForm.subjectId,
        isAIGenerated: true,
      });
      alert('Question saved to bank!');
      loadQuestions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save question');
    }
  };

  const getTypeBadge = (type: QuestionType) => {
    switch (type) {
      case 'MCQ': return <span className="badge badge-primary"><CheckSquare size={12} /> MCQ</span>;
      case 'TRUE_FALSE': return <span className="badge badge-info">T/F</span>;
      case 'PROGRAMMING': return <span className="badge badge-warning"><Code2 size={12} /> Code</span>;
      default: return <span className="badge badge-secondary"><FileText size={12} /> {type}</span>;
    }
  };

  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case 'EASY': return <span className="badge badge-success">Easy</span>;
      case 'MEDIUM': return <span className="badge badge-warning">Medium</span>;
      case 'HARD': return <span className="badge badge-danger">Hard</span>;
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Title & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Question Bank</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Comprehensive repository of assessment items across subjects and difficulty levels.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowAIModal(true)}
            className="btn btn-secondary"
            style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc' }}
          >
            <Sparkles size={16} />
            <span>AI Question Generator</span>
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Strip */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadQuestions()}
            placeholder="Search questions by text..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="form-select"
          style={{ width: 'auto', minWidth: '160px' }}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="form-select"
          style={{ width: 'auto', minWidth: '150px' }}
        >
          <option value="">All Types</option>
          <option value="MCQ">MCQ</option>
          <option value="TRUE_FALSE">True / False</option>
          <option value="FILL_BLANK">Fill in Blank</option>
          <option value="SHORT_ANSWER">Short Answer</option>
          <option value="PROGRAMMING">Programming</option>
          <option value="DESCRIPTIVE">Descriptive</option>
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="form-select"
          style={{ width: 'auto', minWidth: '140px' }}
        >
          <option value="">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        <button onClick={loadQuestions} className="btn btn-secondary">
          Filter
        </button>
      </div>

      {/* Question List Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Loading questions...
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <HelpCircle size={48} style={{ color: 'var(--text-dim)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No Questions Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
            Try adjusting your search criteria or create a new question manually or with AI.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {questions.map((q, idx) => (
            <div key={q.id} className="glass-card glass-card-hover" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)' }}>#{idx + 1}</span>
                    {getTypeBadge(q.questionType)}
                    {getDifficultyBadge(q.difficulty)}
                    <span className="badge badge-secondary">{q.subject?.name || 'General'}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Marks: {q.marks}</span>
                    {q.isAIGenerated && (
                      <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderColor: 'rgba(99,102,241,0.3)' }}>
                        <Sparkles size={10} /> AI Generated
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.02rem', fontWeight: 600, lineHeight: 1.4, marginBottom: '12px' }}>
                    {q.questionText}
                  </h3>

                  {/* MCQ Options Display */}
                  {q.questionType === 'MCQ' && q.options && q.options.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={opt.id || oIdx}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: opt.isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${opt.isCorrect ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                            fontSize: '0.84rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          {opt.isCorrect && <CheckCircle2 size={14} color="#10b981" />}
                          <span style={{ color: opt.isCorrect ? '#34d399' : 'var(--text-muted)' }}>
                            {opt.optionText}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Non-MCQ Correct Answer / Explanation */}
                  {q.questionType !== 'MCQ' && q.correctAnswer && (
                    <div style={{ fontSize: '0.82rem', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Expected Answer / Sample: </span>
                      <span style={{ color: 'var(--text-main)', fontFamily: q.questionType === 'PROGRAMMING' ? 'var(--font-mono)' : 'inherit' }}>{q.correctAnswer}</span>
                    </div>
                  )}

                  {q.explanation && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      💡 Explanation: {q.explanation}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleDuplicate(q.id)}
                    className="btn btn-ghost btn-sm"
                    title="Duplicate Question"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#f87171' }}
                    title="Delete Question"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==========================================================================
          CREATE QUESTION MODAL
          ========================================================================== */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card animate-slide">
            <div className="modal-header">
              <h2 className="modal-title">Create New Question</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateQuestion}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Question Text *</label>
                  <textarea
                    rows={3}
                    required
                    value={form.questionText}
                    onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                    placeholder="Enter the question problem statement..."
                    className="form-textarea"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Subject *</label>
                    <select
                      value={form.subjectId}
                      onChange={(e) => {
                        setForm({ ...form, subjectId: e.target.value });
                        loadSkills(e.target.value);
                      }}
                      className="form-select"
                      required
                    >
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select
                      value={form.questionType}
                      onChange={(e) => setForm({ ...form, questionType: e.target.value as QuestionType })}
                      className="form-select"
                    >
                      <option value="MCQ">MCQ</option>
                      <option value="TRUE_FALSE">True / False</option>
                      <option value="FILL_BLANK">Fill in Blank</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                      <option value="PROGRAMMING">Programming</option>
                      <option value="DESCRIPTIVE">Descriptive</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Difficulty</label>
                    <select
                      value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}
                      className="form-select"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Marks</label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={form.marks}
                      onChange={(e) => setForm({ ...form, marks: parseFloat(e.target.value) || 1 })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Skill (Optional)</label>
                    <select
                      value={form.skillId}
                      onChange={(e) => {
                        setForm({ ...form, skillId: e.target.value });
                        loadTopics(e.target.value);
                      }}
                      className="form-select"
                    >
                      <option value="">Select Skill</option>
                      {skills.map(sk => <option key={sk.id} value={sk.id}>{sk.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* MCQ Options Config */}
                {form.questionType === 'MCQ' ? (
                  <div>
                    <label className="form-label" style={{ marginBottom: '8px' }}>Options & Correct Answer</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {form.options.map((opt, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="radio"
                            name="correctOption"
                            checked={opt.isCorrect}
                            onChange={() => {
                              const nextOpts = form.options.map((o, i) => ({ ...o, isCorrect: i === idx }));
                              setForm({ ...form, options: nextOpts });
                            }}
                          />
                          <input
                            type="text"
                            value={opt.optionText}
                            onChange={(e) => {
                              const nextOpts = [...form.options];
                              nextOpts[idx].optionText = e.target.value;
                              setForm({ ...form, options: nextOpts });
                            }}
                            placeholder={`Option ${idx + 1}`}
                            className="form-input"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Correct Answer / Model Response</label>
                    <textarea
                      rows={2}
                      value={form.correctAnswer}
                      onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                      placeholder="Enter expected answer or grading benchmark..."
                      className="form-textarea"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Explanation</label>
                  <textarea
                    rows={2}
                    value={form.explanation}
                    onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                    placeholder="Explanation shown to students after evaluation..."
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
          AI QUESTION GENERATOR MODAL
          ========================================================================== */}
      {showAIModal && (
        <div className="modal-backdrop">
          <div className="modal-card animate-slide" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="#818cf8" />
                <h2 className="modal-title">AI Question Generator</h2>
              </div>
              <button onClick={() => setShowAIModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
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
                  <label className="form-label">Specific Topic / Keyword</label>
                  <input
                    type="text"
                    value={aiForm.topic}
                    onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                    placeholder="e.g. Recursion, Asynchronous JS, SQL Joins"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    value={aiForm.questionType}
                    onChange={(e) => setAiForm({ ...aiForm, questionType: e.target.value })}
                    className="form-select"
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="TRUE_FALSE">True/False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="PROGRAMMING">Programming</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select
                    value={aiForm.difficulty}
                    onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}
                    className="form-select"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Count</label>
                  <select
                    value={aiForm.count}
                    onChange={(e) => setAiForm({ ...aiForm, count: Number(e.target.value) })}
                    className="form-select"
                  >
                    <option value="1">1 Question</option>
                    <option value="3">3 Questions</option>
                    <option value="5">5 Questions</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleAIGenerate}
                disabled={aiGenerating}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <Sparkles size={16} />
                <span>{aiGenerating ? 'AI Generating Questions...' : 'Generate Questions'}</span>
              </button>

              {/* Generated Result List */}
              {aiGeneratedList.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Generated Preview</h4>
                  {aiGeneratedList.map((gq, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>{gq.questionText}</div>
                          {gq.options && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '0.8rem' }}>
                              {gq.options.map((o: any, i: number) => (
                                <div key={i} style={{ color: o.isCorrect ? '#34d399' : 'var(--text-muted)' }}>
                                  • {o.optionText} {o.isCorrect ? '✓' : ''}
                                </div>
                              ))}
                            </div>
                          )}
                          {gq.explanation && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                              💡 {gq.explanation}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => saveAIGeneratedQuestion(gq)}
                          className="btn btn-secondary btn-sm"
                          style={{ flexShrink: 0 }}
                        >
                          <Plus size={14} /> Add to Bank
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
