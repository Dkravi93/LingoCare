import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export const extractTextFromBuffer = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text.trim();
  } catch (err) {
    throw new Error('PDF parsing failed');
  }
};