import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAIProvider, getAIProviderOptions } from '@/lib/ai-provider';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let defaultProvider: string | null = null;
  try {
    defaultProvider = getAIProvider();
  } catch {
    // The UI will show all providers as unavailable when no key is configured.
  }

  return NextResponse.json({
    providers: getAIProviderOptions(),
    defaultProvider,
  });
}
