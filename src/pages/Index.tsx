import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { StepIndicator } from "@/components/StepIndicator";
import { FileUpload } from "@/components/FileUpload";
import { CertificatePreview } from "@/components/CertificatePreview";
import { AssetsManager } from "@/components/AssetsManager";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, ChevronRight, ChevronLeft, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCertificates } from "@/contexts/CertificateContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  parseExcelFile,
  generateAllPDFsAsZip,
  getOverlayPaths,
  certificateFileName,
  filenamePart,
  CertificateData,
} from "@/lib/certificateGenerator";
import { EXAMS, EXAM_TYPES, ExamType } from "@/lib/exams";
import ShieldCalculator from "./ShieldCalculator";

const steps = [
  { number: 1, title: "Upload", description: "Selecionar arquivo Excel" },
  { number: 2, title: "Preview", description: "Ajustar layout do certificado" },
  { number: 3, title: "Download", description: "Baixar certificados" },
];

// Um único "cache buster" por carregamento da página: pega imagens novas depois de
// um deploy, sem baixar tudo de novo a cada atualização da tela.
const CACHE_BUSTER = `?v=${Date.now()}`;
const withCacheBuster = (path: string) => `${path}${CACHE_BUSTER}`;

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "calculator";
  
  const {
    certificates: contextCertificates,
    setCertificates: setContextCertificates,
    examType,
    setExamType,
    assetOverrides,
  } = useCertificates();
  // Dados que esta página já tratou; evita voltar ao passo 2 só por trocar de aba
  const handledCertificates = useRef<CertificateData[] | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isAssetsDialogOpen, setIsAssetsDialogOpen] = useState(false);
  const [localCertificates, setLocalCertificates] = useState<CertificateData[]>([]);
  const [textPosition, setTextPosition] = useState({ x: 218, y: 144 });
  const [fontSize, setFontSize] = useState(25);
  const [overlaySettings, setOverlaySettings] = useState({
    position: { x: 0, y: -2 },
    size: 600,
    width: 440
  });
  const [isOverlaysUnlocked, setIsOverlaysUnlocked] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [turma, setTurma] = useState("");
  // Escudos que vieram da Calculadora já foram calculados com a prova escolhida lá;
  // trocar a prova aqui deixaria escudos de uma prova no certificado de outra.
  const [fromCalculator, setFromCalculator] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [isAssetsUnlocked, setIsAssetsUnlocked] = useState(false);
  const { toast } = useToast();

  // Use context certificates if available, otherwise use local
  const certificates = contextCertificates.length > 0 ? contextCertificates : localCertificates;
  const setCertificates = (data: CertificateData[]) => {
    handledCertificates.current = data;
    setLocalCertificates(data);
    setContextCertificates(data);
    setPreviewIndex(0);
  };

  const resolveAsset = useCallback(
    (path: string) => assetOverrides[path] ?? withCacheBuster(path),
    [assetOverrides],
  );
  const exam = EXAMS[examType];
  const baseImage = resolveAsset(exam.background);
  const safeIndex = Math.min(previewIndex, Math.max(0, certificates.length - 1));
  const previewCert = certificates[safeIndex];
  const previewOverlays = useMemo(
    () => (previewCert ? getOverlayPaths(previewCert).map(resolveAsset) : []),
    [previewCert, resolveAsset],
  );
  const turmaOk = filenamePart(turma) !== "";
  const yearOk = /^\d{4}$/.test(year.trim());
  const exampleFileName = certificateFileName(turma || "turma", previewCert?.name ?? "Nome Sobrenome", exam.label, year);

  // Check authentication on mount
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [navigate]);

  // Load certificates from context when available
  useEffect(() => {
    if (
      contextCertificates.length > 0 &&
      currentTab === "certificates" &&
      handledCertificates.current !== contextCertificates
    ) {
      handledCertificates.current = contextCertificates;
      setFromCalculator(true);
      setCurrentStep(2);
      setPreviewIndex(0);
      toast({
        title: "Dados carregados",
        description: `${contextCertificates.length} certificados prontos para geração`,
      });
    }
  }, [contextCertificates, currentTab]);

  // Reset unlock status on component mount (simulates page refresh)
  useEffect(() => {
    setIsAssetsUnlocked(false);
  }, []);

  const handleFileSelect = async (file: File) => {
    try {
      const { certificates: data, errors } = await parseExcelFile(file);
      if (errors.length > 0) {
        const list = errors
          .slice(0, 5)
          .map((e) => `Linha ${e.row}, coluna ${e.column}: "${e.value}"`)
          .join("; ");
        toast({
          title: "Valores inválidos na planilha de escudos",
          description: `Use 0 a 5, z ou deixe em branco. ${list}${errors.length > 5 ? ` … e mais ${errors.length - 5}` : ""}`,
          variant: "destructive",
        });
        return;
      }
      if (data.length === 0) {
        toast({
          title: "Nenhum aluno encontrado",
          description: "A planilha parece estar vazia",
          variant: "destructive",
        });
        return;
      }
      setCertificates(data);
      setFromCalculator(false);
      setCurrentStep(2);
      toast({
        title: "Arquivo enviado com sucesso",
        description: `Encontrados ${data.length} certificados para gerar`,
      });
    } catch (error) {
      toast({
        title: "Erro ao ler arquivo",
        description:
          error instanceof Error && error.message
            ? `Não foi possível abrir: ${error.message}`
            : "Certifique-se de que o arquivo é uma planilha Excel válida",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!turmaOk || !yearOk) {
      toast({
        title: "Preencha a turma e o ano",
        description: "Eles fazem parte do nome de cada arquivo",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    setProgress({ done: 0, total: certificates.length });
    try {
      const zipBlob = await generateAllPDFsAsZip(
        certificates,
        baseImage,
        textPosition,
        fontSize,
        overlaySettings,
        (cert) => certificateFileName(turma, cert.name, exam.label, year.trim()),
        resolveAsset,
        (done, total) => setProgress({ done, total }),
      );

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${certificateFileName(turma, "", exam.label, year.trim())}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      setCurrentStep(3);
      toast({
        title: "Sucesso!",
        description: `Gerados ${certificates.length} certificados`,
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDFs",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  const handleUnlock = () => {
    setIsAssetsUnlocked(true);
  };

  const handleLock = () => {
    setIsAssetsUnlocked(false);
  };

  return (
    <>
      <Navigation />
      
      {currentTab === "calculator" ? (
        <ShieldCalculator />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
          <div className="container mx-auto px-4 py-12">
            <div className="flex justify-end mb-2">
              <Dialog open={isAssetsDialogOpen} onOpenChange={setIsAssetsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    aria-label="Trocar imagens do certificado"
                    disabled={isGenerating}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Imagens do certificado</DialogTitle>
                  </DialogHeader>
                  <AssetsManager 
                    isUnlocked={isAssetsUnlocked}
                    onUnlock={handleUnlock}
                    onLock={handleLock}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Gerador de Certificados
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Crie certificados personalizados a partir de dados Excel em três etapas simples
              </p>
            </div>

            <StepIndicator currentStep={currentStep} steps={steps} />

            <div className="max-w-5xl mx-auto">
              {currentStep === 1 && <FileUpload onFileSelect={handleFileSelect} />}

              {currentStep === 2 && certificates.length === 0 && (
                <div className="text-center space-y-4 py-12">
                  <p className="text-muted-foreground">Nenhum aluno carregado.</p>
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                </div>
              )}

              {currentStep === 2 && certificates.length > 0 && previewCert && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold">
                      Prévia do Certificado {safeIndex + 1} de {certificates.length}
                    </h2>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewIndex(Math.max(0, safeIndex - 1))}
                        disabled={safeIndex === 0}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPreviewIndex(Math.min(certificates.length - 1, safeIndex + 1))
                        }
                        disabled={safeIndex === certificates.length - 1}
                      >
                        Próximo
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>

                  <CertificatePreview
                    name={previewCert.name}
                    overlays={previewOverlays}
                    textPosition={textPosition}
                    fontSize={fontSize}
                    overlaySettings={overlaySettings}
                    isOverlaysUnlocked={isOverlaysUnlocked}
                    onOverlaysUnlock={() => setIsOverlaysUnlocked(true)}
                    onPositionChange={setTextPosition}
                    onFontSizeChange={setFontSize}
                    onOverlaySettingsChange={setOverlaySettings}
                    baseImage={baseImage}
                  />

                  <div className="p-4 bg-card rounded-lg border space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="turma">Turma</Label>
                        <Input
                          id="turma"
                          placeholder="Ex.: 121"
                          value={turma}
                          onChange={(e) => setTurma(e.target.value)}
                          disabled={isGenerating}
                          aria-invalid={!turmaOk}
                          aria-describedby="turma-help"
                          className={!turmaOk ? "border-destructive" : undefined}
                        />
                        {!turmaOk && (
                          <p id="turma-help" className="text-xs text-destructive">
                            Preencha a turma para baixar os certificados
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exam">Prova</Label>
                        <Select
                          value={examType}
                          onValueChange={(v) => setExamType(v as ExamType)}
                          disabled={fromCalculator || isGenerating}
                        >
                          <SelectTrigger id="exam">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EXAM_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fromCalculator && (
                          <p className="text-xs text-muted-foreground">
                            Escolhida na Calculadora. Para mudar, envie a planilha de novo lá.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year">Ano</Label>
                        <Input
                          id="year"
                          inputMode="numeric"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          aria-invalid={!yearOk}
                          className={!yearOk ? "border-destructive" : undefined}
                        />
                        {!yearOk && <p className="text-xs text-destructive">Use 4 dígitos, ex.: 2026</p>}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Um PDF A4 (em pé) por aluno. Nome do arquivo:{" "}
                      <span className="font-mono text-foreground">{exampleFileName}.pdf</span>
                    </p>
                  </div>

                  <div className="flex justify-between gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setCurrentStep(1)}
                      disabled={isGenerating}
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      Voltar
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleDownload}
                      disabled={isGenerating || !turmaOk || !yearOk}
                      className="gap-2"
                    >
                      <Download className="w-5 h-5" />
                      {isGenerating
                        ? `Gerando PDFs... ${progress ? `${progress.done}/${progress.total}` : ""}`
                        : "Gerar e Baixar Certificados"}
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="text-center space-y-6 py-12">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Download className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold">Download Concluído!</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Seus certificados foram gerados com sucesso e o download deve começar
                    automaticamente.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => {
                      setCurrentStep(1);
                      setCertificates([]);
                    }}
                  >
                    Gerar Novos Certificados
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Index;
