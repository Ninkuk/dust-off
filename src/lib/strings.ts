export const strings = {
  onboarding: {
    card1: "Photos you forgot you had.",
    card2: "Stays on your phone.",
    prePrompt: "To shuffle your photos, the app needs access to them.",
    continue: "Continue",
  },
  permissionDenied: {
    title: "No photos to dust off.",
    subtitle:
      "Dust Off needs photo access to display and shuffle your library. Nothing leaves your device.",
    openSettings: "Open Settings",
  },
  partialAccess: {
    update: "Update",
    label: (shared: number, total: number) =>
      `${shared.toLocaleString()} of ${total.toLocaleString()} photos shared with Dust Off`,
  },
  emptyStates: {
    nothingYet: "Nothing yet.",
  },
  tabs: {
    gallery: "Gallery",
    albums: "Albums",
    settings: "Settings",
  },
  gallery: {
    sortLabels: {
      random: "Random",
      newest: "Newest",
      oldest: "Oldest",
      name: "Name",
    },
    sortSheetTitle: "Sort",
    formatCount: (count: number) => count.toLocaleString(),
    sortStripA11y: (label: string, count: number) =>
      `${label}, ${count} photos`,
  },
  albums: {
    favoritesTitle: "Favorites",
    tileA11y: (title: string, count: number) =>
      `${title}, ${count} photos`,
  },
  selection: {
    selectedLabel: (n: number) => `${n} selected`,
    cancelA11y: "Cancel selection",
    capToast: "Limit reached: 1,000 photos.",
  },
  pill: {
    shuffleAll: "Shuffle All",
    shuffleAlbum: (title: string) => `Shuffle ${title}`,
    actions: (n: number) => `Actions · ${n}`,
    shuffleA11y: "Shuffle",
    actionsA11y: (n: number) => `Actions for ${n} selected`,
  },
  actionsSheet: {
    favoriteAll: "Favorite all",
    deleteAll: "Delete all",
  },
  toast: {
    saved: "Saved.",
    undo: "Undo",
    gone: "Gone.",
    reshuffled: "Reshuffled.",
  },
  deleteConfirm: {
    titleSingle: "Delete photo?",
    titleBulk: (n: number) => `Delete ${n} photos?`,
    bodyIos: "This photo will be moved to your Recently Deleted album.",
    bodyAndroidNew: "This photo will be moved to Trash.",
    bodyAndroidOld: "This photo will be deleted from your library.",
    delete: (n: number) => (n === 1 ? "Delete" : `Delete ${n}`),
    cancel: "Cancel",
  },
  theater: {
    sourceLabel: {
      all: "All",
      favorites: "Favorites",
      mixed: "Mixed",
      selection: "Selection",
    },
    formatPosition: (i: number, n: number) => `${i + 1} of ${n}`,
    closeA11y: "Close",
    prevA11y: "Previous photo",
    nextA11y: "Next photo",
    playPauseA11y: "Play or pause",
    longPressA11y: "Open photo actions",
    doubleTapA11y: "Double-tap to favorite",
    longPressMenu: {
      favorite: "Favorite",
      unfavorite: "Unfavorite",
      delete: "Delete",
      info: "View Info",
      goToFolder: "Go to Folder",
    },
    infoFields: {
      name: "Name",
      dateTaken: "Date taken",
      album: "Album",
      dimensions: "Dimensions",
      size: "Size",
      camera: "Camera",
      lens: "Lens",
      focal: "Focal",
      aperture: "Aperture",
      shutter: "Shutter",
      iso: "ISO",
    },
  },
} as const;
