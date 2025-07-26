import React, { useState, useEffect } from 'react';
import { NoteSession, ChatMessage } from '@/entities/all';
import { UploadFile, ExtractDataFromUploadedFile, InvokeLLM } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Sparkles } from 'lucide-react';

import FileUploadZone from '../components/upload/FileUploadZone';
import ExtractedTextDisplay from '../components/upload/ExtractedTextDisplay';
import ChatInterface from '../components/chat/ChatInterface';

export default function Dashboard() {
  const [currentSession, setCurrentSession] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [summary, setSummary] = useState('');
  const [voiceSummaryUrl, setVoiceSummaryUrl] = useState('');
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (file) => {
    setError(null);
    setIsProcessing(true);
    setMessages([]);
    setSummary('');
    setVoiceSummaryUrl('');
    setExtractedText('');
    setCurrentSession(null);
    
    try {
      // Create new session
      const session = await NoteSession.create({
        title: file.name.replace(/\.[^/.]+$/, ''),
        original_filename: file.name,
        status: 'processing'
      });
      
      setCurrentSession(session);
      
      // Upload file
      const { file_url } = await UploadFile({ file });
      
      // Extract text using AI OCR
      const extractionResult = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            extracted_text: {
              type: "string",
              description: "All text content extracted from the handwritten notes"
            }
          }
        }
      });
      
      if (extractionResult.status === 'success' && extractionResult.output?.extracted_text) {
        const text = extractionResult.output.extracted_text;
        setExtractedText(text);
        
        // Update session with extracted text
        await NoteSession.update(session.id, {
          file_url,
          extracted_text: text,
          status: 'ready'
        });
        
        setCurrentSession(prev => ({ ...prev, file_url, extracted_text: text, status: 'ready' }));
      } else {
        throw new Error('Failed to extract text from the uploaded file');
      }
    } catch (err) {
      setError(`Error processing file: ${err.message}`);
      if (currentSession) {
        await NoteSession.update(currentSession.id, { status: 'error' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextUpdate = async (newText) => {
    setExtractedText(newText);
    if (currentSession) {
      await NoteSession.update(currentSession.id, { extracted_text: newText });
    }
  };

  const generateSummary = async () => {
    if (!extractedText) return;
    
    setIsGeneratingSummary(true);
    try {
      const response = await InvokeLLM({
        prompt: `Please create a comprehensive summary of the following handwritten notes. Make it well-structured with key points and important details:\n\n${extractedText}`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "A comprehensive summary of the notes"
            }
          }
        }
      });
      
      const summaryText = response.summary;
      setSummary(summaryText);
      
      if (currentSession) {
        await NoteSession.update(currentSession.id, { text_summary: summaryText });
      }
    } catch (err) {
      setError(`Error generating summary: ${err.message}`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const generateVoiceSummary = async () => {
    if (!summary) return;
    
    setIsGeneratingVoice(true);
    try {
      // For demo purposes, we'll simulate voice generation
      // In a real app, you'd integrate with a text-to-speech service
      const response = await InvokeLLM({
        prompt: `Convert this summary to a natural, conversational audio script suitable for text-to-speech: ${summary}`
      });
      
      // Simulate audio URL (in production, you'd use actual TTS service)
      const mockAudioUrl = `data:audio/mp3;base64,${btoa('mock-audio-data')}`;
      setVoiceSummaryUrl(mockAudioUrl);
      
      if (currentSession) {
        await NoteSession.update(currentSession.id, { voice_summary_url: mockAudioUrl });
      }
    } catch (err) {
      setError(`Error generating voice summary: ${err.message}`);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  const handleSendMessage = async (message, isRegeneration = false) => {
    if (!extractedText || !currentSession) return;
    
    setIsChatLoading(true);
    
    try {
      // Add user message
      if (!isRegeneration) {
        const userMessage = await ChatMessage.create({
          session_id: currentSession.id,
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
${extractedText}

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
        session_id: currentSession.id,
        message: response.answer,
        message_type: 'assistant',
        context_used: response.context_used
      });
      
      if (isRegeneration) {
        // Replace the last AI message
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
      setError(`Error sending message: ${err.message}`);
    } finally {
      setIsChatLoading(false);
    }
  };
  
  // Load messages when session changes
  useEffect(() => {
    if (currentSession) {
      const loadMessages = async () => {
        const sessionMessages = await ChatMessage.filter(
          { session_id: currentSession.id },
          'created_date'
        );
        setMessages(sessionMessages);
      };
      loadMessages();
    }
  }, [currentSession?.id]);

  return (
    <div className="h-[calc(100vh-4rem)]">
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-2 gap-0 h-full">
        {/* Left Panel - Upload & Text */}
        <div className="flex flex-col space-y-6 p-6 overflow-y-auto border-r bg-white">
          {!currentSession && (
            <div className="flex-grow flex items-center justify-center">
              <FileUploadZone 
                onFileSelect={handleFileUpload}
                isProcessing={isProcessing}
              />
            </div>
          )}
          
          {extractedText && (
            <ExtractedTextDisplay
              text={extractedText}
              onTextUpdate={handleTextUpdate}
              onGenerateSummary={generateSummary}
              summary={summary}
              voiceSummaryUrl={voiceSummaryUrl}
              isGeneratingSummary={isGeneratingSummary}
              onGenerateVoiceSummary={generateVoiceSummary}
              isGeneratingVoice={isGeneratingVoice}
            />
          )}
        </div>

        {/* Right Panel - Chat */}
        <div className="flex flex-col h-full bg-gray-50">
          {currentSession && extractedText ? (
            <ChatInterface
              sessionId={currentSession.id}
              sessionTitle={currentSession.title}
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
            />
          ) : (
            <Card className="h-full rounded-none border-none bg-gray-50">
              <CardContent className="h-full flex items-center justify-center text-center p-8">
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Your AI Assistant is Ready
                    </h3>
                    <p className="text-gray-600">
                      Upload your notes to start the conversation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}