/*
 * 챕터 목록 — 새 진도가 나가면 여기에 한 줄만 추가하세요.
 *  ch: 장 번호, title: 장 제목
 *  summary: 요약 페이지 경로 (없으면 null)
 *  quiz: 문제 페이지 경로 (1~5장은 중간고사 합본 페이지를 같이 씀)
 *  range: "mid"(중간 범위) | "final"(기말에서 새로 추가된 범위)
 */
window.OS_CHAPTERS = [
  { ch: 1,  title: "운영체제 개요",            summary: "summary/ch01.html", quiz: "quiz/mid-1-5.html", range: "mid" },
  { ch: 2,  title: "컴퓨터의 구조와 성능 향상", summary: "summary/ch02.html", quiz: "quiz/mid-1-5.html", range: "mid" },
  { ch: 3,  title: "프로세스", summary: "summary/ch03.html", quiz: "quiz/mid-1-5.html", range: "mid" },
  { ch: 4,  title: "스레드와 프로세스 간 통신", summary: "summary/ch04.html", quiz: "quiz/mid-1-5.html", range: "mid" },
  { ch: 5,  title: "CPU 스케줄링",              summary: "summary/ch05.html", quiz: "quiz/mid-1-5.html", range: "mid" },
  { ch: 6,  title: "임계구역과 동기화",         summary: "summary/ch06.html", quiz: "quiz/ch06.html",    range: "final" },
  { ch: 7,  title: "교착상태",                  summary: "summary/ch07.html", quiz: "quiz/ch07.html",    range: "final" },
  { ch: 8,  title: "메모리와 할당",             summary: "summary/ch08.html", quiz: "quiz/ch08.html",    range: "final" },
  { ch: 9,  title: "페이징 메모리",             summary: "summary/ch09.html", quiz: "quiz/ch09.html",    range: "final" },
  { ch: 10, title: "가상 메모리 관리",          summary: "summary/ch10.html", quiz: "quiz/ch10.html",    range: "final" }
];
