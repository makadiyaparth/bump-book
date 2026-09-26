/* ============================================
   Sheets Initialization API Route
   Creates spreadsheet + Drive folder on first login
   ============================================ */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SheetsService, setCachedSpreadsheetId } from '@/lib/sheets';
import { DriveService } from '@/lib/drive';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if spreadsheet already exists
    let spreadsheetId = await SheetsService.findExistingSpreadsheet(
      session.accessToken
    );

    if (!spreadsheetId) {
      // Create new spreadsheet
      const userName = session.user?.name || 'User';
      spreadsheetId = await SheetsService.createSpreadsheet(
        session.accessToken,
        userName
      );
    }

    if (session.user?.email) {
      setCachedSpreadsheetId(session.user.email, spreadsheetId);
    }
    setCachedSpreadsheetId(session.accessToken, spreadsheetId);

    // Check if Drive folder exists, create if not
    const driveService = new DriveService(session.accessToken);
    let folderId = await driveService.findRootFolder();

    if (!folderId) {
      folderId = await driveService.createFolderStructure();
    }

    // Store the Drive folder ID in the config tab
    const sheetsService = new SheetsService(session.accessToken, spreadsheetId);
    try {
      await sheetsService.appendRow('_Config', {
        key: 'drive_folder_id',
        value: folderId,
      });
    } catch {
      // Config entry might already exist, that's fine
    }

    return NextResponse.json({
      spreadsheetId,
      driveFolderId: folderId,
    });
  } catch (error) {
    console.error('Error initializing sheets:', error);
    return NextResponse.json(
      { error: 'Failed to initialize' },
      { status: 500 }
    );
  }
}
