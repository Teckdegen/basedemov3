
import { motion } from 'framer-motion';
import { X, Brain, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AISuggestion {
  id: string;
  type: string;
  message: string;
  token?: string;
  dismissed?: boolean;
  timestamp: string;
}

interface AIInsights {
  lastUpdated: string | null;
  suggestions: AISuggestion[];
  dismissedIds: string[];
  tokenInsights: Record<string, any>;
}

interface AIInsightsPanelProps {
  insights: AIInsights;
  onDismiss: (suggestionId: string) => void;
}

export const AIInsightsPanel = ({ insights, onDismiss }: AIInsightsPanelProps) => {
  const activeSuggestions = insights.suggestions.filter(
    suggestion => !insights.dismissedIds.includes(suggestion.id)
  );

  // Mock AI suggestions if none exist
  const mockSuggestions: AISuggestion[] = [
    {
      id: 'diversification-1',
      type: 'diversification',
      message: 'Consider diversifying your portfolio - PEPE represents 72% of your holdings',
      timestamp: new Date().toISOString()
    },
    {
      id: 'market-sentiment-1',
      type: 'sentiment',
      message: 'Positive sentiment detected for Base ecosystem tokens on social media',
      timestamp: new Date().toISOString()
    },
    {
      id: 'profit-taking-1',
      type: 'profit',
      message: 'Consider taking profits on your best performing positions',
      timestamp: new Date().toISOString()
    }
  ];

  const displaySuggestions = activeSuggestions.length > 0 ? activeSuggestions : mockSuggestions;

  const getIcon = (type: string) => {
    switch (type) {
      case 'diversification':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'sentiment':
        return <Brain className="w-5 h-5 text-blue-500" />;
      default:
        return <Brain className="w-5 h-5 text-purple-500" />;
    }
  };

  if (displaySuggestions.length === 0) {
    return (
      <div className="text-center py-8">
        <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <p className="text-purple-600 mb-2">No AI insights available</p>
        <p className="text-sm text-purple-500">
          AI insights will appear here based on your trading activity
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displaySuggestions.map((suggestion, index) => (
        <motion.div
          key={suggestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-purple-50/50 border border-purple-200 hover:bg-purple-50/70 transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getIcon(suggestion.type)}
                  <div className="flex-1">
                    <p className="text-purple-800 font-medium">
                      {suggestion.message}
                    </p>
                    {suggestion.token && (
                      <p className="text-sm text-purple-600 mt-1">
                        Token: {suggestion.token}
                      </p>
                    )}
                    <p className="text-xs text-purple-500 mt-2">
                      {new Date(suggestion.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={() => onDismiss(suggestion.id)}
                  size="sm"
                  variant="ghost"
                  className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 min-w-[32px] h-[32px] p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
      
      {insights.lastUpdated && (
        <p className="text-xs text-purple-500 text-center mt-4">
          Last updated: {new Date(insights.lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  );
};
