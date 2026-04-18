import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@evoapi/design-system';
import { ArrowLeft, Save, X, Plus, Trash2, GripVertical, Settings } from 'lucide-react';
import { automationService } from '@/services/automation/automationService';
import type {
  AutomationCondition,
  AutomationAction,
  CreateAutomationPayload,
  UpdateAutomationPayload,
  AutomationEventType,
} from '@/types/automation';

// Event options for triggers
const EVENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'conversation_created', label: 'Conversa Criada' },
  { value: 'conversation_updated', label: 'Conversa Atualizada' },
  { value: 'message_created', label: 'Mensagem Recebida' },
  { value: 'conversation_opened', label: 'Conversa Aberta' },
  { value: 'conversation_resolved', label: 'Conversa Resolvida' },
  { value: 'conversation_status_changed', label: 'Status Alterado' },
];

// Filter operators
const OPERATOR_OPTIONS: { value: string; label: string }[] = [
  { value: 'equal_to', label: 'Igual a' },
  { value: 'not_equal_to', label: 'Diferente de' },
  { value: 'contains', label: 'Contém' },
  { value: 'does_not_contain', label: 'Não contém' },
  { value: 'is_present', label: 'Existe' },
  { value: 'is_not_present', label: 'Não existe' },
  { value: 'is_greater_than', label: 'Maior que' },
  { value: 'is_less_than', label: 'Menor que' },
  { value: 'is_in', label: 'Está em' },
  { value: 'is_not_in', label: 'Não está em' },
];

// Condition attribute keys that need special dropdown handling
const CONDITION_KEYS = [
  { value: 'contact.name', label: 'Nome do Contato' },
  { value: 'contact.email', label: 'Email do Contato' },
  { value: 'contact.phone', label: 'Telefone do Contato' },
  { value: 'contact.tags', label: 'Tags do Contato' },
  { value: 'conversation.status', label: 'Status da Conversa' },
  { value: 'conversation.priority', label: 'Prioridade da Conversa' },
  { value: 'conversation.assignee_id', label: 'Agente Responsável' },
  { value: 'conversation.team_id', label: 'Equipe' },
  { value: 'message.content', label: 'Conteúdo da Mensagem' },
  { value: 'message.attachment_count', label: 'Quantidade de Anexos' },
];

// Action types
const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: 'send_message', label: 'Enviar Mensagem' },
  { value: 'add_label', label: 'Adicionar Tag' },
  { value: 'remove_label', label: 'Remover Tag' },
  { value: 'assign_agent', label: 'Atribuir Agente' },
  { value: 'assign_team', label: 'Atribuir Equipe' },
  { value: 'send_email_to_team', label: 'Enviar Email para Equipe' },
  { value: 'send_webhook_event', label: 'Enviar Webhook' },
  { value: 'mute_conversation', label: 'Silenciar Conversa' },
  { value: 'resolve_conversation', label: 'Resolver Conversa' },
  { value: 'snooze_conversation', label: 'Adiar Conversa' },
  { value: 'change_priority', label: 'Alterar Prioridade' },
  { value: 'change_status', label: 'Alterar Status' },
  { value: 'send_email_transcript', label: 'Enviar Transcrição por Email' },
  { value: 'assign_to_pipeline', label: 'Mover para Pipeline' },
  { value: 'update_pipeline_stage', label: 'Alterar Estágio do Pipeline' },
];

// Status options
const STATUS_OPTIONS = [
  { value: 'open', label: 'Aberta' },
  { value: 'pending', label: 'Pendente' },
  { value: 'resolved', label: 'Resolvida' },
  { value: 'closed', label: 'Fechada' },
];

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

// Types for form data
interface FormData {
  inboxes: any[];
  agents: any[];
  teams: any[];
  labels: any[];
  campaigns: any[];
  customAttributes: any[];
}


// Get dropdown type for attribute
const getDropdownType = (attributeKey: string): 'labels' | 'agents' | 'teams' | 'status' | 'priority' | null => {
  switch (attributeKey) {
    case 'contact.tags':
      return 'labels';
    case 'conversation.status':
      return 'status';
    case 'conversation.priority':
      return 'priority';
    case 'conversation.assignee_id':
      return 'agents';
    case 'conversation.team_id':
      return 'teams';
    default:
      return null;
  }
};

interface ConditionRowProps {
  condition: AutomationCondition;
  onChange: (condition: AutomationCondition) => void;
  onDelete: () => void;
  index: number;
  formData: FormData;
}

const ConditionRow: React.FC<ConditionRowProps> = ({ condition, onChange, onDelete, index, formData }) => {
  const dropdownType = getDropdownType(condition.attribute_key);
  const needsValue = !['is_present', 'is_not_present'].includes(condition.filter_operator);

  const renderValueInput = () => {
    if (!needsValue) {
      return null;
    }

    if (dropdownType === 'labels') {
      return (
        <select
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={(condition.values as string[])?.[0] || ''}
          onChange={(e) => onChange({ ...condition, values: [e.target.value] })}
        >
          <option value="">Selecione a tag</option>
          {formData.labels.map((label) => (
            <option key={label.id} value={label.title}>
              {label.title}
            </option>
          ))}
        </select>
      );
    }

    if (dropdownType === 'agents') {
      return (
        <select
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={(condition.values as string[])?.[0] || ''}
          onChange={(e) => onChange({ ...condition, values: [e.target.value] })}
        >
          <option value="">Selecione o agente</option>
          {formData.agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name || agent.email || agent.id}
            </option>
          ))}
        </select>
      );
    }

    if (dropdownType === 'teams') {
      return (
        <select
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={(condition.values as string[])?.[0] || ''}
          onChange={(e) => onChange({ ...condition, values: [e.target.value] })}
        >
          <option value="">Selecione a equipe</option>
          {formData.teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name || team.id}
            </option>
          ))}
        </select>
      );
    }

    if (dropdownType === 'status') {
      return (
        <select
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={(condition.values as string[])?.[0] || ''}
          onChange={(e) => onChange({ ...condition, values: [e.target.value] })}
        >
          <option value="">Selecione o status</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (dropdownType === 'priority') {
      return (
        <select
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={(condition.values as string[])?.[0] || ''}
          onChange={(e) => onChange({ ...condition, values: [e.target.value] })}
        >
          <option value="">Selecione a prioridade</option>
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    // Default: free text input
    return (
      <input
        type="text"
        className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
        placeholder="Valor"
        value={(condition.values as string[])?.[0] || ''}
        onChange={(e) => onChange({ ...condition, values: [e.target.value] })}
      />
    );
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
      <div className="text-sm font-medium text-muted-foreground">
        {index === 0 ? 'Quando' : condition.query_operator?.toUpperCase() || 'E'}
      </div>
      <select
        className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={condition.attribute_key}
        onChange={(e) => {
          // Reset value when changing attribute key
          onChange({ ...condition, attribute_key: e.target.value, values: [''] });
        }}
      >
        <option value="">Selecione o atributo</option>
        {CONDITION_KEYS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <select
        className="w-40 h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={condition.filter_operator}
        onChange={(e) => onChange({ ...condition, filter_operator: e.target.value })}
      >
        {OPERATOR_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {renderValueInput()}
      <select
        className="w-24 h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={condition.query_operator || 'and'}
        onChange={(e) => onChange({ ...condition, query_operator: e.target.value })}
      >
        <option value="and">E</option>
        <option value="or">OU</option>
      </select>
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  );
};

interface ActionRowProps {
  action: AutomationAction;
  onChange: (action: AutomationAction) => void;
  onDelete: () => void;
  index: number;
  formData: FormData;
}

const ActionRow: React.FC<ActionRowProps> = ({ action, onChange, onDelete, index, formData }) => {
  const getValueDisplay = (): string => {
    const params = action.action_params;
    if (Array.isArray(params)) {
      return (params[0] as string) || '';
    }
    if (typeof params === 'object' && params !== null) {
      return JSON.stringify(params);
    }
    return '';
  };

  const handleValueChange = (value: string) => {
    let newParams: string[] | Record<string, unknown>;
    switch (action.action_name) {
      case 'send_message':
      case 'send_webhook_event':
      case 'send_email_transcript':
        newParams = [value];
        break;
      case 'add_label':
      case 'remove_label':
        // Store as array of label IDs
        newParams = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];
        break;
      case 'assign_agent':
      case 'assign_team':
      case 'change_priority':
      case 'change_status':
        newParams = [value];
        break;
      case 'mute_conversation':
      case 'resolve_conversation':
      case 'snooze_conversation':
        newParams = [];
        break;
      default:
        newParams = [value];
    }
    onChange({ ...action, action_params: newParams });
  };

  const renderValueInput = () => {
    switch (action.action_name) {
      case 'change_status':
        return (
          <select
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={getValueDisplay()}
            onChange={(e) => handleValueChange(e.target.value)}
          >
            <option value="">Selecione</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      case 'change_priority':
        return (
          <select
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={getValueDisplay()}
            onChange={(e) => handleValueChange(e.target.value)}
          >
            <option value="">Selecione</option>
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      case 'add_label':
        return (
          <select
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={getValueDisplay()}
            onChange={(e) => handleValueChange(e.target.value)}
          >
            <option value="">Selecione a tag</option>
            {formData.labels.map((label) => (
              <option key={label.id} value={label.title}>
                {label.title}
              </option>
            ))}
          </select>
        );
      case 'remove_label':
        return (
          <select
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={getValueDisplay()}
            onChange={(e) => handleValueChange(e.target.value)}
          >
            <option value="">Selecione a tag</option>
            {formData.labels.map((label) => (
              <option key={label.id} value={label.title}>
                {label.title}
              </option>
            ))}
          </select>
        );
      case 'assign_agent':
        return (
          <select
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={getValueDisplay()}
            onChange={(e) => handleValueChange(e.target.value)}
          >
            <option value="">Selecione o agente</option>
            {formData.agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name || agent.email || agent.id}
              </option>
            ))}
          </select>
        );
      case 'assign_team':
        return (
          <select
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={getValueDisplay()}
            onChange={(e) => handleValueChange(e.target.value)}
          >
            <option value="">Selecione a equipe</option>
            {formData.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name || team.id}
              </option>
            ))}
          </select>
        );
      case 'mute_conversation':
      case 'resolve_conversation':
      case 'snooze_conversation':
        return <span className="text-sm text-muted-foreground italic">Sem parâmetros</span>;
      default:
        return (
          <input
            type="text"
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
            placeholder="Valor ou URL"
            value={getValueDisplay()}
            onChange={(e) => handleValueChange(e.target.value)}
          />
        );
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
      <div className="w-8 text-center text-sm font-medium text-muted-foreground">{index + 1}</div>
      <select
        className="w-48 h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={action.action_name}
        onChange={(e) => onChange({ action_name: e.target.value, action_params: [] })}
      >
        <option value="">Selecione a ação</option>
        {ACTION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {renderValueInput()}
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  );
};

const NewAutomation: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventName, setEventName] = useState<AutomationEventType>('conversation_created');
  const [active, setActive] = useState(true);
  const [mode, setMode] = useState<'simple' | 'flow'>('simple');
  const [conditions, setConditions] = useState<AutomationCondition[]>([]);
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    inboxes: [],
    agents: [],
    teams: [],
    labels: [],
    campaigns: [],
    customAttributes: [],
  });

  const hasLoaded = useRef(false);
  const hasLoadedFormData = useRef(false);

  // Load existing automation if editing
  useEffect(() => {
    if (isEditing && id && !hasLoaded.current) {
      hasLoaded.current = true;
      loadAutomation(id);
    }
  }, [isEditing, id]);

  // Load form data (agents, teams, labels)
  useEffect(() => {
    if (!hasLoadedFormData.current) {
      hasLoadedFormData.current = true;
      loadFormData();
    }
  }, []);

  const loadFormData = async () => {
    try {
      const data = await automationService.getFormData();
      setFormData(data);
    } catch (err: any) {
      console.error('Erro ao carregar dados do formulário:', err);
    }
  };

  const loadAutomation = async (automationId: string) => {
    try {
      setIsLoading(true);
      const response = await automationService.getAutomation(automationId);
      const automation = response.data;
      if (automation) {
        setName(automation.name);
        setDescription(automation.description || '');
        setEventName(automation.event_name as AutomationEventType);
        setActive(automation.active);
        setMode(automation.mode || 'simple');
        setConditions(automation.conditions || []);
        setActions(automation.actions || []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar automação');
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (conditions.length === 0) {
      toast.error('Adicione pelo menos uma condição');
      return;
    }
    if (actions.length === 0) {
      toast.error('Adicione pelo menos uma ação');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload: CreateAutomationPayload | UpdateAutomationPayload = {
        name: name.trim(),
        description: description.trim(),
        event_name: eventName,
        active,
        mode,
        conditions,
        actions,
      };

      if (isEditing && id) {
        await automationService.updateAutomation(id, payload);
        toast.success('Automação atualizada com sucesso!');
      } else {
        await automationService.createAutomation(payload);
        toast.success('Automação criada com sucesso!');
      }
      navigate('/automation');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar automação');
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        attribute_key: '',
        filter_operator: 'equal_to',
        values: [''],
        query_operator: conditions.length > 0 ? 'and' : undefined,
      },
    ]);
  };

  const updateCondition = (index: number, condition: AutomationCondition) => {
    const newConditions = [...conditions];
    newConditions[index] = condition;
    setConditions(newConditions);
  };

  const deleteCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const addAction = () => {
    setActions([
      ...actions,
      {
        action_name: '',
        action_params: [],
      },
    ]);
  };

  const updateAction = (index: number, action: AutomationAction) => {
    const newActions = [...actions];
    newActions[index] = action;
    setActions(newActions);
  };

  const deleteAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/automation')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{isEditing ? 'Editar Automação' : 'Nova Automação'}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/automation')}>
            <X className="w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
          )}

          {/* Basic Info */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Informações Básicas
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <input
                  type="text"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="Ex: Atender novo lead"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Evento Disparador</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value as AutomationEventType)}
                >
                  {EVENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <input
                type="text"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                placeholder="Descrição opcional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-input"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                <span className="text-sm">Ativa</span>
              </label>
            </div>
          </div>

          {/* Conditions */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Condições</h2>
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="w-4 mr-2" />
                Adicionar Condição
              </Button>
            </div>
            {conditions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma condição adicionada. Clique em "Adicionar Condição" para começar.
              </div>
            ) : (
              <div className="space-y-2">
                {conditions.map((condition, index) => (
                  <ConditionRow
                    key={index}
                    condition={condition}
                    onChange={(c) => updateCondition(index, c)}
                    onDelete={() => deleteCondition(index)}
                    index={index}
                    formData={formData}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ações</h2>
              <Button variant="outline" size="sm" onClick={addAction}>
                <Plus className="w-4 mr-2" />
                Adicionar Ação
              </Button>
            </div>
            {actions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma ação adicionada. Clique em "Adicionar Ação" para começar.
              </div>
            ) : (
              <div className="space-y-2">
                {actions.map((action, index) => (
                  <ActionRow
                    key={index}
                    action={action}
                    onChange={(a) => updateAction(index, a)}
                    onDelete={() => deleteAction(index)}
                    index={index}
                    formData={formData}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAutomation;
