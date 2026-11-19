import { ExamType } from "@/contexts/CertificateContext";
import { EXAMS, EXAM_TYPES, MAX_SHIELDS } from "@/lib/exams";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ExamTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedType: ExamType;
  onTypeChange: (type: ExamType) => void;
  onConfirm: () => void;
}

export function ExamTypeDialog({
  open,
  onOpenChange,
  selectedType,
  onTypeChange,
  onConfirm,
}: ExamTypeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tipo de Prova</DialogTitle>
          <DialogDescription>
            Selecione o tipo de prova para as notas que você está enviando.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup value={selectedType} onValueChange={(value) => onTypeChange(value as ExamType)}>
            {EXAM_TYPES.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <RadioGroupItem value={type} id={`exam-${type}`} />
                <Label htmlFor={`exam-${type}`} className="cursor-pointer">
                  {type} (Reading/Writing: 0-{EXAMS[type].readingWriting}, Listening: 0-{EXAMS[type].listening}, Speaking: 0-{MAX_SHIELDS} escudos)
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button onClick={onConfirm} className="w-full">
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
