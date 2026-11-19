import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Download, ArrowRight, AlertCircle, Calculator } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCertificates, ExamType } from "@/contexts/CertificateContext";
import {
  parseScoresFile,
  convertScoresToShields,
  generateShieldsExcel,
  RawScoreData,
  ValidationError,
  BlankScoreRow,
} from "@/lib/shieldConverter";
import { EXAMS, EXAM_TYPES, MAX_SHIELDS, shieldRanges } from "@/lib/exams";
import { CertificateData } from "@/lib/certificateGenerator";
import { ExamTypeDialog } from "@/components/ExamTypeDialog";

export default function ShieldCalculator() {
  const navigate = useNavigate();
  const { setCertificates, examType, setExamType } = useCertificates();
  const { toast } = useToast();
  
  const [rawData, setRawData] = useState<RawScoreData[]>([]);
  const [shields, setShields] = useState<CertificateData[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [blanks, setBlanks] = useState<BlankScoreRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExamTypeDialog, setShowExamTypeDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [tempExamType, setTempExamType] = useState<ExamType>(examType);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/\.xlsx$/i.test(file.name)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, envie um arquivo Excel (.xlsx)",
        variant: "destructive",
      });
      return;
    }

    // Permite enviar o mesmo arquivo de novo depois de corrigir
    e.target.value = "";

    // Abrir modal para confirmar tipo de prova
    setPendingFile(file);
    setTempExamType(examType);
    setShowExamTypeDialog(true);
  };

  const processFile = async (file: File, selectedExamType: ExamType) => {
    setIsProcessing(true);
    setErrors([]);
    setBlanks([]);
    setShields([]);

    try {
      // Parse arquivo
      const { data, errors: parseErrors, blanks: blankRows } = await parseScoresFile(file);

      // Converter para escudos usando o tipo de prova selecionado
      const { shields: convertedShields, errors: conversionErrors } = convertScoresToShields(data, selectedExamType);

      // Mostra todos os problemas de uma vez, na ordem das linhas
      const allErrors = [...parseErrors, ...conversionErrors].sort((a, b) => a.row - b.row);
      if (allErrors.length > 0) {
        setErrors(allErrors);
        return;
      }

      setRawData(data);
      setBlanks(blankRows);

      setShields(convertedShields);
      setErrors([]);
      
      const messages = [`${convertedShields.length} certificados ${selectedExamType} convertidos em escudos`];
      if (blankRows.length > 0) {
        messages.push(`${blankRows.length} aluno(s) com nota em branco, contada como zero`);
      }
      
      toast({
        title: "Arquivo processado com sucesso",
        description: messages.join('. '),
      });
    } catch (error) {
      toast({
        title: "Erro ao processar arquivo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExamTypeConfirm = () => {
    if (pendingFile) {
      setExamType(tempExamType);
      processFile(pendingFile, tempExamType);
      setPendingFile(null);
    }
    setShowExamTypeDialog(false);
  };

  const handleDownloadExcel = () => {
    if (shields.length === 0) return;

    const blob = generateShieldsExcel(shields);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'escudos-recalculados.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download iniciado",
      description: "Planilha com escudos recalculados",
    });
  };

  const handleUseCertificates = () => {
    if (shields.length === 0) return;

    setCertificates(shields);
    
    toast({
      title: "Dados carregados",
      description: "Redirecionando para geração de certificados...",
    });

    navigate("/?tab=certificates");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl font-bold text-foreground">Calculadora de Escudos</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Calculator className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-md p-4">
                  <div className="space-y-3 text-sm">
                    {EXAM_TYPES.map((type) => {
                      const exam = EXAMS[type];
                      const rule = (max: number) =>
                        ["0=0", ...shieldRanges(max).map((r, i) => `${r}=${i + 1}⭐`)].join(" | ");
                      return (
                        <div key={type}>
                          <h4 className="font-semibold mb-2">{type}</h4>
                          <div className="space-y-1 text-xs">
                            <p><strong>Reading/Writing (0-{exam.readingWriting}):</strong></p>
                            <p>{rule(exam.readingWriting)}</p>
                            <p><strong>Listening (0-{exam.listening}):</strong></p>
                            <p>{rule(exam.listening)}</p>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-xs">
                      <strong>Speaking:</strong> já vem em escudos (0 a {MAX_SHIELDS}) em todas as provas.
                    </p>
                    <p className="text-xs">
                      Nota em branco, 0 ou z = zero escudos (aluno faltou).
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-muted-foreground">
            Converta notas brutas em escudos para geração de certificados
          </p>
        </div>

        {/* Upload Section */}
        <Card className="p-8">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Enviar Planilha de Notas</h2>
              <div className="text-sm text-muted-foreground mb-6 space-y-1">
                <p>Arquivo .xlsx com 4 colunas: Nome, Reading/Writing, Listening, Speaking</p>
                {EXAM_TYPES.map((type) => (
                  <p key={type} className="font-medium">
                    {type} (Reading/Writing: 0-{EXAMS[type].readingWriting}, Listening: 0-{EXAMS[type].listening}, Speaking: 0-{MAX_SHIELDS} escudos)
                  </p>
                ))}
                <p>Nota em branco, 0 ou z conta como zero escudos.</p>
              </div>
            </div>

            <label className="cursor-pointer flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
                disabled={isProcessing}
              />
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-accent-foreground" />
              </div>
              {/* Um <button> dentro do <label> não abre a janela de arquivos: por isso um <span> com o visual de botão */}
              <span className={buttonVariants({ variant: "outline" })} aria-disabled={isProcessing}>
                {isProcessing ? "Processando..." : "Escolher Arquivo"}
              </span>
            </label>
          </div>
        </Card>

        {/* Errors Section */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Erros encontrados na planilha:</div>
              <ul className="list-disc list-inside space-y-1">
                {errors.slice(0, 10).map((error, idx) => (
                  <li key={idx} className="text-sm">
                    {error.row > 0 && `Linha ${error.row}, `}
                    {error.column}: {error.message}
                    {error.value !== null && error.value !== undefined && ` (valor: ${error.value})`}
                  </li>
                ))}
                {errors.length > 10 && (
                  <li className="text-sm font-semibold">
                    ... e mais {errors.length - 10} erros
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Blank scores section */}
        {blanks.length > 0 && shields.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Notas em branco (contadas como zero escudos):</div>
              <ul className="list-disc list-inside space-y-1">
                {blanks.map((blank) => (
                  <li key={blank.row} className="text-sm">
                    Linha {blank.row}: {blank.name} - {blank.fields.join(", ")}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Results Section */}
        {shields.length > 0 && (
          <Card className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Escudos Calculados</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Exibindo {Math.min(10, shields.length)} de {shields.length} certificados
              </p>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-center">Reading/Writing</TableHead>
                      <TableHead className="text-center">Listening</TableHead>
                      <TableHead className="text-center">Speaking</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shields.slice(0, 10).map((shield, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{shield.name}</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {shield.b}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {shield.c}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {shield.d}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleDownloadExcel}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Download className="w-5 h-5" />
                Baixar Planilha Recalculada
              </Button>
              
              <Button
                onClick={handleUseCertificates}
                size="lg"
                className="gap-2"
              >
                Usar Estes Dados para Gerar Certificados
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Dialog para confirmar tipo de prova */}
      <ExamTypeDialog
        open={showExamTypeDialog}
        onOpenChange={setShowExamTypeDialog}
        selectedType={tempExamType}
        onTypeChange={setTempExamType}
        onConfirm={handleExamTypeConfirm}
      />
    </div>
  );
}
