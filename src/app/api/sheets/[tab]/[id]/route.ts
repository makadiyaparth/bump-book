/* ============================================
   Sheets Row Update/Delete Route
   PUT: Update a row | DELETE: Delete a row
   ============================================ */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SheetsService, resolveSpreadsheetId } from '@/lib/sheets';
import { SHEET_HEADERS } from '@/lib/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tab: string; id: string }> }
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

