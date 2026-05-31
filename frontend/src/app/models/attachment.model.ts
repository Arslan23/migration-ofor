export interface Attachment {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
    uploadedAt: string;
    uploadedBy?: string;
}

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return 'file-text';
    if (type.includes('image')) return 'image';
    if (type.includes('word') || type.includes('document')) return 'file-text';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'file-spreadsheet';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'file-presentation';
    return 'file';
};
