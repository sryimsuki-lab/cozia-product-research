import { getProductById } from '@/lib/database';
import { notFound } from 'next/navigation';
import { ProductDetailClient } from '@/components/ProductDetailClient';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
        notFound();
    }

    return <ProductDetailClient product={product} />;
}
