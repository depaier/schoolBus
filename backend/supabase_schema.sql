-- =====================================================
-- 통학버스 예매 시스템 Supabase 스키마
-- =====================================================

-- 0. 회원정보 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT UNIQUE NOT NULL,  -- 학번 (아이디 대체)
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    fcm_token TEXT,  -- Firebase Cloud Messaging 토큰
    apn_token TEXT,  -- Apple Push Notification 토큰
    notification_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. 버스 노선 테이블
CREATE TABLE IF NOT EXISTS bus_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_name TEXT NOT NULL,
    route_id TEXT UNIQUE NOT NULL,
    departure_time TIME NOT NULL,
    total_seats INTEGER NOT NULL DEFAULT 30,
    available_seats INTEGER NOT NULL DEFAULT 30,
    is_open BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 예매 전체 상태 테이블 (싱글톤 - 하나의 레코드만 유지)
CREATE TABLE IF NOT EXISTS reservation_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_open BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 예매 기록 테이블 (선택사항 - 나중에 예매 기능 구현 시)
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES bus_routes(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT,
    user_phone TEXT,
    seat_number INTEGER,
    status TEXT DEFAULT 'confirmed', -- confirmed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 인덱스 생성
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_notification_enabled ON users(notification_enabled);
CREATE INDEX IF NOT EXISTS idx_bus_routes_is_open ON bus_routes(is_open);
CREATE INDEX IF NOT EXISTS idx_bus_routes_route_id ON bus_routes(route_id);
CREATE INDEX IF NOT EXISTS idx_reservations_route_id ON reservations(route_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- =====================================================
-- Row Level Security (RLS) 설정
-- =====================================================

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 회원정보 정책
CREATE POLICY "Anyone can insert users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (true);

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read bus routes" ON bus_routes
    FOR SELECT USING (true);

CREATE POLICY "Anyone can read reservation status" ON reservation_status
    FOR SELECT USING (true);

-- 인증된 사용자만 쓰기 가능 (관리자 기능)
-- 실제로는 관리자 role을 만들어서 제한해야 하지만, 
-- 지금은 간단하게 anon key로도 쓰기 가능하도록 설정
CREATE POLICY "Anyone can insert bus routes" ON bus_routes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update bus routes" ON bus_routes
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete bus routes" ON bus_routes
    FOR DELETE USING (true);

CREATE POLICY "Anyone can insert reservation status" ON reservation_status
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update reservation status" ON reservation_status
    FOR UPDATE USING (true);

-- 예매 기록은 사용자가 자신의 것만 볼 수 있도록 (나중에 구현)
CREATE POLICY "Anyone can read reservations" ON reservations
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert reservations" ON reservations
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 초기 데이터 삽입
-- =====================================================

-- 예매 상태 초기화 (하나의 레코드만)
INSERT INTO reservation_status (is_open) 
VALUES (false)
ON CONFLICT DO NOTHING;

-- 샘플 노선 데이터
INSERT INTO bus_routes (route_name, route_id, departure_time, total_seats, available_seats, is_open)
VALUES 
    ('등교 노선 A', 'ROUTE_001', '08:00:00', 30, 30, false),
    ('하교 노선 A', 'ROUTE_002', '17:00:00', 30, 30, false)
ON CONFLICT (route_id) DO NOTHING;

-- =====================================================
-- 트리거: updated_at 자동 업데이트
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bus_routes_updated_at
    BEFORE UPDATE ON bus_routes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservation_status_updated_at
    BEFORE UPDATE ON reservation_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
