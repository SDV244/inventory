import { Check } from 'lucide-react';
import type { WorkOrderStep } from '../../types';

interface StepTrackerProps {
  steps: WorkOrderStep[];
  currentStepIndex: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function StepTracker({
  steps,
  currentStepIndex,
  orientation = 'horizontal',
  className = '',
}: StepTrackerProps) {
  const getStepStatus = (index: number, step: WorkOrderStep) => {
    if (step.status === 'complete') return 'complete';
    if (index === currentStepIndex && step.status === 'in-progress') return 'current';
    return 'pending';
  };

  if (orientation === 'vertical') {
    return (
      <div className={`flex flex-col gap-4 ${className}`}>
        {steps.map((step, index) => {
          const status = getStepStatus(index, step);
          return (
            <div key={step.id} className="flex gap-4">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${status === 'complete' ? 'bg-pl-600 text-white' : ''}
                    ${status === 'current' ? 'bg-blue-600 text-white ring-4 ring-blue-600/30' : ''}
                    ${status === 'pending' ? 'bg-slate-700 text-slate-400' : ''}`}
                >
                  {status === 'complete' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 my-2 min-h-[2rem]
                      ${status === 'complete' ? 'bg-pl-600' : 'bg-slate-700'}`}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pb-4">
                <h4
                  className={`font-medium ${
                    status === 'pending' ? 'text-slate-400' : 'text-slate-100'
                  }`}
                >
                  {step.name}
                </h4>
                <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
                {step.actualMinutes && (
                  <p className="text-xs text-slate-500 mt-1">
                    Completed in {step.actualMinutes} min (est. {step.estimatedMinutes} min)
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Limit displayed steps for horizontal view to prevent overflow
  const maxVisibleSteps = 8;
  const displayedSteps = steps.length > maxVisibleSteps 
    ? steps.slice(0, maxVisibleSteps)
    : steps;
  const hiddenCount = steps.length - displayedSteps.length;
  const completedCount = steps.filter(s => s.status === 'complete').length;

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <div className="flex items-start gap-1 overflow-x-auto pb-2 scrollbar-thin">
        {displayedSteps.map((step, index) => {
          const status = getStepStatus(index, step);
          return (
            <div key={step.id} className="flex items-center flex-shrink-0">
              {/* Step dot */}
              <div className="flex flex-col items-center min-w-[40px]">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200
                    ${status === 'complete' ? 'bg-pl-600 text-white' : ''}
                    ${status === 'current' ? 'bg-blue-600 text-white ring-2 ring-blue-600/30' : ''}
                    ${status === 'pending' ? 'bg-slate-700 text-slate-400' : ''}`}
                >
                  {status === 'complete' ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] max-w-[50px] text-center truncate leading-tight
                    ${status === 'pending' ? 'text-slate-500' : 'text-slate-300'}`}
                  title={step.name}
                >
                  {step.name.length > 10 ? `${step.name.slice(0, 8)}...` : step.name}
                </span>
              </div>

              {/* Connector line */}
              {index < displayedSteps.length - 1 && (
                <div
                  className={`w-4 h-0.5 rounded-full transition-all duration-200 flex-shrink-0
                    ${status === 'complete' ? 'bg-pl-600' : 'bg-slate-700'}`}
                />
              )}
            </div>
          );
        })}
        
        {/* Show remaining count if steps are hidden */}
        {hiddenCount > 0 && (
          <div className="flex items-center flex-shrink-0 ml-1">
            <div className="w-4 h-0.5 bg-slate-700 rounded-full" />
            <div className="flex flex-col items-center min-w-[40px]">
              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-400">
                +{hiddenCount}
              </div>
              <span className="mt-1 text-[10px] text-slate-500">más</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Summary bar below */}
      <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
        <div 
          className="bg-pl-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>
      <div className="mt-1 text-[10px] text-slate-500 text-right">
        {completedCount}/{steps.length} pasos
      </div>
    </div>
  );
}
