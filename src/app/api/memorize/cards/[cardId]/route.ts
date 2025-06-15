import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wisdom_lenses';
const client = new MongoClient(uri);

// 개별 카드 수정 (PUT)
export async function PUT(request: NextRequest, { params }: { params: { cardId: string } }) {
  try {
    const { cardId } = params;
    const { question, answer } = await request.json();
    
    if (!ObjectId.isValid(cardId)) {
      return NextResponse.json({ error: '유효하지 않은 카드 ID입니다.' }, { status: 400 });
    }
    
    if (!question || !question.trim()) {
      return NextResponse.json({ error: '문제가 필수입니다.' }, { status: 400 });
    }
    
    if (!answer || !answer.trim()) {
      return NextResponse.json({ error: '답이 필수입니다.' }, { status: 400 });
    }
    
    await client.connect();
    const db = client.db('wisdom_lenses');
    const collection = db.collection('memorize_cards');
    
    const updateData = {
      question: question.trim(),
      answer: answer.trim(),
      updatedAt: new Date().toISOString()
    };
    
    const result = await collection.updateOne(
      { _id: new ObjectId(cardId) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: '카드를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 업데이트된 카드 정보 반환
    const updatedCard = await collection.findOne({ _id: new ObjectId(cardId) });
    
    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error('카드 수정 실패:', error);
    return NextResponse.json({ error: '카드를 수정할 수 없습니다.' }, { status: 500 });
  } finally {
    await client.close();
  }
}

// 개별 카드 삭제 (DELETE)
export async function DELETE(request: NextRequest, { params }: { params: { cardId: string } }) {
  try {
    const { cardId } = params;
    
    if (!ObjectId.isValid(cardId)) {
      return NextResponse.json({ error: '유효하지 않은 카드 ID입니다.' }, { status: 400 });
    }
    
    await client.connect();
    const db = client.db('wisdom_lenses');
    const collection = db.collection('memorize_cards');
    
    const result = await collection.deleteOne({ _id: new ObjectId(cardId) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: '카드를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    return NextResponse.json({ message: '카드가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('카드 삭제 실패:', error);
    return NextResponse.json({ error: '카드를 삭제할 수 없습니다.' }, { status: 500 });
  } finally {
    await client.close();
  }
}