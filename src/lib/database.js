import mongoose from 'mongoose';

// MongoDB 연결 상태를 캐시하기 위한 전역 변수
// Next.js 서버리스 환경에서 연결 재사용을 위함
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * MongoDB 데이터베이스 연결 함수
 * @returns {Promise<mongoose.Connection>} MongoDB 연결 객체
 */
export async function connectToDatabase() {
  // 이미 연결된 경우 기존 연결 반환
  if (cached.conn) {
    console.log('🔄 Using existing MongoDB connection');
    return cached.conn;
  }

  // 연결 중인 경우 해당 promise 반환
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,  // 연결 전까지 명령어 버퍼링 비활성화
      serverSelectionTimeoutMS: 5000,  // 서버 선택 타임아웃 5초
      socketTimeoutMS: 45000,  // 소켓 타임아웃 45초
      family: 4  // IPv4 사용
    };

    console.log('🔌 Connecting to MongoDB...');
    
    // MONGODB_URI 환경 변수 확인
    if (!process.env.MONGODB_URI) {
      throw new Error('❌ MONGODB_URI environment variable is not defined');
    }

    // MongoDB 연결 시도
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully');
        console.log(`📍 Database: ${mongoose.connection.db.databaseName}`);
        console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection failed:', error);
        // 실패 시 promise 캐시 제거
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * MongoDB 연결 상태 확인 함수
 * @returns {boolean} 연결 상태
 */
export function isConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * MongoDB 연결 해제 함수 (개발/테스트 환경에서 사용)
 */
export async function disconnectFromDatabase() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('🔌 MongoDB disconnected');
  }
}

/**
 * 연결 상태 및 데이터베이스 정보 반환
 * @returns {object} 연결 정보 객체
 */
export function getConnectionInfo() {
  if (!isConnected()) {
    return {
      connected: false,
      message: 'Not connected to MongoDB'
    };
  }

  return {
    connected: true,
    database: mongoose.connection.db.databaseName,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    readyState: mongoose.connection.readyState,
    models: Object.keys(mongoose.models)
  };
}

export default connectToDatabase;