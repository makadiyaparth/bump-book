/* ============================================
   Google Drive Service
   File uploads and management
   ============================================ */

import { google } from 'googleapis';
import { Readable } from 'stream';

export class DriveService {
  private drive;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * Create the folder structure for pregnancy files.
   * Returns the root folder ID.
   */
  async createFolderStructure(): Promise<string> {
    // Create root folder
    const rootFolder = await this.createFolder('Bump Book Files');

    // Create sub-folders
    await Promise.all([
      this.createFolder('Reports', rootFolder),
      this.createFolder('Ultrasounds', rootFolder),
      this.createFolder('Prescriptions', rootFolder),
      this.createFolder('Other', rootFolder),
    ]);

    return rootFolder;
  }

  /**
   * Create a folder in Google Drive.
   */
  private async createFolder(
    name: string,
    parentId?: string
  ): Promise<string> {
    const response = await this.drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined,
      },
      fields: 'id',
    });

    return response.data.id!;
  }

  /**
   * Upload a file to a specific folder in Google Drive.
   */
  async uploadFile(
    fileName: string,
    mimeType: string,
    fileBuffer: Buffer,
    folderId: string
  ): Promise<{ fileId: string; webViewLink: string }> {
    const response = await this.drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: Readable.from(fileBuffer),
      },
      fields: 'id, webViewLink',
    });

    return {
      fileId: response.data.id!,
      webViewLink: response.data.webViewLink!,
    };
  }

  /**
   * Delete a file from Google Drive.
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.drive.files.delete({
      fileId,
    });
  }

  /**
   * Find the root "Bump Book Files" folder.
   */
  async findRootFolder(): Promise<string | null> {
    const response = await this.drive.files.list({
      q: "(name='Bump Book Files' or name='Pregnancy Journey Files') and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id)',
      pageSize: 1,
    });

    const files = response.data.files;
    if (files && files.length > 0) {
      return files[0].id!;
    }

    return null;
  }

  /**
   * Find a sub-folder inside the root folder.
   */
  async findSubFolder(
    rootFolderId: string,
    folderName: string
  ): Promise<string | null> {
    const response = await this.drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${rootFolderId}' in parents and trashed=false`,
      fields: 'files(id)',
      pageSize: 1,
    });

    const files = response.data.files;
    if (files && files.length > 0) {
      return files[0].id!;
    }

    return null;
  }
}
