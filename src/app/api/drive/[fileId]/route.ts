import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DriveService } from '@/lib/drive';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = await params;
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const driveService = new DriveService(session.accessToken);
    await driveService.deleteFile(fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file from Drive:', error);
    return NextResponse.json(
      { error: 'Failed to delete file from Google Drive' },
      { status: 500 }
    );
  }
}
