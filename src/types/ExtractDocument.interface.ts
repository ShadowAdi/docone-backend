export interface ExtractedDocument{
    id:string;
    text:string;
    type: 'paragraph' | 'line' | 'text-run';
}