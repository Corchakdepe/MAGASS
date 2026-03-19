// app/api/results/[runId]/[filename]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const RESULTS_BASE_PATH = process.env.RESULTS_PATH || path.join(process.cwd(), 'results');

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string; filename: string } }
) {
  try {
    const { runId, filename } = params;

    // Security: prevent path traversal
    const safeRunId = path.basename(runId);
    const safeFilename = path.basename(filename);

    const filePath = path.join(RESULTS_BASE_PATH, safeRunId, safeFilename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type
    const ext = path.extname(safeFilename).toLowerCase();
    const contentType = ext === '.csv'
      ? 'text/csv'
      : ext === '.txt'
      ? 'text/plain'
      : 'application/octet-stream';

    // Return file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}