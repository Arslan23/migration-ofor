import { useState, useRef } from "react";
import { Paperclip, X, FileText, Image, File, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Attachment, formatFileSize } from "@/types/attachment";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AttachmentManagerProps {
  attachments: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  readOnly?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  compact?: boolean;
}

const getFileIcon = (type: string) => {
  if (type.includes('pdf') || type.includes('word') || type.includes('text')) {
    return <FileText className="w-3 h-3" />;
  }
  if (type.includes('image')) {
    return <Image className="w-3 h-3" />;
  }
  return <File className="w-3 h-3" />;
};

const getFileColor = (type: string): string => {
  if (type.includes('pdf')) return 'bg-red-100 text-red-700 hover:bg-red-200';
  if (type.includes('image')) return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
  if (type.includes('word') || type.includes('document')) return 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200';
  if (type.includes('excel') || type.includes('spreadsheet')) return 'bg-green-100 text-green-700 hover:bg-green-200';
  return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
};

const AttachmentManager = ({
  attachments,
  onAttachmentsChange,
  readOnly = false,
  maxFiles = 10,
  maxFileSize = 10, // 10MB default
  acceptedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif'],
  compact = true,
}: AttachmentManagerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !onAttachmentsChange) return;

    const newAttachments: Attachment[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      // Check max files
      if (attachments.length + newAttachments.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} fichiers autorisés`);
        return;
      }

      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push(`${file.name}: taille maximale ${maxFileSize}MB dépassée`);
        return;
      }

      newAttachments.push({
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      });
    });

    if (errors.length > 0) {
      toast.error(errors.join('\n'));
    }

    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
      toast.success(`${newAttachments.length} fichier(s) ajouté(s)`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (id: string) => {
    if (!onAttachmentsChange) return;
    onAttachmentsChange(attachments.filter((a) => a.id !== id));
    toast.success("Fichier supprimé");
  };

  const truncateName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    const ext = name.split('.').pop() || '';
    const baseName = name.slice(0, name.length - ext.length - 1);
    const truncatedBase = baseName.slice(0, maxLength - ext.length - 4);
    return `${truncatedBase}...${ext}`;
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Attachments badges */}
      {attachments.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {attachments.slice(0, compact ? 3 : attachments.length).map((att) => (
            <Badge
              key={att.id}
              variant="secondary"
              className={cn(
                "text-[10px] h-5 px-1.5 gap-1 font-normal cursor-pointer transition-colors",
                getFileColor(att.type)
              )}
            >
              {getFileIcon(att.type)}
              <span className="max-w-[60px] truncate">{truncateName(att.name, 12)}</span>
              {!readOnly && onAttachmentsChange && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(att.id);
                  }}
                  className="ml-0.5 hover:text-red-600 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </Badge>
          ))}
          {compact && attachments.length > 3 && (
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 px-1.5 cursor-pointer hover:bg-muted"
                >
                  +{attachments.length - 3}
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Documents attachés ({attachments.length})
                  </p>
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className={cn(
                        "flex items-center justify-between gap-2 p-1.5 rounded text-xs",
                        getFileColor(att.type)
                      )}
                    >
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {getFileIcon(att.type)}
                        <span className="truncate">{att.name}</span>
                      </div>
                      <span className="text-[10px] opacity-60 shrink-0">
                        {formatFileSize(att.size)}
                      </span>
                      {!readOnly && onAttachmentsChange && (
                        <button
                          type="button"
                          onClick={() => handleRemove(att.id)}
                          className="hover:text-red-600 transition-colors shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}

      {/* Add button */}
      {!readOnly && onAttachmentsChange && attachments.length < maxFiles && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
            title="Ajouter des documents"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </Button>
        </>
      )}

      {/* Read-only paperclip indicator when no attachments */}
      {readOnly && attachments.length === 0 && (
        <span className="text-muted-foreground/50">
          <Paperclip className="w-3 h-3" />
        </span>
      )}
    </div>
  );
};

export default AttachmentManager;
