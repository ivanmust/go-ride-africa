import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useDriverDocuments, DOCUMENT_TYPES } from '@/hooks/useDriverDocuments';
import { DocumentUploadCard } from './DocumentUploadCard';

export const DriverDocumentsSection = () => {
  const { 
    documents, 
    loading, 
    uploading, 
    uploadDocument, 
    deleteDocument, 
    getDocumentUrl,
    getDocumentByType,
    getCompletionStatus 
  } = useDriverDocuments();
  
  const [viewingDocument, setViewingDocument] = useState<{ url: string; name: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const completionStatus = getCompletionStatus();
  const progressPercent = (completionStatus.uploadedRequired / completionStatus.required) * 100;

  const handleViewDocument = async (filePath: string, fileName: string) => {
    setLoadingPreview(true);
    const url = await getDocumentUrl(filePath);
    setLoadingPreview(false);
    
    if (url) {
      setViewingDocument({ url, name: fileName });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Required Documents
              </CardTitle>
              <CardDescription>
                Upload your documents for verification. Required documents are marked with *
              </CardDescription>
            </div>
            {completionStatus.isComplete ? (
              <Badge variant="default" className="bg-primary">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="w-3 h-3 mr-1" />
                {completionStatus.uploadedRequired}/{completionStatus.required} Required
              </Badge>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Document Completion</span>
              <span className="font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {DOCUMENT_TYPES.map((docType) => {
            const doc = getDocumentByType(docType.type);
            return (
              <DocumentUploadCard
                key={docType.type}
                type={docType.type}
                label={docType.label}
                description={docType.description}
                required={docType.required}
                document={doc}
                uploading={uploading === docType.type}
                onUpload={(file) => uploadDocument(docType.type, file)}
                onDelete={() => doc && deleteDocument(doc.id)}
                onView={() => doc && handleViewDocument(doc.file_path, doc.file_name)}
              />
            );
          })}
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewingDocument?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {loadingPreview ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : viewingDocument?.url.includes('.pdf') ? (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  PDF preview may not work in all browsers. Click below to open in a new tab.
                </p>
                <Button onClick={() => window.open(viewingDocument.url, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open PDF
                </Button>
                <iframe 
                  src={viewingDocument.url} 
                  className="w-full h-[60vh] border rounded-lg"
                  title="Document Preview"
                />
              </div>
            ) : (
              <img 
                src={viewingDocument?.url} 
                alt="Document Preview" 
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
