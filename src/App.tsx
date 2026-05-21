/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, 
  Calendar as CalendarIcon, 
  Calculator as CalculatorIcon, 
  User as UserIcon, 
  Flame, 
  Heart, 
  Bell, 
  Settings, 
  Check, 
  AlertTriangle, 
  ChevronRight, 
  LogOut, 
  Save, 
  HelpCircle, 
  Sparkles 
} from 'lucide-react';

import { Nutrition, DishItem, MealData } from './types';
import { 
  getTodayKST, 
  formatKoreanDate, 
  formatDateKey, 
  getWeekDates, 
  getWeekOfMonth, 
  getDefaultSelectedDate, 
  getKoreanDayOfWeek 
} from './utils';
import { generateMockMeals } from './data';

export default function App() {
  const [today, setToday] = useState<Date>(() => getTodayKST());
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'calculate' | 'profile'>('home');
  const [meals, setMeals] = useState<MealData[]>([]);
  
  // 식단표 탭 관련 상태
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(() => getDefaultSelectedDate(getTodayKST()));
  
  // 영양계산 탭 관련 상태
  const [selectedNutritionDate, setSelectedNutritionDate] = useState<Date>(() => getDefaultSelectedDate(getTodayKST()));
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [nutritionFilter, setNutritionFilter] = useState<'all' | 'rice' | 'soup' | 'side' | 'dessert'>('all');
  
  // 프로필 설정 상태
  const [allergyAlert, setAllergyAlert] = useState(true);
  const [dailyMealAlert, setDailyMealAlert] = useState(true);
  
  // 좋아요 상태 (토글)
  const [isLikedToday, setIsLikedToday] = useState(false);
  const [likesCount, setLikesCount] = useState(128); // 가상의 초기 수치

  // 토스트 메시지 알림 상태
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 급식 데이터 로드
  useEffect(() => {
    const generated = generateMockMeals(today);
    setMeals(generated);
  }, [today]);

  // 영양계산 탭 선택 날짜가 바뀌거나 meals 데이터가 로드되면 선택한 급식 초기화 (오늘의 중식을 디폴트로 체크 완료 처리)
  useEffect(() => {
    if (meals.length > 0) {
      const dateKey = formatDateKey(selectedNutritionDate);
      const todayLunch = meals.find(m => m.dateKey === dateKey && m.mealType === 'lunch');
      if (todayLunch) {
        // 기본으로 밥과 국, 메인반찬 위주로 선택 상태 설정
        const defaultSelected = todayLunch.dishItems.slice(0, 3).map(item => item.name);
        setSelectedDishes(defaultSelected);
      }
    }
  }, [selectedNutritionDate, meals]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // 주말 여부 체크
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;

  // 홈 화면에 띄울 날짜 구하기 (평일이면 오늘, 주말이면 다음 월요일 - 방식 B)
  const homeDisplayDate = getDefaultSelectedDate(today);
  const isHomeDateDifferent = formatDateKey(today) !== formatDateKey(homeDisplayDate);

  // 홈 화면 표시용 중식 / 석식 가져오기
  const homeDateKey = formatDateKey(homeDisplayDate);
  const homeLunch = meals.find(m => m.dateKey === homeDateKey && m.mealType === 'lunch');
  const homeDinner = meals.find(m => m.dateKey === homeDateKey && m.mealType === 'dinner');

  // 주간 식단표 요일 버튼들을 위한 이번 주 월~금 날짜배열 구하기
  const weekDates = getWeekDates(today);

  // 식단표 탭에서 선택된 날짜의 중식 / 석식
  const calendarDateKey = formatDateKey(selectedCalendarDate);
  const calendarLunch = meals.find(m => m.dateKey === calendarDateKey && m.mealType === 'lunch');
  const calendarDinner = meals.find(m => m.dateKey === calendarDateKey && m.mealType === 'dinner');

  // 영양계산에서 선택된 날짜의 중식 데이터
  const calculateDateKey = formatDateKey(selectedNutritionDate);
  const calculateMeal = meals.find(m => m.dateKey === calculateDateKey && m.mealType === 'lunch');

  // 영양계산 탭 실시간 합산 연산
  const currentSelections = calculateMeal 
    ? calculateMeal.dishItems.filter(item => selectedDishes.includes(item.name))
    : [];

  const totalKcal = currentSelections.reduce((acc, current) => acc + current.kcal, 0);
  const totalProtein = currentSelections.reduce((acc, current) => acc + current.nutrition.protein, 0);
  const totalCarbs = currentSelections.reduce((acc, current) => acc + current.nutrition.carbs, 0);
  const totalFat = currentSelections.reduce((acc, current) => acc + current.nutrition.fat, 0);

  // 영양 영양비율 가이드용 프로그레스바 퍼센트 (일일 영양 권장량 기준 - 청소년 기준 가령 프로틴 60g, 탄수화물 130g, 지방 50g 등)
  const proteinPercent = Math.min(100, Math.round((totalProtein / 60) * 100));
  const carbsPercent = Math.min(100, Math.round((totalCarbs / 130) * 100));
  const fatPercent = Math.min(100, Math.round((totalFat / 50) * 100));

  const toggleDishSelection = (name: string) => {
    setSelectedDishes(prev => 
      prev.includes(name) 
        ? prev.filter(d => d !== name) 
        : [...prev, name]
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF7EF] text-[#201b11] font-sans antialiased pb-[100px] md:pb-0 relative flex flex-col items-center">
      
      {/* 토스트 알림 컴포넌트 */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 z-[100] px-6 py-3 bg-[#3c5500] text-white font-bold rounded-full shadow-xl flex items-center gap-2 text-sm"
          >
            <Sparkles className="w-4 h-4 text-[#c9f07c]" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header (Desktop & Mobile) */}
      <header className="w-full bg-[#FAF7EF]/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#496800]/5 shadow-sm">
        {/* Mobile Header (Hidden on Laptop) */}
        <div className="flex items-center justify-between px-6 h-14 w-full md:hidden">
          <button className="text-[#3c5500] hover:opacity-80 transition-opacity p-2 -ml-2 rounded-full">
            <Sparkles className="w-5 h-5 text-[#3c5500]" />
          </button>
          <h1 className="font-bold text-lg text-[#3c5500] tracking-tight">씨마스고등학교 급식</h1>
          <button 
            onClick={() => showToast('식단 알림 설정이 되어 있습니다.')}
            className="text-[#3c5500] hover:opacity-80 transition-opacity p-2 -mr-2 rounded-full relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full"></span>
          </button>
        </div>

        {/* Desktop Header Content (Hidden on Mobile) */}
        <div className="hidden md:flex items-center justify-between px-10 h-20 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3c5500] flex items-center justify-center text-[#c9f07c]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-2xl text-[#3c5500] tracking-tight">
              씨마스고등학교 급식
            </h1>
          </div>

          <nav className="flex items-center gap-8">
            <button 
              onClick={() => setActiveTab('home')}
              className={`font-semibold text-base transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                activeTab === 'home' ? 'text-[#3c5500] bg-[#3c5500]/5' : 'text-[#444939] hover:text-[#3c5500]'
              }`}
            >
              <HomeIcon className="w-4 h-4" /> 홈
            </button>
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`font-semibold text-base transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                activeTab === 'calendar' ? 'text-[#3c5500] bg-[#3c5500]/5' : 'text-[#444939] hover:text-[#3c5500]'
              }`}
            >
              <CalendarIcon className="w-4 h-4" /> 식단표
            </button>
            <button 
              onClick={() => setActiveTab('calculate')}
              className={`font-semibold text-base transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                activeTab === 'calculate' ? 'text-[#3c5500] bg-[#3c5500]/5' : 'text-[#444939] hover:text-[#3c5500]'
              }`}
            >
              <CalculatorIcon className="w-4 h-4" /> 영양계산
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`font-semibold text-base transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                activeTab === 'profile' ? 'text-[#3c5500] bg-[#3c5500]/5' : 'text-[#444939] hover:text-[#3c5500]'
              }`}
            >
              <UserIcon className="w-4 h-4" /> 프로필
            </button>
          </nav>

          <button 
            onClick={() => showToast('식단 리포트 PDF 저장이 시뮬레이션 되었습니다.')} 
            className="bg-[#3c5500] hover:bg-[#496800] text-white font-bold px-6 py-2.5 rounded-full shadow-md transition-colors flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4 text-[#c9f07c]" /> 식단 저장
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-3xl px-5 md:px-10 pt-4 pb-20 md:pb-12 flex flex-col gap-6">
        
        {/* Animated Tab Contents */}
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              {/* Home Hero Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-[#496800]/5 pb-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#201b11] leading-tight flex items-center gap-2">
                    급식 히어로 🍽️
                  </h2>
                  <p className="text-sm text-[#444939] mt-0.5">
                    씨마스고등학교 학생들을 위한 오늘 최고의 황금 식단
                  </p>
                </div>
                
                {/* 주말 알림 배지 (방식 B 기준) */}
                {isWeekend && (
                  <div className="self-start px-3 py-1 bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-full text-xs font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    오늘은 주말이므로 가장 가까운 급식일을 표시합니다.
                  </div>
                )}
              </div>

              {/* Hero Meal Card (치즈돈까스 정식 / 월요일 혹은 평일 오늘 식단) */}
              {homeLunch ? (
                <article className="bg-[#FFFFFF] rounded-3xl p-6 shadow-md border border-[#496800]/5 flex flex-col relative overflow-hidden group">
                  {/* Meal Photo (with actual referrerPolicy) */}
                  <div className="relative w-full h-[220px] rounded-2xl overflow-hidden mb-5 shadow-inner">
                    <img 
                      alt={homeLunch.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      src={homeLunch.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuBTTLNeFGopjACemHp3unPiY6O4TD79qVvhh8jANc3xSKUBrrzbuhG7QmM4MNe5WxSeMn3kIDealnkanXKzT1vhqX6sKV0d5bZGQnqZsmvDlTQL7mX0xs3x6qwp5pI3kIQPLwvXqG5yDFd2vtFR3iISBNHFbf5ri4ED4lll2JQFlVy4p7GpR2TNEVWVyjzwPI47bWAat-A4Y9r6FU7TDxDPGuJWi-Aen2d3P5XWXEqEquXpTIEQgWDteuIdyTDBqsSYZE754mZXxcA"} 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                  </div>

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1.5">
                      {/* Badge (방식 B일 때 "다음 급식일" 표시) */}
                      <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold self-start ${
                        isHomeDateDifferent 
                          ? 'bg-[#ffe7dd] text-[#93000a] border border-[#ffdad6]' 
                          : 'bg-[#dde8b2] text-[#364e00]'
                      }`}>
                        {isHomeDateDifferent ? "다음 급식일 안내" : "오늘의 추천 급식"}
                      </span>
                      
                      {/* 홈 화면 큰 날짜 (동적 변환 완료!) */}
                      <span className="font-bold text-lg text-[#3c5500] tracking-tight">
                        {formatKoreanDate(homeDisplayDate)}
                      </span>
                    </div>

                    <button 
                      onClick={() => {
                        setIsLikedToday(!isLikedToday);
                        setLikesCount(prev => isLikedToday ? prev - 1 : prev + 1);
                        showToast(isLikedToday ? '좋아요가 취소되었습니다.' : '이 식단을 좋아합니다! ❤️');
                      }}
                      className="bg-[#EEF0EA] hover:bg-[#e4d8c9] active:scale-95 transition-all rounded-full p-2.5 text-[#3c5500] shadow-sm flex items-center justify-center"
                    >
                      <Heart className={`w-5 h-5 transition-colors ${isLikedToday ? 'fill-[#ba1a1a] text-[#ba1a1a]' : 'text-[#3c5500]'}`} />
                    </button>
                  </div>

                  <h3 className="font-bold text-2xl text-[#201b11] mb-2">
                    {homeLunch.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 mt-1 text-sm font-semibold text-[#444939]">
                    <div className="flex items-center text-[#3c5500] bg-[#3c5500]/5 px-2.5 py-1 rounded-lg gap-1">
                      <Flame className="w-4 h-4 text-[#3c5500]" /> 
                      <span>{homeLunch.totalCalories} kcal</span>
                    </div>
                    <div className="text-xs text-[#747967]">
                      좋아요 수 {likesCount}명 • 단백질 {homeLunch.nutrition.protein}g
                    </div>
                  </div>
                </article>
              ) : (
                <div className="p-8 bg-[#f8ecdc] rounded-2xl text-center font-bold text-lg text-[#747967]">
                  식단 데이터를 불러오지 못했습니다.
                </div>
              )}

              {/* Lunch (중식) Card */}
              {homeLunch && (
                <section className="bg-[#FFFFFF] rounded-3xl p-6 shadow-sm border border-[#496800]/5 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-[#496800]/5 pb-3">
                    <h4 className="text-xl font-bold text-[#3c5500] flex items-center gap-2">
                      <span className="w-2.5 h-6 bg-[#3c5500] rounded-full inline-block"></span>
                      중식 (Lunch)
                    </h4>
                    <span className="font-bold text-base text-[#3c5500] bg-[#c9f17c]/20 px-3 py-1 rounded-full">
                      {homeLunch.totalCalories} kcal
                    </span>
                  </div>

                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 py-1">
                    {homeLunch.dishes.map((dish, i) => (
                      <li key={i} className="flex items-center gap-3 text-[#201b11] text-base font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#b9d164] flex-shrink-0"></span>
                        <span>{dish}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-2 flex flex-wrap gap-1.5 border-t border-[#496800]/5 pt-3">
                    <span className="text-xs text-[#747967] font-semibold mr-1 mt-1">알레르기 정보:</span>
                    {homeLunch.allergens.map((alg, i) => (
                      <span key={i} className="bg-[#EEF0EA] text-[#444939] font-semibold text-xs px-2.5 py-1 rounded-full">
                        {alg}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Dinner (석식) Card */}
              {homeDinner && (
                <section className="bg-[#FFFFFF] rounded-3xl p-6 shadow-sm border border-[#496800]/5 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-[#496800]/5 pb-3">
                    <h4 className="text-xl font-bold text-[#485229] flex items-center gap-2">
                      <span className="w-2.5 h-6 bg-[#485229] rounded-full inline-block"></span>
                      석식 (Dinner)
                    </h4>
                    <span className="font-bold text-base text-[#485229] bg-[#dde8b2]/40 px-3 py-1 rounded-full">
                      {homeDinner.totalCalories} kcal
                    </span>
                  </div>

                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 py-1">
                    {homeDinner.dishes.map((dish, i) => (
                      <li key={i} className="flex items-center gap-3 text-[#201b11] text-base font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#dde8b2] flex-shrink-0"></span>
                        <span>{dish}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-2 flex flex-wrap gap-1.5 border-t border-[#496800]/5 pt-3">
                    <span className="text-xs text-[#747967] font-semibold mr-1 mt-1">알레르기 정보:</span>
                    {homeDinner.allergens.map((alg, i) => (
                      <span key={i} className="bg-[#EEF0EA] text-[#444939] font-semibold text-xs px-2.5 py-1 rounded-full">
                        {alg}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              {/* Weekly Header */}
              <section className="flex flex-col border-b border-[#496800]/5 pb-4">
                <span className="text-xs font-bold text-[#3c5500] uppercase tracking-wider mb-1">
                  주간 급식 식단표
                </span>
                {/* 주차 제목 (동적 변환 완료!) */}
                <h2 className="text-2xl font-bold text-[#201b11]">
                  {getWeekOfMonth(selectedCalendarDate)}
                </h2>
              </section>

              {/* WeekDateSelector (동적 변환 완료!) */}
              <section className="grid grid-cols-5 bg-[#f8ecdc] rounded-2xl p-3 shadow-inner border border-[#496800]/5 gap-2">
                {weekDates.map((date, i) => {
                  const isSelected = formatDateKey(date) === formatDateKey(selectedCalendarDate);
                  const isToday = formatDateKey(date) === formatDateKey(today);
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedCalendarDate(date)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${
                        isSelected 
                          ? 'bg-[#3c5500] text-white shadow-md scale-105' 
                          : 'text-[#444939] hover:bg-[#3c5500]/5 bg-[#FFFFFF]/40'
                      }`}
                    >
                      <span className="text-xs font-semibold mb-1 opacity-95">
                        {getKoreanDayOfWeek(date)}
                      </span>
                      <span className="text-lg font-bold">
                        {date.getDate()}
                      </span>
                      {isToday && (
                        <span className={`absolute -bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#c9f07c]' : 'bg-[#3c5500]'}`}></span>
                      )}
                    </button>
                  );
                })}
              </section>

              {/* Selected Day Info text */}
              <div className="bg-[#3c5500]/5 p-4 rounded-xl flex items-center justify-between text-sm font-bold text-[#3c5500]">
                <span>📅 {formatKoreanDate(selectedCalendarDate)}</span>
                <span className="text-xs text-[#747967]">
                  {formatDateKey(selectedCalendarDate) === formatDateKey(today) ? "오늘" : "선택 날짜"}
                </span>
              </div>

              {/* Lunch (중식) Card */}
              {calendarLunch ? (
                <article className="bg-[#FFFFFF] rounded-3xl p-6 shadow-sm border border-[#496800]/5 relative overflow-hidden flex flex-col gap-4">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#c9f17c]/20 opacity-40 rounded-bl-full pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="text-xl font-bold text-[#3c5500] flex items-center gap-1.5">
                        <span className="w-2.5 h-6 bg-[#3c5500] rounded-full inline-block"></span>
                        중식 (Lunch)
                      </h3>
                      <p className="text-sm font-semibold text-[#747967] mt-1">
                        {calendarLunch.title}
                      </p>
                    </div>
                    <span className="font-bold text-base text-[#3c5500] bg-[#c9f07c]/30 px-3 py-1 rounded-full">
                      {calendarLunch.totalCalories} kcal
                    </span>
                  </div>

                  <ul className="flex flex-col gap-3.5 my-1">
                    {calendarLunch.dishItems.map((dish, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        {/* Highlights main dishes */}
                        <span className={`w-2 h-2 rounded-full ${dish.kcal > 200 ? 'bg-[#ba1a1a]' : 'bg-[#3c5500]'}`}></span>
                        <div className="flex justify-between items-center w-full">
                          <span className={`${dish.kcal > 200 ? 'font-bold text-[#201b11]' : 'text-[#444939]'} text-base`}>
                            {dish.name}
                          </span>
                          <span className="text-xs text-[#747967] font-medium bg-[#EEF0EA] px-2 py-0.5 rounded">
                            {dish.kcal} kcal
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {calendarLunch.allergens.map((alg, i) => (
                      <span key={i} className="bg-[#ffdad6] text-[#ba1a1a] font-semibold text-xs px-2.5 py-1 rounded-full">
                        {alg}
                      </span>
                    ))}
                  </div>

                  {/* Protein target indicator */}
                  <div className="bg-[#FAF7EF] rounded-xl p-4 border border-[#496800]/5 mt-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-[#444939]">일일 단백질 달성도</span>
                      <span className="text-xs font-bold text-[#3c5500]">
                        {Math.round((calendarLunch.nutrition.protein / 60) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-[#EEF0EA] rounded-full h-2">
                      <div 
                        className="bg-[#3c5500] rounded-full h-2 transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.round((calendarLunch.nutrition.protein / 60) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                </article>
              ) : (
                <div className="p-8 bg-[#f8ecdc] rounded-2xl text-center font-bold text-lg text-[#747967]">
                  선택한 날짜의 중식 데이터가 없습니다.
                </div>
              )}

              {/* Dinner (석식) Card */}
              {calendarDinner ? (
                <article className="bg-[#FFFFFF] rounded-3xl p-6 shadow-sm border border-[#496800]/5 relative overflow-hidden flex flex-col gap-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="text-xl font-bold text-[#485229] flex items-center gap-1.5">
                        <span className="w-2.5 h-6 bg-[#485229] rounded-full inline-block"></span>
                        석식 (Dinner)
                      </h3>
                      <p className="text-sm font-semibold text-[#747967] mt-1">
                        {calendarDinner.title}
                      </p>
                    </div>
                    <span className="font-bold text-base text-[#485229] bg-[#dde8b2] px-3 py-1 rounded-full">
                      {calendarDinner.totalCalories} kcal
                    </span>
                  </div>

                  <ul className="flex flex-col gap-3.5 my-1">
                    {calendarDinner.dishItems.map((dish, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${dish.kcal > 200 ? 'bg-[#ba1a1a]' : 'bg-[#485229]'}`}></span>
                        <div className="flex justify-between items-center w-full">
                          <span className={`${dish.kcal > 200 ? 'font-bold text-[#201b11]' : 'text-[#444939]'} text-base`}>
                            {dish.name}
                          </span>
                          <span className="text-xs text-[#747967] font-medium bg-[#EEF0EA] px-2 py-0.5 rounded">
                            {dish.kcal} kcal
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {calendarDinner.allergens.map((alg, i) => (
                      <span key={i} className="bg-[#EEF0EA] text-[#444939] font-semibold text-xs px-2.5 py-1 rounded-full">
                        {alg}
                      </span>
                    ))}
                  </div>

                  {/* Protein target indicator */}
                  <div className="bg-[#FAF7EF] rounded-xl p-4 border border-[#496800]/5 mt-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-[#444939]">일일 단백질 달성도</span>
                      <span className="text-xs font-bold text-[#485229]">
                        {Math.round((calendarDinner.nutrition.protein / 60) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-[#EEF0EA] rounded-full h-2">
                      <div 
                        className="bg-[#485229] rounded-full h-2 transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.round((calendarDinner.nutrition.protein / 60) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                </article>
              ) : (
                <div className="p-8 bg-[#f8ecdc] rounded-2xl text-center font-bold text-lg text-[#747967]">
                  선택한 날짜의 석식 데이터가 없습니다.
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'calculate' && (
            <motion.div
              key="calculate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              {/* Calculate Header */}
              <div className="flex justify-between items-center border-b border-[#496800]/5 pb-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#201b11] leading-tight">
                    영양계산 📊
                  </h2>
                  <p className="text-sm text-[#444939] mt-0.5">
                    오늘 한 끼의 칼로리와 3대 영양 배분율을 스마트하게 설계해 보세오.
                  </p>
                </div>
              </div>

              {/* Day Selection Slider for Calculate Tab */}
              <section className="flex items-center gap-2 overflow-x-auto py-1.5 hide-scrollbar">
                {weekDates.map((date, idx) => {
                  const isCur = formatDateKey(date) === formatDateKey(selectedNutritionDate);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedNutritionDate(date)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs transition-colors border ${
                        isCur 
                          ? 'bg-[#3c5500] text-white border-[#3c5500]' 
                          : 'bg-[#FFFFFF] text-[#444939] border-[#496800]/10 hover:bg-[#3c5500]/5'
                      }`}
                    >
                      {getKoreanDayOfWeek(date)} ({date.getDate()}일)
                    </button>
                  );
                })}
              </section>

              {/* Top Nutrition Summary Card */}
              <section className="bg-[#FFFFFF] rounded-3xl p-6 shadow-md border border-[#496800]/5 flex flex-col gap-5 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#dde8b2] rounded-full opacity-20 blur-2xl"></div>
                
                <div className="flex justify-between items-start z-10">
                  <div>
                    <h3 className="text-md font-bold text-[#747967] mb-1">
                      {formatKoreanDate(selectedNutritionDate)} 중식의 선택 영양
                    </h3>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-3xl text-[#3c5500]">
                        {totalKcal}
                      </span>
                      <span className="font-bold text-sm text-[#747967]">kcal</span>
                    </div>
                  </div>
                  <div className="bg-[#dde8b2] w-11 h-11 rounded-full flex items-center justify-center text-[#ffdad6] shadow-sm">
                    <CalculatorIcon className="w-5 h-5 text-[#3c5500]" />
                  </div>
                </div>

                <div className="flex flex-col gap-4 z-10 border-t border-[#496800]/5 pt-4">
                  {/* Protein */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-[#201b11]">단백질</span>
                      <span className="text-[#3c5500]">{totalProtein}g ({proteinPercent}%)</span>
                    </div>
                    <div className="w-full bg-[#EEF0EA] h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#536500] h-full rounded-full transition-all duration-300" 
                        style={{ width: `${proteinPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Carbs */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-[#201b11]">탄수화물</span>
                      <span className="text-[#3c5500]">{totalCarbs}g ({carbsPercent}%)</span>
                    </div>
                    <div className="w-full bg-[#EEF0EA] h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#dde8b2] h-full rounded-full transition-all duration-300" 
                        style={{ width: `${carbsPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Fat */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-[#201b11]">지방</span>
                      <span className="text-[#3c5500]">{totalFat}g ({fatPercent}%)</span>
                    </div>
                    <div className="w-full bg-[#EEF0EA] h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#c4c9b4] h-full rounded-full transition-all duration-300" 
                        style={{ width: `${fatPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Menu Filter Chips */}
              <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
                {([
                  { label: "전체", val: "all" },
                  { label: "밥류", val: "rice" },
                  { label: "국/찌개", val: "soup" },
                  { label: "반찬", val: "side" },
                  { label: "디저트", val: "dessert" }
                ] as const).map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => setNutritionFilter(chip.val)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      nutritionFilter === chip.val 
                        ? 'bg-[#3c5500] text-white shadow-sm' 
                        : 'bg-[#EEF0EA] text-[#444939] hover:bg-[#3c5500]/5'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Selectable Menu List */}
              <div className="flex flex-col gap-3">
                {calculateMeal && calculateMeal.dishItems.length > 0 ? (
                  calculateMeal.dishItems
                    .filter(item => nutritionFilter === 'all' || item.category === nutritionFilter)
                    .map((item, i) => {
                      const isChecked = selectedDishes.includes(item.name);
                      return (
                        <label 
                          key={i}
                          onClick={() => toggleDishSelection(item.name)}
                          className={`bg-[#FFFFFF] p-4 rounded-[20px] shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all border-2 select-none ${
                            isChecked ? 'border-[#3c5500]' : 'border-transparent'
                          }`}
                        >
                          <div className="relative flex items-center justify-center flex-shrink-0">
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => {}} // Controlled by label click
                              className="sr-only" 
                            />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isChecked 
                                ? 'border-[#3c5500] bg-[#3c5500] text-white' 
                                : 'border-[#747967]/30 bg-transparent'
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                            </div>
                          </div>

                          <div className="flex-1">
                            <h4 className="font-bold text-base text-[#201b11] mb-1">
                              {item.name}
                            </h4>
                            <div className="flex gap-2 items-center">
                              <span className="bg-[#FFE7DD] text-[#93000A] px-2 py-0.5 rounded-full text-xs font-bold">
                                {item.kcal} kcal
                              </span>
                              <span className="bg-[#dde8b2]/60 text-[#364e00] px-2 py-0.5 rounded-full text-xs font-semibold">
                                {item.category === 'rice' ? '밥류' : item.category === 'soup' ? '국/찌개' : item.category === 'side' ? '반찬' : '디저트'}
                              </span>
                            </div>
                          </div>
                        </label>
                      );
                    })
                ) : (
                  <div className="p-8 bg-[#f8ecdc] rounded-2xl text-center font-bold text-lg text-[#747967]">
                    선택 날짜의 데이터 식단 항목이 없습니다.
                  </div>
                )}
              </div>

              {/* Save selection button */}
              <button 
                onClick={() => showToast('선택한 영양 성분 저장이 완료되었습니다! 💾')}
                className="w-full bg-[#3c5500] hover:bg-[#496800] text-white font-bold py-4 rounded-2xl shadow-md transition-colors flex justify-center items-center gap-2 text-base mt-2"
              >
                <Save className="w-5 h-5" />
                계산 결과 저장하기
              </button>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              {/* Profile Card */}
              <section className="bg-gradient-to-br from-[#FFFFFF] to-[#dde8b2]/40 rounded-3xl p-6 shadow-md border border-[#496800]/5 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#c9f07c]/20 rounded-full blur-2xl"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="relative">
                    <img 
                      alt="김학생 프로필 이미지" 
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1hShYqYRnz0CKzGTm-oj3IJX7zLeRKq4z34hTFoT8OkkQCQrhjuxIcZVBF23KIWeWAxQ8x5JEs89sE3OBO689Xix2NIM4PHWOffQocW0Mwe8G4jB0LsvGDmQLpzuoGu_ZNKnh4FldVfEI7PteL0hInlYC1sgwhG8zr_4clJYI9-hMXERMGt3mI5uRDFM7gryvl0O8qUTDgAYJBUnKO_lI8wjbdIYUGsNbeUY3XUM8WkxkgKEkq3frCZSeGXLpk91pmoW8VTlYoPg" 
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      onClick={() => showToast('프로필 이미지 수정이 구현되었습니다.')}
                      className="absolute bottom-0 right-0 w-7 h-7 bg-[#3c5500] rounded-full flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-transform"
                    >
                      <span className="text-xs font-bold">✎</span>
                    </button>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#201b11]">김학생</h2>
                    <p className="text-sm font-semibold text-[#747967] mt-1">2학년 3반 15번</p>
                  </div>
                </div>
              </section>

              {/* Settings List */}
              <section className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#496800]/5 overflow-hidden divide-y divide-[#496800]/5">
                
                {/* Allergy Alert */}
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-base text-[#201b11]">알레르기 알림</h3>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button 
                      onClick={() => {
                        setAllergyAlert(!allergyAlert);
                        showToast(allergyAlert ? '알레르기 알림이 꺼졌습니다.' : '알레르기 알림이 활성화되었습니다. ⚠️');
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        allergyAlert ? 'bg-[#3c5500]' : 'bg-[#747967]/30'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        allergyAlert ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                  
                  <p className="text-xs text-[#747967] font-semibold pl-13">
                    식단에 등록된 알레르기 유발 물질 포함 시 스마트 경고 배지를 노출합니다.
                  </p>
                  
                  <div className="flex gap-2 pl-13 mt-1">
                    <span className="px-3 py-1 bg-[#ffdad6] text-[#ba1a1a] rounded-full text-xs font-bold">우유 🥛</span>
                    <span className="px-3 py-1 bg-[#ffdad6] text-[#ba1a1a] rounded-full text-xs font-bold">땅콩 🥜</span>
                  </div>
                </div>

                {/* Daily Meal Alert */}
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#dde8b2]/60 flex items-center justify-center text-[#3c5500]">
                        <Bell className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-base text-[#201b11]">매일 식단 알림</h3>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button 
                      onClick={() => {
                        setDailyMealAlert(!dailyMealAlert);
                        showToast(dailyMealAlert ? '식단 알림이 해제되었습니다.' : '매일 아침 8시 식단 알림 ON! 🔔');
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        dailyMealAlert ? 'bg-[#3c5500]' : 'bg-[#747967]/30'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        dailyMealAlert ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                  
                  <p className="text-xs text-[#747967] font-semibold pl-13">
                    매일 아침 8시에 오늘의 맛있는 실시간 메뉴 알림을 받습니다.
                  </p>
                </div>

                {/* Customer Service */}
                <button 
                  onClick={() => showToast('고객센터 준비 중입니다. cs@cmas.hs.kr')}
                  className="w-full p-5 flex justify-between items-center hover:bg-[#3c5500]/5 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EEF0EA] flex items-center justify-center text-[#444939]">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-[#201b11]">고객센터 / 문의하기</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#747967] group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Terms */}
                <button 
                  onClick={() => showToast('급식 서비스 이용 약관 2026.05 개정')}
                  className="w-full p-5 flex justify-between items-center hover:bg-[#3c5500]/5 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EEF0EA] flex items-center justify-center text-[#444939]">
                      <Settings className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-[#201b11]">이용약관</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#747967] group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Logout */}
                <button 
                  onClick={() => showToast('로그아웃 되었습니다. (모의 로그인 세션)')}
                  className="w-full p-5 flex justify-between items-center hover:bg-[#ba1a1a]/5 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-[#ba1a1a]">로그아웃</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#ba1a1a] group-hover:translate-x-1 transition-transform" />
                </button>
              </section>

              {/* Footer text */}
              <footer className="text-center opacity-70 py-4 flex flex-col items-center">
                <p className="text-xs text-[#747967] font-semibold">
                  © 2026 씨마스고등학교 급식
                </p>
                <p className="text-[10px] text-[#747967] mt-1">
                  건강하고 맛있는 최적의 학교 영양 식단을 지원합니다.
                </p>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Bar (Mobile Only - Hidden on laptop) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe pt-2 h-[80px] bg-[#f8ecdc] rounded-t-2xl shadow-[0_-4px_22px_0_rgba(79,111,0,0.08)]">
        {/* Tab 1: 홈 */}
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all duration-300 w-[72px] ${
            activeTab === 'home' 
              ? 'bg-[#3c5500] text-white scale-105 shadow-md' 
              : 'text-[#444939] hover:bg-[#3c5500]/5'
          }`}
        >
          <HomeIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">홈</span>
        </button>

        {/* Tab 2: 식단표 */}
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all duration-300 w-[72px] ${
            activeTab === 'calendar' 
              ? 'bg-[#3c5500] text-white scale-105 shadow-md' 
              : 'text-[#444939] hover:bg-[#3c5500]/5'
          }`}
        >
          <CalendarIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">식단표</span>
        </button>

        {/* Tab 3: 영양계산 */}
        <button 
          onClick={() => setActiveTab('calculate')}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all duration-300 w-[72px] ${
            activeTab === 'calculate' 
              ? 'bg-[#3c5500] text-white scale-105 shadow-md' 
              : 'text-[#444939] hover:bg-[#3c5500]/5'
          }`}
        >
          <CalculatorIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">영양계산</span>
        </button>

        {/* Tab 4: 프로필 */}
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-full transition-all duration-300 w-[72px] ${
            activeTab === 'profile' 
              ? 'bg-[#3c5500] text-white scale-105 shadow-md' 
              : 'text-[#444939] hover:bg-[#3c5500]/5'
          }`}
        >
          <UserIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold">프로필</span>
        </button>
      </nav>
    </div>
  );
}
