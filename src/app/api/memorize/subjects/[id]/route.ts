import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wisdom_lenses';
const client = new MongoClient(uri);

// 개별 주제 정보 조회 (GET)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: '유효하지 않은 주제 ID입니다.' }, { status: 400 });
    }

    await client.connect();
    const db = client.db('wisdom_lenses');
    const collection = db.collection('memorize_subjects');
    
    // 주제 정보 조회
    const subject = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!subject) {
      return NextResponse.json({ error: '주제를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 해당 주제의 카드 수 계산
    const cardsCollection = db.collection('memorize_cards');
    const cardCount = await cardsCollection.countDocuments({ subjectId: id });
    subject.cardCount = cardCount;
    
    return NextResponse.json(subject);
  } catch (error) {
    console.error('주제 조회 실패:', error);
    return NextResponse.json({ error: '주제 정보를 불러올 수 없습니다.' }, { status: 500 });
  } finally {
    await client.close();
  }
}