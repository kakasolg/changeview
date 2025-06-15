import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wisdom_lenses';
const client = new MongoClient(uri);

// 해당 주제의 카드 목록 조회 (GET)
export async function GET(request: NextRequest, { params }: { params: { subjectId: string } }) {
  try {
    const { subjectId } = params;
    
    await client.connect();
    const db = client.db('wisdom_lenses');
    const collection = db.collection('memorize_cards');
    
    // 해당 주제의 카드 목록 조회
    const cards = await collection.find({ subjectId }).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json(cards);
  } catch (error) {
    console.error('카드 목록 조회 실패:', error);
    return NextResponse.json({ error: '카드 목록을 불러올 수 없습니다.' }, { status: 500 });
  } finally {
    await client.close();
  }
}

// 새 카드 추가 (POST)
export async function POST(request: NextRequest, { params }: { params: { subjectId: string } }) {
  try {
    const { subjectId } = params;
    const { question, answer } = await request.json();
    
    if (!question || !question.trim()) {
      return NextResponse.json({ error: '문제가 필수입니다.' }, { status: 400 });
    }
    
    if (!answer || !answer.trim()) {
      return NextResponse.json({ error: '답이 필수입니다.' }, { status: 400 });
    }
    
    await client.connect();
    const db = client.db('wisdom_lenses');
    const collection = db.collection('memorize_cards');
    
    const newCard = {
      question: question.trim(),
      answer: answer.trim(),
      subjectId,
      createdAt: new Date().toISOString()
    };
    
    const result = await collection.insertOne(newCard);
    const insertedCard = { _id: result.insertedId, ...newCard };
    
    return NextResponse.json(insertedCard, { status: 201 });
  } catch (error) {
    console.error('카드 추가 실패:', error);
    return NextResponse.json({ error: '카드를 추가할 수 없습니다.' }, { status: 500 });
  } finally {
    await client.close();
  }
}