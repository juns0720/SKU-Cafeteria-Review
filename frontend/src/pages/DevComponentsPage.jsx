import { useState } from 'react';

// ── v3 coral/ ────────────────────────────────────────────────────────────────
import CoralIcon from '../components/coral/Icon';
import CoralStatus from '../components/coral/Status';
import CoralHeader from '../components/coral/Header';
import CoralStars from '../components/coral/Stars';
import CoralChip from '../components/coral/Chip';
import CoralSec from '../components/coral/Sec';
import CoralThumb from '../components/coral/Thumb';
import CoralButton from '../components/coral/Button';
import CoralTab from '../components/coral/Tab';
import CoralBestRow from '../components/coral/BestRow';
import CoralWeekPicker from '../components/coral/WeekPicker';
import CoralCategoryFilter from '../components/coral/CategoryFilter';
import CoralMedalDot from '../components/coral/MedalDot';
import CoralMultiStarInput from '../components/coral/MultiStarInput';
import CoralMultiStarSummary from '../components/coral/MultiStarSummary';
import CoralProgressBar from '../components/coral/ProgressBar';
import CoralStatsGrid from '../components/coral/StatsGrid';
import CoralEmpty from '../components/coral/Empty';
import CoralAxisProgress from '../components/coral/AxisProgress';

// ─────────────────────────── 공통 헬퍼 ───────────────────────────────────────

const PRETENDARD = '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

function CSection({ title, children }) {
  return (
    <section style={{ marginBottom: 52 }}>
      <div style={{
        fontSize: 13, fontWeight: 700, color: '#FF6B5C',
        letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12,
      }}>
        Coral ·
      </div>
      <h2 style={{
        fontSize: 20, fontWeight: 800, color: '#191F28',
        letterSpacing: -0.5, borderBottom: '2px solid #F2F4F6',
        paddingBottom: 10, marginBottom: 24, marginTop: -4,
      }}>{title}</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        {children}
      </div>
    </section>
  );
}

function CLabel({ text }) {
  return (
    <div style={{ fontSize: 11, color: '#8B95A1', marginTop: 6, textAlign: 'center', fontWeight: 500 }}>
      {text}
    </div>
  );
}

// ─── 카탈로그 데이터 ──────────────────────────────────────────────────────────

const CORAL_ICONS = [
  'bowl','soup','chop','home','cal','list','user',
  'chev','chevD','chevL','chevR',
  'star','starO','heart','heartF',
  'x','pencil','cam','gear','search','filter',
  'medal','check','plus','arrow',
];

const CORAL_COLORS = [
  { token: 'coral',     hex: '#FF6B5C', dark: true },
  { token: 'coralSoft', hex: '#FFEEEC', dark: false },
  { token: 'g50',  hex: '#F9FAFB', dark: false },
  { token: 'g100', hex: '#F2F4F6', dark: false },
  { token: 'g200', hex: '#E5E8EB', dark: false },
  { token: 'g300', hex: '#D1D6DB', dark: false },
  { token: 'g400', hex: '#B0B8C1', dark: false },
  { token: 'g500', hex: '#8B95A1', dark: true },
  { token: 'g600', hex: '#6B7684', dark: true },
  { token: 'g700', hex: '#4E5968', dark: true },
  { token: 'g800', hex: '#333D4B', dark: true },
  { token: 'g900', hex: '#191F28', dark: true },
];

const CORAL_TYPO = [
  { role: 'Display L', size: 30, weight: 800, tracking: -0.9, sample: 'SKU 학식' },
  { role: 'Display M', size: 26, weight: 800, tracking: -0.8, sample: '닉네임을 정해주세요' },
  { role: 'Title L',   size: 18, weight: 800, tracking: -0.4, sample: '오늘의 베스트 5' },
  { role: 'Title M',   size: 17, weight: 700, tracking: -0.4, sample: '오늘의 메뉴' },
  { role: 'Body L',    size: 15, weight: 700, tracking: -0.3, sample: '치킨까스 정식' },
  { role: 'Caption',   size: 13, weight: 600, tracking: -0.2, sample: '4월 20일 · 양식' },
  { role: 'Meta',      size: 12, weight: 500, tracking:     0, sample: '카테고리 라벨' },
  { role: 'Micro',     size: 11, weight: 500, tracking:     0, sample: 'NEW · 1위' },
];

const CORAL_BEST_ITEMS = [
  { id: 1, name: '치킨까스',   corner: '양식', avgOverall: 4.7, reviewCount: 24 },
  { id: 2, name: '제육볶음',   corner: '한식', avgOverall: 4.5, reviewCount: 31 },
  { id: 3, name: '순두부찌개', corner: '일품', avgOverall: 4.3, reviewCount: 18 },
  { id: 4, name: '김치찌개',   corner: '한식', avgOverall: 4.2, reviewCount: 15 },
  { id: 5, name: '라볶이',     corner: '분식', avgOverall: 4.0, reviewCount:  9 },
];

// ─── 인터랙티브 데모 래퍼 ─────────────────────────────────────────────────────

function CoralWeekPickerDemo() {
  const [idx, setIdx] = useState(0);
  const days = [
    { label: '월', date: 20 }, { label: '화', date: 21 }, { label: '수', date: 22 },
    { label: '목', date: 23 }, { label: '금', date: 24 },
  ];
  return <CoralWeekPicker days={days} activeIndex={idx} onSelect={setIdx} />;
}

function CoralCategoryFilterDemo() {
  const [active, setActive] = useState('전체');
  const cats = ['전체', '한식', '양식', '분식', '일품', '중식'];
  return <CoralCategoryFilter categories={cats} active={active} onSelect={setActive} />;
}

function CoralMultiStarInputDemo() {
  const [val, setVal] = useState({ taste: 4, amount: 3, value: 5 });
  const handleChange = (field, rating) => setVal(prev => ({ ...prev, [field]: rating }));
  return (
    <div style={{ width: 320 }}>
      <CoralMultiStarInput value={val} onChange={handleChange} />
    </div>
  );
}

// ─────────────────────────── 메인 페이지 ──────────────────────────────────────

export default function DevComponentsPage() {
  return (
    <div>

      {/* ══════════════════════════════════════════════════════════════════
          CORAL v3 섹션
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: '#FFFFFF', minHeight: '100vh',
        padding: '60px 40px', fontFamily: PRETENDARD, color: '#191F28',
      }}>
        <div style={{ maxWidth: 900 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, marginBottom: 6 }}>
            Coral v3 컴포넌트 카탈로그
          </h1>
          <p style={{ fontSize: 13, color: '#8B95A1', marginBottom: 56, fontWeight: 500 }}>
            components/coral/ · Icon 25종 + 기초 9종 + 컴포지트 10종
          </p>

          {/* ── 1. Icons ─────────────────────────────────────────────── */}
          <CSection title="Icons (25종)">
            {CORAL_ICONS.map(name => (
              <div key={name} style={{ textAlign: 'center', minWidth: 48 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: '#F9FAFB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CoralIcon name={name} size={24} color="#4E5968" weight={1.6} />
                </div>
                <CLabel text={name} />
              </div>
            ))}
            {/* coral 색상 변형 */}
            <div style={{ width: '100%', borderTop: '1px solid #F2F4F6', paddingTop: 16, marginTop: 4 }}>
              <div style={{ fontSize: 12, color: '#8B95A1', marginBottom: 12, fontWeight: 600 }}>
                star — coral fill / starO — g300 border / heartF — filled
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <CoralIcon name="star"   size={28} color="#FF6B5C" />
                <CoralIcon name="starO"  size={28} color="#D1D6DB" />
                <CoralIcon name="heartF" size={28} color="#FF6B5C" />
              </div>
            </div>
          </CSection>

          {/* ── 2. Basics (9종) ─────────────────────────────────────── */}
          <CSection title="Basics — Status">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ width: 280, border: '1px solid #F2F4F6', borderRadius: 12, overflow: 'hidden' }}>
                <CoralStatus />
              </div>
              <CLabel text="light (default)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ width: 280, border: '1px solid #F2F4F6', borderRadius: 12, overflow: 'hidden', background: '#191F28' }}>
                <CoralStatus dark />
              </div>
              <CLabel text="dark=true" />
            </div>
          </CSection>

          <CSection title="Basics — Header">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 375, border: '1px solid #F2F4F6', borderRadius: 12 }}>
                <CoralHeader title="오늘의 메뉴" />
              </div>
              <CLabel text="title only" />
              <div style={{ width: 375, border: '1px solid #F2F4F6', borderRadius: 12 }}>
                <CoralHeader
                  title="메뉴 상세"
                  left={
                    <button style={{
                      width: 36, height: 36, borderRadius: 18, background: '#F9FAFB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -8,
                      border: 'none', cursor: 'pointer',
                    }}>
                      <CoralIcon name="chevL" size={20} color="#191F28" weight={2} />
                    </button>
                  }
                  right={<CoralIcon name="heart" size={20} color="#4E5968" weight={1.7} />}
                />
              </div>
              <CLabel text="left=back / right=heart" />
            </div>
          </CSection>

          <CSection title="Basics — Stars">
            {[0, 1, 2.5, 3.7, 5].map(v => (
              <div key={v} style={{ textAlign: 'center' }}>
                <CoralStars value={v} size={16} />
                <CLabel text={`${v}`} />
              </div>
            ))}
            <div style={{ textAlign: 'center' }}>
              <CoralStars value={4} size={22} />
              <CLabel text="size 22" />
            </div>
          </CSection>

          <CSection title="Basics — Chip">
            <div style={{ textAlign: 'center' }}>
              <CoralChip active>전체</CoralChip>
              <CLabel text="active" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <CoralChip>한식</CoralChip>
              <CLabel text="inactive" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <CoralChip>양식</CoralChip>
              <CLabel text="inactive" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <CoralChip active>분식</CoralChip>
              <CLabel text="active" />
            </div>
          </CSection>

          <CSection title="Basics — Sec">
            <div style={{ width: 340, border: '1px solid #F2F4F6', borderRadius: 12, padding: '16px 0' }}>
              <CoralSec title="오늘의 베스트 5" right="전체" />
            </div>
            <div style={{ width: 340, border: '1px solid #F2F4F6', borderRadius: 12, padding: '16px 0' }}>
              <CoralSec title="리뷰" sub="최신 리뷰 순으로 보여요" />
            </div>
          </CSection>

          <CSection title="Basics — Thumb">
            {[
              { corner: '한식', size: 48, radius: 12 },
              { corner: '양식', size: 48, radius: 12 },
              { corner: '분식', size: 48, radius: 12 },
              { corner: '일품', size: 48, radius: 12 },
              { corner: '중식', size: 48, radius: 12 },
              { corner: '한식', size: 124, radius: 14 },
              { corner: '양식', size: 140, radius: 24 },
            ].map((p, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <CoralThumb corner={p.corner} size={p.size} radius={p.radius} />
                <CLabel text={`${p.corner} ${p.size}`} />
              </div>
            ))}
          </CSection>

          <CSection title="Basics — Button">
            {[
              { variant: 'primary', size: 'lg', label: 'primary lg' },
              { variant: 'primary', size: 'md', label: 'primary md' },
              { variant: 'accent',  size: 'lg', label: 'accent lg' },
              { variant: 'accent',  size: 'md', label: 'accent md' },
              { variant: 'ghost',   size: 'lg', label: 'ghost lg' },
              { variant: 'ghost',   size: 'md', label: 'ghost md' },
            ].map(b => (
              <div key={b.label} style={{ textAlign: 'center' }}>
                <CoralButton variant={b.variant} size={b.size}>리뷰 작성하기</CoralButton>
                <CLabel text={b.label} />
              </div>
            ))}
            <div style={{ textAlign: 'center' }}>
              <CoralButton variant="primary" size="md" disabled>비활성</CoralButton>
              <CLabel text="disabled" />
            </div>
          </CSection>

          <CSection title="Basics — Tab">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(['home', 'week', 'all', 'me']).map(key => (
                <div key={key}>
                  <div style={{ width: 375, border: '1px solid #F2F4F6', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                    <CoralTab current={key} />
                  </div>
                  <CLabel text={`current="${key}"`} />
                </div>
              ))}
            </div>
          </CSection>

          {/* ── 3. Composites (10종) ─────────────────────────────────── */}
          <CSection title="Composites — BestRow">
            <div style={{ width: 375, border: '1px solid #F2F4F6', borderRadius: 12, overflow: 'hidden' }}>
              <CoralBestRow items={CORAL_BEST_ITEMS} />
            </div>
          </CSection>

          <CSection title="Composites — WeekPicker">
            <div style={{ width: 375, border: '1px solid #F2F4F6', borderRadius: 12, padding: '16px 0' }}>
              <CoralWeekPickerDemo />
            </div>
          </CSection>

          <CSection title="Composites — CategoryFilter">
            <div style={{ width: 375, border: '1px solid #F2F4F6', borderRadius: 12, padding: '12px 0' }}>
              <CoralCategoryFilterDemo />
            </div>
          </CSection>

          <CSection title="Composites — MedalDot">
            {[
              { tier: 'GOLD',   label: 'GOLD — coralSoft bg' },
              { tier: 'SILVER', label: 'SILVER — g100 bg' },
              { tier: 'BRONZE', label: 'BRONZE — g100 bg' },
              { tier: null,     label: 'null → nothing' },
            ].map(({ tier, label }) => (
              <div key={String(tier)} style={{ textAlign: 'center' }}>
                <div style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {tier ? <CoralMedalDot tier={tier} /> : <span style={{ fontSize: 11, color: '#D1D6DB' }}>—</span>}
                </div>
                <CLabel text={label} />
              </div>
            ))}
          </CSection>

          <CSection title="Composites — MultiStarInput">
            <CoralMultiStarInputDemo />
          </CSection>

          <CSection title="Composites — MultiStarSummary">
            {[
              { taste: 5, amount: 5, value: 5 },
              { taste: 4, amount: 3, value: 5 },
              { taste: 1, amount: 2, value: 1 },
            ].map((r, i) => (
              <div key={i} style={{
                padding: '12px 16px', borderRadius: 12, background: '#F9FAFB',
                border: '1px solid #F2F4F6',
              }}>
                <CoralMultiStarSummary taste={r.taste} amount={r.amount} value={r.value} />
              </div>
            ))}
          </CSection>

          <CSection title="Composites — ProgressBar">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
              <CoralProgressBar current={0}  target={30} nextTierLabel="🥇 골드" remaining={30} />
              <CoralProgressBar current={14} target={30} nextTierLabel="🥇 골드" remaining={16} />
              <CoralProgressBar current={29} target={30} nextTierLabel="🥇 골드" remaining={1} />
            </div>
          </CSection>

          <CSection title="Composites — StatsGrid">
            <div style={{ width: 320 }}>
              <CoralStatsGrid items={[
                { value: 14,  label: '리뷰' },
                { value: 4.2, label: '평균 별점' },
                { value: 2,   label: '뱃지' },
              ]} />
            </div>
          </CSection>

          <CSection title="Composites — Empty">
            <div style={{ width: 320 }}>
              <CoralEmpty
                icon="soup"
                title="아직 오늘 메뉴가 없어요"
                description={'매주 월요일 아침에 업데이트됩니다.\n조금만 기다려주세요!'}
              />
            </div>
            <div style={{ width: 320 }}>
              <CoralEmpty
                icon="pencil"
                title="리뷰가 없어요"
                description="첫 리뷰의 주인공이 되어보세요"
                cta={{ label: '리뷰 쓰기', onClick: () => {} }}
              />
            </div>
          </CSection>

          <CSection title="Composites — AxisProgress">
            <div style={{ width: 320 }}>
              <CoralAxisProgress taste={4.8} amount={4.5} value={4.6} />
            </div>
            <div style={{ width: 320 }}>
              <CoralAxisProgress taste={null} amount={null} value={null} />
            </div>
          </CSection>

          {/* ── 4. Color Tokens ──────────────────────────────────────── */}
          <CSection title="Color Tokens">
            {CORAL_COLORS.map(({ token, hex, dark }) => (
              <div key={token} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: hex,
                  border: '1px solid #E5E8EB',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  paddingBottom: 4,
                }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: dark ? '#fff' : '#8B95A1', letterSpacing: 0 }}>
                    {hex}
                  </span>
                </div>
                <CLabel text={token} />
              </div>
            ))}
          </CSection>

          {/* ── 5. Typography ────────────────────────────────────────── */}
          <CSection title="Typography — Pretendard">
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {CORAL_TYPO.map(({ role, size, weight, tracking, sample }) => (
                <div key={role} style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                  <div style={{ fontSize: 11, color: '#B0B8C1', width: 80, flexShrink: 0, fontWeight: 600 }}>
                    {role}
                  </div>
                  <div style={{ fontSize: 11, color: '#D1D6DB', width: 100, flexShrink: 0 }}>
                    {size}px / {weight} / {tracking}
                  </div>
                  <div style={{
                    fontSize: size, fontWeight: weight,
                    letterSpacing: tracking, color: '#191F28', fontFamily: PRETENDARD,
                    lineHeight: 1.2,
                  }}>
                    {sample}
                  </div>
                </div>
              ))}
            </div>
          </CSection>

        </div>
      </div>

    </div>
  );
}
