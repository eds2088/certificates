import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PasswordDialog } from "@/components/PasswordDialog";
import { Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { drawCertificate, loadImage, PREVIEW_HEIGHT, PREVIEW_WIDTH } from "@/lib/certificateGenerator";

interface CertificatePreviewProps {
  name: string;
  overlays: string[];
  textPosition: { x: number; y: number };
  fontSize: number;
  overlaySettings: {
    position: { x: number; y: number };
    size: number;
    width: number;
  };
  isOverlaysUnlocked: boolean;
  onOverlaysUnlock: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onFontSizeChange: (size: number) => void;
  onOverlaySettingsChange: (settings: { position: { x: number; y: number }; size: number; width: number }) => void;
  baseImage: string;
}

export const CertificatePreview = ({
  name,
  overlays,
  textPosition,
  fontSize,
  overlaySettings,
  isOverlaysUnlocked,
  onOverlaysUnlock,
  onPositionChange,
  onFontSizeChange,
  onOverlaySettingsChange,
  baseImage,
}: CertificatePreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const { toast } = useToast();

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const width = PREVIEW_WIDTH;
    const height = PREVIEW_HEIGHT;
    canvas.width = width;
    canvas.height = height;
    setCanvasSize({ width, height });

    // Carrega tudo antes de desenhar, para o nome ficar sempre por cima dos escudos
    // e para uma troca rápida de aluno não misturar imagens de dois alunos.
    let cancelled = false;
    Promise.all([loadImage(baseImage), Promise.all(overlays.map(loadImage))])
      .then(([base, overlayImages]) => {
        if (cancelled) return;
        setLoadError(null);
        drawCertificate(ctx, width, height, { base, overlays: overlayImages }, name, textPosition, fontSize, overlaySettings);
      })
      .catch((error: Error) => {
        if (!cancelled) setLoadError(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [name, overlays, textPosition, fontSize, overlaySettings, baseImage]);

  const handlePasswordSuccess = () => {
    onOverlaysUnlock();
    setShowPasswordDialog(false);
    toast({
      title: "Overlays Desbloqueados",
      description: "Você pode ajustar a posição e tamanho das camadas",
    });
  };

  const handlePasswordError = () => {
    toast({
      title: "Senha Incorreta",
      description: "Tente novamente",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-secondary/30">
        <div className="flex justify-center mb-6">
          <canvas
            ref={canvasRef}
            className="border-2 border-border rounded-lg shadow-lg max-w-full h-auto"
            style={{ maxWidth: "100%" }}
          />
        </div>
        {loadError && (
          <p className="text-sm text-destructive text-center mb-4">{loadError}</p>
        )}

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Texto do Nome</TabsTrigger>
            <TabsTrigger value="overlays">Camadas (Overlays)</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-4">
            {!isOverlaysUnlocked ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Configuração Bloqueada</h3>
                <p className="text-muted-foreground mb-4">
                  Digite a senha para ajustar o texto
                </p>
                <Button onClick={() => setShowPasswordDialog(true)}>
                  Desbloquear Texto
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>X Position</Label>
                  <Slider
                    value={[textPosition.x]}
                    onValueChange={([x]) => onPositionChange({ ...textPosition, x })}
                    min={0}
                    max={canvasSize.width}
                    step={1}
                    className="mb-2"
                  />
                  <Input
                    type="number"
                    value={textPosition.x}
                    onChange={(e) =>
                      onPositionChange({ ...textPosition, x: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Y Position</Label>
                  <Slider
                    value={[textPosition.y]}
                    onValueChange={([y]) => onPositionChange({ ...textPosition, y })}
                    min={0}
                    max={canvasSize.height}
                    step={1}
                    className="mb-2"
                  />
                  <Input
                    type="number"
                    value={textPosition.y}
                    onChange={(e) =>
                      onPositionChange({ ...textPosition, y: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tamanho da Fonte</Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={([size]) => onFontSizeChange(size)}
                    min={12}
                    max={72}
                    step={1}
                    className="mb-2"
                  />
                  <Input
                    type="number"
                    value={fontSize}
                    onChange={(e) => onFontSizeChange(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="overlays" className="space-y-4 mt-4">
            {!isOverlaysUnlocked ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Configuração Bloqueada</h3>
                <p className="text-muted-foreground mb-4">
                  Digite a senha para ajustar as camadas
                </p>
                <Button onClick={() => setShowPasswordDialog(true)}>
                  Desbloquear Overlays
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>X Position</Label>
                  <Slider
                    value={[overlaySettings.position.x]}
                    onValueChange={([x]) => 
                      onOverlaySettingsChange({ 
                        ...overlaySettings, 
                        position: { ...overlaySettings.position, x } 
                      })
                    }
                    min={-200}
                    max={canvasSize.width}
                    step={1}
                    className="mb-2"
                  />
                  <Input
                    type="number"
                    value={overlaySettings.position.x}
                    onChange={(e) =>
                      onOverlaySettingsChange({ 
                        ...overlaySettings, 
                        position: { ...overlaySettings.position, x: Number(e.target.value) } 
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Y Position</Label>
                  <Slider
                    value={[overlaySettings.position.y]}
                    onValueChange={([y]) => 
                      onOverlaySettingsChange({ 
                        ...overlaySettings, 
                        position: { ...overlaySettings.position, y } 
                      })
                    }
                    min={-200}
                    max={canvasSize.height}
                    step={1}
                    className="mb-2"
                  />
                  <Input
                    type="number"
                    value={overlaySettings.position.y}
                    onChange={(e) =>
                      onOverlaySettingsChange({ 
                        ...overlaySettings, 
                        position: { ...overlaySettings.position, y: Number(e.target.value) } 
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Altura</Label>
                  <Slider
                    value={[overlaySettings.size]}
                    onValueChange={([size]) => 
                      onOverlaySettingsChange({ ...overlaySettings, size })
                    }
                    min={50}
                    max={800}
                    step={1}
                    className="mb-2"
                  />
                  <Input
                    type="number"
                    value={overlaySettings.size}
                    onChange={(e) => 
                      onOverlaySettingsChange({ ...overlaySettings, size: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Largura</Label>
                  <Slider
                    value={[overlaySettings.width]}
                    onValueChange={([width]) => 
                      onOverlaySettingsChange({ ...overlaySettings, width })
                    }
                    min={50}
                    max={800}
                    step={1}
                    className="mb-2"
                  />
                  <Input
                    type="number"
                    value={overlaySettings.width}
                    onChange={(e) => 
                      onOverlaySettingsChange({ ...overlaySettings, width: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      <p className="text-sm text-muted-foreground text-center">
        Ajuste a posição e tamanho dos elementos do certificado nas abas acima
      </p>

      <PasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onSuccess={handlePasswordSuccess}
        onError={handlePasswordError}
      />
    </div>
  );
};
