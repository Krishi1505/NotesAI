
import React, { useState, useEffect } from 'react';
import { NoteSession, Quiz } from '@/entities/all';
import { InvokeLLM } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BrainCircuit, Sparkles, Loader2, ArrowLeft, FileText } from 'lucide-react';
import SessionsList from '../components/history/SessionsList';
import QuizDisplay from '../components/quiz/QuizDisplay';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function QuizPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const allSessions = await NoteSession.filter({ status: 'ready' }, '-created_date');
      setSessions(allSessions);
    } catch (err) {
      setError(`Error loading sessions: ${err.message}`);
    }
  };

  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    setError(null);
    // Check if a quiz already exists for this session
    const quizzes = await Quiz.filter({ session_id: session.id }, '-created_date', 1);
    if (quizzes.length > 0) {
      setCurrentQuiz(quizzes[0]);
    } else {
      setCurrentQuiz(null);
    }
  };
  
  const generateQuiz = async () => {
    if (!selectedSession || !selectedSession.extracted_text) return;
    
    setIsGeneratingQuiz(true);
    setError(null);
    try {
      const response = await InvokeLLM({
        prompt: `Based on the following extracted text from handwritten notes, create a comprehensive quiz with multiple choice questions. Make the questions test understanding of key concepts and details:

EXTRACTED NOTES:
${selectedSession.extracted_text}

Create 5-8 multiple choice questions with 4 options each. Include explanations for the correct answers. The difficulty should be medium.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "A short, relevant title for the quiz based on the notes content"
            },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 4,
                    maxItems: 4
                  },
                  correct_answer: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      const quiz = await Quiz.create({
        session_id: selectedSession.id,
        title: response.title,
        questions: response.questions,
        difficulty: 'medium'
      });
      
      setCurrentQuiz(quiz);
    } catch (err) {
      setError(`Error generating quiz: ${err.message}`);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    if (selectedSession) {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <CardTitle>Selected Session</CardTitle>
                  </div>
                  <p className="text-gray-600">{selectedSession.title}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setSelectedSession(null);
                  setCurrentQuiz(null);
                }}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Change Session
                </Button>
              </div>
            </CardHeader>
            {
              !currentQuiz && !isGeneratingQuiz && (
                <CardContent className="text-center">
                  <p className="mb-4 text-gray-700">Ready to generate a quiz from this session's notes.</p>
                  <Button onClick={generateQuiz}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Quiz Now
                  </Button>
                </CardContent>
              )
            }
          </Card>

          {isGeneratingQuiz && (
            <Card className="text-center p-8">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-500 mb-4" />
              <p className="text-gray-600">AI is generating your quiz, please wait...</p>
            </Card>
          )}

          {currentQuiz && (
            <QuizDisplay quiz={currentQuiz} onRestart={generateQuiz} />
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card className="premium-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Find a Session to Quiz</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by title or filename..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} available
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <SessionsList 
          sessions={filteredSessions}
          onSelectSession={handleSelectSession}
          selectedSessionId={null}
        />
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <BrainCircuit className="w-8 h-8 mr-3" />
          AI Quiz Generator
        </h1>
        <p className="text-gray-600">Test your knowledge. Select a note session to generate a quiz.</p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {renderContent()}
    </div>
  );
}
