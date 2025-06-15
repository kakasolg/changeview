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

// 주제 삭제 (DELETE) - 카드가 없을 때만 가능
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: '유효하지 않은 주제 ID입니다.' }, { status: 400 });
    }

    await client.connect();
    const db = client.db('wisdom_lenses');
    const subjectsCollection = db.collection('memorize_subjects');
    const cardsCollection = db.collection('memorize_cards');
    
    // 먼저 주제가 존재하는지 확인
    const subject = await subjectsCollection.findOne({ _id: new ObjectId(id) });
    if (!subject) {
      return NextResponse.json({ error: '주제를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 해당 주제에 카드가 있는지 확인
    const cardCount = await cardsCollection.countDocuments({ subjectId: id });
    if (cardCount > 0) {
      return NextResponse.json({ 
        error: '주제에 문제가 있어 삭제할 수 없습니다. 먼저 모든 문제를 삭제해주세요.' 
      }, { status: 400 });
    }
    
    // 주제 삭제
    const result = await subjectsCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: '주제 삭제에 실패했습니다.' }, { status: 500 });
    }
    
    return NextResponse.json({ message: '주제가 성공적으로 삭제되었습니다.' });
    
  } catch (error) {
    console.error('주제 삭제 실패:', error);
    return NextResponse.json({ error: '주제를 삭제할 수 없습니다.' }, { status: 500 });
  } finally {
    await client.close();
  }
}