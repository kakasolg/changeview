import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wisdom_lenses';
const client = new MongoClient(uri);

// 주제 목록 조회 (GET)
export async function GET() {
  try {
    await client.connect();
    const db = client.db('wisdom_lenses');
    const collection = db.collection('memorize_subjects');
    
    // 주제 목록 조회 및 카드 수 계산
    const subjects = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    // 각 주제별 카드 수 계산
    const cardsCollection = db.collection('memorize_cards');
    for (const subject of subjects) {
      const cardCount = await cardsCollection.countDocuments({ subjectId: subject._id.toString() });
      subject.cardCount = cardCount;
    }
    
    return NextResponse.json(subjects);
  } catch (error) {
    console.error('주제 목록 조회 실패:', error);
    return NextResponse.json({ error: '주제 목록을 불러올 수 없습니다.' }, { status: 500 });
  } finally {
    await client.close();
  }
}

// 새 주제 생성 (POST)
export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json();
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: '주제 이름이 필수입니다.' }, { status: 400 });
    }
    
    await client.connect();
    const db = client.db('wisdom_lenses');
    const collection = db.collection('memorize_subjects');
    
    // 중복 체크
    const existingSubject = await collection.findOne({ name: name.trim() });
    if (existingSubject) {
      return NextResponse.json({ error: '이미 존재하는 주제 이름입니다.' }, { status: 400 });
    }
    
    const newSubject = {
      name: name.trim(),
      description: description?.trim() || '',
      cardCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const result = await collection.insertOne(newSubject);
    
    return NextResponse.json({
      ...newSubject,
      _id: result.insertedId
    }, { status: 201 });
  } catch (error) {
    console.error('주제 생성 실패:', error);
    return NextResponse.json({ error: '주제를 생성할 수 없습니다.' }, { status: 500 });
  } finally {
    await client.close();
  }
}
