import { Paperclip, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AttachmentManager from "@/components/ui/AttachmentManager";
import CommentManager from "@/components/ui/CommentManager";
import { Attachment } from "@/types/attachment";
import { Comment } from "@/types/comment";
import { cn } from "@/lib/utils";

interface DocumentsCommentsSectionProps {
  attachments: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  comments: Comment[];
  onCommentsChange?: (comments: Comment[]) => void;
  readOnly?: boolean;
  currentUser?: string;
  className?: string;
  compact?: boolean;
}

const DocumentsCommentsSection = ({
  attachments,
  onAttachmentsChange,
  comments,
  onCommentsChange,
  readOnly = false,
  currentUser = "Utilisateur",
  className,
  compact = false,
}: DocumentsCommentsSectionProps) => {
  const hasContent = attachments.length > 0 || comments.length > 0;

  return (
    <div className={cn("border-t pt-3 mt-3", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Paperclip className="w-3.5 h-3.5" />
          <span>Documents & Commentaires</span>
          {hasContent && (
            <div className="flex gap-1 ml-2">
              {attachments.length > 0 && (
                <Badge variant="outline" className="h-5 text-[10px] gap-0.5">
                  <Paperclip className="w-2.5 h-2.5" />
                  {attachments.length}
                </Badge>
              )}
              {comments.length > 0 && (
                <Badge variant="outline" className="h-5 text-[10px] gap-0.5">
                  <MessageSquare className="w-2.5 h-2.5" />
                  {comments.length}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Attachments */}
          <AttachmentManager
            attachments={attachments}
            onAttachmentsChange={onAttachmentsChange}
            readOnly={readOnly}
            compact
          />
          
          <Separator orientation="vertical" className="h-4 mx-1" />
          
          {/* Comments */}
          <CommentManager
            comments={comments}
            onCommentsChange={onCommentsChange}
            readOnly={readOnly}
            currentUser={currentUser}
            compact
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentsCommentsSection;
