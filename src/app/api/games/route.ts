import 'reflect-metadata';
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/database';
import { Game } from '@/entity/Game';

export async function GET() {
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(Game);
    const games = await repo.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return NextResponse.json({ games });
  } catch (error) {
    console.error('GET /api/games error:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { winner } = body;

    if (!winner || !['X', 'O', 'Draw'].includes(winner)) {
      return NextResponse.json({ error: 'Invalid winner value' }, { status: 400 });
    }

    const ds = await getDataSource();
    const repo = ds.getRepository(Game);

    const game = repo.create({ winner });
    const saved = await repo.save(game);

    return NextResponse.json({ game: saved }, { status: 201 });
  } catch (error) {
    console.error('POST /api/games error:', error);
    return NextResponse.json({ error: 'Failed to save game' }, { status: 500 });
  }
}
