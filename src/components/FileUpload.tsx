import { Upload } from "lucide-react";
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

    if (!/\.xlsx$/i.test(file.name)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, envie um arquivo Excel (.xlsx)",
        variant: "destructive",
      });
      return;
    }

    onFileSelect(file);
  };

  return (
    <Card className="p-12 border-dashed border-2 hover:border-primary transition-colors cursor-pointer">
      <label className="cursor-pointer flex flex-col items-center justify-center">
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mb-6">
          <Upload className="w-10 h-10 text-accent-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Envie Seu Arquivo Excel</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Planilha de escudos (.xlsx): nome na coluna A e escudos (0 a 5, z ou em branco) nas colunas B, C e D
        </p>
        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">
          Escolher Arquivo
        </div>
      </label>
    </Card>
  );
};
