/* ============================================
   Google Sheets Service
   CRUD operations for all sheet tabs
   ============================================ */

import { google } from 'googleapis';
import { SHEET_HEADERS, SHEET_TABS } from './types';

// In-memory cache for user's spreadsheetId to avoid repeated Drive API calls
const spreadsheetCache = new Map<string, string>();

export function setCachedSpreadsheetId(key: string, id: string): void {
  spreadsheetCache.set(key, id);
}

export function getCachedSpreadsheetId(key: string): string | undefined {
  return spreadsheetCache.get(key);
}

export async function resolveSpreadsheetId(
  accessToken: string,
  userEmail?: string | null,
  knownSpreadsheetId?: string | null
): Promise<string | null> {
  if (knownSpreadsheetId) {
    if (userEmail) spreadsheetCache.set(userEmail, knownSpreadsheetId);
    return knownSpreadsheetId;
  }

  const cacheKey = userEmail || accessToken;
  const cached = spreadsheetCache.get(cacheKey);
  if (cached) return cached;

  try {
    const found = await SheetsService.findExistingSpreadsheet(accessToken);
    if (found) {
      spreadsheetCache.set(cacheKey, found);
      if (userEmail) spreadsheetCache.set(userEmail, found);
      return found;
    }
  } catch (error) {
    console.error('Error resolving spreadsheet ID:', error);
  }
  return null;
}

export class SheetsService {
  private sheets;
  private spreadsheetId: string;

  constructor(accessToken: string, spreadsheetId: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = spreadsheetId;
  }

  /**
   * Read all rows from a tab, returning them as an array of objects.
   */
  async getRows(tab: string): Promise<Record<string, string>[]> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${tab}!A:ZZ`,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) return [];

    const headers = rows[0];
    const schemaHeaders = SHEET_HEADERS[tab] || [];
    const headerList = headers.length >= schemaHeaders.length ? headers : schemaHeaders;
    return rows.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headerList.forEach((header: string, i: number) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });
  }

  /**
   * Append a new row to a tab.
   */
  async appendRow(tab: string, data: Record<string, string>): Promise<void> {
    const headers = SHEET_HEADERS[tab];
    if (!headers) throw new Error(`Unknown tab: ${tab}`);

    const values = headers.map((header) => data[header] ?? '');

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${tab}!A:A`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
  }

  /**
   * Find a row by its ID column value. Returns 1-indexed row number.
   */
  async findRowById(
    tab: string,
    id: string
  ): Promise<{ rowIndex: number; data: Record<string, string> } | null> {
    const rows = await this.getRows(tab);
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) return null;

    return {
      rowIndex: index + 2, // +1 for header, +1 for 1-indexed
      data: rows[index],
    };
  }

  /**
   * Update a specific row by its 1-indexed row number.
   */
  async updateRow(
    tab: string,
    rowIndex: number,
    data: Record<string, string>
  ): Promise<void> {
    const headers = SHEET_HEADERS[tab];
    if (!headers) throw new Error(`Unknown tab: ${tab}`);

    const values = headers.map((header) => data[header] ?? '');

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${tab}!A${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
  }

  /**
   * Delete a row by its 1-indexed row number.
   * Uses the batchUpdate method to delete the row.
   */
  async deleteRow(tab: string, rowIndex: number): Promise<void> {
    // First, get the sheet ID for the tab
    const sheetId = await this.getSheetId(tab);

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1, // 0-indexed
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    });
  }

  /**
   * Get the sheet ID (not spreadsheet ID) for a given tab name.
   */
  private async getSheetId(tab: string): Promise<number> {
    const response = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      fields: 'sheets.properties',
    });

    const sheet = response.data.sheets?.find(
      (s) => s.properties?.title === tab
    );

    if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
      throw new Error(`Sheet tab not found: ${tab}`);
    }

    return sheet.properties.sheetId;
  }

  /**
   * Create the entire spreadsheet with all tabs and headers.
   * Called once on first login.
   */
  static async createSpreadsheet(
    accessToken: string,
    userName: string
  ): Promise<string> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth });

    const tabNames = Object.values(SHEET_TABS);

    // Create spreadsheet with all tabs
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Bump Book – ${userName}`,
        },
        sheets: tabNames.map((title, index) => ({
          properties: {
            title,
            index,
          },
        })),
      },
    });

    const spreadsheetId = response.data.spreadsheetId!;

    // Add headers to each tab
    const headerData = tabNames
      .filter((tab) => SHEET_HEADERS[tab])
      .map((tab) => ({
        range: `${tab}!A1`,
        values: [SHEET_HEADERS[tab]],
      }));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: headerData,
      },
    });

    // Write initial config
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_TABS.config}!A:A`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['version', '1.0'],
          ['created_at', new Date().toISOString()],
        ],
      },
    });

    // Automatically set up the Overview & Charts tab
    try {
      await SheetsService.setupOverviewChartsSheet(accessToken, spreadsheetId);
    } catch (err) {
      console.error('Failed to setup overview charts sheet initially:', err);
    }

    return spreadsheetId;
  }

  /**
   * Check if a "Bump Book" or "Pregnancy Journey" spreadsheet already exists.
   * Returns the spreadsheet ID if found, null otherwise.
   */
  static async findExistingSpreadsheet(
    accessToken: string
  ): Promise<string | null> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.list({
      q: "(name contains 'Bump Book' or name contains 'BumpBook' or name contains 'Pregnancy Journey') and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      fields: 'files(id, name)',
      pageSize: 1,
    });

    const files = response.data.files;
    if (files && files.length > 0) {
      return files[0].id!;
    }

    return null;
  }

  /**
   * Sets up or refreshes the dedicated "Overview & Charts" tab in the user's spreadsheet.
   * Creates summary KPI cards, live auto-updating formulas, and embedded native charts.
   */
  static async setupOverviewChartsSheet(
    accessToken: string,
    spreadsheetId: string
  ): Promise<{ sheetId: number; url: string }> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Fetch existing sheets to get sheet IDs and check for existing Overview tab
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets(properties(sheetId,title,index))',
    });

    const sheetsList = meta.data.sheets || [];
    const titleMap = new Map<string, number>();
    sheetsList.forEach((s) => {
      if (s.properties?.title && typeof s.properties.sheetId === 'number') {
        titleMap.set(s.properties.title, s.properties.sheetId);
      }
    });

    const existingOverviewId = titleMap.get(SHEET_TABS.overview);
    const healthStatsSheetId = titleMap.get(SHEET_TABS.healthStats);
    const babyStatsSheetId = titleMap.get(SHEET_TABS.babyStats);

    // 2. Delete existing Overview tab if it already exists, and create a fresh one at index 0
    const setupRequests: any[] = [];
    if (existingOverviewId !== undefined) {
      setupRequests.push({
        deleteSheet: { sheetId: existingOverviewId },
      });
    }

    setupRequests.push({
      addSheet: {
        properties: {
          title: SHEET_TABS.overview,
          index: 0,
          gridProperties: {
            rowCount: 65,
            columnCount: 12,
          },
          tabColor: { red: 0.96, green: 0.45, blue: 0.6 },
        },
      },
    });

    const addSheetRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: setupRequests },
    });

    const newOverviewSheet = addSheetRes.data.replies?.find(
      (r) => r.addSheet
    )?.addSheet?.properties;
    const overviewSheetId = newOverviewSheet?.sheetId!;

    // 3. Write Formulas, Labels, and Queries into the Overview sheet
    const overviewValues: (string | number)[][] = [
      // Row 1: Title
      ['🤰 BUMP BOOK — PREGNANCY OVERVIEW & HEALTH CHARTS'],
      // Row 2: Subtitle
      [
        'Live visual dashboard • Updates automatically when records are logged in Bump Book',
      ],
      // Row 3: Blank
      [],
      // Row 4: KPI Card Headers
      [
        'CURRENT GESTATION',
        '',
        'ESTIMATED DUE DATE',
        '',
        'LATEST MATERNAL VITALS',
        '',
        'BABY GROWTH & HEARTBEAT',
      ],
      // Row 5: KPI Card Formulas
      [
        '="Week " & IFERROR(INT((TODAY() - DATEVALUE(Pregnancy!B2))/7), "--") & " + " & IFERROR(MOD(INT(TODAY() - DATEVALUE(Pregnancy!B2)), 7), "--") & " days"',
        '',
        '="Due: " & IFERROR(TEXT(DATEVALUE(Pregnancy!C2), "dd mmm yyyy"), Pregnancy!C2) & " (" & IFERROR(DATEVALUE(Pregnancy!C2) - TODAY(), "--") & " days left)"',
        '',
        '="BP: " & IFERROR(INDEX(FILTER(HealthStats!D2:D & "/" & HealthStats!E2:E, HealthStats!D2:D<>""), ROWS(FILTER(HealthStats!D2:D, HealthStats!D2:D<>""))), "--") & " mmHg • Wt: " & IFERROR(INDEX(FILTER(HealthStats!C2:C, HealthStats!C2:C<>""), ROWS(FILTER(HealthStats!C2:C, HealthStats!C2:C<>""))), "--") & " kg"',
        '',
        '="FHR: " & IFERROR(INDEX(FILTER(BabyStats!D2:D, BabyStats!D2:D<>""), ROWS(FILTER(BabyStats!D2:D, BabyStats!D2:D<>""))), "--") & " bpm • Wt: " & IFERROR(INDEX(FILTER(BabyStats!C2:C, BabyStats!C2:C<>""), ROWS(FILTER(BabyStats!C2:C, BabyStats!C2:C<>""))), "--") & " g"',
      ],
      // Row 6: KPI Card Details
      [
        '="Trimester: " & IFERROR(IF(INT((TODAY() - DATEVALUE(Pregnancy!B2))/7) < 13, "1st Trimester", IF(INT((TODAY() - DATEVALUE(Pregnancy!B2))/7) < 28, "2nd Trimester", "3rd Trimester")), "--")',
        '',
        '="Type: " & Pregnancy!F2 & " • Blood: " & Pregnancy!D2 & " " & Pregnancy!E2',
        '',
        '="Doctor: " & Pregnancy!K2 & " (" & Pregnancy!L2 & ")"',
        '',
        '="Kicks: " & IFERROR(INDEX(FILTER(BabyStats!J2:J, BabyStats!J2:J<>""), ROWS(FILTER(BabyStats!J2:J, BabyStats!J2:J<>""))), "--") & " kicks logged"',
      ],
      // Row 7: Blank
      [],
      // Row 8: Charts Header
      ['📈 INTERACTIVE HEALTH & BABY GROWTH CHARTS'],
    ];

    // Pad rows 9 to 37 so the query table header lands at row 39
    while (overviewValues.length < 38) {
      overviewValues.push([]);
    }

    // Row 39: Table Section Headers
    overviewValues.push([
      '🩺 RECENT DOCTOR VISITS & CLINICAL ADVICE',
      '',
      '',
      '',
      '',
      '',
      '📅 UPCOMING APPOINTMENTS',
    ]);

    // Row 40: Table Query Formulas
    overviewValues.push([
      '=IFERROR(QUERY(DoctorVisits!B1:I, "select B, C, D, E, I where B is not null order by B desc limit 6 label B \'Visit Date\', C \'Doctor\', D \'Hospital\', E \'Reason\', I \'Doctor Observations\'", 1), "No doctor visits logged yet")',
      '',
      '',
      '',
      '',
      '',
      '=IFERROR(QUERY(Appointments!B1:G, "select B, C, D, F, G where B is not null order by B desc limit 6 label B \'Date\', C \'Time\', D \'Doctor\', F \'Purpose\', G \'Status\'", 1), "No appointments logged yet")',
    ]);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEET_TABS.overview}'!A1:K40`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: overviewValues,
      },
    });

    // 4. Build formatting, styling, merges, column dimensions, and embedded charts
    const formatRequests: any[] = [
      // Title banner merge (A1:H1)
      {
        mergeCells: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 8,
          },
          mergeType: 'MERGE_ALL',
        },
      },
      // Title styling
      {
        repeatCell: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 8,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.98, green: 0.93, blue: 0.95 },
              textFormat: {
                bold: true,
                fontSize: 14,
                foregroundColor: { red: 0.7, green: 0.15, blue: 0.3 },
              },
              verticalAlignment: 'MIDDLE',
            },
          },
          fields:
            'userEnteredFormat(backgroundColor,textFormat,verticalAlignment)',
        },
      },
      // Subtitle styling
      {
        repeatCell: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 1,
            endRowIndex: 2,
            startColumnIndex: 0,
            endColumnIndex: 8,
          },
          cell: {
            userEnteredFormat: {
              textFormat: {
                italic: true,
                fontSize: 10,
                foregroundColor: { red: 0.45, green: 0.45, blue: 0.5 },
              },
            },
          },
          fields: 'userEnteredFormat(textFormat)',
        },
      },
      // Merge KPI card cells
      {
        mergeCells: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 3,
            endRowIndex: 4,
            startColumnIndex: 0,
            endColumnIndex: 2,
          },
          mergeType: 'MERGE_ALL',
        },
      },
      {
        mergeCells: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 4,
            endRowIndex: 5,
            startColumnIndex: 0,
            endColumnIndex: 2,
          },
          mergeType: 'MERGE_ALL',
        },
      },
      {
        mergeCells: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 5,
            endRowIndex: 6,
            startColumnIndex: 0,
            endColumnIndex: 2,
          },
          mergeType: 'MERGE_ALL',
        },
      },
      {
        mergeCells: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 3,
            endRowIndex: 4,
            startColumnIndex: 2,
            endColumnIndex: 4,
          },
          mergeType: 'MERGE_ALL',
        },
      },
      {
        mergeCells: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 4,
            endRowIndex: 5,
            startColumnIndex: 2,
            endColumnIndex: 4,
          },
          mergeType: 'MERGE_ALL',
        },
      },
      {
        mergeCells: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 5,
            endRowIndex: 6,
            startColumnIndex: 2,
            endColumnIndex: 4,
          },
          mergeType: 'MERGE_ALL',
        },
      },
      {
        mergeCells: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 3,
            endRowIndex: 4,
            startColumnIndex: 4,
            endColumnIndex: 6,
          },
          mergeType: 'MERGE_ALL',
        },
      },
      {
        mergeCells: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 4,
            endRowIndex: 5,
            startColumnIndex: 4,
            endColumnIndex: 6,
          },
          mergeType: 'MERGE_ALL',
        },
      },
      {
        mergeCells: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 5,
            endRowIndex: 6,
            startColumnIndex: 4,
            endColumnIndex: 6,
          },
          mergeType: 'MERGE_ALL',
        },
      },
      {
        mergeCells: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 3,
            endRowIndex: 4,
            startColumnIndex: 6,
            endColumnIndex: 8,
          },
          mergeType: 'MERGE_ALL',
        },
      },
      {
        mergeCells: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 4,
            endRowIndex: 5,
            startColumnIndex: 6,
            endColumnIndex: 8,
          },
          mergeType: 'MERGE_ALL',
        },
      },
      {
        mergeCells: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 5,
            endRowIndex: 6,
            startColumnIndex: 6,
            endColumnIndex: 8,
          },
          mergeType: 'MERGE_ALL',
        },
      },
      // Format KPI card headers (Row 4, 0-indexed 3)
      {
        repeatCell: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 3,
            endRowIndex: 4,
            startColumnIndex: 0,
            endColumnIndex: 8,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.95, green: 0.95, blue: 0.98 },
              textFormat: {
                bold: true,
                fontSize: 9,
                foregroundColor: { red: 0.4, green: 0.4, blue: 0.5 },
              },
              horizontalAlignment: 'CENTER',
            },
          },
          fields:
            'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
        },
      },
      // Format KPI card values (Row 5, 0-indexed 4)
      {
        repeatCell: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 4,
            endRowIndex: 5,
            startColumnIndex: 0,
            endColumnIndex: 8,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.98, green: 0.98, blue: 1.0 },
              textFormat: {
                bold: true,
                fontSize: 11,
                foregroundColor: { red: 0.15, green: 0.15, blue: 0.25 },
              },
              horizontalAlignment: 'CENTER',
            },
          },
          fields:
            'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
        },
      },
      // Format KPI card subtexts (Row 6, 0-indexed 5)
      {
        repeatCell: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 5,
            endRowIndex: 6,
            startColumnIndex: 0,
            endColumnIndex: 8,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.98, green: 0.98, blue: 1.0 },
              textFormat: {
                fontSize: 9,
                foregroundColor: { red: 0.35, green: 0.35, blue: 0.45 },
              },
              horizontalAlignment: 'CENTER',
            },
          },
          fields:
            'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
        },
      },
      // Card borders
      {
        updateBorders: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 3,
            endRowIndex: 6,
            startColumnIndex: 0,
            endColumnIndex: 8,
          },
          top: {
            style: 'SOLID',
            color: { red: 0.85, green: 0.85, blue: 0.9 },
          },
          bottom: {
            style: 'SOLID',
            color: { red: 0.85, green: 0.85, blue: 0.9 },
          },
          left: {
            style: 'SOLID',
            color: { red: 0.85, green: 0.85, blue: 0.9 },
          },
          right: {
            style: 'SOLID',
            color: { red: 0.85, green: 0.85, blue: 0.9 },
          },
          innerVertical: {
            style: 'SOLID',
            color: { red: 0.85, green: 0.85, blue: 0.9 },
          },
        },
      },
      // Charts header styling (Row 8, 0-indexed 7)
      {
        repeatCell: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 7,
            endRowIndex: 8,
            startColumnIndex: 0,
            endColumnIndex: 6,
          },
          cell: {
            userEnteredFormat: {
              textFormat: {
                bold: true,
                fontSize: 11,
                foregroundColor: { red: 0.2, green: 0.2, blue: 0.3 },
              },
            },
          },
          fields: 'userEnteredFormat(textFormat)',
        },
      },
      // Tables header styling (Row 39, 0-indexed 38)
      {
        repeatCell: {
          range: {
            sheetId: overviewSheetId,
            startRowIndex: 38,
            endRowIndex: 39,
            startColumnIndex: 0,
            endColumnIndex: 11,
          },
          cell: {
            userEnteredFormat: {
              textFormat: {
                bold: true,
                fontSize: 11,
                foregroundColor: { red: 0.2, green: 0.2, blue: 0.3 },
              },
            },
          },
          fields: 'userEnteredFormat(textFormat)',
        },
      },
      // Set Column Widths for comfortable readability
      {
        updateDimensionProperties: {
          range: {
            sheetId: overviewSheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 1,
          },
          properties: { pixelSize: 130 },
          fields: 'pixelSize',
        },
      },
      {
        updateDimensionProperties: {
          range: {
            sheetId: overviewSheetId,
            dimension: 'COLUMNS',
            startIndex: 1,
            endIndex: 2,
          },
          properties: { pixelSize: 150 },
          fields: 'pixelSize',
        },
      },
      {
        updateDimensionProperties: {
          range: {
            sheetId: overviewSheetId,
            dimension: 'COLUMNS',
            startIndex: 2,
            endIndex: 3,
          },
          properties: { pixelSize: 130 },
          fields: 'pixelSize',
        },
      },
      {
        updateDimensionProperties: {
          range: {
            sheetId: overviewSheetId,
            dimension: 'COLUMNS',
            startIndex: 3,
            endIndex: 4,
          },
          properties: { pixelSize: 150 },
          fields: 'pixelSize',
        },
      },
      {
        updateDimensionProperties: {
          range: {
            sheetId: overviewSheetId,
            dimension: 'COLUMNS',
            startIndex: 4,
            endIndex: 5,
          },
          properties: { pixelSize: 130 },
          fields: 'pixelSize',
        },
      },
      {
        updateDimensionProperties: {
          range: {
            sheetId: overviewSheetId,
            dimension: 'COLUMNS',
            startIndex: 5,
            endIndex: 6,
          },
          properties: { pixelSize: 150 },
          fields: 'pixelSize',
        },
      },
      {
        updateDimensionProperties: {
          range: {
            sheetId: overviewSheetId,
            dimension: 'COLUMNS',
            startIndex: 6,
            endIndex: 7,
          },
          properties: { pixelSize: 130 },
          fields: 'pixelSize',
        },
      },
      {
        updateDimensionProperties: {
          range: {
            sheetId: overviewSheetId,
            dimension: 'COLUMNS',
            startIndex: 7,
            endIndex: 8,
          },
          properties: { pixelSize: 160 },
          fields: 'pixelSize',
        },
      },
    ];

    // 5. Add Embedded Native Charts (if target tabs exist)
    if (healthStatsSheetId !== undefined) {
      // Chart 1: Maternal Weight Trend (Line Chart)
      formatRequests.push({
        addChart: {
          chart: {
            spec: {
              title: 'Maternal Weight Trend (kg)',
              basicChart: {
                chartType: 'LINE',
                legendPosition: 'BOTTOM_LEGEND',
                axis: [
                  { position: 'BOTTOM_AXIS', title: 'Recorded Date' },
                  { position: 'LEFT_AXIS', title: 'Weight (kg)' },
                ],
                domains: [
                  {
                    domain: {
                      sourceRange: {
                        sources: [
                          {
                            sheetId: healthStatsSheetId,
                            startRowIndex: 0,
                            startColumnIndex: 1,
                            endColumnIndex: 2,
                          },
                        ],
                      },
                    },
                  },
                ],
                series: [
                  {
                    series: {
                      sourceRange: {
                        sources: [
                          {
                            sheetId: healthStatsSheetId,
                            startRowIndex: 0,
                            startColumnIndex: 2,
                            endColumnIndex: 3,
                          },
                        ],
                      },
                    },
                    targetAxis: 'LEFT_AXIS',
                  },
                ],
                headerCount: 1,
              },
            },
            position: {
              overlayPosition: {
                anchorCell: {
                  sheetId: overviewSheetId,
                  rowIndex: 8,
                  columnIndex: 0,
                },
                widthPixels: 520,
                heightPixels: 300,
              },
            },
          },
        },
      });

      // Chart 2: Blood Pressure Dual-Line Tracker
      formatRequests.push({
        addChart: {
          chart: {
            spec: {
              title: 'Blood Pressure Trend (Systolic / Diastolic mmHg)',
              basicChart: {
                chartType: 'LINE',
                legendPosition: 'BOTTOM_LEGEND',
                axis: [
                  { position: 'BOTTOM_AXIS', title: 'Recorded Date' },
                  { position: 'LEFT_AXIS', title: 'Blood Pressure (mmHg)' },
                ],
                domains: [
                  {
                    domain: {
                      sourceRange: {
                        sources: [
                          {
                            sheetId: healthStatsSheetId,
                            startRowIndex: 0,
                            startColumnIndex: 1,
                            endColumnIndex: 2,
                          },
                        ],
                      },
                    },
                  },
                ],
                series: [
                  {
                    series: {
                      sourceRange: {
                        sources: [
                          {
                            sheetId: healthStatsSheetId,
                            startRowIndex: 0,
                            startColumnIndex: 3,
                            endColumnIndex: 4,
                          },
                        ],
                      },
                    },
                    targetAxis: 'LEFT_AXIS',
                  },
                  {
                    series: {
                      sourceRange: {
                        sources: [
                          {
                            sheetId: healthStatsSheetId,
                            startRowIndex: 0,
                            startColumnIndex: 4,
                            endColumnIndex: 5,
                          },
                        ],
                      },
                    },
                    targetAxis: 'LEFT_AXIS',
                  },
                ],
                headerCount: 1,
              },
            },
            position: {
              overlayPosition: {
                anchorCell: {
                  sheetId: overviewSheetId,
                  rowIndex: 8,
                  columnIndex: 6,
                },
                widthPixels: 520,
                heightPixels: 300,
              },
            },
          },
        },
      });
    }

    if (babyStatsSheetId !== undefined) {
      // Chart 3: Fetal Heart Rate (FHR bpm)
      formatRequests.push({
        addChart: {
          chart: {
            spec: {
              title: 'Fetal Heart Rate Trend (FHR bpm)',
              basicChart: {
                chartType: 'LINE',
                legendPosition: 'BOTTOM_LEGEND',
                axis: [
                  { position: 'BOTTOM_AXIS', title: 'Recorded Date' },
                  { position: 'LEFT_AXIS', title: 'Heart Rate (bpm)' },
                ],
                domains: [
                  {
                    domain: {
                      sourceRange: {
                        sources: [
                          {
                            sheetId: babyStatsSheetId,
                            startRowIndex: 0,
                            startColumnIndex: 1,
                            endColumnIndex: 2,
                          },
                        ],
                      },
                    },
                  },
                ],
                series: [
                  {
                    series: {
                      sourceRange: {
                        sources: [
                          {
                            sheetId: babyStatsSheetId,
                            startRowIndex: 0,
                            startColumnIndex: 3,
                            endColumnIndex: 4,
                          },
                        ],
                      },
                    },
                    targetAxis: 'LEFT_AXIS',
                  },
                ],
                headerCount: 1,
              },
            },
            position: {
              overlayPosition: {
                anchorCell: {
                  sheetId: overviewSheetId,
                  rowIndex: 23,
                  columnIndex: 0,
                },
                widthPixels: 520,
                heightPixels: 300,
              },
            },
          },
        },
      });

      // Chart 4: Estimated Baby Weight (Grams)
      formatRequests.push({
        addChart: {
          chart: {
            spec: {
              title: 'Estimated Baby Weight Trend (grams)',
              basicChart: {
                chartType: 'LINE',
                legendPosition: 'BOTTOM_LEGEND',
                axis: [
                  { position: 'BOTTOM_AXIS', title: 'Recorded Date' },
                  { position: 'LEFT_AXIS', title: 'Weight (grams)' },
                ],
                domains: [
                  {
                    domain: {
                      sourceRange: {
                        sources: [
                          {
                            sheetId: babyStatsSheetId,
                            startRowIndex: 0,
                            startColumnIndex: 1,
                            endColumnIndex: 2,
                          },
                        ],
                      },
                    },
                  },
                ],
                series: [
                  {
                    series: {
                      sourceRange: {
                        sources: [
                          {
                            sheetId: babyStatsSheetId,
                            startRowIndex: 0,
                            startColumnIndex: 2,
                            endColumnIndex: 3,
                          },
                        ],
                      },
                    },
                    targetAxis: 'LEFT_AXIS',
                  },
                ],
                headerCount: 1,
              },
            },
            position: {
              overlayPosition: {
                anchorCell: {
                  sheetId: overviewSheetId,
                  rowIndex: 23,
                  columnIndex: 6,
                },
                widthPixels: 520,
                heightPixels: 300,
              },
            },
          },
        },
      });
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: formatRequests },
    });

    // 6. Record the overview_sheet_id in the _Config tab for client navigation
    try {
      const sheetsService = new SheetsService(accessToken, spreadsheetId);
      const existingConfig = await sheetsService.findRowById(
        SHEET_TABS.config,
        'overview_sheet_id'
      );
      if (existingConfig) {
        await sheetsService.updateRow(
          SHEET_TABS.config,
          existingConfig.rowIndex,
          {
            key: 'overview_sheet_id',
            value: String(overviewSheetId),
          }
        );
      } else {
        await sheetsService.appendRow(SHEET_TABS.config, {
          key: 'overview_sheet_id',
          value: String(overviewSheetId),
        });
      }
    } catch (e) {
      console.warn('Could not save overview_sheet_id to _Config tab:', e);
    }

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${overviewSheetId}`;
    return { sheetId: overviewSheetId, url };
  }
}

