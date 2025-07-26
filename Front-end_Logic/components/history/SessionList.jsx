
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText,
  MessageCircle, // This import is no longer used but kept as it was not explicitly removed from imports
  Calendar,
  Clock,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

export default function SessionsList({ sessions, onSelectSession, selectedSessionId }) {
  const getStatusColor = (status) => {
    // All statuses now return the same monochrome style
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    // This function is kept, but its output is no longer used in the badge for a monochrome look
    switch (status) {
      case 'ready': return '🟢';
      case 'processing': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <Card className="premium-shadow">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions yet</h3>
            <p className="text-gray-600">Upload your first handwritten notes to get started!</p>
          </CardContent>
        </Card>
      ) : (
        sessions.map((session) => (
          <Card 
            key={session.id} 
            className={`premium-shadow cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedSessionId === session.id ? 'ring-2 ring-gray-900' : '' // Monochrome selection ring
            }`}
            onClick={() => onSelectSession(session)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" /> {/* Monochrome icon color */}
                    <h3 className="font-semibold text-gray-900 truncate">
                      {session.title}
                    </h3>
                    <Badge variant="outline" className={getStatusColor(session.status)}>
                      {session.status} {/* Only status text, no icon for monochrome */}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 truncate">
                    {session.original_filename}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(session.created_date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(session.created_date), 'HH:mm')}</span>
                    </div>
                    {/* MessageCircle and "Q&A Available" removed for monochrome UI */}
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
              </div>
              
              {/* session.text_summary block removed for the new design */}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
