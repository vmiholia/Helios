import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const entryId = parseInt(id, 10);

    if (isNaN(entryId)) {
        return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 });
    }

    const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', entryId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Entry deleted' });
}
