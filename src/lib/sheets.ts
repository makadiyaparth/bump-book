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
    return rows.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header: string, i: number) => {
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
          title: `Pregnancy Journey – ${userName}`,
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

    return spreadsheetId;
  }

  /**
   * Check if a "Pregnancy Journey" spreadsheet already exists.
   * Returns the spreadsheet ID if found, null otherwise.
   */
  static async findExistingSpreadsheet(
    accessToken: string
  ): Promise<string | null> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.list({
      q: "name contains 'Pregnancy Journey' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      fields: 'files(id, name)',
      pageSize: 1,
    });

    const files = response.data.files;
    if (files && files.length > 0) {
      return files[0].id!;
    }

    return null;
  }
}
