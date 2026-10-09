const messages = {
  ko: {
    metadata: {
      title: "글린 | 나의 작품",
      description: "이야기를 차분히 이어 가는 웹소설 글쓰기 공간",
    },
    brand: {
      name: "글린",
      tagline: "당신의 이야기가 머무는 곳",
    },
    navigation: {
      works: "작품 목록",
      statistics: "통계",
      library: "자료실",
      world: "세계관",
      settings: "설정",
    },
    header: {
      searchPlaceholder: "작품을 검색하세요...",
      notifications: "알림",
      profile: "프로필 메뉴",
    },
    dashboard: {
      eyebrow: "MY WRITING ROOM",
      title: "나의 작품",
      description: "당신의 이야기를 이어서 써 내려가세요.",
      newWork: "새 작품",
      recentLabel: "최근 작업",
      recentTitle: "마지막 이야기를 이어가세요",
      recentEmptyTitle: "첫 이야기를 시작해 보세요",
      recentEmptyDescription: "새 작품을 만들면 이곳에서 가장 최근 작업을 확인할 수 있어요.",
      updatedAt: "최근 수정",
      createdAt: "만든 날",
      allWorks: "모든 작품",
      workCount: (count: number) => `${count}개의 작품`,
      emptyTitle: "아직 등록된 작품이 없습니다",
      emptyDescription: "마음속 이야기에 제목을 붙여 첫 작품을 시작해 보세요.",
      noResultsTitle: "검색 결과가 없습니다",
      noResultsDescription: "다른 제목이나 부제로 다시 검색해 보세요.",
      loading: "작품을 불러오는 중입니다...",
      loadError: "작품 목록을 불러오지 못했습니다.",
      retry: "다시 시도",
    },
    modal: {
      eyebrow: "NEW STORY",
      title: "새 작품 만들기",
      description: "지금 떠오른 이야기에 이름을 붙여주세요. 부제는 나중에 추가해도 됩니다.",
      workTitle: "작품 제목",
      titlePlaceholder: "예: 바람이 머무는 자리",
      subtitle: "부제",
      optional: "선택",
      subtitlePlaceholder: "이야기를 한 줄로 소개해 주세요.",
      cancel: "취소",
      submit: "작품 만들기",
      submitting: "만드는 중...",
      close: "모달 닫기",
      titleRequired: "작품 제목을 입력해 주세요.",
      createError: "작품을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    },
  },
  en: {
    metadata: {
      title: "Glean | My Works",
      description: "A calm writing space for stories that grow one page at a time",
    },
    brand: {
      name: "Glean",
      tagline: "A place where your stories stay",
    },
    navigation: {
      works: "Works",
      statistics: "Statistics",
      library: "Library",
      world: "Worldbuilding",
      settings: "Settings",
    },
    header: {
      searchPlaceholder: "Search your works...",
      notifications: "Notifications",
      profile: "Profile menu",
    },
    dashboard: {
      eyebrow: "MY WRITING ROOM",
      title: "My Works",
      description: "Pick up where your story left off.",
      newWork: "New work",
      recentLabel: "Recent work",
      recentTitle: "Continue your latest story",
      recentEmptyTitle: "Begin your first story",
      recentEmptyDescription: "Create a work to see your latest writing here.",
      updatedAt: "Last updated",
      createdAt: "Created",
      allWorks: "All works",
      workCount: (count: number) => `${count} ${count === 1 ? "work" : "works"}`,
      emptyTitle: "No works yet",
      emptyDescription: "Give your idea a title and begin your first story.",
      noResultsTitle: "No matching works",
      noResultsDescription: "Try searching with another title or subtitle.",
      loading: "Loading your works...",
      loadError: "We couldn't load your works.",
      retry: "Try again",
    },
    modal: {
      eyebrow: "NEW STORY",
      title: "Create a new work",
      description: "Give your story a title. You can always add a subtitle later.",
      workTitle: "Title",
      titlePlaceholder: "e.g. Where the Wind Stays",
      subtitle: "Subtitle",
      optional: "Optional",
      subtitlePlaceholder: "Describe your story in one line.",
      cancel: "Cancel",
      submit: "Create work",
      submitting: "Creating...",
      close: "Close modal",
      titleRequired: "Please enter a title.",
      createError: "We couldn't create the work. Please try again.",
    },
  },
} as const;

export type Locale = keyof typeof messages;
export type Messages = (typeof messages)["ko"];

export function isLocale(value: string | undefined): value is Locale {
  return value === "ko" || value === "en";
}

const configuredLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE;

export const defaultLocale: Locale = isLocale(configuredLocale)
  ? configuredLocale
  : "ko";

export function getMessages(locale: Locale = defaultLocale): Messages {
  return messages[locale] as Messages;
}
