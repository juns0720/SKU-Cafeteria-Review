// 모바일 앱 프레임 컨테이너
// 모바일: 전체 화면 / 데스크톱: 375×760 박스 (centering은 App.jsx 에서)
export default function Frame({ children }) {
  return (
    <div className="w-full h-[100dvh] bg-white text-g900 flex flex-col overflow-hidden sm:w-[375px] sm:h-[760px] sm:rounded-[32px] sm:shadow-frame sm:flex-shrink-0">
      {children}
    </div>
  );
}
