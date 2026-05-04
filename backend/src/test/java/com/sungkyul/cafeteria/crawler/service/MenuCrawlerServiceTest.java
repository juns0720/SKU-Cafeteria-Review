package com.sungkyul.cafeteria.crawler.service;

import com.sungkyul.cafeteria.crawler.dto.CrawlingResult;
import com.sungkyul.cafeteria.menu.entity.Holiday;
import com.sungkyul.cafeteria.menu.entity.Menu;
import com.sungkyul.cafeteria.menu.entity.MenuDate;
import com.sungkyul.cafeteria.menu.repository.HolidayRepository;
import com.sungkyul.cafeteria.menu.repository.MenuDateRepository;
import com.sungkyul.cafeteria.menu.repository.MenuRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MenuCrawlerServiceTest {

    @Mock
    private MenuRepository menuRepository;

    @Mock
    private MenuDateRepository menuDateRepository;

    @Mock
    private HolidayRepository holidayRepository;

    private MenuCrawlerService crawlerService;

    // 실제 성결대 HTML 구조를 반영: <th>요일<br>yyyy.MM.dd</th>
    // no-data 클래스로 주말 셀 표현
    private static final String SAMPLE_HTML = """
            <html><body>
            <table>
              <thead>
                <tr>
                  <th class="title">식단구분</th>
                  <th>월<br>2026.04.13</th>
                  <th>화<br>2026.04.14</th>
                  <th>토<br>2026.04.18</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>한식</td>
                  <td>된장찌개<br/>공기밥<br/>김치</td>
                  <td>김치찌개<br/>공기밥</td>
                  <td class="no-data">등록된 식단내용이(가) 없습니다.</td>
                </tr>
                <tr>
                  <td>양식</td>
                  <td>스파게티</td>
                  <td>피자</td>
                  <td class="no-data">등록된 식단내용이(가) 없습니다.</td>
                </tr>
              </tbody>
            </table>
            </body></html>
            """;

    private static final String HOLIDAY_HTML = """
            <html><body>
            <table>
              <thead>
                <tr>
                  <th class="title">식단구분</th>
                  <th>월<br>2026.04.13</th>
                  <th>화<br>2026.04.14</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>한식</td>
                  <td>된장찌개<br/>공기밥</td>
                  <td>휴일</td>
                </tr>
                <tr>
                  <td>양식</td>
                  <td>스파게티</td>
                  <td>임시 휴무입니다</td>
                </tr>
              </tbody>
            </table>
            </body></html>
            """;

    private static final String NO_TABLE_HTML = """
            <html><body><p>메뉴 정보가 없습니다.</p></body></html>
            """;

    private static final String EMPTY_DATE_HEADER_HTML = """
            <html><body>
            <table>
              <thead><tr><th class="title">식단구분</th></tr></thead>
              <tbody><tr><td>한식</td><td>된장찌개</td></tr></tbody>
            </table>
            </body></html>
            """;

    @BeforeEach
    void setUp() {
        crawlerService = spy(new MenuCrawlerService(menuRepository, menuDateRepository, holidayRepository));
        lenient().when(holidayRepository.existsByHolidayDate(any())).thenReturn(false);
        lenient().when(holidayRepository.save(any(Holiday.class))).thenAnswer(inv -> inv.getArgument(0));

        // 기본: 모든 메뉴가 신규 (사용하지 않는 테스트에서 예외가 발생하지 않도록 lenient 설정)
        lenient().when(menuRepository.findByNameAndCorner(any(), any())).thenReturn(Optional.empty());
        lenient().when(menuRepository.save(any(Menu.class))).thenAnswer(inv -> inv.getArgument(0));

        // 기본: 모든 menu_date가 신규
        lenient().when(menuDateRepository.existsByMenuAndServedDate(any(), any())).thenReturn(false);
        lenient().when(menuDateRepository.save(any(MenuDate.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("정상 크롤링 - 새 메뉴 전부 저장 (no-data 셀 제외)")
    void crawlAndSave_allNewMenus_savesAll() throws Exception {
        Document doc = Jsoup.parse(SAMPLE_HTML);
        doReturn(doc).when(crawlerService).fetchDocument();

        CrawlingResult result = crawlerService.crawlAndSave();

        // 한식: 월(3개)+화(2개)=5, 양식: 월(1개)+화(1개)=2 → 총 7개 (토 no-data 제외)
        assertThat(result.errorMessage()).isNull();
        assertThat(result.savedCount()).isEqualTo(7);
        assertThat(result.skippedCount()).isEqualTo(0);

        // menu_dates 7건 저장
        verify(menuDateRepository, times(7)).save(any(MenuDate.class));

        // 저장된 menu_dates에 no-data 텍스트가 없는지 — menu 이름으로 간접 확인
        ArgumentCaptor<Menu> menuCaptor = ArgumentCaptor.forClass(Menu.class);
        verify(menuRepository, atLeastOnce()).save(menuCaptor.capture());
        assertThat(menuCaptor.getAllValues()).extracting(Menu::getCorner)
                .allMatch(c -> c.equals("한식") || c.equals("양식"));
        assertThat(menuCaptor.getAllValues()).extracting(Menu::getName)
                .doesNotContain("등록된 식단내용이(가) 없습니다.");
        assertThat(menuCaptor.getAllValues()).extracting(Menu::getFirstSeenAt)
                .doesNotContainNull();
        assertThat(menuCaptor.getAllValues()).extracting(Menu::getLastSeenAt)
                .doesNotContainNull();
    }

    @Test
    @DisplayName("이미 존재하는 menu_date는 skip, 신규만 저장")
    void crawlAndSave_partialDuplicates_skipsExistingDate() throws Exception {
        Document doc = Jsoup.parse(SAMPLE_HTML);
        doReturn(doc).when(crawlerService).fetchDocument();

        // 된장찌개/한식 메뉴는 이미 존재
        Menu existingMenu = Menu.builder().name("된장찌개").corner("한식").build();
        when(menuRepository.findByNameAndCorner(eq("된장찌개"), eq("한식")))
                .thenReturn(Optional.of(existingMenu));

        // 된장찌개/한식 의 2026-04-13 날짜도 이미 기록됨
        LocalDate monday = LocalDate.of(2026, 4, 13);
        when(menuDateRepository.existsByMenuAndServedDate(eq(existingMenu), eq(monday)))
                .thenReturn(true);

        CrawlingResult result = crawlerService.crawlAndSave();

        assertThat(result.errorMessage()).isNull();
        assertThat(result.savedCount()).isEqualTo(6);
        assertThat(result.skippedCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("중복 menu_date 여도 seen date 메타가 비어 있으면 보정")
    void crawlAndSave_duplicateDate_repairsNullSeenDates() throws Exception {
        String html = """
                <html><body>
                <table>
                  <thead><tr><th class="title">식단구분</th><th>월<br>2026.04.13</th></tr></thead>
                  <tbody><tr><td>한식</td><td>된장찌개</td></tr></tbody>
                </table>
                </body></html>
                """;
        Document doc = Jsoup.parse(html);
        doReturn(doc).when(crawlerService).fetchDocument();

        Menu existingMenu = Menu.builder().name("된장찌개").corner("한식").build();
        when(menuRepository.findByNameAndCorner("된장찌개", "한식"))
                .thenReturn(Optional.of(existingMenu));
        when(menuDateRepository.existsByMenuAndServedDate(existingMenu, LocalDate.of(2026, 4, 13)))
                .thenReturn(true);

        CrawlingResult result = crawlerService.crawlAndSave();

        assertThat(result.savedCount()).isZero();
        assertThat(result.skippedCount()).isEqualTo(1);
        assertThat(existingMenu.getFirstSeenAt()).isEqualTo(LocalDate.of(2026, 4, 13));
        assertThat(existingMenu.getLastSeenAt()).isEqualTo(LocalDate.of(2026, 4, 13));
        verify(menuRepository).save(existingMenu);
    }

    @Test
    @DisplayName("기존 메뉴가 더 늦은 날짜에 다시 등장하면 lastSeenAt 을 갱신")
    void crawlAndSave_existingMenu_updatesLastSeenAt() throws Exception {
        String html = """
                <html><body>
                <table>
                  <thead>
                    <tr>
                      <th class="title">식단구분</th>
                      <th>월<br>2026.04.13</th>
                      <th>화<br>2026.04.14</th>
                    </tr>
                  </thead>
                  <tbody><tr><td>한식</td><td>된장찌개</td><td>된장찌개</td></tr></tbody>
                </table>
                </body></html>
                """;
        Document doc = Jsoup.parse(html);
        doReturn(doc).when(crawlerService).fetchDocument();

        Menu existingMenu = Menu.builder()
                .name("된장찌개")
                .corner("한식")
                .firstSeenAt(LocalDate.of(2026, 4, 10))
                .lastSeenAt(LocalDate.of(2026, 4, 10))
                .build();
        when(menuRepository.findByNameAndCorner("된장찌개", "한식"))
                .thenReturn(Optional.of(existingMenu));

        CrawlingResult result = crawlerService.crawlAndSave();

        assertThat(result.savedCount()).isEqualTo(2);
        assertThat(result.skippedCount()).isZero();
        assertThat(existingMenu.getFirstSeenAt()).isEqualTo(LocalDate.of(2026, 4, 10));
        assertThat(existingMenu.getLastSeenAt()).isEqualTo(LocalDate.of(2026, 4, 14));
        verify(menuRepository, times(2)).save(existingMenu);
    }

    @Test
    @DisplayName("table 태그가 없으면 failure 반환")
    void crawlAndSave_noTable_returnsFailure() throws Exception {
        Document doc = Jsoup.parse(NO_TABLE_HTML);
        doReturn(doc).when(crawlerService).fetchDocument();

        CrawlingResult result = crawlerService.crawlAndSave();

        assertThat(result.errorMessage()).isNotNull();
        assertThat(result.savedCount()).isEqualTo(0);
        verify(menuRepository, never()).save(any());
        verify(menuDateRepository, never()).save(any());
    }

    @Test
    @DisplayName("날짜 헤더가 없으면 failure 반환")
    void crawlAndSave_noDateHeaders_returnsFailure() throws Exception {
        Document doc = Jsoup.parse(EMPTY_DATE_HEADER_HTML);
        doReturn(doc).when(crawlerService).fetchDocument();

        CrawlingResult result = crawlerService.crawlAndSave();

        assertThat(result.errorMessage()).isNotNull();
        assertThat(result.savedCount()).isEqualTo(0);
        verify(menuDateRepository, never()).save(any());
    }

    @Test
    @DisplayName("네트워크 오류 발생 시 failure 반환")
    void crawlAndSave_fetchThrows_returnsFailure() throws Exception {
        doThrow(new RuntimeException("Connection refused")).when(crawlerService).fetchDocument();

        CrawlingResult result = crawlerService.crawlAndSave();

        assertThat(result.errorMessage()).contains("Connection refused");
        assertThat(result.savedCount()).isEqualTo(0);
        verify(menuDateRepository, never()).save(any());
    }

    @Test
    @DisplayName("날짜 파싱 검증 - yyyy.MM.dd 형식에서 servedDate 올바르게 추출")
    void crawlAndSave_parsedDatesAreCorrect() throws Exception {
        Document doc = Jsoup.parse(SAMPLE_HTML);
        doReturn(doc).when(crawlerService).fetchDocument();

        crawlerService.crawlAndSave();

        ArgumentCaptor<MenuDate> captor = ArgumentCaptor.forClass(MenuDate.class);
        verify(menuDateRepository, atLeastOnce()).save(captor.capture());

        List<LocalDate> dates = captor.getAllValues().stream()
                .map(MenuDate::getServedDate)
                .distinct()
                .toList();

        // 토요일 no-data이므로 월·화 2개만
        assertThat(dates).containsExactlyInAnyOrder(
                LocalDate.of(2026, 4, 13),
                LocalDate.of(2026, 4, 14)
        );
    }

    @Test
    @DisplayName("저장된 MenuDate의 mealSlot은 LUNCH")
    void crawlAndSave_savedMenuDate_hasMealSlotLunch() throws Exception {
        Document doc = Jsoup.parse(SAMPLE_HTML);
        doReturn(doc).when(crawlerService).fetchDocument();

        crawlerService.crawlAndSave();

        ArgumentCaptor<MenuDate> captor = ArgumentCaptor.forClass(MenuDate.class);
        verify(menuDateRepository, atLeastOnce()).save(captor.capture());
        assertThat(captor.getAllValues()).extracting(MenuDate::getMealSlot)
                .allMatch("LUNCH"::equals);
    }

    @Test
    @DisplayName("휴일 메시지 셀은 메뉴로 저장하지 않음 (no-data 클래스 없어도)")
    void crawlAndSave_holidayMessage_isSkipped() throws Exception {
        Document doc = Jsoup.parse(HOLIDAY_HTML);
        doReturn(doc).when(crawlerService).fetchDocument();

        CrawlingResult result = crawlerService.crawlAndSave();

        // 월요일 한식 2개 + 양식 1개 = 3개만 저장, 화요일 휴일 메시지는 제외
        assertThat(result.savedCount()).isEqualTo(3);

        ArgumentCaptor<Menu> captor = ArgumentCaptor.forClass(Menu.class);
        verify(menuRepository, atLeastOnce()).save(captor.capture());
        assertThat(captor.getAllValues()).extracting(Menu::getName)
                .doesNotContain("휴일", "임시 휴무입니다");
    }

    @Test
    @DisplayName("빈 코너명 행은 무시")
    void crawlAndSave_emptyCornerName_isIgnored() throws Exception {
        String htmlWithEmptyCorner = """
                <html><body>
                <table>
                  <thead><tr><th class="title">식단구분</th><th>월<br>2026.04.13</th></tr></thead>
                  <tbody>
                    <tr><td></td><td>된장찌개</td></tr>
                    <tr><td>한식</td><td>김치찌개</td></tr>
                  </tbody>
                </table>
                </body></html>
                """;
        Document doc = Jsoup.parse(htmlWithEmptyCorner);
        doReturn(doc).when(crawlerService).fetchDocument();

        CrawlingResult result = crawlerService.crawlAndSave();

        assertThat(result.savedCount()).isEqualTo(1);
        ArgumentCaptor<Menu> captor = ArgumentCaptor.forClass(Menu.class);
        verify(menuRepository, times(1)).save(captor.capture());
        assertThat(captor.getValue().getCorner()).isEqualTo("한식");
        assertThat(captor.getValue().getName()).isEqualTo("김치찌개");
    }
}
