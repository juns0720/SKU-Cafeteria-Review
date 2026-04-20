import { useState } from 'react';
import Icon from '../components/hi/Icon';
import FoodIllust from '../components/hi/FoodIllust';
import Pill from '../components/hi/Pill';
import Card from '../components/hi/Card';
import Button from '../components/hi/Button';
import Stars from '../components/hi/Stars';
import UL from '../components/hi/UL';
import SecLabel from '../components/hi/SecLabel';
import AxisBar from '../components/hi/AxisBar';
import Screen from '../components/hi/Screen';
import TabBarHi from '../components/hi/TabBarHi';
import BestCarousel from '../components/hi/BestCarousel';
import WeekDayTabs from '../components/hi/WeekDayTabs';
import CornerFilterChips from '../components/hi/CornerFilterChips';
import MedalSticker from '../components/hi/MedalSticker';
import MultiStarRating from '../components/hi/MultiStarRating';
import MultiStarSummary from '../components/hi/MultiStarSummary';
import BadgeProgressBar from '../components/hi/BadgeProgressBar';
import StatsGrid from '../components/hi/StatsGrid';
import EmptyState from '../components/hi/EmptyState';

const ICON_NAMES = [
  'bowl','soup','chop','star','starO','search','home','cal','list',
  'user','heart','gear','pencil','cam','medal','fire','chevL','chevR','chevD',
  'x','plus','filter',
];

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{
        fontFamily: 'var(--font-disp)',
        fontSize: 20,
        color: '#2B2218',
        borderBottom: '2px solid #2B2218',
        paddingBottom: 8,
        marginBottom: 20,
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        {children}
      </div>
    </section>
  );
}

function Label({ text }) {
  return (
    <div style={{ fontFamily: 'var(--font-hand)', fontSize: 11, color: '#8E7A66', marginTop: 4, textAlign: 'center' }}>
      {text}
    </div>
  );
}

export default function DevComponentsPage() {
  return (
    <div style={{
      background: '#FBF6EC',
      minHeight: '100vh',
      padding: '60px 40px',
      fontFamily: 'var(--font-hand)',
      color: '#2B2218',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-disp)',
        fontSize: 30,
        marginBottom: 8,
      }}>
        <UL>컴포넌트 카탈로그</UL>
      </h1>
      <p style={{ color: '#8E7A66', marginBottom: 48, fontSize: 13 }}>
        components/hi/ · Phase 3 기초 9종
      </p>

      {/* Icon */}
      <Section title="Icon (22종)">
        {ICON_NAMES.map(name => (
          <div key={name} style={{ textAlign: 'center' }}>
            <Icon name={name} size={28} color="#2B2218" />
            <Label text={name} />
          </div>
        ))}
      </Section>

      {/* FoodIllust */}
      <Section title="FoodIllust">
        {[
          { kind: 'bowl', bg: '#FCE3C9' },
          { kind: 'soup', bg: '#FBE6A6' },
          { kind: 'chop', bg: '#CDE5C8' },
          { kind: 'bowl', bg: '#F6C7A8' },
        ].map((p, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <FoodIllust kind={p.kind} size={72} bg={p.bg} />
            <Label text={`${p.kind} · ${p.bg}`} />
          </div>
        ))}
        <div style={{ textAlign: 'center' }}>
          <FoodIllust kind="bowl" size={48} />
          <Label text="size 48" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <FoodIllust kind="soup" size={100} bg="#CDE5C8" />
          <Label text="size 100" />
        </div>
      </Section>

      {/* Pill */}
      <Section title="Pill">
        <div>
          <Pill>기본</Pill>
          <Label text="default" />
        </div>
        <div>
          <Pill bg="#FBE6A6" border="#2B2218">NEW</Pill>
          <Label text="NEW" />
        </div>
        <div>
          <Pill bg="#CDE5C8" border="#4A8F5B" color="#4A8F5B">베스트</Pill>
          <Label text="베스트" />
        </div>
        <div>
          <Pill bg="#FBE6A6" icon={<Icon name="fire" size={12} color="#EF8A3D" />}>TOP 5</Pill>
          <Label text="TOP5 + icon" />
        </div>
        <div>
          <Pill bg="#2B2218" color="#FBF6EC" border="#2B2218">GOLD</Pill>
          <Label text="dark" />
        </div>
      </Section>

      {/* Card */}
      <Section title="Card">
        <Card style={{ padding: 16, width: 140 }}>
          <div style={{ fontFamily: 'var(--font-disp)' }}>기본 카드</div>
          <div style={{ fontSize: 13, color: '#8E7A66' }}>bg white</div>
        </Card>
        <Card style={{ padding: 16, width: 140 }} bg="#FBE6A6">
          <div style={{ fontFamily: 'var(--font-disp)' }}>노랑 배경</div>
          <div style={{ fontSize: 13, color: '#8E7A66' }}>bg yellowSoft</div>
        </Card>
        <Card style={{ padding: 16, width: 140 }} shadow={false}>
          <div style={{ fontFamily: 'var(--font-disp)' }}>그림자 없음</div>
          <div style={{ fontSize: 13, color: '#8E7A66' }}>shadow=false</div>
        </Card>
        <Card style={{ padding: 16, width: 140 }} round={32}>
          <div style={{ fontFamily: 'var(--font-disp)' }}>큰 라운드</div>
          <div style={{ fontSize: 13, color: '#8E7A66' }}>round=32</div>
        </Card>
      </Section>

      {/* Button */}
      <Section title="Button">
        <div style={{ textAlign: 'center' }}>
          <Button>기본</Button>
          <Label text="default md" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <Button primary>확인</Button>
          <Label text="primary md" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <Button size="sm">작게</Button>
          <Label text="default sm" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <Button size="lg" primary>크게</Button>
          <Label text="primary lg" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <Button icon={<Icon name="pencil" size={16} color="#2B2218" />}>리뷰 쓰기</Button>
          <Label text="with icon" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <Button primary icon={<Icon name="plus" size={16} color="#FBF6EC" />}>추가</Button>
          <Label text="primary + icon" />
        </div>
      </Section>

      {/* Stars */}
      <Section title="Stars">
        {[0, 1, 2.5, 3, 4.3, 5].map(v => (
          <div key={v} style={{ textAlign: 'center' }}>
            <Stars value={v} size="md" />
            <Label text={`${v} / sm`} />
          </div>
        ))}
        <div style={{ textAlign: 'center' }}>
          <Stars value={4} size="sm" />
          <Label text="size sm (10)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <Stars value={4} size="lg" />
          <Label text="size lg (32)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <Stars value={3} size={20} color="#EF8A3D" />
          <Label text="orange, size 20" />
        </div>
      </Section>

      {/* UL */}
      <Section title="UL (웨이브 언더라인)">
        <div>
          <span style={{ fontFamily: 'var(--font-disp)', fontSize: 24 }}>
            <UL>오늘의 메뉴</UL>
          </span>
          <Label text="orange (default)" />
        </div>
        <div>
          <span style={{ fontFamily: 'var(--font-disp)', fontSize: 20 }}>
            <UL color="#4A8F5B">베스트 메뉴</UL>
          </span>
          <Label text="green" />
        </div>
        <div>
          <span style={{ fontFamily: 'var(--font-disp)', fontSize: 18 }}>
            <UL color="#F4B73B">이번 주</UL>
          </span>
          <Label text="yellow" />
        </div>
      </Section>

      {/* SecLabel */}
      <Section title="SecLabel">
        <div style={{ width: 320, background: '#FBF6EC', padding: 16, border: '1px dashed #D8CBB6' }}>
          <SecLabel>오늘의 베스트</SecLabel>
          <div style={{ fontSize: 13, color: '#8E7A66' }}>right 없음</div>
        </div>
        <div style={{ width: 320, background: '#FBF6EC', padding: 16, border: '1px dashed #D8CBB6' }}>
          <SecLabel right={<Pill bg="#FBE6A6" icon={<Icon name="fire" size={12} color="#EF8A3D" />}>TOP 5</Pill>}>
            이번 주 베스트
          </SecLabel>
          <div style={{ fontSize: 13, color: '#8E7A66' }}>right=Pill</div>
        </div>
      </Section>

      {/* AxisBar */}
      <Section title="AxisBar">
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AxisBar label="맛" value={4.5} color="#EF8A3D" />
          <AxisBar label="양" value={3.2} color="#F4B73B" />
          <AxisBar label="가성비" value={4.8} color="#4A8F5B" />
        </div>
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AxisBar label="맛" value={1.0} />
          <AxisBar label="양" value={5.0} />
          <AxisBar label="가성비" value={2.5} />
        </div>
      </Section>

      {/* Screen */}
      <Section title="Screen (모바일 프레임)">
        <Screen label="프리뷰" sub="375 × 760">
          <div style={{ padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-disp)', fontSize: 22, marginBottom: 8 }}>
              <UL>학식 오늘</UL>
            </div>
            <FoodIllust kind="bowl" size={80} />
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Pill>한식</Pill>
              <Pill bg="#FBE6A6">NEW</Pill>
            </div>
            <div style={{ marginTop: 12 }}>
              <Stars value={4.3} size="md" />
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AxisBar label="맛" value={4.5} />
              <AxisBar label="양" value={3.8} />
              <AxisBar label="가성비" value={4.2} />
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <Button size="sm">취소</Button>
              <Button size="sm" primary>리뷰 쓰기</Button>
            </div>
          </div>
        </Screen>
      </Section>

      <hr style={{ border: 'none', borderTop: '3px solid #2B2218', margin: '40px 0' }} />
      <h2 style={{ fontFamily: 'var(--font-disp)', fontSize: 24, marginBottom: 32 }}>
        컴포지트 10종
      </h2>

      {/* TabBarHi */}
      <CompositeSection title="TabBarHi">
        <div style={{ width: 375, border: '1px dashed #D8CBB6' }}>
          <TabBarHiDemo />
        </div>
      </CompositeSection>

      {/* BestCarousel */}
      <CompositeSection title="BestCarousel">
        <div style={{ width: 375, border: '1px dashed #D8CBB6', overflow: 'hidden' }}>
          <BestCarousel items={BEST_ITEMS} />
        </div>
      </CompositeSection>

      {/* WeekDayTabs */}
      <CompositeSection title="WeekDayTabs">
        <div style={{ width: 375, border: '1px dashed #D8CBB6' }}>
          <WeekDayTabsDemo />
        </div>
      </CompositeSection>

      {/* CornerFilterChips */}
      <CompositeSection title="CornerFilterChips">
        <div style={{ width: 375, border: '1px dashed #D8CBB6', padding: '8px 0' }}>
          <CornerFilterChipsDemo />
        </div>
      </CompositeSection>

      {/* MedalSticker */}
      <CompositeSection title="MedalSticker">
        {['GOLD','SILVER','BRONZE'].map(tier => (
          <div key={tier} style={{ textAlign: 'center' }}>
            <MedalSticker tier={tier} size={32} />
            <Label text={`${tier} 32`} />
          </div>
        ))}
        {['GOLD','SILVER','BRONZE'].map(tier => (
          <div key={`sm-${tier}`} style={{ textAlign: 'center' }}>
            <MedalSticker tier={tier} size={18} />
            <Label text={`${tier} 18`} />
          </div>
        ))}
      </CompositeSection>

      {/* MultiStarRating */}
      <CompositeSection title="MultiStarRating">
        <div style={{ width: 320 }}>
          <MultiStarRatingDemo />
        </div>
      </CompositeSection>

      {/* MultiStarSummary */}
      <CompositeSection title="MultiStarSummary">
        <Card style={{ padding: 12, width: 240 }}>
          <div style={{ fontFamily: 'var(--font-disp)', fontSize: 14, marginBottom: 4 }}>밥상탐험가 🥇</div>
          <MultiStarSummary taste={5} amount={4} value={5} />
          <div style={{ fontFamily: 'var(--font-hand)', fontSize: 13, marginTop: 6 }}>바삭함이 살아있어요!</div>
        </Card>
        <Card style={{ padding: 12, width: 240 }}>
          <div style={{ fontFamily: 'var(--font-disp)', fontSize: 14, marginBottom: 4 }}>익명의고양이 🥈</div>
          <MultiStarSummary taste={4} amount={3} value={5} />
        </Card>
      </CompositeSection>

      {/* BadgeProgressBar */}
      <CompositeSection title="BadgeProgressBar">
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Label text="0%" />
            <BadgeProgressBar current={0} max={30} />
          </div>
          <div>
            <Label text="47% (14/30)" />
            <BadgeProgressBar current={14} max={30} />
          </div>
          <div>
            <Label text="100%" />
            <BadgeProgressBar current={30} max={30} color="#4A8F5B" />
          </div>
        </div>
      </CompositeSection>

      {/* StatsGrid */}
      <CompositeSection title="StatsGrid">
        <div style={{ width: 320 }}>
          <StatsGrid stats={[
            { value: 14, label: '리뷰',    bg: '#FCE3C9' },
            { value: 4.2, label: '평균 별점', bg: '#FBE6A6' },
            { value: 2,  label: '뱃지',    bg: '#CDE5C8' },
          ]} />
        </div>
      </CompositeSection>

      {/* EmptyState */}
      <CompositeSection title="EmptyState">
        <div style={{ width: 320, border: '1px dashed #D8CBB6' }}>
          <EmptyState
            title="아직 오늘 메뉴가 없어요"
            description={'매주 월요일 아침에 업데이트됩니다.\n조금만 기다려주세요!'}
          />
        </div>
        <div style={{ width: 320, border: '1px dashed #D8CBB6' }}>
          <EmptyState
            title="리뷰가 없어요"
            description="첫 리뷰의 주인공이 되어보세요"
            illKind="bowl"
            illBg="#FBE6A6"
          />
        </div>
      </CompositeSection>
    </div>
  );
}

// ─── 컴포지트 섹션 헬퍼 ───

function CompositeSection({ title, children }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h3 style={{
        fontFamily: 'var(--font-disp)',
        fontSize: 18,
        color: '#2B2218',
        borderBottom: '1.5px dashed #D8CBB6',
        paddingBottom: 8,
        marginBottom: 20,
      }}>{title}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        {children}
      </div>
    </section>
  );
}

// ─── 인터랙티브 데모 래퍼 ───

function TabBarHiDemo() {
  const [active, setActive] = useState('home');
  return <TabBarHi active={active} onTabChange={setActive} />;
}

function WeekDayTabsDemo() {
  const [idx, setIdx] = useState(0);
  const days = [
    { day: '월', date: '4/20' },
    { day: '화', date: '4/21' },
    { day: '수', date: '4/22' },
    { day: '목', date: '4/23' },
    { day: '금', date: '4/24' },
  ];
  return <WeekDayTabs days={days} activeIndex={idx} onChange={setIdx} />;
}

function CornerFilterChipsDemo() {
  const [active, setActive] = useState('전체');
  const corners = ['전체', '한식', '양식', '분식', '일품'];
  return (
    <div style={{ padding: '0 16px' }}>
      <CornerFilterChips corners={corners} active={active} onChange={setActive} />
    </div>
  );
}

function MultiStarRatingDemo() {
  const [val, setVal] = useState({ taste: 5, amount: 4, value: 5 });
  return <MultiStarRating value={val} onChange={setVal} />;
}

const BEST_ITEMS = [
  { id: 1, name: '치킨까스',    corner: '양식', avgOverall: 4.7, reviewCount: 24, illKind: 'bowl', bg: '#FBE6A6' },
  { id: 2, name: '제육볶음',    corner: '한식', avgOverall: 4.5, reviewCount: 31, illKind: 'bowl', bg: '#FCE3C9' },
  { id: 3, name: '순두부찌개',  corner: '일품', avgOverall: 4.3, reviewCount: 18, illKind: 'soup', bg: '#F6C7A8' },
  { id: 4, name: '김치찌개',    corner: '한식', avgOverall: 4.2, reviewCount: 15, illKind: 'soup', bg: '#FCE3C9' },
  { id: 5, name: '라볶이',      corner: '분식', avgOverall: 4.0, reviewCount:  9, illKind: 'bowl', bg: '#CDE5C8' },
];
