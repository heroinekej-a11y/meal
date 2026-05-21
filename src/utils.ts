/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function getTodayKST(): Date {
  const now = new Date();
  // KST: UTC+9
  // Calculate timezone shift securely
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kstTime = utc + (9 * 60 * 60 * 1000);
  return new Date(kstTime);
}

export function formatKoreanDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const dayOfWeek = dayNames[date.getDay()];
  return `${month}월 ${day}일 ${dayOfWeek}`;
}

export function formatDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export function getKoreanDayOfWeek(date: Date): string {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  return dayNames[date.getDay()];
}

export function getWeekDates(date: Date): Date[] {
  const currentDay = date.getDay(); // 0(일) ~ 6(토)
  // 월요일과의 차이를 구함
  // 일요일(0)은 지난주 월요일(-6) 또는 이번주 월요일. 급식표는 월~금을 표시하므로, 
  // 일요일에는 내일 오는 새로운 주 또는 이번 주 월요일을 보여줄 수 있으나, 
  // 보통 평일 중심의 스케줄러이므로 일요일(0)은 +1일 하면 다음 주가 되지만, '해당 날짜가 포함된 주'의 월~금을 보여주기로 함.
  // 따라서 일요일이면 -6, 토요일이면 -5, 월~금은 1 - currentDay 만큼 더해 월요일을 찾음.
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + distanceToMonday);
  
  const dates: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function getWeekOfMonth(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const week = Math.ceil(day / 7);
  return `${month}월 ${week}주차`;
}

export function getDefaultSelectedDate(today: Date): Date {
  const day = today.getDay();
  if (day >= 1 && day <= 5) {
    return today;
  }
  // 토요일(6)이면 2일 후인 월요일 반환, 일요일(0)이면 1일 후인 월요일 반환 (방식 B 기준 다음 급식일)
  const distance = day === 0 ? 1 : 2;
  const nextMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + distance);
  return nextMonday;
}
