/* ============================================
   Setup / Refresh Overview & Charts Sheet
   Creates or updates the dedicated Overview & Charts
   tab with live formulas, KPIs, and embedded charts.
   ============================================ */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SheetsService, resolveSpreadsheetId } from '@/lib/sheets';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.isDemo) {
      return NextResponse.json({
        success: true,
        sheetId: 0,
        url: 'https://docs.google.com/spreadsheets/d/demo-spreadsheet-id/edit#gid=0',
        message: 'Demo mode simulated: Overview & Charts tab is active.',
      });
    }

    const spreadsheetId = await resolveSpreadsheetId(
      session.accessToken,
      session.user?.email,
      session.spreadsheetId
    );

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Spreadsheet not found. Please complete setup in onboarding.' },
        { status: 404 }
      );
    }

    const result = await SheetsService.setupOverviewChartsSheet(
      session.accessToken,
      spreadsheetId
    );

    return NextResponse.json({
      success: true,
      sheetId: result.sheetId,
      url: result.url,
    });
  } catch (error) {
    console.error('Error generating overview charts sheet:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to setup charts sheet' },
      { status: 500 }
    );
  }
}
