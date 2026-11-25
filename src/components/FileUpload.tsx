import { Download, Info, Upload } from "lucide-react";
import { downloadBlob, generateExampleShieldsSheet } from "@/lib/exampleSheet";
import {
  isSpreadsheetFileName,
  SPREADSHEET_ACCEPT,
  SPREADSHEET_FORMATS_TEXT,
} from "@/lib/shieldConverter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Permite escolher o mesmo arquivo de novo depois de corrigir
    e.target.value = "";
    if (!file) return;

    if (!isSpreadsheetFileName(file.name)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: `Envie uma planilha Excel (${SPREADSHEET_FORMATS_TEXT})`,
        variant: "destructive",
      });
      return;
    }

    onFileSelect(file);
  };

  const handleDownloadExample = () => {
    downloadBlob(
      generateExampleShieldsSheet(),
      "planilha-exemplo-escudos.xlsx",
    );
  };

  return (
    <div className="space-y-4">
      <Card className="p-12 border-dashed border-2 hover:border-primary transition-colors cursor-pointer">
        <label className="cursor-pointer flex flex-col items-center justify-center">
          <input
            type="file"
            accept={SPREADSHEET_ACCEPT}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mb-6">
            <Upload className="w-10 h-10 text-accent-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            Envie Seu Arquivo Excel
          </h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Planilha de escudos ({SPREADSHEET_FORMATS_TEXT}): nome na coluna A e escudos (0 a 5, z ou
            em branco) nas colunas B, C e D
          </p>
          <div className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">
            Escolher Arquivo
          </div>
        </label>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card rounded-lg border">
        <p className="text-sm text-muted-foreground flex gap-2">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Se o aluno não tiver nota em uma avaliação, coloque{" "}
            <strong>Z</strong>, <strong>0</strong> ou deixe a célula{" "}
            <strong>em branco</strong>: ele fica sem escudo naquela avaliação.
          </span>
        </p>
        <Button
          variant="outline"
          onClick={handleDownloadExample}
          className="gap-2 shrink-0"
        >
          <Download className="w-4 h-4" />
          Baixar planilha exemplo
        </Button>
      </div>
    </div>
  );
};
