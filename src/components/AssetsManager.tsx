import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Lock, Unlock, AlertCircle, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PasswordDialog } from "@/components/PasswordDialog";
import JSZip from "jszip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCertificates } from "@/contexts/CertificateContext";
import { EXAMS, EXAM_TYPES } from "@/lib/exams";

interface AssetsManagerProps {
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
}

const IMAGE_EXT = /\.(png|jpe?g)$/i;

/**
 * Descobre qual imagem do site um arquivo substitui, pelo nome (sem a extensão):
 * base / basemovers / baseflyers → fundos; B-3, C-z, D-0… → escudos.
 */
export const assetPathFor = (fileName: string): string | null => {
  const name = fileName.split("/").pop() ?? "";
  if (!IMAGE_EXT.test(name) || name.startsWith(".")) return null;
  const stem = name.replace(IMAGE_EXT, "");
  const background = EXAM_TYPES.map((t) => EXAMS[t].background).find(
    (bg) => bg.slice(1).replace(IMAGE_EXT, "").toLowerCase() === stem.toLowerCase(),
  );
  if (background) return background;
  // Zero escudos usa sempre a imagem "z"; um arquivo B-0 também troca a B-z
  const overlay = /^([BCD])-([0-5z])$/i.exec(stem);
  if (overlay) {
    const value = overlay[2] === "0" ? "z" : overlay[2].toLowerCase();
    return `/overlays/${overlay[1].toUpperCase()}-${value}.png`;
  }
  return null;
};

export const AssetsManager = ({ isUnlocked, onUnlock, onLock }: AssetsManagerProps) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const { assetOverrides, setAssetOverrides, clearAssetOverrides } = useCertificates();
  const { toast } = useToast();

  const handlePasswordSuccess = () => {
    onUnlock();
    setShowPasswordDialog(false);
    toast({
      title: "Acesso concedido",
      description: "Você pode trocar as imagens nesta sessão.",
    });
  };

  const handlePasswordError = () => {
    toast({
      title: "Senha inválida",
      description: "Tente novamente.",
      variant: "destructive",
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    try {
      const found: Record<string, Blob> = {};
      const ignored: string[] = [];

      for (const file of files) {
        if (/\.zip$/i.test(file.name)) {
          const zip = await JSZip.loadAsync(file);
          for (const entry of Object.values(zip.files)) {
            if (entry.dir || entry.name.includes("__MACOSX")) continue;
            const path = assetPathFor(entry.name);
            if (path) found[path] = await entry.async("blob");
            else ignored.push(entry.name);
          }
        } else {
          const path = assetPathFor(file.name);
          if (path) found[path] = file;
          else ignored.push(file.name);
        }
      }

      const paths = Object.keys(found);
      if (paths.length === 0) {
        toast({
          title: "Nenhuma imagem reconhecida",
          description:
            "Use os nomes base, basemovers, baseflyers (fundos) ou B-1 a B-5, B-z, C-…, D-… (escudos), em .png ou .jpg.",
          variant: "destructive",
        });
        return;
      }

      setAssetOverrides(Object.fromEntries(paths.map((p) => [p, URL.createObjectURL(found[p])])));
      toast({
        title: `${paths.length} imagem(ns) trocada(s) nesta sessão`,
        description: ignored.length > 0 ? `Ignorados: ${ignored.slice(0, 5).join(", ")}${ignored.length > 5 ? "…" : ""}` : undefined,
      });
    } catch (error) {
      toast({
        title: "Erro ao ler os arquivos",
        description: error instanceof Error ? error.message : "Não foi possível abrir o arquivo",
        variant: "destructive",
      });
    }
  };

  const replaced = Object.keys(assetOverrides).sort();

  return (
    <>
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Trocar imagens do certificado</h3>
            <p className="text-sm text-muted-foreground">
              Fundos (base, basemovers, baseflyers) e escudos (B-1 a B-5, B-z, C-…, D-…), em .png, .jpg ou dentro de um .zip
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium shrink-0">
            {isUnlocked ? (
              <span className="flex items-center gap-2 text-primary">
                <Unlock className="w-4 h-4" />
                Desbloqueado
              </span>
            ) : (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-4 h-4" />
                Bloqueado
              </span>
            )}
          </div>
        </div>

        {!isUnlocked && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ações protegidas</AlertTitle>
            <AlertDescription>Para trocar as imagens, clique em "Desbloquear" e informe a senha.</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {!isUnlocked ? (
            <Button onClick={() => setShowPasswordDialog(true)} variant="outline" className="w-full">
              <Lock className="w-4 h-4 mr-2" />
              Desbloquear
            </Button>
          ) : (
            <>
              <label className="block border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".zip,.png,.jpg,.jpeg"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="assets-input"
                />
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4 mx-auto">
                  <Upload className="w-8 h-8 text-accent-foreground" />
                </div>
                <h4 className="font-semibold mb-2">Enviar imagens</h4>
                <p className="text-sm text-muted-foreground mb-4">Pode escolher várias imagens de uma vez, ou um .zip</p>
                <div className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  Escolher Arquivos
                </div>
              </label>

              {replaced.length > 0 && (
                <div className="text-sm space-y-2">
                  <p className="font-medium">Trocadas nesta sessão:</p>
                  <p className="text-muted-foreground font-mono break-words">
                    {replaced.map((p) => p.replace(/^\/(overlays\/)?/, "")).join(", ")}
                  </p>
                  <Button onClick={clearAssetOverrides} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Voltar às imagens originais
                  </Button>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={onLock} variant="ghost" size="sm">
                  <Lock className="w-4 h-4 mr-2" />
                  Bloquear novamente
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> as imagens trocadas aqui valem só neste navegador, até a página ser recarregada.
            Para trocar uma imagem de vez, ela precisa ser substituída na pasta <code>public/</code> do projeto.
          </p>
        </div>
      </Card>

      <PasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onSuccess={handlePasswordSuccess}
        onError={handlePasswordError}
      />
    </>
  );
};
