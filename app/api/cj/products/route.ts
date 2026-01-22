import { NextResponse } from 'next/server';
import { getCJClient } from '@/lib/cjdropshipping';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const keyword = searchParams.get('keyword') || 'boots';
        const page = parseInt(searchParams.get('page') || '1');
        const size = parseInt(searchParams.get('size') || '20');

        const cj = getCJClient();
        const result = await cj.searchProducts({
            keyWord: keyword,
            page,
            size,
        });

        // Flatten the productList from each result
        const products = result.content.flatMap(c => c.productList || []);

        return NextResponse.json({
            products,
            totalRecords: result.totalRecords,
            page,
            size,
        });
    } catch (error: any) {
        console.error('CJ Products API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch products' },
            { status: 500 }
        );
    }
}
