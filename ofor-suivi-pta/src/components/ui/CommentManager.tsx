import { useState } from "react";
import { MessageSquare, X, Send, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Comment, formatCommentDate } from "@/types/comment";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommentManagerProps {
  comments: Comment[];
  onCommentsChange?: (comments: Comment[]) => void;
  readOnly?: boolean;
  maxComments?: number;
  currentUser?: string;
  compact?: boolean;
}

const CommentManager = ({
  comments,
  onCommentsChange,
  readOnly = false,
  maxComments = 100,
  currentUser = "Utilisateur",
  compact = true,
}: CommentManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (!newComment.trim() || !onCommentsChange) return;

    if (comments.length >= maxComments) {
      toast.error(`Maximum ${maxComments} commentaires autorisés`);
      return;
    }

    const comment: Comment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: newComment.trim(),
      author: currentUser,
      createdAt: new Date().toISOString(),
    };

    onCommentsChange([comment, ...comments]);
    setNewComment("");
    toast.success("Commentaire ajouté");
  };

  const handleRemove = (id: string) => {
    if (!onCommentsChange) return;
    onCommentsChange(comments.filter((c) => c.id !== id));
    toast.success("Commentaire supprimé");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 gap-1.5 text-muted-foreground hover:text-primary",
            comments.length > 0 && "text-primary"
          )}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {comments.length > 0 && (
            <span className="text-xs font-medium">{comments.length}</span>
          )}
          {!compact && <span className="text-xs">Commentaires</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-primary" />
              Commentaires
              {comments.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 text-xs">
                  {comments.length}
                </Badge>
              )}
            </h4>
          </div>
        </div>

        {/* Comment input */}
        {!readOnly && onCommentsChange && (
          <div className="p-3 border-b">
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ajouter un commentaire..."
                className="min-h-[60px] text-xs resize-none"
                maxLength={500}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-muted-foreground">
                {newComment.length}/500
              </span>
              <Button
                type="button"
                size="sm"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="h-7 px-3 text-xs gap-1"
              >
                <Send className="w-3 h-3" />
                Envoyer
              </Button>
            </div>
          </div>
        )}

        {/* Comments list */}
        <ScrollArea className="max-h-[300px]">
          {comments.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Aucun commentaire</p>
            </div>
          ) : (
            <div className="divide-y">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium">{comment.author}</span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-2.5 h-2.5" />
                          {formatCommentDate(comment.createdAt)}
                        </div>
                      </div>
                    </div>
                    {!readOnly && onCommentsChange && (
                      <button
                        type="button"
                        onClick={() => handleRemove(comment.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition-all"
                        title="Supprimer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 pl-8 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default CommentManager;
