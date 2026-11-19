import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const Navigation = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const currentTab = searchParams.get("tab") || "calculator";

  const handleLogout = () => {
    sessionStorage.removeItem("isAuthenticated");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
    navigate("/login");
  };

  return (
    <div className="border-b bg-card shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">
            Sistema de Certificados
          </h1>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        <Tabs value={currentTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="certificates" asChild>
              <Link to="/?tab=certificates" className="gap-2">
                <FileText className="w-4 h-4" />
                Gerar Certificados
              </Link>
            </TabsTrigger>
            <TabsTrigger value="calculator" asChild>
              <Link to="/?tab=calculator" className="gap-2">
                <Calculator className="w-4 h-4" />
                Calculadora de Escudos
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};
