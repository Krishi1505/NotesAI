
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain,
  CheckCircle,
  XCircle,
  RotateCcw,
  Download,
  Award
} from 'lucide-react';

export default function QuizDisplay({ quiz, onRestart }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerSelect = (questionIndex, answer) => {
    if (showResults) return;
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const submitQuiz = () => {
    let correctCount = 0;
    quiz.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correct_answer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setShowResults(true);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    if (onRestart) onRestart();
  };

  const downloadResults = () => {
    const results = quiz.questions.map((q, index) => ({
      question: q.question,
      yourAnswer: selectedAnswers[index] || 'Not answered',
      correctAnswer: q.correct_answer,
      isCorrect: selectedAnswers[index] === q.correct_answer,
      explanation: q.explanation
    }));

    const content = `Quiz Results: ${quiz.title}\n\nScore: ${score}/${quiz.questions.length} (${Math.round(score/quiz.questions.length*100)}%)\n\n${results.map((r, i) => 
      `Question ${i+1}: ${r.question}\nYour Answer: ${r.yourAnswer}\nCorrect Answer: ${r.correctAnswer}\n${r.isCorrect ? '✓ Correct' : '✗ Incorrect'}\nExplanation: ${r.explanation}\n\n`
    ).join('')}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-results-${quiz.title.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'medium': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'hard': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <Card className="premium-shadow">
        <CardContent className="p-8 text-center">
          <Brain className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No quiz available yet. Generate one from your extracted notes!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="premium-shadow">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{quiz.title}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className={getDifficultyColor(quiz.difficulty)}>
                  {quiz.difficulty?.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-600">
                  {quiz.questions.length} Questions
                </span>
              </div>
            </div>
          </div>
          
          {showResults && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadResults}
              >
                <Download className="w-4 h-4 mr-1" />
                Download Results
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={restartQuiz}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Restart Quiz
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {showResults ? (
          <div className="space-y-6">
            {/* Score Summary */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Award className="w-10 h-10 text-gray-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Quiz Complete!</h3>
                <p className="text-lg text-gray-600 mt-1">
                  You scored <span className="font-bold text-gray-900">{score}</span> out of <span className="font-bold">{quiz.questions.length}</span>
                </p>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {Math.round(score/quiz.questions.length*100)}%
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Detailed Results:</h4>
              {quiz.questions.map((question, index) => {
                const userAnswer = selectedAnswers[index];
                const isCorrect = userAnswer === question.correct_answer;
                
                return (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-gray-900 flex-1">
                        {index + 1}. {question.question}
                      </p>
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500 ml-2 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 ml-2 flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Your answer: </span>
                        <span className={isCorrect ? 'text-gray-800' : 'text-red-600'}>
                          {userAnswer || 'Not answered'}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div>
                          <span className="font-medium">Correct answer: </span>
                          <span className="text-gray-800">{question.correct_answer}</span>
                        </div>
                      )}
                      {question.explanation && (
                        <div className="bg-gray-50 rounded p-2 mt-2">
                          <span className="font-medium">Explanation: </span>
                          <span className="text-gray-700">{question.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Current Question */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {quiz.questions[currentQuestion]?.question}
              </h3>
              
              <div className="space-y-3">
                {quiz.questions[currentQuestion]?.options?.map((option, optionIndex) => (
                  <button
                    key={optionIndex}
                    onClick={() => handleAnswerSelect(currentQuestion, option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedAnswers[currentQuestion] === option
                        ? 'border-gray-900 bg-gray-100 text-gray-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswers[currentQuestion] === option
                          ? 'border-gray-900 bg-gray-900'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswers[currentQuestion] === option && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              
              {currentQuestion === quiz.questions.length - 1 ? (
                <Button
                  onClick={submitQuiz}
                  disabled={Object.keys(selectedAnswers).length !== quiz.questions.length}
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestion(Math.min(quiz.questions.length - 1, currentQuestion + 1))}
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
