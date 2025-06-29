import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getConnectionInfo } from '@/lib/database';

/**
 * MongoDB 연결 테스트 API
 * GET /api/test-db
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🗺️ MongoDB 연결 테스트 시작...');
    
    // MongoDB 연결 시도
    const startTime = Date.now();
    await connectToDatabase();
    const connectionTime = Date.now() - startTime;
    
    // 연결 정보 가져오기
    const connectionInfo = getConnectionInfo();
    
    console.log('✅ MongoDB 연결 테스트 성공');
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection test successful',
      data: {
        ...connectionInfo,
        connectionTime: `${connectionTime}ms`,
        timestamp: new Date().toISOString(),
        environment: {
          mongodbUri: process.env.MONGODB_URI ? 'Set' : 'Not set',
          nodeEnv: process.env.NODE_ENV || 'development'
        }
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ MongoDB 연결 테스트 실패:', error);
    let errorType = 'DatabaseError';
    let errorMessage = 'Unknown database error';
    if (error && typeof error === 'object') {
      if ('name' in error && typeof (error as any).name === 'string') {
        errorType = (error as any).name;
      }
      if ('message' in error && typeof (error as any).message === 'string') {
        errorMessage = (error as any).message;
      }
    }
    return NextResponse.json({
      success: false,
      message: 'MongoDB connection test failed',
      error: {
        type: errorType,
        message: errorMessage,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * 데이터베이스 연결 상태 조회 API
 * POST /api/test-db
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'ping') {
      // MongoDB ping 테스트
      await connectToDatabase();
      const connectionInfo = getConnectionInfo();
      
      return NextResponse.json({
        success: true,
        message: 'Database ping successful',
        data: {
          ping: 'pong',
          ...connectionInfo,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    if (action === 'stats') {
      // 데이터베이스 통계 정보
      const db = await connectToDatabase();
      if (!db.db) {
        return NextResponse.json({
          success: false,
          message: 'Database connection object is missing the "db" property.'
        }, { status: 500 });
      }
      const admin = db.db.admin();
      const stats = await admin.serverStatus();
      
      return NextResponse.json({
        success: true,
        message: 'Database statistics retrieved',
        data: {
          version: stats.version,
          uptime: stats.uptime,
          connections: stats.connections,
          network: stats.network,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid action. Supported actions: ping, stats'
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Database action failed:', error);
    
    let errorType = 'DatabaseError';
    let errorMessage = 'Unknown database error';
    if (error && typeof error === 'object') {
      if ('name' in error && typeof (error as any).name === 'string') {
        errorType = (error as any).name;
      }
      if ('message' in error && typeof (error as any).message === 'string') {
        errorMessage = (error as any).message;
      }
    }
    return NextResponse.json({
      success: false,
      message: 'Database action failed',
      error: {
        type: errorType,
        message: errorMessage
      }
    }, { status: 500 });
  }
}