-- =====================================================
-- 마이그레이션: bus_routes에 departure_date 추가 및 reservations 테이블 수정
-- =====================================================

-- 1. bus_routes 테이블에 departure_date 컬럼 추가
ALTER TABLE bus_routes 
ADD COLUMN IF NOT EXISTS departure_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- 2. departure_date 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bus_routes_departure_date ON bus_routes(departure_date);

-- 3. bus_type과 departure_date 복합 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_bus_routes_type_date ON bus_routes(bus_type, departure_date);

-- 4. reservations 테이블에서 seat_number 컬럼 제거 및 seat_count 추가
ALTER TABLE reservations 
DROP COLUMN IF EXISTS seat_number;

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS seat_count INTEGER NOT NULL DEFAULT 1;

-- 5. seat_count에 체크 제약 조건 추가 (1명 이상)
ALTER TABLE reservations 
ADD CONSTRAINT seat_count_check CHECK (seat_count > 0);

-- =====================================================
-- 완료 메시지
-- =====================================================
-- 이 마이그레이션을 실행하면:
-- 1. bus_routes 테이블에 departure_date 컬럼이 추가됩니다
-- 2. departure_date 관련 인덱스가 생성됩니다
-- 3. reservations 테이블의 seat_number가 seat_count로 변경됩니다
-- 4. seat_count는 1 이상의 값만 허용됩니다
