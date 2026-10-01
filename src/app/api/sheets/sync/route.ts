/* ============================================
   Manual Cache Invalidation / Sync Endpoint
   Allows users to force sync with their Google Sheets
   ============================================ */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { resolveSpreadsheetId } from '@/lib/sheets';
import { ServerCache } from '@/lib/cache';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.isDemo) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode is always synced with sample data.',
      });
    }

    const spreadsheetId = await resolveSpreadsheetId(
      session.accessToken,
      session.user?.email,
      session.spreadsheetId
    );

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Spreadsheet not found.' },
        { status: 404 }
      );
    }

    let tab: string | undefined;
    try {
      const body = await req.json();
      tab = body?.tab;
    } catch {
      // Body is optional
    }

    if (tab) {
      ServerCache.invalidate(spreadsheetId, tab);
    } else {
      ServerCache.clearSpreadsheet(spreadsheetId);
    }

    return NextResponse.json({
      success: true,
      message: tab
        ? `Cache refreshed for tab ${tab}`
        : 'All sheets cache cleared. Next request will fetch fresh data from Google Sheets.',
    });
  } catch (error) {
    console.error('Error syncing sheets cache:', error);
    return NextResponse.json(
      { error: 'Failed to sync cache' },
      { status: 500 }
    );
  }
}
