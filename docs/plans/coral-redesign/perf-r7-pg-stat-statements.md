# PERF-R7 · Supabase pg_stat_statements 확인 기록

> 목적: 운영 Supabase에서 실제 느린 쿼리와 호출 빈도가 높은 쿼리를 확인해, 인덱스/쿼리 최적화를 추측이 아니라 근거 기반으로 결정한다.

## 실행 위치

Supabase Dashboard → SQL Editor

이 작업은 운영 DB 접근 권한이 필요하다. 로컬 Codex 환경에는 운영 DB 접속 정보가 없으므로, 아래 SQL을 Supabase SQL Editor에서 실행하고 결과를 이 문서에 기록한다.

## 사전 확인

`pg_stat_statements` 확장이 없으면 먼저 활성화한다.

```sql
create extension if not exists pg_stat_statements;
```

확장 확인:

```sql
select extname
from pg_extension
where extname = 'pg_stat_statements';
```

## 느린 쿼리 상위 20개

```sql
select
  calls,
  round(total_exec_time::numeric, 2) as total_ms,
  round(mean_exec_time::numeric, 2) as mean_ms,
  rows,
  query
from pg_stat_statements
order by mean_exec_time desc
limit 20;
```

## 호출 많은 쿼리 상위 20개

```sql
select
  calls,
  round(total_exec_time::numeric, 2) as total_ms,
  round(mean_exec_time::numeric, 2) as mean_ms,
  rows,
  query
from pg_stat_statements
order by calls desc
limit 20;
```

## 기록 양식

측정일:
측정자:
배포 버전/커밋:

| 구분 | calls | mean_ms | rows | query 요약 | 판단 |
|---|---:|---:|---:|---|---|
| 느린 쿼리 | | | | | |
| 호출 많은 쿼리 | | | | | |

## 판단 기준

- `reviews` 최신순 조회가 상위권이면 `idx_reviews_menu_created_at` 복합 인덱스 적용을 검토한다.
- `auth/me` 또는 사용자 통계 조회가 호출 상위권이면 프론트 staleTime/무효화 범위를 먼저 확인한다.
- `menus` 조회가 평균 실행 시간은 낮은데 브라우저 total이 길면 DB보다 네트워크/Render 오버헤드 가능성이 높다.
- `rows`가 과도하게 큰 쿼리는 응답 DTO 크기와 pagination 여부를 함께 확인한다.
