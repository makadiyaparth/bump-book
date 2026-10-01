/* ============================================
   Generic Sheets CRUD Route
   GET: Read all rows | POST: Append a row
   ============================================ */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SheetsService, resolveSpreadsheetId } from '@/lib/sheets';
import { SHEET_HEADERS } from '@/lib/types';
import { getDemoSheetRows } from '@/lib/demo-data';
import { ServerCache } from '@/lib/cache';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tab: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tab } = await params;

    if (!SHEET_HEADERS[tab]) {
      return NextResponse.json({ error: 'Invalid tab' }, { status: 400 });
    }

    // Serve prefilled demo data in demo mode
    if (session.isDemo) {
      const rows = getDemoSheetRows(tab);
      return NextResponse.json({ data: rows, cached: true });
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

    const isForceRefresh = req.nextUrl.searchParams.get('refresh') === 'true';

    // Check server in-memory cache unless caller explicitly requested fresh data
    if (!isForceRefresh) {
      const cached = ServerCache.get<Record<string, string>[]>(spreadsheetId, tab);
      if (cached) {
        return NextResponse.json({ data: cached, cached: true });
      }
    }

    const service = new SheetsService(session.accessToken, spreadsheetId);
    const rows = await service.getRows(tab);

    // Cache the retrieved rows for 1 hour
    ServerCache.set(spreadsheetId, tab, rows);

    return NextResponse.json({ data: rows, cached: false });
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

    // Block modifications in demo mode
    if (session.isDemo) {
      return NextResponse.json(
        { error: 'Demo mode is read-only. Sign in with Google to add records.' },
        { status: 403 }
      );
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

    // Invalidate cached rows for this tab so subsequent reads fetch fresh data
    ServerCache.invalidate(spreadsheetId, tab);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing to sheet:', error);
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    );
  }
}

