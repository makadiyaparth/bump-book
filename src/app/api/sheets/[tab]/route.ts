/* ============================================
   Generic Sheets CRUD Route
   GET: Read all rows | POST: Append a row
   ============================================ */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SheetsService, resolveSpreadsheetId } from '@/lib/sheets';
import { SHEET_HEADERS } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tab: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const spreadsheetId = await resolveSpreadsheetId(
      session.accessToken,
      session.user?.email,
      session.spreadsheetId
    );

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Spreadsheet not found. Please complete setup.' },
        { status: 404 }
      );
    }

    const { tab } = await params;

    if (!SHEET_HEADERS[tab]) {
      return NextResponse.json({ error: 'Invalid tab' }, { status: 400 });
    }

    const service = new SheetsService(session.accessToken, spreadsheetId);
    const rows = await service.getRows(tab);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Error reading sheet:', error);
    return NextResponse.json(
      { error: 'Failed to read data' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tab: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const spreadsheetId = await resolveSpreadsheetId(
      session.accessToken,
      session.user?.email,
      session.spreadsheetId
    );

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Spreadsheet not found. Please complete setup.' },
        { status: 404 }
      );
    }

    const { tab } = await params;

    if (!SHEET_HEADERS[tab]) {
      return NextResponse.json({ error: 'Invalid tab' }, { status: 400 });
    }

    const body = await req.json();

    const service = new SheetsService(session.accessToken, spreadsheetId);
    await service.appendRow(tab, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing to sheet:', error);
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    );
  }
}

