import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type DocumentType = 'drivers_license' | 'national_id' | 'vehicle_registration' | 'insurance' | 'inspection_certificate';
export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export interface DriverDocument {
  id: string;
  user_id: string;
  document_type: DocumentType;
  file_path: string;
  file_name: string;
  status: DocumentStatus;
  rejection_reason: string | null;
  uploaded_at: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const DOCUMENT_TYPES: { type: DocumentType; label: string; description: string; required: boolean }[] = [
  { type: 'drivers_license', label: "Driver's License", description: 'Valid driver license (front & back)', required: true },
  { type: 'national_id', label: 'National ID / Passport', description: 'Government-issued ID document', required: true },
  { type: 'vehicle_registration', label: 'Vehicle Registration', description: 'Vehicle ownership document', required: true },
  { type: 'insurance', label: 'Vehicle Insurance', description: 'Proof of vehicle insurance', required: true },
  { type: 'inspection_certificate', label: 'Inspection Certificate', description: 'Vehicle inspection certificate', required: false },
];

export const useDriverDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DocumentType | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion since we know the structure matches
      setDocuments((data || []) as unknown as DriverDocument[]);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = async (documentType: DocumentType, file: File) => {
    if (!user) {
      toast.error('You must be logged in to upload documents');
      return { error: new Error('Not authenticated') };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, WebP or PDF file');
      return { error: new Error('Invalid file type') };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return { error: new Error('File too large') };
    }

    setUploading(documentType);

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Check if document record already exists
      const existingDoc = documents.find(d => d.document_type === documentType);

      if (existingDoc) {
        // Delete old file if exists
        if (existingDoc.file_path) {
          await supabase.storage
            .from('driver-documents')
            .remove([existingDoc.file_path]);
        }

        // Update existing record
        const { error: updateError } = await supabase
          .from('driver_documents')
          .update({
            file_path: filePath,
            file_name: file.name,
            status: 'pending',
            rejection_reason: null,
            uploaded_at: new Date().toISOString(),
            reviewed_at: null,
          })
          .eq('id', existingDoc.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('driver_documents')
          .insert({
            user_id: user.id,
            document_type: documentType,
            file_path: filePath,
            file_name: file.name,
            status: 'pending',
          });

        if (insertError) throw insertError;
      }

      toast.success('Document uploaded successfully');
      await fetchDocuments();
      return { error: null };
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
      return { error: error as Error };
    } finally {
      setUploading(null);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const doc = documents.find(d => d.id === documentId);
      if (!doc) throw new Error('Document not found');

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('driver-documents')
        .remove([doc.file_path]);

      if (storageError) console.warn('Error deleting file:', storageError);

      // Delete record from database
      const { error: deleteError } = await supabase
        .from('driver_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;

      toast.success('Document deleted');
      await fetchDocuments();
      return { error: null };
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
      return { error: error as Error };
    }
  };

  const getDocumentUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('driver-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Error getting document URL:', error);
      return null;
    }

    return data.signedUrl;
  };

  const getDocumentByType = (type: DocumentType): DriverDocument | undefined => {
    return documents.find(d => d.document_type === type);
  };

  const getCompletionStatus = () => {
    const requiredDocs = DOCUMENT_TYPES.filter(d => d.required);
    const uploadedRequiredDocs = requiredDocs.filter(d => 
      documents.some(doc => doc.document_type === d.type)
    );
    const approvedDocs = documents.filter(d => d.status === 'approved');
    
    return {
      total: DOCUMENT_TYPES.length,
      required: requiredDocs.length,
      uploaded: documents.length,
      uploadedRequired: uploadedRequiredDocs.length,
      approved: approvedDocs.length,
      isComplete: uploadedRequiredDocs.length === requiredDocs.length,
      isApproved: approvedDocs.length === requiredDocs.length,
    };
  };

  return {
    documents,
    loading,
    uploading,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    getDocumentByType,
    getCompletionStatus,
    refetch: fetchDocuments,
  };
};
