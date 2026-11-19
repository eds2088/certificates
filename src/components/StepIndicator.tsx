import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  steps: { number: number; title: string; description: string }[];
}

export const StepIndicator = ({ currentStep, steps }: StepIndicatorProps) => {
  return (
    <div className="w-full max-w-3xl mx-auto mb-12">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300",
                  currentStep > step.number
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step.number
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {currentStep > step.number ? (
                  <Check className="w-6 h-6" />
                ) : (
                  step.number
                )}
              </div>
              <div className="mt-3 text-center">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    currentStep >= step.number
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4 transition-all duration-300",
                  currentStep > step.number
                    ? "bg-primary"
                    : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
