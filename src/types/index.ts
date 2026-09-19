export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatar?: string;
  phone?: string;
  lastLoginAt?: string;
  student?: {
    id: string;
    enrollmentNo: string;
    departmentId: string;
    department?: { id: string; name: string; code: string };
    batchId: string;
    batch?: { id: string; name: string; year: number };
    semester?: number;
  };
  admin?: {
    id: string;
    designation?: string;
  };
}

export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANK' | 'SHORT_ANSWER' | 'PROGRAMMING' | 'DESCRIPTIVE';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type TestStatus = 'DRAFT' | 'PUBLISHED' | 'ASSIGNED' | 'STARTED' | 'SUBMITTED' | 'EVALUATED' | 'COMPLETED' | 'EXPIRED';
export type SubmissionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'EVALUATED';
export type MaterialType = 'PPT' | 'VIDEO' | 'IMAGE' | 'DOCUMENT' | 'OTHER';

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface Batch {
  id: string;
  name: string;
  year: number;
  isActive: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface Skill {
  id: string;
  name: string;
  subjectId: string;
  subject?: Subject;
  description?: string;
}

export interface Topic {
  id: string;
  name: string;
  skillId: string;
  skill?: Skill;
  description?: string;
}

export interface QuestionOption {
  id?: string;
  optionText: string;
  isCorrect: boolean;
  sortOrder?: number;
}

export interface Question {
  id: string;
  questionText: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  marks: number;
  timeInSeconds?: number;
  explanation?: string;
  correctAnswer?: string;
  subjectId: string;
  subject?: Subject;
  skillId?: string;
  skill?: Skill;
  topicId?: string;
  topic?: Topic;
  options?: QuestionOption[];
  isAIGenerated: boolean;
  createdAt: string;
}

export interface TestQuestion {
  id: string;
  testId: string;
  questionId: string;
  question: Question;
  sortOrder: number;
  marks?: number;
}

export interface Test {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  subjectId: string;
  subject?: Subject;
  skillId?: string;
  skill?: Skill;
  topicId?: string;
  topic?: Topic;
  totalMarks: number;
  duration: number; // minutes
  startDate?: string;
  endDate?: string;
  maxAttempts: number;
  status: TestStatus;
  passingScore?: number;
  shuffleQuestions: boolean;
  showResult: boolean;
  testQuestions?: TestQuestion[];
  assignments?: TestAssignment[];
  _count?: { testQuestions: number; assignments: number };
  createdAt: string;
}

export interface TestAssignment {
  id: string;
  testId: string;
  test: Test;
  studentId: string;
  student?: {
    id: string;
    enrollmentNo: string;
    user: { firstName: string; lastName: string; email: string };
  };
  assignedAt: string;
  status: SubmissionStatus;
  attemptCount: number;
  submissions?: TestSubmission[];
}

export interface StudentAnswer {
  id: string;
  questionId: string;
  question?: Question;
  answer?: string;
  selectedOptionId?: string;
  isCorrect?: boolean;
  marksObtained?: number;
  isMarkedForReview: boolean;
  timeSpent?: number;
}

export interface TestSubmission {
  id: string;
  assignmentId: string;
  assignment?: TestAssignment;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  timeSpent?: number;
  status: SubmissionStatus;
  answers: StudentAnswer[];
  result?: TestResult;
}

export interface TestResult {
  id: string;
  submissionId: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  isPassed: boolean;
  feedback?: string;
  evaluatedAt?: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  description?: string;
  type: MaterialType;
  subjectId: string;
  subject?: Subject;
  skillId?: string;
  skill?: Skill;
  topicId?: string;
  topic?: Topic;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  metadata?: any;
  isAIGenerated: boolean;
  createdAt: string;
  assignments?: Array<{
    id: string;
    studentId: string;
    student?: { enrollmentNo: string; user: { firstName: string; lastName: string } };
  }>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  link?: string;
  createdAt: string;
}
