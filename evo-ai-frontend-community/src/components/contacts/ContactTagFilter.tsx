import { useMemo, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Button,
  Checkbox,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@evoapi/design-system';
import { ChevronDown, Tag } from 'lucide-react';
import { Label } from '@/types/settings';

interface ContactTagFilterProps {
  availableLabels: Label[];
  selectedLabels: string[];
  onSelectionChange: (labels: string[]) => void | Promise<void>;
}

export default function ContactTagFilter({
  availableLabels,
  selectedLabels,
  onSelectionChange,
}: ContactTagFilterProps) {
  const { t } = useLanguage('contacts');
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const filteredLabels = useMemo(
    () =>
      availableLabels.filter(label =>
        label.title.toLowerCase().includes(searchValue.trim().toLowerCase()),
      ),
    [availableLabels, searchValue],
  );

  const allSelected =
    availableLabels.length > 0 && selectedLabels.length === availableLabels.length;

  const toggleLabel = (labelTitle: string) => {
    if (selectedLabels.includes(labelTitle)) {
      void onSelectionChange(selectedLabels.filter(label => label !== labelTitle));
      return;
    }

    void onSelectionChange([...selectedLabels, labelTitle]);
  };

  const buttonLabel =
    selectedLabels.length > 0
      ? t('tagFilter.buttonWithCount', { count: selectedLabels.length })
      : t('tagFilter.button');

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-sidebar border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Tag className="h-4 w-4 mr-2" />
            {buttonLabel}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="border-b px-3 py-3">
            <div className="text-sm font-medium">{t('tagFilter.title')}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('tagFilter.description')}
            </div>
            <Input
              value={searchValue}
              onChange={event => setSearchValue(event.target.value)}
              placeholder={t('tagFilter.searchPlaceholder')}
              className="mt-3"
            />
          </div>

          <div className="flex items-center justify-between border-b px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void onSelectionChange(availableLabels.map(label => label.title))}
              disabled={availableLabels.length === 0 || allSelected}
            >
              {t('tagFilter.selectAll')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void onSelectionChange([])}
              disabled={selectedLabels.length === 0}
            >
              {t('tagFilter.clearAll')}
            </Button>
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {availableLabels.length === 0 ? (
              <div className="px-2 py-6 text-sm text-center text-muted-foreground">
                {t('tagFilter.empty')}
              </div>
            ) : filteredLabels.length === 0 ? (
              <div className="px-2 py-6 text-sm text-center text-muted-foreground">
                {t('tagFilter.noResults')}
              </div>
            ) : (
              filteredLabels.map(label => {
                const checked = selectedLabels.includes(label.title);

                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(label.title)}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted"
                  >
                    <Checkbox checked={checked} className="pointer-events-none" />
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{label.title}</div>
                      {label.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {label.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
