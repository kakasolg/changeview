import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import Hexagram, { IHexagram, IHexagramModel } from '@/models/Hexagram'; // IHexagram, IHexagramModel 인터페이스 임포트

/**
 * 64괘 데이터 조회 API
 * GET /api/hexagrams
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // URL 파라미터 추출
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const number = searchParams.get('number');
    const random = searchParams.get('random'); // 'random' 파라미터 추가
    const limit = Math.min(parseInt(searchParams.get('limit') || '64'), 64);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const skip = (page - 1) * limit;
    
    if (random === 'true') {
      // 무작위 괘 하나 조회
      const randomHexagram = await (Hexagram as IHexagramModel).getRandomHexagram();
      if (!randomHexagram) {
        return NextResponse.json({
          success: false,
          message: 'No hexagrams found in the database.'
        }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        data: {
          number: randomHexagram.number,
          symbol: randomHexagram.symbol,
          name: randomHexagram.name,
          koreanName: randomHexagram.koreanName,
          coreViewpoint: randomHexagram.coreViewpoint,
          mentalModels: randomHexagram.mentalModels,
          summary: randomHexagram.summary,
          keywords: randomHexagram.keywords,
          perspectives: randomHexagram.perspectives,
          createdAt: randomHexagram.createdAt,
          updatedAt: randomHexagram.updatedAt,
        },
        timestamp: new Date().toISOString()
      });
    }

    if (number) {
      // 특정 번호의 괘 조회
      const hexagramNumber = parseInt(number);
      if (hexagramNumber >= 1 && hexagramNumber <= 64) {
        const hexagram = await Hexagram.findOne({ number: hexagramNumber });
        
        if (!hexagram) {
          return NextResponse.json({
            success: false,
            message: `Hexagram number ${hexagramNumber} not found`
          }, { status: 404 });
        }
        
        return NextResponse.json({
          success: true,
          data: hexagram.getFullInfo(),
          timestamp: new Date().toISOString()
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Invalid hexagram number. Must be between 1 and 64.'
        }, { status: 400 });
      }
    }
    
    let query: any = {}; // query 변수 선언 및 초기화
    let hexagrams: IHexagram[]; // hexagrams 변수 타입 명시
    let total: number;

    if (keyword) {
      // 키워드 검색
      hexagrams = await (Hexagram as IHexagramModel).searchByKeyword(keyword)
        .limit(limit)
        .skip(skip)
        .sort({ number: 1 });
      total = await (Hexagram as IHexagramModel).searchByKeyword(keyword).countDocuments();
    } else {
      // 전체 조회
      hexagrams = await Hexagram.find(query)
        .limit(limit)
        .skip(skip)
        .sort({ number: 1 });
      total = await Hexagram.countDocuments(query);
    }
    
    return NextResponse.json({
      success: true,
      data: hexagrams.map(h => h.getFullInfo()), // 배열의 각 요소에 대해 getFullInfo 호출
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) { // error 타입을 any로 명시
    console.error('❌ Hexagrams GET error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch hexagrams',
      error: {
        type: error.name || 'DatabaseError',
        message: error.message || 'Unknown database error'
      }
    }, { status: 500 });
  }
}

/**
 * 64괘 데이터 생성 API (Seed Data)
 * POST /api/hexagrams
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { action, data } = await request.json();
    
    if (action === 'seed') {
      // 64괘 시드 데이터 입력
      console.log('🌱 Starting 64 hexagrams seed data insertion...');
      
      // 기존 데이터 삭제 (중복 방지)
      await Hexagram.deleteMany({});
      console.log('🗑️ Cleared existing hexagram data');
      
      // 64괘 데이터 생성
      const hexagramsData = createHexagramsData();
      
      // 일괄 삽입
      const result = await Hexagram.insertMany(hexagramsData);
      
      console.log(`✅ Successfully inserted ${result.length} hexagrams`);
      
      return NextResponse.json({
        success: true,
        message: `Successfully inserted ${result.length} hexagrams`,
        data: {
          insertedCount: result.length,
          hexagrams: result.map(h => ({
            number: h.number,
            name: h.name,
            symbol: h.symbol
          }))
        },
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'single' && data) {
      // 단일 괘 생성
      const hexagram = new Hexagram(data);
      await hexagram.save();
      
      return NextResponse.json({
        success: true,
        message: 'Hexagram created successfully',
        data: hexagram.getFullInfo(),
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid action. Supported actions: seed, single'
    }, { status: 400 });
    
  } catch (error: any) { // error 타입을 any로 명시
    console.error('❌ Hexagrams POST error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create hexagram(s)',
      error: {
        type: error.name || 'DatabaseError',
        message: error.message || 'Unknown database error'
      }
    }, { status: 500 });
  }
}

/**
 * 64괘 데이터 삭제 API
 * DELETE /api/hexagrams
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const number = searchParams.get('number');
    
    if (number) {
      // 특정 괘 삭제
      const hexagramNumber = parseInt(number);
      const result = await Hexagram.findOneAndDelete({ number: hexagramNumber });
      
      if (!result) {
        return NextResponse.json({
          success: false,
          message: `Hexagram number ${hexagramNumber} not found`
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        message: `Hexagram ${hexagramNumber} deleted successfully`,
        data: result,
        timestamp: new Date().toISOString()
      });
    } else {
      // 전체 데이터 삭제 (주의: 위험!)
      const result = await Hexagram.deleteMany({});
      
      return NextResponse.json({
        success: true,
        message: `All hexagrams deleted. Count: ${result.deletedCount}`,
        data: { deletedCount: result.deletedCount },
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error: any) { // error 타입을 any로 명시
    console.error('❌ Hexagrams DELETE error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to delete hexagram(s)',
      error: {
        type: error.name || 'DatabaseError',
        message: error.message || 'Unknown database error'
      }
    }, { status: 500 });
  }
}

/**
 * 64괘 데이터 수정 API
 * PUT /api/hexagrams?number={number}
 */
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const number = searchParams.get('number');
    
    if (!number) {
      return NextResponse.json({
        success: false,
        message: 'Hexagram number is required'
      }, { status: 400 });
    }
    
    const hexagramNumber = parseInt(number);
    if (hexagramNumber < 1 || hexagramNumber > 64) {
      return NextResponse.json({
        success: false,
        message: 'Invalid hexagram number. Must be between 1 and 64.'
      }, { status: 400 });
    }
    
    // 수정할 데이터 받기
    const updateData = await request.json();
    
    // 유효한 필드만 업데이트 허용
    const allowedFields = ['name', 'koreanName', 'coreViewpoint', 'mentalModels', 'summary', 'keywords'];
    const filteredData: Record<string, any> = {}; // 타입 명시
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        filteredData[key] = value;
      }
    }
    
    if (Object.keys(filteredData).length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid fields to update'
      }, { status: 400 });
    }
    
    // 수정 시간 추가
    filteredData.updatedAt = new Date();
    
    // 괘 데이터 업데이트
    const result = await Hexagram.findOneAndUpdate(
      { number: hexagramNumber },
      filteredData,
      { new: true, runValidators: true }
    );
    
    if (!result) {
      return NextResponse.json({
        success: false,
        message: `Hexagram number ${hexagramNumber} not found`
      }, { status: 404 });
    }
    
    console.log(`✅ Successfully updated hexagram ${hexagramNumber}`);
    
    return NextResponse.json({
      success: true,
      message: `Hexagram ${hexagramNumber} updated successfully`,
      data: result.getFullInfo(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) { // error 타입을 any로 명시
    console.error('❌ Hexagrams PUT error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to update hexagram',
      error: {
        type: error.name || 'DatabaseError',
        message: error.message || 'Unknown database error'
      }
    }, { status: 500 });
  }
}

// 64괘 전체 시드 데이터 생성 함수
function createHexagramsData() {
  return [
    {
      number: 1,
      symbol: "☰/☰",
      name: "중천건",
      koreanName: "重天乾",
      coreViewpoint: "창조적 에너지와 리더십의 관점",
      summary: "순수한 잠재력과 창조적 에너지가 어떻게 세상을 이끌고 시작하게 하는지를 본다.",
      keywords: ["창조", "리더십", "시작", "에너지", "하늘"]
    },
    {
      number: 2,
      symbol: "⚏/⚏",
      name: "중지곤",
      koreanName: "重地坤",
      coreViewpoint: "플랫폼과 수용성의 관점",
      summary: "모든 것을 포용하고 성장시키는 시스템, 즉 플랫폼의 힘과 가능성을 본다.",
      keywords: ["플랫폼", "수용", "포용", "성장", "시스템"]
    },
    {
      number: 3,
      symbol: "☵/☳",
      name: "수뢰둔",
      koreanName: "水雷屯",
      coreViewpoint: "초기 혼돈과 창조적 고통의 관점",
      summary: "시작 단계의 어려움 속에서 잠재된 에너지를 모으고 질서를 잡아가는 과정을 통찰한다.",
      keywords: ["초기", "혼돈", "창조", "고통", "질서"]
    },
    {
      number: 4,
      symbol: "☶/☵",
      name: "산수몽",
      koreanName: "山水蒙",
      coreViewpoint: "무지와 계몽의 관점",
      summary: "안개(무지) 속에 갇힌 상황에서 어떻게 교육과 경험을 통해 길을 찾는지를 살핀다.",
      keywords: ["무지", "계몽", "교육", "경험", "깨달음"]
    },
    {
      number: 5,
      symbol: "☵/☰",
      name: "수천수",
      koreanName: "水天需",
      coreViewpoint: "전략적 기다림의 관점",
      summary: "장애물 앞에서 맹목적으로 돌진하지 않고, 확신을 갖고 때를 기다리며 힘을 기른다.",
      keywords: ["전략", "기다림", "인내", "때", "준비"]
    },
    {
      number: 6,
      symbol: "☰/☵",
      name: "천수송",
      koreanName: "天水訟",
      coreViewpoint: "갈등과 분쟁 해결의 관점",
      summary: "서로 다른 두 힘이 충돌할 때, 그 갈등의 원인을 분석하고 해결하는 법을 모색한다.",
      keywords: ["갈등", "분쟁", "해결", "중재", "조화"]
    },
    {
      number: 7,
      symbol: "⚏/☵",
      name: "지수사",
      koreanName: "地水師",
      coreViewpoint: "조직과 군중 통솔의 관점",
      summary: "명확한 목표와 원칙을 가진 리더가 어떻게 조직(군중)을 이끌고 힘을 결집하는지를 본다.",
      keywords: ["조직", "군중", "통솔", "리더십", "결집"]
    },
    {
      number: 8,
      symbol: "☵/⚏",
      name: "수지비",
      koreanName: "水地比",
      coreViewpoint: "연대와 파트너십의 관점",
      summary: "중심을 기반으로 한 협력과 연대가 어떻게 시너지를 창출하는지 그 원리를 살핀다.",
      keywords: ["연대", "파트너십", "협력", "시너지", "관계"]
    },
    {
      number: 9,
      symbol: "☴/☰",
      name: "풍천소축",
      koreanName: "風天小畜",
      coreViewpoint: "작은 성공과 점진적 축적의 관점",
      summary: "거대한 힘이 작은 힘에 의해 잠시 멈춘 상태로, 작은 성공을 축적하며 나아간다.",
      keywords: ["작은성공", "축적", "점진적", "성장", "인내"]
    },
    {
      number: 10,
      symbol: "☰/☱",
      name: "천택리",
      koreanName: "天澤履",
      coreViewpoint: "리스크 관리와 프로토콜의 관점",
      summary: "위험(호랑이 꼬리)을 밟는 아슬아슬한 상황에서, 정해진 절차와 예의로 위기를 관리한다.",
      keywords: ["리스크", "관리", "프로토콜", "위기", "절차"]
    },
    {
      number: 11,
      symbol: "⚏/☰",
      name: "지천태",
      koreanName: "地天泰",
      coreViewpoint: "소통과 상생의 관점 (번영)",
      summary: "서로 다른 두 에너지가 활발히 교류하며 안정과 번영을 이루는 최적의 상태를 본다.",
      keywords: ["소통", "상생", "번영", "교류", "안정"]
    },
    {
      number: 12,
      symbol: "☰/⚏",
      name: "천지비",
      koreanName: "天地否",
      coreViewpoint: "단절과 불통의 관점 (침체)",
      summary: "소통이 단절되어 모든 것이 정체되고 막혀버린 위기 상황의 원인과 구조를 분석한다.",
      keywords: ["단절", "불통", "침체", "정체", "위기"]
    },
    {
      number: 13,
      symbol: "☰/☲",
      name: "천화동인",
      koreanName: "天火同人",
      coreViewpoint: "개방적 협력과 공동 목표의 관점",
      summary: "사적인 관계를 넘어, 공동의 목표 아래 여러 사람이 뜻을 모아 함께 나아가는 힘을 본다.",
      keywords: ["개방", "협력", "공동목표", "단결", "공익"]
    },
    {
      number: 14,
      symbol: "☲/☰",
      name: "화천대유",
      koreanName: "火天大有",
      coreViewpoint: "풍요와 소유의 관점",
      summary: "큰 성공과 풍요를 이룬 상태에서, 그것을 어떻게 겸손하게 유지하고 나눌 것인가를 고찰한다.",
      keywords: ["풍요", "소유", "성공", "겸손", "나눔"]
    },
    {
      number: 15,
      symbol: "⚏/☶",
      name: "지산겸",
      koreanName: "地山謙",
      coreViewpoint: "겸손과 자기조절의 관점",
      summary: "재능(산)을 가졌음에도 스스로를 낮추는(땅) 겸손의 미덕이 왜 중요한지를 이해한다.",
      keywords: ["겸손", "자기조절", "미덕", "재능", "겸양"]
    },
    {
      number: 16,
      symbol: "☳/⚏",
      name: "뇌지예",
      koreanName: "雷地豫",
      coreViewpoint: "준비와 예방의 관점",
      summary: "미리 준비하고 즐거워하는 상태로, 긍정적 기대와 사전 대비의 중요성을 살핀다.",
      keywords: ["준비", "예방", "기대", "대비", "즐거움"]
    },
    {
      number: 17,
      symbol: "☱/☳",
      name: "택뢰수",
      koreanName: "澤雷隨",
      coreViewpoint: "변화 수용과 팔로워십의 관점",
      summary: "원칙을 갖고 시대의 변화와 리더를 따르는 유연한 적응의 지혜를 고찰한다.",
      keywords: ["변화", "수용", "팔로워십", "적응", "유연성"]
    },
    {
      number: 18,
      symbol: "☶/☴",
      name: "산풍고",
      koreanName: "山風蠱",
      coreViewpoint: "문제 해결과 개혁의 관점",
      summary: "오랫동안 방치되어 썩고 막힌 문제(蠱)의 원인을 진단하고 해결하는 과정을 살핀다.",
      keywords: ["문제해결", "개혁", "진단", "치료", "혁신"]
    },
    {
      number: 19,
      symbol: "⚏/☱",
      name: "지택림",
      koreanName: "地澤臨",
      coreViewpoint: "적극적 참여와 현장 관리의 관점",
      summary: "높은 위치에서 낮은 곳으로 직접 나아가(臨) 살피고 관리하는 리더십을 본다.",
      keywords: ["참여", "현장", "관리", "리더십", "접근"]
    },
    {
      number: 20,
      symbol: "☴/⚏",
      name: "풍지관",
      koreanName: "風地觀",
      coreViewpoint: "관찰과 통찰의 관점",
      summary: "한발 물러서서 전체를 조망하며, 현상의 이면에 있는 본질과 패턴을 관찰한다.",
      keywords: ["관찰", "통찰", "조망", "본질", "패턴"]
    },
    {
      number: 21,
      symbol: "☲/☳",
      name: "화뢰서합",
      koreanName: "火雷噬嗑",
      coreViewpoint: "장애물 제거와 결단의 관점",
      summary: "입안의 이물질(장애물)을 깨물어 없애듯, 문제 해결을 위한 결단과 집행력을 본다.",
      keywords: ["장애물", "제거", "결단", "집행", "해결"]
    },
    {
      number: 22,
      symbol: "☶/☲",
      name: "산화비",
      koreanName: "山火賁",
      coreViewpoint: "본질과 꾸밈의 관점",
      summary: "실질(산)과 형식(불)의 조화. 본질을 바탕으로 한 포장과 브랜딩의 원리를 살핀다.",
      keywords: ["본질", "꾸밈", "조화", "브랜딩", "포장"]
    },
    {
      number: 23,
      symbol: "☶/⚏",
      name: "산지박",
      koreanName: "山地剝",
      coreViewpoint: "쇠퇴와 붕괴의 관점",
      summary: "기반이 무너지며 모든 것이 깎여나가는 쇠퇴의 시점에서, 어떻게 핵심을 보존할지 본다.",
      keywords: ["쇠퇴", "붕괴", "보존", "핵심", "위기"]
    },
    {
      number: 24,
      symbol: "⚏/☳",
      name: "지뢰복",
      koreanName: "地雷復",
      coreViewpoint: "회복과 전환점의 관점",
      summary: "혹한의 동지가 지나고 하나의 양(陽)이 돌아오듯, 쇠퇴 끝에 나타나는 회복의 전환점을 본다.",
      keywords: ["회복", "전환점", "희망", "재시작", "변화"]
    },
    {
      number: 25,
      symbol: "☰/☳",
      name: "천뢰무망",
      koreanName: "天雷無妄",
      coreViewpoint: "순리와 자연스러움의 관점",
      summary: "인위적인 욕심을 버리고, 하늘의 이치(자연의 법칙)에 따라 순리대로 행동하는 법을 본다.",
      keywords: ["순리", "자연", "법칙", "진실", "순수"]
    },
    {
      number: 26,
      symbol: "☶/☰",
      name: "산천대축",
      koreanName: "山天大畜",
      coreViewpoint: "거대한 잠재력과 축적의 관점",
      summary: "거대한 에너지(天)가 단단한 그릇(山)에 담겨 있듯, 큰 힘을 축적하고 관리하는 법을 본다.",
      keywords: ["잠재력", "축적", "관리", "힘", "저장"]
    },
    {
      number: 27,
      symbol: "☶/☳",
      name: "산뢰이",
      koreanName: "山雷頤",
      coreViewpoint: "자기관리와 양육의 관점",
      summary: "입(頤)의 모양으로, 무엇을 먹고(정보, 음식), 무슨 말을 할 것인가 하는 자기관리의 문제를 본다.",
      keywords: ["자기관리", "양육", "선택", "절제", "말"]
    },
    {
      number: 28,
      symbol: "☱/☴",
      name: "택풍대과",
      koreanName: "澤風大過",
      coreViewpoint: "비상 상황과 과감한 결단의 관점",
      summary: "기둥이 휠 정도의 비상 상황에서, 평범한 규칙을 넘어선 과감한 행동의 필요성을 본다.",
      keywords: ["비상", "과감", "결단", "위기", "용기"]
    },
    {
      number: 29,
      symbol: "☵/☵",
      name: "중수감",
      koreanName: "重水坎",
      coreViewpoint: "위기관리와 반복 훈련의 관점",
      summary: "반복되는 위기 상황 속에서 핵심을 잃지 않고, 훈련을 통해 극복하는 방법을 모색한다.",
      keywords: ["위기관리", "반복", "훈련", "극복", "연습"]
    },
    {
      number: 30,
      symbol: "☲/☲",
      name: "중화리",
      koreanName: "重火離",
      coreViewpoint: "네트워크와 상호의존의 관점",
      summary: "개별적인 것들이 서로 의존(離)하고 연결되어야만 빛을 발하는 네트워크의 본질을 본다.",
      keywords: ["네트워크", "의존", "연결", "관계", "빛"]
    },
    {
      number: 31,
      symbol: "☱/☶",
      name: "택산함",
      koreanName: "澤山咸",
      coreViewpoint: "공감과 상호작용의 관점",
      summary: "젊은 남녀가 서로에게 느끼는 '감응(咸)'처럼, 진실한 상호작용과 공감의 원리를 본다.",
      keywords: ["공감", "상호작용", "감응", "소통", "이해"]
    },
    {
      number: 32,
      symbol: "☳/☴",
      name: "뇌풍항",
      koreanName: "雷風恒",
      coreViewpoint: "지속가능성과 항상성의 관점",
      summary: "역동적인 것(雷)과 유순한 것(風)이 각자의 위치를 지키듯, 오래 지속되는 시스템의 조건을 본다.",
      keywords: ["지속가능", "항상성", "균형", "지속", "안정"]
    },
    {
      number: 33,
      symbol: "☰/☶",
      name: "천산돈",
      koreanName: "天山遯",
      coreViewpoint: "전략적 후퇴의 관점",
      summary: "불리한 상황에서 맹목적으로 싸우지 않고, 다음을 위해 질서 있게 물러나는 지혜를 본다.",
      keywords: ["후퇴", "전략", "지혜", "타이밍", "재정비"]
    },
    {
      number: 34,
      symbol: "☳/☰",
      name: "뇌천대장",
      koreanName: "雷天大壯",
      coreViewpoint: "성장과 자기과신의 경계 관점",
      summary: "에너지가 강하고 왕성한 상태(大壯)에서, 힘을 남용하지 않고 원칙을 지키는 법을 살핀다.",
      keywords: ["성장", "과신", "경계", "원칙", "절제"]
    },
    {
      number: 35,
      symbol: "☲/⚏",
      name: "화지진",
      koreanName: "火地晉",
      coreViewpoint: "점진적 성장과 인정의 관점",
      summary: "태양이 지평선 위로 떠오르듯, 꾸준히 나아가며 주변의 인정을 받는 성장 모델을 본다.",
      keywords: ["점진적", "성장", "인정", "발전", "꾸준함"]
    },
    {
      number: 36,
      symbol: "⚏/☲",
      name: "지화명이",
      koreanName: "地火明夷",
      coreViewpoint: "암흑기 생존 전략의 관점",
      summary: "밝음(明)이 땅속에 상처 입고(夷) 숨은 상태로, 어려운 시기를 버티는 지혜를 본다.",
      keywords: ["암흑기", "생존", "전략", "인내", "희망"]
    },
    {
      number: 37,
      symbol: "☴/☲",
      name: "풍화가인",
      koreanName: "風火家人",
      coreViewpoint: "가족 시스템과 역할의 관점",
      summary: "가족 구성원들이 각자의 역할과 책임을 다할 때, 건강한 시스템이 유지되는 원리를 본다.",
      keywords: ["가족", "시스템", "역할", "책임", "조화"]
    },
    {
      number: 38,
      symbol: "☲/☱",
      name: "화택규",
      koreanName: "火澤睽",
      coreViewpoint: "불화와 이질성의 관점",
      summary: "서로 다른 본성(불과 물)이 등을 돌린 상태로, 갈등 속에서도 공통점을 찾는 법을 모색한다.",
      keywords: ["불화", "이질성", "갈등", "공통점", "화해"]
    },
    {
      number: 39,
      symbol: "☵/☶",
      name: "수산건",
      koreanName: "水山蹇",
      coreViewpoint: "진퇴양난과 우회의 관점",
      summary: "앞으로는 강(水), 뒤로는 산(山)이 막힌 상황에서, 문제를 정면 돌파가 아닌 우회하는 법을 본다.",
      keywords: ["진퇴양난", "우회", "막힘", "돌파", "방법"]
    },
    {
      number: 40,
      symbol: "☳/☵",
      name: "뇌수해",
      koreanName: "雷水解",
      coreViewpoint: "문제 해결과 해소의 관점",
      summary: "얼어붙은 겨울(水)이 가고 봄의 천둥(雷)이 치듯, 문제가 해결되는 해소의 과정을 본다.",
      keywords: ["해결", "해소", "봄", "변화", "해방"]
    },
    {
      number: 41,
      symbol: "☶/☱",
      name: "산택손",
      koreanName: "山澤損",
      coreViewpoint: "손실과 핵심 집중의 관점",
      summary: "덜어내는 것(損)이 오히려 이익이 되는 상황. 비핵심을 덜어내고 핵심에 집중하는 전략을 본다.",
      keywords: ["손실", "핵심", "집중", "덜어냄", "효율"]
    },
    {
      number: 42,
      symbol: "☴/☳",
      name: "풍뢰익",
      koreanName: "風雷益",
      coreViewpoint: "이익과 시너지의 관점",
      summary: "덜어낸 것을 보태주니(益) 더 큰 이익이 생기는 상황. 투자와 시너지의 원리를 본다.",
      keywords: ["이익", "시너지", "투자", "보탬", "상생"]
    },
    {
      number: 43,
      symbol: "☱/☰",
      name: "택천쾌",
      koreanName: "澤天夬",
      coreViewpoint: "결단과 공개의 관점",
      summary: "하나의 음(陰)을 여러 양(陽)이 몰아내는 상황. 문제를 과감히 결단하고 투명하게 공개해야 함을 본다.",
      keywords: ["결단", "공개", "투명", "과감", "정의"]
    },
    {
      number: 44,
      symbol: "☰/☴",
      name: "천풍구",
      koreanName: "天風姤",
      coreViewpoint: "우연한 만남과 초기 대응의 관점",
      summary: "예상치 못한 만남(逅)이 시작된 상황으로, 작은 조짐을 초기에 어떻게 관리할지 본다.",
      keywords: ["우연", "만남", "초기", "대응", "조짐"]
    },
    {
      number: 45,
      symbol: "☱/⚏",
      name: "택지췌",
      koreanName: "澤地萃",
      coreViewpoint: "군중과 집결의 관점",
      summary: "연못에 물이 모이듯(萃), 사람들이 모여드는 현상과 군중의 힘을 어떻게 활용할지 본다.",
      keywords: ["군중", "집결", "모임", "힘", "활용"]
    },
    {
      number: 46,
      symbol: "⚏/☴",
      name: "지풍승",
      koreanName: "地風升",
      coreViewpoint: "점진적 성장의 관점",
      summary: "땅속의 씨앗이 나무로 자라듯, 꾸준한 노력을 통해 위로 올라가는(升) 성장 모델을 본다.",
      keywords: ["점진적", "성장", "상승", "노력", "발전"]
    },
    {
      number: 47,
      symbol: "☱/☵",
      name: "택수곤",
      koreanName: "澤水困",
      coreViewpoint: "곤경과 본질 유지의 관점",
      summary: "연못에 물이 다 빠져버린 곤경(困) 속에서, 말을 잃지 않고(신념) 본질을 지키는 법을 본다.",
      keywords: ["곤경", "본질", "유지", "신념", "인내"]
    },
    {
      number: 48,
      symbol: "☵/☴",
      name: "수풍정",
      koreanName: "水風井",
      coreViewpoint: "공유 자원과 시스템의 관점",
      summary: "마르지 않는 우물(井)처럼, 모두가 공유하는 자원과 시스템을 어떻게 유지, 보수할지 본다.",
      keywords: ["공유", "자원", "시스템", "우물", "유지"]
    },
    {
      number: 49,
      symbol: "☱/☲",
      name: "택화혁",
      koreanName: "澤火革",
      coreViewpoint: "패러다임 전환과 혁신의 관점",
      summary: "기존의 낡은 시스템을 근본적으로 바꾸는 혁명적 변화의 원리와 필연성을 이해한다.",
      keywords: ["패러다임", "전환", "혁신", "변화", "혁명"]
    },
    {
      number: 50,
      symbol: "☲/☴",
      name: "화풍정",
      koreanName: "火風鼎",
      coreViewpoint: "안정과 전문성의 관점",
      summary: "세발솥(鼎)처럼 안정된 시스템 위에서, 인재를 양성하고 전문성을 인정하는 법을 본다.",
      keywords: ["안정", "전문성", "인재", "양성", "시스템"]
    },
    {
      number: 51,
      symbol: "☳/☳",
      name: "중뢰진",
      koreanName: "重雷震",
      coreViewpoint: "돌발 상황과 위기 대응의 관점",
      summary: "갑작스러운 천둥(震)이 반복되는 상황에서, 놀라지 않고 침착하게 자기를 돌아보는 법을 본다.",
      keywords: ["돌발", "위기", "대응", "침착", "성찰"]
    },
    {
      number: 52,
      symbol: "☶/☶",
      name: "중산간",
      koreanName: "重山艮",
      coreViewpoint: "멈춤과 자기 성찰의 관점",
      summary: "움직임을 멈추고(艮) 자기 자리를 지키며, 욕망을 제어하고 내면을 성찰하는 시간을 본다.",
      keywords: ["멈춤", "성찰", "제어", "내면", "고요"]
    },
    {
      number: 53,
      symbol: "☴/☶",
      name: "풍산점",
      koreanName: "風山漸",
      coreViewpoint: "점진적 발전과 절차의 관점",
      summary: "나무가 산 위에서 서서히 자라듯(漸), 순서와 절차를 따라 점진적으로 발전하는 모델을 본다.",
      keywords: ["점진적", "발전", "절차", "순서", "성장"]
    },
    {
      number: 54,
      symbol: "☳/☱",
      name: "뇌택귀매",
      koreanName: "雷澤歸妹",
      coreViewpoint: "비정상적 결합과 결과 예측의 관점",
      summary: "비정상적인 출발이 가져올 결과를 예측하고, 단기적 쾌락이 아닌 장기적 관점을 유지한다.",
      keywords: ["비정상", "결합", "예측", "장기적", "결과"]
    },
    {
      number: 55,
      symbol: "☳/☲",
      name: "뇌화풍",
      koreanName: "雷火豊",
      coreViewpoint: "풍요의 정점과 허무의 관점",
      summary: "해가 중천에 뜬 듯한 풍요(豊)의 절정에서, 오히려 그림자가 생겨날 것을 대비하는 지혜를 본다.",
      keywords: ["풍요", "정점", "허무", "절정", "대비"]
    },
    {
      number: 56,
      symbol: "☲/☶",
      name: "화산려",
      koreanName: "火山旅",
      coreViewpoint: "나그네와 적응의 관점",
      summary: "정처 없이 떠도는 나그네(旅)의 상황에서, 새로운 환경에 어떻게 적응하고 처신할지 본다.",
      keywords: ["나그네", "적응", "환경", "처신", "변화"]
    },
    {
      number: 57,
      symbol: "☴/☴",
      name: "중풍손",
      koreanName: "重風巽",
      coreViewpoint: "겸손과 반복의 힘 관점",
      summary: "부드러운 바람(巽)이 반복해서 불 때 바위도 뚫듯, 겸손한 태도의 반복이 갖는 힘을 본다.",
      keywords: ["겸손", "반복", "힘", "부드러움", "지속"]
    },
    {
      number: 58,
      symbol: "☱/☱",
      name: "중택태",
      koreanName: "重澤兌",
      coreViewpoint: "기쁨과 소통의 관점",
      summary: "함께 모여 기뻐하고(兌) 토론하며, 긍정적 소통이 어떻게 발전의 원동력이 되는지를 본다.",
      keywords: ["기쁨", "소통", "토론", "긍정", "발전"]
    },
    {
      number: 59,
      symbol: "☴/☵",
      name: "풍수환",
      koreanName: "風水渙",
      coreViewpoint: "분열과 해소의 관점",
      summary: "얼음(水)이 바람(風)에 녹아 흩어지듯(渙), 굳어 있던 문제나 조직이 해체되는 과정을 본다.",
      keywords: ["분열", "해소", "해체", "흩어짐", "변화"]
    },
    {
      number: 60,
      symbol: "☵/☱",
      name: "수택절",
      koreanName: "水澤節",
      coreViewpoint: "절제와 한계 설정의 관점",
      summary: "물을 담는 그릇의 크기처럼, 명확한 한계(節)를 설정하는 것이 왜 중요한지를 이해한다.",
      keywords: ["절제", "한계", "설정", "그릇", "균형"]
    },
    {
      number: 61,
      symbol: "☴/☱",
      name: "풍택중부",
      koreanName: "風澤中孚",
      coreViewpoint: "진실한 신뢰의 관점",
      summary: "어미새가 알을 품듯(孚), 말이 아닌 마음속 진실함이 어떻게 신뢰를 형성하는지 본다.",
      keywords: ["진실", "신뢰", "마음", "품기", "형성"]
    },
    {
      number: 62,
      symbol: "☳/☶",
      name: "뇌산소과",
      koreanName: "雷山小過",
      coreViewpoint: "작은 성공과 겸손의 관점",
      summary: "작은 새가 날아가는 모습으로, 분수에 맞는 작은 일(小過)에 만족하고 겸손해야 함을 본다.",
      keywords: ["작은성공", "겸손", "분수", "만족", "소과"]
    },
    {
      number: 63,
      symbol: "☵/☲",
      name: "수화기제",
      koreanName: "水火旣濟",
      coreViewpoint: "완성과 정점의 질서 (쇠퇴의 시작) 관점",
      summary: "완벽한 성공과 균형 상태에 도달했으나, 바로 그 때문에 변화와 쇠퇴를 준비해야 함을 본다.",
      keywords: ["완성", "정점", "질서", "쇠퇴", "준비"]
    },
    {
      number: 64,
      symbol: "☲/☵",
      name: "화수미제",
      koreanName: "火水未濟",
      coreViewpoint: "미완성과 무한한 가능성의 관점",
      summary: "모든 것이 아직 미완성(未濟)이기에, 오히려 무한한 가능성을 품고 새로운 시작을 할 수 있음을 본다.",
      keywords: ["미완성", "가능성", "무한", "시작", "잠재력"]
    }
  ];
}
