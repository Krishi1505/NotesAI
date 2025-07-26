
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Edit3, 
  Save, 
  X, 
  FileText, 
  Sparkles, 
  Copy, 
  Check,
  Volume2,
  Download
} from 'lucide-react';

export default function ExtractedTextDisplay({ 
  text, 
  onTextUpdate, 
  onGenerateSummary,
  summary,
  voiceSummaryUrl,
  isGeneratingSummary,
  onGenerateVoiceSummary,
  isGeneratingVoice
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSave = () => {
    onTextUpdate(editedText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(text);
    setIsEditing(false);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playAudio = () => {
    if (voiceSummaryUrl) {
      const audio = new Audio(voiceSummaryUrl);
      setIsPlaying(true);
      audio.play();
      audio.onended = () => setIsPlaying(false);
    }
  };

  const downloadAudio = () => {
    if (voiceSummaryUrl) {
      const link = document.createElement('a');
      link.href = voiceSummaryUrl;
      link.download = 'voice-summary.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Extracted Text */}
      <Card className="premium-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <CardTitle className="text-lg">Extracted Text</CardTitle>
            <Badge variant="secondary">
              AI Recognized
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="text-gray-600 hover:text-gray-900"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={8}
                className="resize-none"
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} className="bg-gray-900 hover:bg-gray-800">
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {text}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Section */}
      {(summary || isGeneratingSummary) && (
        <Card className="premium-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-lg">AI Summary</CardTitle>
            </div>
            <div className="flex space-x-2">
              {summary && !isGeneratingVoice && !voiceSummaryUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGenerateVoiceSummary}
                >
                  <Volume2 className="w-4 h-4 mr-1" />
                  Generate Voice
                </Button>
              )}
              {voiceSummaryUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={playAudio}
                    disabled={isPlaying}
                  >
                    <Volume2 className="w-4 h-4 mr-1" />
                    {isPlaying ? 'Playing...' : 'Play Audio'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadAudio}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download MP3
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isGeneratingSummary ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mr-3"></div>
                <span className="text-gray-600">Generating AI summary...</span>
              </div>
            ) : isGeneratingVoice ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mr-3"></div>
                <span className="text-gray-600">Converting to speech...</span>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 rounded-lg p-4 leading-relaxed">
                  {summary}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {text && !summary && !isGeneratingSummary && (
        <div className="flex justify-center">
          <Button
            onClick={onGenerateSummary}
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate AI Summary
          </Button>
        </div>
      )}
    </div>
  );
}
