export const strings = {
  onboarding: {
    card1: "Photos you forgot you had.",
    card2: "Stays on your phone.",
    prePrompt: "To shuffle your photos, the app needs access to them.",
    // Restated at the decision point: the reassurance on card 2 is spent two
    // cards before the permission dialog, which is the moment it has to work.
    prePromptBody: "Nothing leaves your device.",
    continue: "Continue",
    skip: "Skip",
    pageA11y: (page: number, total: number) => `Page ${page} of ${total}`,
  },
  permissionDenied: {
    title: "No photos to dust off.",
    subtitle:
      "Dust Off needs photo access to display and shuffle your library. Nothing leaves your device.",
    openSettings: "Open Settings",
  },
  partialAccess: {
    update: "Choose Photos",
    // No OS API exposes the library total under limited access, so any
    // "N of N" phrasing can only ever report shared-of-shared — which reads as
    // "everything is shared". State the shared count alone.
    label: (shared: number) =>
      `${shared.toLocaleString()} ${shared === 1 ? "photo" : "photos"} shared with Dust Off`,
  },
  emptyStates: {
    nothingYet: "Nothing yet.",
    nothingToShuffle: "Nothing to shuffle.",
  },
  tile: {
    // Tiles previously announced as bare unlabelled buttons, so a large grid
    // was an undifferentiated wall of "button" to a screen reader.
    photoA11y: (date?: string) => (date ? `Photo, ${date}` : "Photo"),
    selectA11y: "Select",
  },
  errorStates: {
    photosTitle: "Couldn't read your photos.",
    photosBody: "Something went wrong reading the library.",
    albumsTitle: "Couldn't read your albums.",
    retry: "Try Again",
  },
  loading: {
    photosA11y: "Loading photos",
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
    shuffleSelected: (n: number) => `Shuffle (${n})`,
    slideshowSelectionA11y: (n: number) =>
      `Play slideshow of ${n} selected photos`,
    favoriteSelectionA11y: (n: number) => `Favorite ${n} selected photos`,
    deleteSelectionA11y: (n: number) => `Delete ${n} selected photos`,
    shareSelectionA11y: (n: number) => `Share ${n} selected photos`,
  },
  toast: {
    saved: "Saved.",
    // Confirmation for the remove direction of the favorite toggle. Rendering
    // "Saved." for both directions asserted the opposite of an unfavorite.
    unfavorited: "Unfavorited.",
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
    // Bodies were singular regardless of count — a 300-photo delete read
    // "This photo will be…".
    bodyIos: (n: number) =>
      n === 1
        ? "This photo will be moved to your Recently Deleted album."
        : `These ${n} photos will be moved to your Recently Deleted album.`,
    bodyAndroidNew: (n: number) =>
      n === 1
        ? "This photo will be moved to Trash."
        : `These ${n} photos will be moved to Trash.`,
    bodyAndroidOld: (n: number) =>
      n === 1
        ? "This photo will be deleted from your library."
        : `These ${n} photos will be deleted from your library.`,
    delete: (n: number) => (n === 1 ? "Delete" : `Delete ${n}`),
    cancel: "Cancel",
  },
  // Shown after a delete succeeds. "Gone." alone told the user nothing about
  // recoverability; naming where the photos went is the reassurance that
  // matters most immediately after an irreversible-feeling action.
  deleteResult: {
    ios: (n: number) =>
      n === 1
        ? "Moved to Recently Deleted."
        : `${n.toLocaleString()} photos moved to Recently Deleted.`,
    androidNew: (n: number) =>
      n === 1 ? "Moved to Trash." : `${n.toLocaleString()} photos moved to Trash.`,
    androidOld: (n: number) =>
      n === 1 ? "Deleted." : `${n.toLocaleString()} photos deleted.`,
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
      goToFolder: "Go to Album",
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
      // Decoupled from "Replay onboarding": resetting the guide should not
      // also throw the user back through the permission cards.
      slideshowGestures: "Slideshow gestures",
      version: "Version",
      replayOnboarding: "Replay onboarding",
      acknowledgements: "Acknowledgements",
    },
    gestureGuideReset: "Gestures will show again.",
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
