import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { checkAdminPassword } from "@/lib/passwordCheck";

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onError: () => void;
}

export const PasswordDialog = ({
  open,
  onOpenChange,
  onSuccess,
  onError,
}: PasswordDialogProps) => {
  const [password, setPassword] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (await checkAdminPassword(password)) {
      setIsError(false);
      setPassword("");
      onSuccess();
    } else {
      setIsError(true);
      onError();
    }
  };

  const handleCancel = () => {
    setPassword("");
    setIsError(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle>Autenticação Necessária</DialogTitle>
          </div>
          <DialogDescription>
            Insira a senha para desbloquear as ações de modificação de assets.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setIsError(false);
                }}
                placeholder="Digite a senha"
                className={isError ? "border-destructive focus-visible:ring-destructive" : ""}
                autoFocus
              />
              {isError && (
                <p className="text-sm text-destructive">
                  Senha incorreta. Tente novamente.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
