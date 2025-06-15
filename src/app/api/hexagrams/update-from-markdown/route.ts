
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import clientPromise from '@/lib/database';
import Hexagram from '@/models/Hexagram';

// Helper function to parse the name and koreanName
const parseNameAndKoreanName = (nameField: string): { name: string; koreanName?: string } => {
  nameField = nameField.replace(/\\*\\*/g, ''); // Remove bold markers
  const match = nameField.match(/([^（]+)（([^）]+)）/);
  if (match) {
    return { name: match[1].trim(), koreanName: match[2].trim() };
  }
  return { name: nameField.trim() };
};

export async function POST() {
  try {
    await clientPromise();

    const filePath = path.join(process.cwd(), 'docs', 'mental_models.md');
    const markdownContent = await fs.readFile(filePath, 'utf-8');
    const lines = markdownContent.split('\\n');

    const hexagramData = [];
    let tableStarted = false;

    for (const line of lines) {
      if (line.startsWith('|---|')) {
        tableStarted = true;
        continue;
      }
      if (!tableStarted || !line.startsWith('|')) {
        continue;
      }

      const cells = line.split('|').map(cell => cell.trim()).slice(1, -1); // Get content cells

      if (cells.length >= 6 && cells[0] !== '**번호**') { // Ensure it's a data row and has enough cells
        const number = parseInt(cells[0], 10);
        if (isNaN(number)) continue; // Skip if number is not valid

        const parsedName = parseNameAndKoreanName(cells[2]);
        
        hexagramData.push({
          number: number,
          symbol: cells[1],
          name: parsedName.name,
          koreanName: parsedName.koreanName,
          coreViewpoint: cells[3],
          mentalModels: cells[4] === '-' ? '' : cells[4],
          summary: cells[5],
        });
      }
    }

    if (hexagramData.length === 0) {
      return NextResponse.json({ success: false, message: 'No hexagram data found in Markdown or table format incorrect.' }, { status: 400 });
    }

    let updatedCount = 0;
    let createdCount = 0;
    const errors = [];

    for (const data of hexagramData) {
      try {
        const result = await Hexagram.findOneAndUpdate(
          { number: data.number },
          {
            $set: {
              symbol: data.symbol,
              name: data.name,
              koreanName: data.koreanName,
              coreViewpoint: data.coreViewpoint,
              mentalModels: data.mentalModels,
              summary: data.summary,
              // perspectives will be kept as is or default if new
            }
          },
          { upsert: true, new: true, runValidators: true }
        );
        if (result) {
          // Check if it was an upsert that created a new document
          // Mongoose doesn't directly tell if upsert created or updated in findOneAndUpdate result easily
          // We can assume if it's new and matches, it's either updated or created.
          // For more precise count, one might need to check existence before upsert or check timestamps.
          // However, for this purpose, we'll count every successful operation.
          // A more robust way would be to query first, then update/insert.
          // For simplicity here, we'll just increment updatedCount for any successful operation.
          // To differentiate, we could check if result.createdAt is very recent or if specific fields were just set.
          // Let's assume for now: if it existed, it's updated. If upserted, it's created.
          // This distinction is hard with findOneAndUpdate alone.
          // We'll count successful operations as 'processed'.
          updatedCount++; // Simplified: counting all successful upserts as "processed"
        }
      } catch (e: any) {
        errors.push({ number: data.number, error: e.message });
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Some hexagrams failed to update.',
        processedCount: updatedCount, // Renamed from updatedCount for clarity
        errors 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${updatedCount} hexagrams from Markdown.`,
      processedCount: updatedCount,
    });

  } catch (error: any) {
    console.error('Error updating hexagrams from Markdown:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update hexagrams from Markdown.', 
      error: error.message 
    }, { status: 500 });
  }
}
