-- =====================================================
-- 마이그레이션: bus_routes 테이블에 bus_type 컬럼 추가 및 노선 데이터 추가
-- =====================================================

-- 1. bus_routes 테이블에 bus_type 컬럼 추가
ALTER TABLE bus_routes 
ADD COLUMN IF NOT EXISTS bus_type TEXT NOT NULL DEFAULT '등교';

-- 2. bus_type 컬럼에 체크 제약 조건 추가
ALTER TABLE bus_routes 
ADD CONSTRAINT bus_type_check CHECK (bus_type IN ('등교', '하교'));

-- 3. bus_type 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bus_routes_bus_type ON bus_routes(bus_type);

-- 4. 등교 노선 데이터 추가 (첫번째 이미지)
INSERT INTO bus_routes (route_name, route_id, bus_type, departure_time, total_seats, available_seats, is_open)
VALUES 
    -- 경기 노선들
    ('경기(동탄 오산)', 'ROUTE_TO_GYEONGGI_DONGTAN_OSAN', '등교', '07:00:00', 44, 44, false),
    ('경기(송내 시흥)', 'ROUTE_TO_GYEONGGI_SONGNAE_SIHEUNG', '등교', '07:00:00', 44, 44, false),
    ('경기(송내)', 'ROUTE_TO_GYEONGGI_SONGNAE', '등교', '07:00:00', 44, 44, false),
    ('경기(수원)', 'ROUTE_TO_GYEONGGI_SUWON', '등교', '07:00:00', 44, 44, false),
    ('경기(안산터미널/상록수)', 'ROUTE_TO_GYEONGGI_ANSAN_TERMINAL', '등교', '07:00:00', 44, 44, false),
    ('경기(일산 김포)', 'ROUTE_TO_GYEONGGI_ILSAN_GIMPO', '등교', '07:00:00', 44, 44, false),
    
    -- 서울 노선들
    ('서울(신도림)', 'ROUTE_TO_SEOUL_SINDORIM', '등교', '07:00:00', 44, 44, false),
    ('서울(양재) 경기(판교 동천)', 'ROUTE_TO_SEOUL_YANGJAE_PANGYO', '등교', '07:00:00', 44, 44, false),
    
    -- 인천 노선들
    ('인천(원인재역)', 'ROUTE_TO_INCHEON_WONINJAE', '등교', '07:00:00', 44, 44, false),
    ('인천(주안)', 'ROUTE_TO_INCHEON_JUAN', '등교', '07:00:00', 44, 44, false),
    
    -- 충남 노선들
    ('충남(당진,서산(08시))', 'ROUTE_TO_CHUNGNAM_DANGJIN_SEOSAN_08', '등교', '08:00:00', 44, 44, false),
    ('충남(서산(09시))', 'ROUTE_TO_CHUNGNAM_SEOSAN_09', '등교', '09:00:00', 44, 44, false),
    ('충남(천안 아산 예산 홍성)', 'ROUTE_TO_CHUNGNAM_CHEONAN_ASAN', '등교', '07:00:00', 44, 44, false),
    
    -- 태안비행장
    ('태안비행장', 'ROUTE_TO_TAEAN_AIRPORT', '등교', '07:00:00', 44, 44, false)
ON CONFLICT (route_id) DO NOTHING;

-- 5. 하교 노선 데이터 추가 (두번째 이미지)
INSERT INTO bus_routes (route_name, route_id, bus_type, departure_time, total_seats, available_seats, is_open)
VALUES 
    -- 경기 노선들
    ('경기(송내)', 'ROUTE_FROM_GYEONGGI_SONGNAE', '하교', '17:00:00', 44, 44, false),
    ('경기(수원역)', 'ROUTE_FROM_GYEONGGI_SUWON_STATION', '하교', '17:00:00', 44, 44, false),
    ('경기(안산)', 'ROUTE_FROM_GYEONGGI_ANSAN', '하교', '17:00:00', 44, 44, false),
    ('경기(오산 동탄)', 'ROUTE_FROM_GYEONGGI_OSAN_DONGTAN', '하교', '17:00:00', 44, 44, false),
    ('경기(일산 김포)', 'ROUTE_FROM_GYEONGGI_ILSAN_GIMPO', '하교', '17:00:00', 44, 44, false),
    
    -- 서울 노선들
    ('서울(사당 판교 18시 20분)', 'ROUTE_FROM_SEOUL_SADANG_PANGYO_1820', '하교', '18:20:00', 44, 44, false),
    ('서울(사당)', 'ROUTE_FROM_SEOUL_SADANG', '하교', '17:00:00', 44, 44, false),
    
    -- 인천 노선들
    ('인천(인천터미널역)', 'ROUTE_FROM_INCHEON_TERMINAL', '하교', '17:00:00', 44, 44, false),
    
    -- 충남 노선들
    ('충남(내포 삽교 16시)', 'ROUTE_FROM_CHUNGNAM_NAEPO_SAPGYO_16', '하교', '16:00:00', 44, 44, false),
    ('충남(당진,서산)', 'ROUTE_FROM_CHUNGNAM_DANGJIN_SEOSAN', '하교', '17:00:00', 44, 44, false),
    ('충남(천안 아산 예산 홍성)', 'ROUTE_FROM_CHUNGNAM_CHEONAN_ASAN', '하교', '17:00:00', 44, 44, false),
    
    -- 태안비행장
    ('태안비행장', 'ROUTE_FROM_TAEAN_AIRPORT', '하교', '17:00:00', 44, 44, false)
ON CONFLICT (route_id) DO NOTHING;


-- =====================================================
-- 완료 메시지
-- =====================================================
-- 이 마이그레이션을 실행하면:
-- 1. bus_routes 테이블에 bus_type 컬럼이 추가됩니다
-- 2. 등교 노선 14개가 추가됩니다
-- 3. 하교 노선 12개가 추가됩니다
-- 4. 기존 샘플 데이터의 bus_type이 설정됩니다
