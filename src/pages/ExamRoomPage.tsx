import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testApi } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Award,
  BookOpen,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';

export const ExamRoomPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answers map: questionId -> { selectedOptionId, answer, isMarkedForReview }
  const [answers, setAnswers] = useState<Record<string, { selectedOptionId?: string; answer?: string; isMarkedForReview?: boolean }>>({});
  const [timeLeft, setTimeLeft] = useState<number>(1800); // seconds
  const [isUrgent, setIsUrgent] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (testId) {
      startAssessment();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testId]);

  const startAssessment = async () => {
    setLoading(true);
    try {
      const res = await testApi.startTest(testId!);
      const data = res.data?.data;
      if (data) {
        setTest(data.test);
        setQuestions(data.questions || []);

        // Rehydrate existing answers
        const ansMap: Record<string, any> = {};
        if (data.submission?.answers) {
          data.submission.answers.forEach((a: any) => {
            ansMap[a.questionId] = {
              selectedOptionId: a.selectedOptionId,
              answer: a.answer,
              isMarkedForReview: a.isMarkedForReview,
            };
          });
        }
        setAnswers(ansMap);

        // Compute time remaining
        const durationSec = (data.test.duration || 30) * 60;
        const started = new Date(data.submission.startedAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - started) / 1000);
        const remaining = Math.max(durationSec - elapsed, 10);
        setTimeLeft(remaining);

        // Start countdown
        startTimer(remaining);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start test');
      navigate('/student/assessments');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (seconds: number) => {
    let current = seconds;
    timerRef.current = setInterval(() => {
      current -= 1;
      setTimeLeft(current);
      if (current <= 300) setIsUrgent(true);
      if (current <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleSubmitTest(true);
      }
    }, 1000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Answer handler
  const handleSelectOption = async (optionId: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const nextState = {
      ...answers,
      [currentQ.id]: {
        ...answers[currentQ.id],
        selectedOptionId: optionId,
      },
    };
    setAnswers(nextState);

    // Auto save
    testApi.saveAnswer(testId!, {
      questionId: currentQ.id,
      selectedOptionId: optionId,
    }).catch(() => {});
  };

  const handleTextAnswerChange = (val: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        answer: val,
      },
    }));
  };

  const handleTextAnswerBlur = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const ans = answers[currentQ.id];
    if (ans?.answer !== undefined) {
      testApi.saveAnswer(testId!, {
        questionId: currentQ.id,
        answer: ans.answer,
      }).catch(() => {});
    }
  };

  const toggleMarkForReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const currentMark = !!answers[currentQ.id]?.isMarkedForReview;
    const nextState = {
      ...answers,
      [currentQ.id]: {
        ...answers[currentQ.id],
        isMarkedForReview: !currentMark,
      },
    };
    setAnswers(nextState);

    testApi.saveAnswer(testId!, {
      questionId: currentQ.id,
      isMarkedForReview: !currentMark,
    }).catch(() => {});
  };

  const clearResponse = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });

    testApi.saveAnswer(testId!, {
      questionId: currentQ.id,
      selectedOptionId: null,
      answer: null,
      isMarkedForReview: false,
    }).catch(() => {});
  };

  // Submit test
  const handleSubmitTest = async (auto = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const res = await testApi.submitTest(testId!);
      setShowSubmitModal(false);
      if (res.data?.data) {
        setResult(res.data.data);
        // Fire confetti on completion!
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute stats for palette & submit modal
  const answeredCount = Object.values(answers).filter(a => a.selectedOptionId || a.answer?.trim()).length;
  const reviewCount = Object.values(answers).filter(a => a.isMarkedForReview).length;
  const totalCount = questions.length;
  const unansweredCount = totalCount - answeredCount;

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '42px', height: '42px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Preparing secure examination environment...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RESULT SCREEN AFTER SUBMISSION
  // ============================================
  if (result) {
    const resData = result.result;
    const isPass = resData?.isPassed ?? (resData?.percentage >= 50);

    return (
      <div className="exam-container" style={{ padding: '40px 24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div className="glass-card animate-slide" style={{ padding: '36px', textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: isPass ? 'var(--success-bg)' : 'var(--danger-bg)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Award size={40} color={isPass ? 'var(--success)' : 'var(--danger)'} />
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
            {isPass ? 'Congratulations! You Passed! 🎉' : 'Assessment Completed'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '24px' }}>
            {test?.title} • {test?.subject?.name || 'General'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '600px', margin: '0 auto 30px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Score Percentage</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: isPass ? 'var(--success)' : 'var(--danger)' }}>
                {resData?.percentage || 0}%
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Marks Obtained</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                {resData?.obtainedMarks || 0} / {resData?.totalMarks || 0}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Passing Status</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isPass ? 'var(--success)' : 'var(--danger)', marginTop: '6px' }}>
                {isPass ? 'PASSED' : 'RETAKE SUGGESTED'}
              </div>
            </div>
          </div>

          <button onClick={() => navigate('/student/assessments')} className="btn btn-primary">
            <ArrowLeft size={16} /> Return to Assessments
          </button>
        </div>

        {/* Detailed Solutions & Explanations Review */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Performance & Answer Solutions</h2>

          {result.submission?.answers?.map((ans: any, idx: number) => {
            const q = ans.question;
            const isCorrect = ans.isCorrect;
            return (
              <div
                key={ans.id || idx}
                className="glass-card"
                style={{
                  borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}`,
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Question {idx + 1} ({q.marks} Marks)
                  </div>
                  <span className={`badge ${isCorrect ? 'badge-success' : 'badge-danger'}`}>
                    {isCorrect ? 'Correct (+ ' + (ans.marksObtained ?? q.marks) + ')' : 'Incorrect (0)'}
                  </span>
                </div>

                <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px' }}>
                  {q.questionText}
                </div>

                {/* Show options with student selection vs correct selection */}
                {q.questionType === 'MCQ' && q.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {q.options.map((opt: any) => {
                      const isStudentChoice = opt.id === ans.selectedOptionId;
                      const isOptionCorrect = opt.isCorrect;
                      let bg = 'rgba(255,255,255,0.02)';
                      let border = 'var(--border)';

                      if (isOptionCorrect) {
                        bg = 'rgba(16,185,129,0.1)';
                        border = 'var(--success)';
                      } else if (isStudentChoice && !isOptionCorrect) {
                        bg = 'rgba(239,68,68,0.1)';
                        border = 'var(--danger)';
                      }

                      return (
                        <div
                          key={opt.id}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            background: bg,
                            border: `1px solid ${border}`,
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{opt.optionText}</span>
                          <div style={{ display: 'flex', gap: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                            {isStudentChoice && <span style={{ color: isOptionCorrect ? '#34d399' : '#f87171' }}>(Your Choice)</span>}
                            {isOptionCorrect && <span style={{ color: '#34d399' }}>✓ Correct Answer</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.explanation && (
                  <div style={{ background: 'rgba(99,102,241,0.06)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem', color: '#c7d2fe', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================
  // ACTIVE EXAMINATION INTERFACE
  // ============================================
  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;

  return (
    <div className="exam-container">
      {/* Top Header */}
      <header className="exam-topbar">
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{test?.title}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Subject: {test?.subject?.name || 'General'} • Total Marks: {test?.totalMarks}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className={`exam-timer ${isUrgent ? 'urgent' : ''}`}>
            <Clock size={18} />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button onClick={() => setShowSubmitModal(true)} className="btn btn-primary btn-sm">
            <Send size={15} /> Finish & Submit
          </button>
        </div>
      </header>

      {/* Exam Body Layout */}
      <div className="exam-body">
        {/* Main Question Workspace */}
        <div className="exam-question-area">
          {currentQuestion ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div>
                {/* Question Info Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span className="badge badge-secondary">{currentQuestion.questionType}</span>
                    <span className="badge badge-secondary">{currentQuestion.marks} Mark{currentQuestion.marks > 1 ? 's' : ''}</span>
                  </div>

                  <button
                    onClick={toggleMarkForReview}
                    className="btn btn-ghost btn-sm"
                    style={{ color: currentAnswer?.isMarkedForReview ? '#fbbf24' : 'var(--text-dim)' }}
                  >
                    <Bookmark size={16} fill={currentAnswer?.isMarkedForReview ? '#fbbf24' : 'none'} />
                    <span>{currentAnswer?.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
                  </button>
                </div>

                {/* Question Statement */}
                <div style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.5, marginBottom: '28px' }}>
                  {currentQuestion.questionText}
                </div>

                {/* Option Choice Section */}
                {currentQuestion.questionType === 'MCQ' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {currentQuestion.options?.map((opt: any) => {
                      const isSelected = currentAnswer?.selectedOptionId === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleSelectOption(opt.id)}
                          className={`option-card ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="option-radio" />
                          <span style={{ fontSize: '0.95rem' }}>{opt.optionText}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Programming Question Workspace */}
                {currentQuestion.questionType === 'PROGRAMMING' && (
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Write your code solution below:
                    </div>
                    <textarea
                      rows={12}
                      value={currentAnswer?.answer || ''}
                      onChange={(e) => handleTextAnswerChange(e.target.value)}
                      onBlur={handleTextAnswerBlur}
                      placeholder="// Type your implementation here..."
                      className="form-textarea"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: 1.5 }}
                    />
                  </div>
                )}

                {/* Descriptive / Text Question */}
                {currentQuestion.questionType !== 'MCQ' && currentQuestion.questionType !== 'PROGRAMMING' && (
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Your Answer:
                    </div>
                    <textarea
                      rows={6}
                      value={currentAnswer?.answer || ''}
                      onChange={(e) => handleTextAnswerChange(e.target.value)}
                      onBlur={handleTextAnswerBlur}
                      placeholder="Type your answer clearly..."
                      className="form-textarea"
                    />
                  </div>
                )}
              </div>

              {/* Bottom Nav Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className="btn btn-secondary"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <button
                    onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                    disabled={currentIndex === questions.length - 1}
                    className="btn btn-secondary"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={clearResponse} className="btn btn-ghost btn-sm">
                    <RotateCcw size={14} /> Clear Selection
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>No question selected</div>
          )}
        </div>

        {/* Right Sidebar Question Palette */}
        <aside className="exam-sidebar">
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Question Palette</h3>
            
            {/* Status Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--success)' }} />
                <span>Answered ({answeredCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--warning)' }} />
                <span>Review ({reviewCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)' }} />
                <span>Unvisited ({unansweredCount})</span>
              </div>
            </div>

            {/* Grid Palette */}
            <div className="question-palette">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isAnswered = ans?.selectedOptionId || ans?.answer?.trim();
                const isReview = ans?.isMarkedForReview;
                const isActive = idx === currentIndex;

                let statusClass = 'unvisited';
                if (isReview) statusClass = 'review';
                else if (isAnswered) statusClass = 'answered';

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`palette-btn ${statusClass} ${isActive ? 'active' : ''}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              <Send size={16} /> Submit Assessment
            </button>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="modal-backdrop">
          <div className="modal-card animate-slide" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Ready to Submit?</h2>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Please review your progress before final evaluation. Once submitted, you cannot modify your answers.
              </p>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Questions:</span>
                  <strong>{totalCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                  <span>Answered Questions:</span>
                  <strong>{answeredCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)' }}>
                  <span>Marked for Review:</span>
                  <strong>{reviewCount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: unansweredCount > 0 ? 'var(--danger)' : 'var(--text-dim)' }}>
                  <span>Unanswered Questions:</span>
                  <strong>{unansweredCount}</strong>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '0.8rem', marginTop: '12px' }}>
                  <AlertTriangle size={16} />
                  <span>You still have {unansweredCount} unanswered questions!</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
                className="btn btn-secondary"
              >
                Continue Exam
              </button>
              <button
                disabled={submitting}
                onClick={() => handleSubmitTest(false)}
                className="btn btn-primary"
              >
                {submitting ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
