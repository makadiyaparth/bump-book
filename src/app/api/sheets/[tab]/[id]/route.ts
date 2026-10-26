/* ============================================
   Sheets Row Update/Delete Route
   PUT: Update a row | DELETE: Delete a row
   ============================================ */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SheetsService, resolveSpreadsheetId } from '@/lib/sheets';
import { SHEET_HEADERS } from '@/lib/types';
import { getDemoSheetRowById, updateDemoSheetRow } from '@/lib/demo-data';
import { ServerCache } from '@/lib/cache';
import { generateVaccineSchedule } from '@/lib/postpartum';

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

    const { tab, id } = await params;

    if (!SHEET_HEADERS[tab]) {
      return NextResponse.json({ error: 'Invalid tab' }, { status: 400 });
    }

    // In demo mode, allow updating demo record in memory
    if (session.isDemo) {
      const body = await req.json();
      updateDemoSheetRow(tab, id, body);
      return NextResponse.json({ success: true });
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

    const body = await req.json();
    const service = new SheetsService(session.accessToken, spreadsheetId);

    const found = await service.findRowById(tab, id);
    if (!found) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    await service.updateRow(tab, found.rowIndex, { ...found.data, ...body });

    // Auto-seed vaccination calendar if delivery date was just set and vaccinations are empty
    if (tab === 'Pregnancy' && body.delivery_date && body.delivery_date.trim() !== '') {
      try {
        const existingVaccines = await service.getRows('Vaccinations');
        if (existingVaccines.length === 0) {
          const defaultSchedule = generateVaccineSchedule(body.delivery_date);
          const rowsToAppend = defaultSchedule.map((v) => ({
            id: v.id,
            vaccine_name: v.vaccineName,
            dose_number: v.doseNumber,
            target_disease: v.targetDisease,
            recommended_age_str: v.recommendedAgeStr,
            recommended_age_days: String(v.recommendedAgeDays),
            due_date: v.dueDate,
            status: v.status,
            given_date: v.givenDate,
            doctor_name: v.doctorName,
            hospital: v.hospital,
            batch_no: v.batchNo,
            reactions: v.reactions,
            cost: '',
            notes: v.notes,
            created_at: v.createdAt,
          }));
          await service.appendRows('Vaccinations', rowsToAppend);
          ServerCache.invalidate(spreadsheetId, 'Vaccinations');
        }
      } catch (vacErr) {
        console.warn('Could not auto-seed vaccinations:', vacErr);
      }
    }

    // Invalidate cached rows for this tab so subsequent reads fetch fresh data
    ServerCache.invalidate(spreadsheetId, tab);

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

    // Invalidate cached rows for this tab so subsequent reads fetch fresh data
    ServerCache.invalidate(spreadsheetId, tab);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting row:', error);
    return NextResponse.json(
      { error: 'Failed to delete' },
      { status: 500 }
    );
  }
}

