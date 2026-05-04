package com.sungkyul.cafeteria.crawler.service;

import com.sungkyul.cafeteria.crawler.dto.CrawlingResult;
import com.sungkyul.cafeteria.menu.entity.Holiday;
import com.sungkyul.cafeteria.menu.entity.Menu;
import com.sungkyul.cafeteria.menu.entity.MenuDate;
import com.sungkyul.cafeteria.menu.repository.HolidayRepository;
import com.sungkyul.cafeteria.menu.repository.MenuDateRepository;
import com.sungkyul.cafeteria.menu.repository.MenuRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.cert.X509Certificate;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class MenuCrawlerService {

    private static final String TARGET_URL = "https://www.sungkyul.ac.kr/skukr/340/subview.do";
    private static final int TIMEOUT_MS = 10_000;

    private final MenuRepository menuRepository;
    private final MenuDateRepository menuDateRepository;
    private final HolidayRepository holidayRepository;

    /** 테스트에서 stubbing 가능하도록 분리 (package-private) */
    Document fetchDocument() throws Exception {
        // 성결대 웹사이트는 한국 CA 인증서를 사용하여 JVM 기본 truststore에 없음
        // SSL 검증을 우회하는 커스텀 context 사용
        SSLContext sslContext = SSLContext.getInstance("TLS");
        sslContext.init(null, new TrustManager[]{new X509TrustManager() {
            public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
            public void checkClientTrusted(X509Certificate[] c, String a) {}
            public void checkServerTrusted(X509Certificate[] c, String a) {}
        }}, new java.security.SecureRandom());

        return Jsoup.connect(TARGET_URL)
                .timeout(TIMEOUT_MS)
                .sslSocketFactory(sslContext.getSocketFactory())
                .get();
    }

    @Async
    public void crawlAndSaveAsync() {
        crawlAndSave();
    }

    public CrawlingResult crawlAndSave() {
        int savedCount = 0;
        int skippedCount = 0;

        try {
            Document doc = fetchDocument();

            Element table = doc.selectFirst("table");
            if (table == null) {
                log.error("[Crawler] table 태그를 찾을 수 없습니다.");
                return CrawlingResult.failure("table 태그를 찾을 수 없습니다.");
            }

            List<LocalDate> dates = parseDates(table);
            if (dates.isEmpty()) {
                log.error("[Crawler] 날짜 헤더를 파싱할 수 없습니다.");
                return CrawlingResult.failure("날짜 헤더를 파싱할 수 없습니다.");
            }

            log.info("[Crawler] 파싱된 날짜: {}", dates);

            // 휴일 감지: 날짜별 (휴일메시지 조우 여부, 저장된 메뉴 수) 추적
            Set<LocalDate> holidayMessageDates = new HashSet<>();
            Map<LocalDate, Integer> savedPerDate = new HashMap<>();

            Elements rows = table.select("tbody tr");
            for (Element row : rows) {
                Elements cells = row.select("td");
                if (cells.isEmpty()) continue;

                String corner = cells.get(0).text().trim();
                if (corner.isEmpty()) continue;

                for (int i = 1; i < cells.size() && (i - 1) < dates.size(); i++) {
                    LocalDate servedDate = dates.get(i - 1);
                    Element cell = cells.get(i);

                    if (cell.hasClass("no-data")) continue;

                    List<String> menuNames = splitByBr(cell);

                    for (String menuName : menuNames) {
                        if (menuName.isEmpty()) continue;
                        if (isHolidayMessage(menuName)) {
                            log.info("[Crawler] 휴일 메시지 skip: '{}'", menuName);
                            holidayMessageDates.add(servedDate);
                            continue;
                        }

                        // (name, corner) 기준으로 upsert — 메뉴 자체는 한 번만 저장
                        Menu menu = menuRepository.findByNameAndCorner(menuName, corner)
                                .map(existingMenu -> syncMenuSeenDates(existingMenu, servedDate))
                                .orElseGet(() -> menuRepository.save(
                                        Menu.builder()
                                                .name(menuName)
                                                .corner(corner)
                                                .firstSeenAt(servedDate)
                                                .lastSeenAt(servedDate)
                                                .build()
                                ));

                        // 해당 주차 제공일 기록 — 이미 있으면 skip
                        if (menuDateRepository.existsByMenuAndServedDate(menu, servedDate)) {
                            skippedCount++;
                        } else {
                            menuDateRepository.save(
                                    MenuDate.builder().menu(menu).servedDate(servedDate).mealSlot("LUNCH").build()
                            );
                            savedCount++;
                            savedPerDate.merge(servedDate, 1, Integer::sum);
                        }
                    }
                }
            }

            // 휴일 메시지가 있었으나 실제 메뉴가 0건인 날짜 → holidays 테이블에 저장
            int holidayCount = 0;
            for (LocalDate holidayDate : holidayMessageDates) {
                if (savedPerDate.getOrDefault(holidayDate, 0) == 0) {
                    if (!holidayRepository.existsByHolidayDate(holidayDate)) {
                        holidayRepository.save(Holiday.builder().holidayDate(holidayDate).build());
                        log.info("[Crawler] 휴일 등록: {}", holidayDate);
                    }
                    holidayCount++;
                }
            }

            log.info("[Crawler] 완료 — saved: {}, skipped: {}, holidays: {}", savedCount, skippedCount, holidayCount);
            return CrawlingResult.success(savedCount, skippedCount, holidayCount);

        } catch (Exception e) {
            log.error("[Crawler] 크롤링 중 오류 발생: {}", e.getMessage(), e);
            return CrawlingResult.failure(e.getMessage());
        }
    }

    private Menu syncMenuSeenDates(Menu menu, LocalDate servedDate) {
        if (menu.syncSeenDates(servedDate)) {
            return menuRepository.save(menu);
        }
        return menu;
    }

    public String debugHtml() {
        try {
            Document doc = fetchDocument();
            return doc.outerHtml();
        } catch (Exception e) {
            log.error("[Crawler] debugHtml 오류: {}", e.getMessage(), e);
            return "오류: " + e.getMessage();
        }
    }

    /**
     * thead의 th에서 날짜를 파싱한다. 첫 번째 th(class="title")는 skip.
     *
     * 실제 HTML 구조:
     *   <th scope="col">월<br>2026.04.13</th>
     *
     * Jsoup .text() 호출 시 br 사이의 텍스트가 공백으로 합쳐져 "월 2026.04.13" 형태가 된다.
     * yyyy.MM.dd 패턴을 정규식으로 직접 추출한다.
     */
    private static final Set<String> HOLIDAY_KEYWORDS = Set.of(
            "휴일", "휴무", "휴관", "공휴일", "방학", "운영안함",
            "운영하지", "없습니다", "쉽니다", "점검", "행사"
    );

    private static final Pattern DATE_PATTERN = Pattern.compile("(\\d{4}\\.\\d{2}\\.\\d{2})");
    private static final DateTimeFormatter DOT_DATE_FMT = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private List<LocalDate> parseDates(Element table) {
        List<LocalDate> dates = new ArrayList<>();
        Elements headers = table.select("thead tr th");

        for (int i = 1; i < headers.size(); i++) {
            String text = headers.get(i).text().trim();
            Matcher m = DATE_PATTERN.matcher(text);
            if (m.find()) {
                dates.add(LocalDate.parse(m.group(1), DOT_DATE_FMT));
            } else {
                log.warn("[Crawler] 날짜 파싱 실패: '{}'", text);
            }
        }
        return dates;
    }

    private boolean isHolidayMessage(String text) {
        for (String kw : HOLIDAY_KEYWORDS) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    private List<String> splitByBr(Element cell) {
        List<String> result = new ArrayList<>();
        for (String line : cell.wholeText().split("\n")) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty()) {
                result.add(trimmed);
            }
        }
        return result;
    }
}
