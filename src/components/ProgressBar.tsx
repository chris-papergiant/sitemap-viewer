import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
  message: string;
  subMessage?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, message, subMessage }) => {
  const isComplete = progress >= 100;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl border border-primary-pink-100 shadow-glow-pink p-8">
        <div className="flex items-start space-x-4">
          {/* Loading Icon */}
          <div className="flex-shrink-0">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
              ${isComplete ? 'bg-success-500' : 'bg-primary-pink'}
            `}>
              {isComplete ? (
                <svg 
                  className="h-6 w-6 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              ) : (
                <Loader2 className="h-6 w-6 text-white animate-spin" aria-hidden="true" />
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {message}
              </h3>
              {subMessage && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {subMessage}
                </p>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`
                      h-full rounded-full transition-all duration-500 ease-out
                      ${isComplete ? 'bg-success-500' : 'bg-primary-pink'}
                    `}
                    style={{ width: `${clampedProgress}%` }}
                  >
                  </div>
                </div>
                
                {/* Progress indicator */}
                <div className="absolute -top-1 transition-all duration-500" style={{ left: `${clampedProgress}%` }}>
                  <div className={`
                    w-4 h-4 rounded-full border-2 border-white shadow-sm transform -translate-x-1/2 transition-colors duration-300
                    ${isComplete ? 'bg-success-500' : 'bg-primary-pink'}
                  `} />
                </div>
              </div>
              
              {/* Progress percentage */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {isComplete ? 'Completed successfully!' : 'Processing...'}
                </span>
                <span className={`
                  font-semibold tabular-nums transition-colors duration-300
                  ${isComplete ? 'text-gradient-cool' : 'text-gradient'}
                `}>
                  {Math.round(clampedProgress)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Status indicator */}
        {!isComplete && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary-pink rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs font-medium ml-2">Please wait while we analyse the sitemap</span>
            </div>
          </div>
        )}
        
        {isComplete && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-center text-sm text-success-500">
              <span className="font-medium">Ready to explore!</span> Your website has been successfully processed.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;