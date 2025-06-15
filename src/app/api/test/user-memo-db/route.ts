import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'thinking_lenses';
const COLLECTION = 'user_memos';

async function getDb() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  return client.db(DB_NAME);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDb();
    const result = await db.collection(COLLECTION).insertOne({
      ...body,
      createdAt: new Date()
    });
    return NextResponse.json({ success: true, insertedId: result.insertedId });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const hexagramNumber = searchParams.get('hexagramNumber');
    const username = searchParams.get('username');
    const skip = (page - 1) * pageSize;
    
    const db = await getDb();
    
    // 쿼리 조건 구성
    let query: any = {};
    if (hexagramNumber) {
      query.hexagramNumber = parseInt(hexagramNumber, 10);
    }
    if (username) {
      query.username = username;
    }
    
    const memos = await db.collection(COLLECTION)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();
    const total = await db.collection(COLLECTION).countDocuments(query);
    return NextResponse.json({ success: true, memos, total, page, pageSize });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, username, password, memo } = body;
    if (!id || !username || !password || !memo) {
      return NextResponse.json({ success: false, message: '필수 정보 누락' }, { status: 400 });
    }
    const db = await getDb();
    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(id), username, password },
      { $set: { memo, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: '수정 권한 없음 또는 메모 없음' }, { status: 403 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, username, password } = body;
    console.log('[DELETE] 요청:', { id, username, password });
    if (!id || !username || !password) {
      return NextResponse.json({ success: false, message: '필수 정보 누락' }, { status: 400 });
    }
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      return NextResponse.json({ success: false, message: 'id가 올바른 ObjectId 형식이 아닙니다.' }, { status: 400 });
    }
    const db = await getDb();
    const result = await db.collection(COLLECTION).deleteOne({ _id: objectId, username, password });
    if (result.deletedCount === 0) {
      // DB에 실제로 존재하는 값과 비교를 위해 추가 정보 출력
      const found = await db.collection(COLLECTION).findOne({ _id: objectId });
      if (!found) {
        return NextResponse.json({ success: false, message: '해당 id의 메모가 존재하지 않습니다.' }, { status: 404 });
      } else {
        return NextResponse.json({ success: false, message: 'username 또는 password가 일치하지 않습니다.', foundUsername: found.username }, { status: 403 });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
