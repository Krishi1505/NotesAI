
import React, { useState, useEffect } from 'react';
import { NoteSession, ChatMessage } from '@/entities/all';
import { InvokeLLM } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';

import SessionsList from '../components/history/SessionsList';
import ChatInterface from '../components/chat/ChatInterface';
import ExtractedTextDisplay from '../components/upload/ExtractedTextDisplay';

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const allSessions = await NoteSession.list('-created_date');
      setSessions(allSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const handleSelectSession = async (session) => {
    setSelectedSession(session);

    // Load messages for this session
    const sessionMessages = await ChatMessage.filter(
      { session_id: session.id },
      'created_date'
    );
    setMessages(sessionMessages);
  };

  const handleSendMessage = async (message, isRegeneration = false) => {
    if (!selectedSession || !selectedSession.extracted_text) return;

    setIsChatLoading(true);

    try {
      // Add user message
      if (!isRegeneration) {
        const userMessage = await ChatMessage.create({
          session_id: selectedSession.id,
          message,
          message_type: 'user',
          voice_input: false
        });
        setMessages(prev => [...prev, userMessage]);
      }

      // Generate AI response
      const response = await InvokeLLM({
        prompt: `Based on the following extracted text from handwritten notes, please answer the user's question comprehensively:

EXTRACTED NOTES:
${selectedSession.extracted_text}

USER QUESTION:
${message}

Please provide a helpful, detailed answer based on the content of the notes. If the question cannot be answered from the notes, please say so clearly.`,
        response_json_schema: {
          type: "object",
          properties: {
            answer: {
              type: "string",
              description: "The AI's response to the user's question"
            },
            context_used: {
              type: "string",
              description: "Relevant excerpt from the notes that was used to answer"
            }
          }
        }
      });

      // Add AI response
      const aiMessage = await ChatMessage.create({
        session_id: selectedSession.id,
        message: response.answer,
        message_type: 'assistant',
        context_used: response.context_used
      });

      if (isRegeneration) {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastAiMessageIndex = newMessages.map(m => m.message_type).lastIndexOf('assistant');
          if (lastAiMessageIndex !== -1) {
            newMessages[lastAiMessageIndex] = aiMessage;
          }
          return newMessages;
        });
      } else {
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Session History</h1>
            <p className="text-gray-600">Review and continue previous conversations</p>
          </div>
          {selectedSession && (
            <Button
              variant="outline"
              onClick={() => setSelectedSession(null)}
              className="text-gray-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Button>
          )}
        </div>
      </div>

      {!selectedSession ? (
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card className="premium-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Find Sessions</span>
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
                    {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sessions List */}
          <SessionsList
            sessions={filteredSessions}
            onSelectSession={handleSelectSession}
            selectedSessionId={null}
          />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Session Details */}
          <div className="space-y-6">
            <Card className="premium-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-gray-600" />
                    <div>
                      <CardTitle>{selectedSession.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedSession.original_filename}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {selectedSession.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">Created:</span>
                      <p className="text-gray-600">
                        {format(new Date(selectedSession.created_date), 'PPP')}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Messages:</span>
                      <p className="text-gray-600">{messages.length} total</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedSession.extracted_text && (
              <ExtractedTextDisplay
                text={selectedSession.extracted_text}
                onTextUpdate={() => {}} // Read-only in history
                summary={selectedSession.text_summary}
                voiceSummaryUrl={selectedSession.voice_summary_url}
                isGeneratingSummary={false}
                isGeneratingVoice={false}
              />
            )}
          </div>

          {/* Right Panel - Chat */}
          <div className="space-y-6">
            <div className="h-[600px] border rounded-lg overflow-hidden">
              <ChatInterface
                sessionId={selectedSession.id}
                sessionTitle={selectedSession.title}
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
