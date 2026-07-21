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
    nothingToShuffle: "Nothing to shuffle.",
  },
  tabs: {
    gallery: "Gallery",
    albums: "Albums",
    settings: "Settings",
  },
  nav: {
    backA11y: "Back",
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
    select: "Select",
    selectA11y: "Select albums to shuffle",
  },
  selection: {
    selectedLabel: (n: number) => `${n} selected`,
    cancelA11y: "Cancel selection",
    capToast: "Limit reached: 1,000 photos.",
  },
  pill: {
    shuffleAll: "Shuffle All",
    shuffleAlbum: (title: string) => `Shuffle ${title}`,
    shuffleA11y: "Shuffle",
    shuffleSelected: (n: number) => `Shuffle (${n})`,
    shuffleSelectedA11y: (n: number) =>
      `Shuffle ${n} selected ${n === 1 ? "source" : "sources"}`,
    slideshowSelectionA11y: (n: number) =>
      `Play slideshow of ${n} selected photos`,
    favoriteSelectionA11y: (n: number) => `Favorite ${n} selected photos`,
    deleteSelectionA11y: (n: number) => `Delete ${n} selected photos`,
    shareSelectionA11y: (n: number) => `Share ${n} selected photos`,
  },
  toast: {
    saved: "Saved.",
    undo: "Undo",
    gone: "Gone.",
    reshuffled: "Reshuffled.",
    shareFailed: "Couldn't share.",
    deleteFailed: "Couldn't delete.",
    slideshowFailed: "Couldn't start the slideshow.",
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
      share: "Share",
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
    gestureGuide: {
      doubleTap: "Double-tap to favorite",
      swipeHint: "Swipe to navigate",
      gotIt: "Got it",
      a11y:
        "Slideshow gestures: tap to play, swipe to navigate, double-tap to favorite. Tap anywhere to dismiss.",
    },
    empty: {
      back: "Go Back",
      useAllPhotos: "Use All Photos",
    },
  },
  settings: {
    title: "Settings",
    sections: {
      appearance: "APPEARANCE",
      library: "LIBRARY",
      slideshow: "SLIDESHOW",
      about: "ABOUT",
    },
    rows: {
      theme: "Theme",
      includeIcloud: "Include iCloud albums",
      defaultSort: "Default sort",
      gridSize: "Grid size",
      duration: "Duration",
      transition: "Transition",
      version: "Version",
      replayOnboarding: "Replay onboarding",
      acknowledgements: "Acknowledgements",
    },
    themeModeLabels: {
      auto: "Automatic",
      light: "Light",
      dark: "Dark",
    },
    gridSizeLabels: {
      compact: "Compact",
      comfortable: "Comfortable",
      large: "Large",
    },
    slideTransitionLabels: {
      "cross-fade": "Cross-fade",
      "hard-cut": "Hard cut",
    },
    slideDurationLabel: (sec: number) =>
      sec === 1 ? "1 second" : `${sec} seconds`,
    acknowledgementsTitle: "Acknowledgements",
    acknowledgementsIntro:
      "Dust Off is built on the shoulders of these open-source projects.",
  },
} as const;
