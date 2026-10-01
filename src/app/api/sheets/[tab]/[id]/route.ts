/* ============================================
   Sheets Row Update/Delete Route
   PUT: Update a row | DELETE: Delete a row
   ============================================ */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SheetsService, resolveSpreadsheetId } from '@/lib/sheets';
import { SHEET_HEADERS } from '@/lib/types';
import { getDemoSheetRowById } from '@/lib/demo-data';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tab: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tab, id } = await params;

    if (!SHEET_HEADERS[tab]) {
      return NextResponse.json({ error: 'Invalid tab' }, { status: 400 });
    }

    if (session.isDemo) {
      const row = getDemoSheetRowById(tab, id);
      if (!row) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }
      return NextResponse.json({ data: row });
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

    const service = new SheetsService(session.accessToken, spreadsheetId);
    const found = await service.findRowById(tab, id);
    if (!found) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ data: found.data });
  } catch (error) {
    console.error('Error fetching row:', error);
    return NextResponse.json({ error: 'Failed to fetch record' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tab: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Block modifications in demo mode
    if (session.isDemo) {
      return NextResponse.json(
        { error: 'Demo mode is read-only. Sign in with Google to edit records.' },
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

    const { tab, id } = await params;

    if (!SHEET_HEADERS[tab]) {
      return NextResponse.json({ error: 'Invalid tab' }, { status: 400 });
    }

    const body = await req.json();
    const service = new SheetsService(session.accessToken, spreadsheetId);

    const found = await service.findRowById(tab, id);
    if (!found) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    await service.updateRow(tab, found.rowIndex, { ...found.data, ...body });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating row:', error);
    return NextResponse.json(
      { error: 'Failed to update' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tab: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Block deletion in demo mode
    if (session.isDemo) {
      return NextResponse.json(
        { error: 'Demo mode is read-only. Sign in with Google to delete records.' },
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

    const { tab, id } = await params;

    if (!SHEET_HEADERS[tab]) {
      return NextResponse.json({ error: 'Invalid tab' }, { status: 400 });
    }

    const service = new SheetsService(session.accessToken, spreadsheetId);

    const found = await service.findRowById(tab, id);
    if (!found) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    await service.deleteRow(tab, found.rowIndex);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting row:', error);
    return NextResponse.json(
      { error: 'Failed to delete' },
      { status: 500 }
    );
  }
}

