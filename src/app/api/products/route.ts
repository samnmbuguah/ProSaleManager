import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newProduct = await db.insert(products).values(body).returning();
    return NextResponse.json(newProduct[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    const updatedProduct = await db
      .update(products)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(products.id, id))
      .returning();
      
    return NextResponse.json(updatedProduct[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
} 