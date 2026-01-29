/**
 * Quick Review Modal Component
 * 
 * Student-friendly, brief review modal with minimal text.
 * Shows 1 strength, 1 improvement tip, and 2 skill tags.
 * 
 * @module components/QuickReviewModal
 */

'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Sparkles, TrendingUp } from 'lucide-react';
import { getStudentQuickReview } from '@/lib/report-views';

interface QuickReviewModalProps {
  attemptData: any;
  onClose: () => void;
}

export function QuickReviewModal({ attemptData, onClose }: QuickReviewModalProps) {
  const review = getStudentQuickReview(attemptData);
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Quick Review
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Strength */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-1">Strength Observed</h3>
                <p className="text-sm text-green-800">{review.strength}</p>
              </div>
            </div>
          </div>
          
          {/* Improvement Tip */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Coach Tip</h3>
                <p className="text-sm text-blue-800">{review.improvementTip}</p>
              </div>
            </div>
          </div>
          
          {/* Skill Tags */}
          {review.skillTags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Skills Improved</h3>
              <div className="flex flex-wrap gap-2">
                {review.skillTags.slice(0, 2).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm">
                    {String(tag).replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

