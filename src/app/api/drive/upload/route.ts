import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveService } from '@/lib/drive';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folderType = (formData.get('folderType') as string) || 'Other';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed (10MB)' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Only PDF and images are accepted.' },
        { status: 400 }
      );
    }

    const driveService = new DriveService(session.accessToken);
    let rootFolderId = await driveService.findRootFolder();
    if (!rootFolderId) {
      rootFolderId = await driveService.createFolderStructure();
    }

    let targetFolderId = rootFolderId;
    if (folderType) {
      const subFolderId = await driveService.findSubFolder(rootFolderId, folderType);
      if (subFolderId) {
        targetFolderId = subFolderId;
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await driveService.uploadFile(
      file.name,
      file.type,
      buffer,
      targetFolderId
    );

    return NextResponse.json({
      fileId: result.fileId,
      webViewLink: result.webViewLink,
      fileName: file.name,
    });
  } catch (error) {
    console.error('Error uploading file to Drive:', error);
    return NextResponse.json(
      { error: 'Failed to upload file to Google Drive' },
      { status: 500 }
    );
  }
}
