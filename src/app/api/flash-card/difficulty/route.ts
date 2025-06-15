import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'thinking_lenses';
const COLLECTION = 'flash_card_progress';

async function getDb() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  return client.db(DB_NAME);
}

// 난이도 기록/업데이트
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, hexagramNumber, difficulty } = body;
    
    if (!username || !hexagramNumber || !difficulty) {
      return NextResponse.json({ 
        success: false, 
        message: 'username, hexagramNumber, difficulty are required' 
      }, { status: 400 });
    }

    const validDifficulties = ['again', 'soon', 'later', 'mastered'];
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid difficulty. Must be one of: ' + validDifficulties.join(', ')
      }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection(COLLECTION);
    
    // 기존 기록이 있는지 확인
    const existing = await collection.findOne({ 
      username, 
      hexagramNumber: Number(hexagramNumber) 
    });

    if (existing) {
      // 업데이트
      const result = await collection.updateOne(
        { username, hexagramNumber: Number(hexagramNumber) },
        {
          $set: {
            difficulty,
            lastReviewed: new Date(),
            updatedAt: new Date()
          },
          $inc: { reviewCount: 1 }
        }
      );
      return NextResponse.json({ 
        success: true, 
        message: 'Difficulty updated',
        updated: result.modifiedCount > 0
      });
    } else {
      // 새로 생성
      const result = await collection.insertOne({
        username,
        hexagramNumber: Number(hexagramNumber),
        difficulty,
        lastReviewed: new Date(),
        reviewCount: 1,
        createdAt: new Date()
      });
      return NextResponse.json({ 
        success: true, 
        message: 'Difficulty recorded',
        insertedId: result.insertedId
      });
    }
  } catch (error) {
    console.error('Flash card difficulty API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// 사용자의 학습 진도 조회
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const hexagramNumber = searchParams.get('hexagramNumber');
    
    if (!username) {
      return NextResponse.json({ 
        success: false, 
        message: 'username is required' 
      }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection(COLLECTION);
    
    let query: any = { username };
    if (hexagramNumber) {
      query.hexagramNumber = Number(hexagramNumber);
    }
    
    const progress = await collection
      .find(query)
      .sort({ lastReviewed: -1 })
      .toArray();
    
    // 통계 계산
    const stats = {
      total: progress.length,
      again: progress.filter(p => p.difficulty === 'again').length,
      soon: progress.filter(p => p.difficulty === 'soon').length,
      later: progress.filter(p => p.difficulty === 'later').length,
      mastered: progress.filter(p => p.difficulty === 'mastered').length
    };
    
    return NextResponse.json({ 
      success: true, 
      progress,
      stats
    });
  } catch (error) {
    console.error('Flash card difficulty GET API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
