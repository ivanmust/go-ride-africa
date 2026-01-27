import { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trash2,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { DocumentType, DocumentStatus, DriverDocument } from '@/hooks/useDriverDocuments';

interface DocumentUploadCardProps {
  type: DocumentType;
  label: string;
  description: string;
  required: boolean;
  document?: DriverDocument;
  uploading: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
  onView: () => void;
}

const statusConfig: Record<DocumentStatus, { label: string; icon: typeof Clock; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending Review', icon: Clock, variant: 'secondary' },
  approved: { label: 'Approved', icon: CheckCircle2, variant: 'default' },
  rejected: { label: 'Rejected', icon: XCircle, variant: 'destructive' },
};

export const DocumentUploadCard = ({
  type,
  label,
  description,
  required,
  document,
  uploading,
  onUpload,
  onDelete,
  onView,
}: DocumentUploadCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const status = document ? statusConfig[document.status] : null;
  const StatusIcon = status?.icon || Clock;

  return (
    <Card className={`transition-all ${dragOver ? 'ring-2 ring-primary border-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            document?.status === 'approved' 
              ? 'bg-goride-green-light' 
              : document?.status === 'rejected'
              ? 'bg-destructive/10'
              : 'bg-secondary'
          }`}>
            {document?.status === 'approved' ? (
              <CheckCircle2 className="w-6 h-6 text-primary" />
            ) : document?.status === 'rejected' ? (
              <XCircle className="w-6 h-6 text-destructive" />
            ) : document ? (
              <FileText className="w-6 h-6 text-muted-foreground" />
            ) : (
              <Upload className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  {label}
                  {required && (
                    <span className="text-xs text-destructive">*</span>
                  )}
                </h4>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              {status && (
                <Badge variant={status.variant} className="flex-shrink-0">
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              )}
            </div>

            {/* Rejection reason */}
            {document?.status === 'rejected' && document.rejection_reason && (
              <div className="mt-2 p-2 bg-destructive/10 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{document.rejection_reason}</p>
              </div>
            )}

            {/* File name */}
            {document && (
              <p className="text-xs text-muted-foreground mt-2 truncate">
                {document.file_name}
              </p>
            )}

            {/* Actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {document ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onView}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {document.status !== 'approved' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-1" />
                        )}
                        Replace
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDelete}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <div
                  className="w-full"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Button
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    or drag and drop • JPG, PNG, PDF up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};
