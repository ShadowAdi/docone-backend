import fs from "fs";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

interface ExtractedItem {
    id: string;
    text: string;
    type: 'paragraph' | 'line';
}

// Extract text from DOCX file (preserving structure)
export const extractFromDocx = async (filePath: string): Promise<ExtractedItem[]> => {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    
    // Split by paragraphs (double newlines) or lines
    const lines = result.value.split('\n');
    
    return lines
        .filter(line => line.trim().length > 0)
        .map((text, index) => ({
            id: `line_${index}`,
            text: text.trim(),
            type: 'line' as const
        }));
};

// Extract text from DOC file (old format)
export const extractFromDoc = async (filePath: string): Promise<ExtractedItem[]> => {
    // Mammoth also supports .doc files
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    
    const lines = result.value.split('\n');
    
    return lines
        .filter(line => line.trim().length > 0)
        .map((text, index) => ({
            id: `line_${index}`,
            text: text.trim(),
            type: 'line' as const
        }));
};

// Extract text from PDF file
export const extractFromPdf = async (filePath: string): Promise<ExtractedItem[]> => {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    
    const lines = data.text.split('\n');
    
    return lines
        .filter(line => line.trim().length > 0)
        .map((text, index) => ({
            id: `line_${index}`,
            text: text.trim(),
            type: 'line' as const
        }));
};

// Main function to extract from any supported file type
export const extractDocument = async (filePath: string): Promise<ExtractedItem[]> => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    switch (extension) {
        case 'docx':
            return await extractFromDocx(filePath);
        case 'doc':
            return await extractFromDoc(filePath);
        case 'pdf':
            return await extractFromPdf(filePath);
        default:
            throw new Error(`Unsupported file type: ${extension}`);
    }
};

// Test the extraction
const testExtraction = async () => {
    try {
        // Change this to your file path - use .docx instead of .doc
        const extracted = await extractDocument("./src/data/test.docx");
        console.log('Extracted items:', extracted.length);
        console.log('Sample:', extracted.slice(0, 5));
    } catch (error) {
        console.error('Error:', error);
    }
};

testExtraction();