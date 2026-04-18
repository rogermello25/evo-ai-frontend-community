import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { automationService } from "@/services/automation/automationService";
import type { AutomationRule } from "@/types/automation";
import { Button, Card, CardContent, Input, Badge, Skeleton } from "@evoapi/design-system";
import { Plus, Trash2, Power, PowerOff } from "lucide-react";

const Automation: React.FC = () => {
  const navigate = useNavigate();
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { loadAutomations(); }, []);

  const loadAutomations = async () => {
    try {
      setIsLoading(true);
      const response = await automationService.getAutomations();
      setAutomations(response.data || []);
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleToggle = async (automation: AutomationRule) => {
    try {
      await automationService.updateAutomation(automation.id, { active: !automation.active });
      setAutomations(prev => prev.map(a => a.id === automation.id ? { ...a, active: !a.active } : a));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir?")) return;
    try {
      await automationService.deleteAutomation(id);
      setAutomations(prev => prev.filter(a => a.id !== id));
    } catch (err) { console.error(err); }
  };

  if (isLoading) return <div className="p-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-24 mt-4" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Automacoes</h1>
        <Button onClick={() => navigate("/automation/new")}><Plus className="w-4 mr-2" />Nova</Button>
      </div>
      <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-sm" />
      {error && <div className="p-4 bg-destructive/10 text-destructive rounded">{error}</div>}
      <div className="space-y-3">
        {automations.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map(a => (
          <Card key={a.id} className={a.active ? "" : "opacity-60"}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => handleToggle(a)}>
                    {a.active ? <Power className="w-5 text-green-500" /> : <PowerOff />}
                  </Button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{a.name}</h3>
                      <Badge variant="outline">{a.mode}</Badge>
                    </div>
                    {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
                    <span className="text-xs text-muted-foreground">Evento: {a.event_name}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Automation;
