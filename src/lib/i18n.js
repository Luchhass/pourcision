export const DEFAULT_LOCALE = "en";
export const LANGUAGE_STORAGE_KEY = "pourcision-language";

const dictionaries = {
  en: {
    app: {
      createdBy: "created by",
    },
    common: {
      backHome: "Back home",
      continue: "Continue",
      loading: "Loading",
      mainMenu: "Main Menu",
      playAgain: "Play Again",
    },
    toggles: {
      soundOff: "Turn sound off",
      soundOn: "Turn sound on",
      soundToggle: "Toggle sound",
      themeDark: "Switch to dark mode",
      themeLight: "Switch to light mode",
      themeToggle: "Toggle theme",
    },
    home: {
      howToPlay: "How to play",
      introOne:
        "A target line appears each round. Hold to raise the water, then release near the mark.",
      introTwo:
        "Three quick rounds turn timing into a clean score.",
      multiplayerDescription: "Prepare a shared match format for future lobbies.",
      multiplayerTitle: "Multiplayer",
      singleplayerDescription: "Play a solo water-timing run across target rounds.",
      singleplayerTitle: "Singleplayer",
    },
    setup: {
      couldNotLoadLobbies: "Could not load lobbies.",
      creatingLobby: "Creating Lobby",
      createLobby: "Create Lobby",
      defaultLobbyName: "Pourcision lobby",
      difficulty: "Difficulty",
      enterLobbyPassword: "Enter Password",
      joinLobbyAction: "Browse Lobbies",
      lobbyList: "Open lobbies",
      lobbyName: "Lobby name",
      lobbyNameRequired: "Lobby name is required",
      lobbyPassword: "Lobby password",
      lobbyPasswordRequired: "Password is required",
      levels: "Levels",
      mode: "Mode",
      multiplayerDescription:
        "Create a private lobby, set the run length, and watch every opponent's water line chase yours in real time.",
      multiplayerStart: "Start Multiplayer",
      multiplayerTitle: "Multiplayer",
      noLobbies: "No open lobbies.",
      playerName: "Player name",
      playerNameRequired: "Player name is required",
      privateLobby: "Private",
      publicLobby: "Public",
      searchLobby: "Search lobbies",
      playerLobbyName: "{name}'s lobby",
      sectionBrowse: "Browse",
      sectionCreate: "Create",
      sectionLobbies: "Lobbies",
      sectionLobby: "Lobby",
      sectionName: "Name",
      sectionPlayer: "Player",
      sectionSetup: "Setup",
      singleplayerDifficultyDescription:
        "{difficulty} sets the pressure: {difficultyDescription}",
      singleplayerModeDescription:
        "{mode} sets the rule: {modeDescription}",
      singleplayerSelectionDescription:
        "{mode} sets the rule: {modeDescription} {difficulty} sets the pressure: {difficultyDescription} Together they shape fill speed, waves, and release control.",
      singleplayerDescription:
        "Choose the rule mode, pick the water color, and start a timing run built around your release.",
      singleplayerStart: "Start Singleplayer",
      singleplayerTitle: "Singleplayer",
      setup: "SETUP",
      visibility: "Visibility",
      waterColor: "Water color",
      colorTaken: "{color} is already taken",
      hidePassword: "Hide password",
      showPassword: "Show password",
    },
    room: {
      code: "Room Code",
      closeSettings: "Close settings",
      copyInvite: "Copy Invite",
      createFailed: "Could not create multiplayer lobby.",
      couldNotCopy: "Could not copy invite link.",
      couldNotKick: "Could not remove player.",
      couldNotReachServer: "Could not reach multiplayer server.",
      couldNotReturnToLobby: "Could not return to lobby.",
      couldNotStart: "Could not start game.",
      couldNotUpdateSettings: "Could not update lobby settings.",
      closedMessage: "This lobby has closed.",
      editSettings: "Edit settings",
      findingLobby: "Finding lobby.",
      host: "Host",
      defaultPlayer: "Player",
      playerNotInLobby: "Player is not in this lobby.",
      join: "Join Lobby",
      joinFailed: "Could not join lobby.",
      joining: "Joining",
      kicked: "Removed",
      kickedMessage: "You were removed from this lobby.",
      kickPlayer: "Remove {name}",
      lobby: "Lobby",
      lobbyNotFound: "Lobby not found.",
      multiplayerDescription:
        "Join the private lobby, wait for the host, then race the same target line with every player visible in the background.",
      namePlaceholder: "Player name",
      away: "Away",
      online: "Online",
      players: "Players",
      resultsDescription:
        "The run is complete. Read the table, catch your best round, and decide if the lobby deserves one more pour.",
      returnLobby: "Return to lobby",
      returningLobby: "Returning",
      startGame: "Start Game",
      waiting: "Waiting for the host.",
      waitingLobbyReturn: "Waiting for every player to return to the lobby.",
      waitingPlayers: "Waiting for players.",
      waitingShort: "Wait",
      finishedShort: "Finished",
      you: "You",
    },
    game: {
      actionHold: "HOLD",
      actionPour: "POUR",
      chaosQueue: "Chaos Queue",
      diff: "Diff",
      done: "Done",
      exit: "Exit",
      exitConfirm:
        "Are you sure you want to return to the main menu? This run will be dropped.",
      exitRun: "Exit run",
      fake: "Fake",
      goal: "Goal",
      left: "Left",
      nextRound: "Next Round",
      ready: "READY",
      right: "Right",
      scoreboard: "Scoreboard",
      set: "SET",
      stay: "Stay",
      stayInGame: "Stay in game",
      splitMiss: "SPLIT MISS",
      target: "Target",
      tenOrZero: "All or Nothing",
      time: "Time",
      go: "GO",
      band: "Band",
      bandMiss: "BAND MISS",
      line: "Line",
      lowestWins: "Lowest wins",
      timing: "TIMING",
      round: "Round",
      rounds: "Rounds",
      labels: {
        noScore: "NO SCORE",
        perfect: "PERFECT!",
        soClose: "SO CLOSE!",
        tooHigh: "TOO HIGH!",
        tooLow: "TOO LOW!",
      },
      guidance: {
        classic: "Hold to pour. Release when the surface meets the mark.",
        endless: "Hold to pour. Release, read the result, then keep the run going.",
        band: "Each line is one touch. Release near the active band, then chase the next.",
        perfect:
          "The line is gone. Hit the strike zone for everything, miss it for nothing.",
        split: "Move between both tanks while holding, then release once.",
      },
      resultMessages: {
        close: [
          "So close. The mark almost gave in.",
          "Good hands. Just one ripple away.",
          "Sharp read. The line felt you coming.",
        ],
        high: [
          "A little bold. The water ran past the whisper.",
          "Too much tide. The next one can land softer.",
          "The line was lower. Your hand had extra confidence.",
        ],
        low: [
          "A little shy. The next pour has more nerve.",
          "Too calm. Let the water climb next time.",
          "The line waited higher. Your timing is warming up.",
        ],
        perfect: [
          "Excellent. The line held still for you.",
          "Clean touch. That one knew where to stop.",
          "Perfect read. The water listened.",
        ],
      },
    },
    results: {
      assessment: {
        excellent: "The water barely argued. Your hand found the quiet part.",
        good: "A clean run is already in the room. It just needs one calmer release.",
        learning:
          "The line moved like a rumor. You caught enough of it to come back sharper.",
        retry:
          "The water kept its secret this time. The next pour starts with better eyes.",
      },
      run: "RUN",
      title: "RESULTS",
    },
    difficulties: {
      easy: {
        description: "Gentler flow. Small surface movement.",
        label: "Easy",
      },
      hard: {
        description: "Fast fill. Heavy waves and sharper timing.",
        label: "Hard",
      },
      normal: {
        description: "Balanced speed with clear wave motion.",
        label: "Normal",
      },
    },
    colors: {
      amber: "Amber",
      aqua: "Aqua",
      blue: "Blue",
      coral: "Coral",
      graphite: "Graphite",
      lemon: "Lemon",
      lime: "Misket",
      mint: "Mint",
      plum: "Plum",
      red: "Red",
      rose: "Rose",
      slate: "Slate",
      violet: "Violet",
    },
    modes: {
      blind: {
        briefing: "No target line appears. Read the percentage and trust the pour.",
        description: "No target line. Trust the goal percentage.",
        label: "No Guide",
      },
      flash: {
        briefing: "The target line flashes for a moment, then disappears.",
        description: "The line flashes briefly. Five seconds to chase it.",
        label: "Flash",
      },
      "band-run": {
        briefing: "Two to five target bands appear. Each release scores the next band.",
        description: "Two to five target bands. One touch for each.",
        label: "Band Run",
      },
      "charge-pour": {
        briefing: "Hold to charge pressure. Release to pour the stored water from above.",
        description: "Hold to charge. Release a stronger pour from above.",
        label: "Pressure Charge",
      },
      "burst-click": {
        briefing: "Click in bursts. Fast taps create a timed flow you have to steady.",
        description: "Spam quick taps to build a steady timed flow.",
        label: "Burst Click",
      },
      colorblind: {
        briefing: "The screen fades to black after one second. Hold the timing in your head.",
        description: "The screen fades out after the round begins.",
        label: "Blind",
      },
      "chaos-queue": {
        briefing: "A random rule appears before every round.",
        description: "A random rule appears before every round.",
        label: "Chaos Queue",
      },
      classic: {
        briefing: "One clean hold, one release, one target line.",
        description: "One hold. Release locks the level.",
        label: "Classic",
      },
      endless: {
        briefing: "Classic rounds keep coming, but the scoreboard never arrives.",
        description: "Classic rounds without a final scoreboard. Keep playing forever.",
        label: "Endless",
      },
      "fake-target": {
        briefing: "Two lines appear. One is bait, one is the real mark.",
        description: "Two target lines. One is a trap.",
        label: "Fake Target",
      },
      invert: {
        briefing: "The rule is classic, but the water reads upside down.",
        description: "Classic timing with the water flipped upside down.",
        label: "Invert",
      },
      leaky: {
        briefing: "The water leaks after release. Keep pressure until the clock ends.",
        description: "Release leaks. Short clock, then lock.",
        label: "Leaky",
      },
      "perfect-or-nothing": {
        briefing:
          "A narrow strike zone replaces the line. Hit it for everything, miss it for nothing.",
        description: "Hit the narrow zone for everything, miss it for nothing.",
        label: "All or Nothing",
      },
      "reverse-pour": {
        briefing: "You start full. Hold to drain down into the mark.",
        description: "Start full. Hold to drain down.",
        label: "Draining",
      },
      "split-fill": {
        briefing: "Two tanks are active. Move between them while holding, then release once.",
        description: "Two tanks. Two targets. One release.",
        label: "Split Fill",
      },
      tilt: {
        briefing: "The target line leans. Release into the slant.",
        description: "Gravity leans. Read the slanted water line.",
        label: "Tilt",
      },
    },
    utility: {
      language: "Language switch",
      sound: "Sound switch",
      theme: "Dark mode switch",
    },
  },
  tr: {
    app: {
      createdBy: "haz\u0131rlayan",
    },
    common: {
      backHome: "Ana Sayfaya D\u00f6n",
      continue: "Devam",
      loading: "Y\u00fckleniyor",
      mainMenu: "Ana Men\u00fc",
      playAgain: "Yeniden Oyna",
    },
    toggles: {
      soundOff: "Sesi kapat",
      soundOn: "Sesi a\u00e7",
      soundToggle: "Sesi de\u011fi\u015ftir",
      themeDark: "Koyu moda ge\u00e7",
      themeLight: "A\u00e7\u0131k moda ge\u00e7",
      themeToggle: "Temay\u0131 de\u011fi\u015ftir",
    },
    home: {
      howToPlay: "Nas\u0131l oynan\u0131r",
      introOne:
        "Her turda hedef \u00e7izgisi belirir. Suyu y\u00fckseltmek i\u00e7in bas\u0131l\u0131 tut, hedefe yakla\u015f\u0131nca b\u0131rak.",
      introTwo: "\u00dc\u00e7 k\u0131sa tur, zamanlamay\u0131 temiz bir skora \u00e7evirir.",
      multiplayerDescription:
        "Arkada\u015flar\u0131nla ayn\u0131 hedef \u00e7izgisine kar\u015f\u0131 oynayaca\u011f\u0131n ortak bir lobi kur.",
      multiplayerTitle: "\u00c7ok Oyunculu",
      singleplayerDescription:
        "Hedef turlar\u0131nda tek ba\u015f\u0131na su zamanlamas\u0131 ko\u015fusu oyna.",
      singleplayerTitle: "Tek Oyunculu",
    },
    setup: {
      couldNotLoadLobbies: "Lobiler yüklenemedi.",
      creatingLobby: "Lobi kuruluyor",
      createLobby: "Lobi Kur",
      defaultLobbyName: "Pourcision lobisi",
      difficulty: "Zorluk",
      enterLobbyPassword: "\u015eifre Gir",
      joinLobbyAction: "Lobilere G\u00f6z At",
      lobbyList: "A\u00e7\u0131k lobiler",
      lobbyName: "Lobi ad\u0131",
      lobbyNameRequired: "Lobi ad\u0131 gerekli",
      lobbyPassword: "Lobi \u015fifresi",
      lobbyPasswordRequired: "\u015eifre gerekli",
      levels: "Seviyeler",
      mode: "Mod",
      multiplayerDescription:
        "\u00d6zel bir lobi kur, tur say\u0131s\u0131n\u0131 belirle ve rakiplerinin su \u00e7izgisini anl\u0131k izle.",
      multiplayerStart: "\u00c7ok Oyunculu Ba\u015flat",
      multiplayerTitle: "\u00c7ok Oyunculu",
      noLobbies: "A\u00e7\u0131k lobi yok.",
      playerName: "Oyuncu ad\u0131",
      playerNameRequired: "Oyuncu ad\u0131 gerekli",
      privateLobby: "\u00d6zel",
      publicLobby: "Herkese A\u00e7\u0131k",
      searchLobby: "Lobi ara",
      playerLobbyName: "{name} lobisi",
      sectionBrowse: "G\u00f6z At",
      sectionCreate: "Kur",
      sectionLobbies: "Lobiler",
      sectionLobby: "Lobi",
      sectionName: "\u0130sim",
      sectionPlayer: "Oyuncu",
      sectionSetup: "Ayar",
      singleplayerDifficultyDescription:
        "{difficulty} tempoyu belirler: {difficultyDescription}",
      singleplayerModeDescription:
        "{mode} kural\u0131 belirler: {modeDescription}",
      singleplayerSelectionDescription:
        "{mode} kural\u0131 belirler: {modeDescription} {difficulty} tempoyu belirler: {difficultyDescription} Birlikte dolma h\u0131z\u0131n\u0131, dalgay\u0131 ve b\u0131rak\u0131\u015f kontrol\u00fcn\u00fc \u015fekillendirir.",
      singleplayerDescription:
        "Kural modunu se\u00e7, su rengini belirle ve b\u0131rak\u0131\u015fa dayal\u0131 bir zamanlama ko\u015fusuna ba\u015fla.",
      singleplayerStart: "Tek Oyunculu Ba\u015flat",
      singleplayerTitle: "Tek Oyunculu",
      setup: "AYAR",
      visibility: "G\u00f6r\u00fcn\u00fcrl\u00fck",
      waterColor: "Su Rengi",
      colorTaken: "{color} kullan\u0131l\u0131yor",
      hidePassword: "\u015eifreyi gizle",
      showPassword: "\u015eifreyi g\u00f6ster",
    },
    room: {
      code: "Oda Kodu",
      closeSettings: "Ayarlar\u0131 kapat",
      copyInvite: "Daveti Kopyala",
      createFailed: "\u00c7ok oyunculu lobi kurulamad\u0131.",
      couldNotCopy: "Davet ba\u011flant\u0131s\u0131 kopyalanamad\u0131.",
      couldNotKick: "Oyuncu \u00e7\u0131kar\u0131lamad\u0131.",
      couldNotReachServer: "\u00c7ok oyunculu sunucuya ula\u015f\u0131lamad\u0131.",
      couldNotReturnToLobby: "Lobiye d\u00f6n\u00fclemedi.",
      couldNotStart: "Oyun ba\u015flat\u0131lamad\u0131.",
      couldNotUpdateSettings: "Lobi ayarlar\u0131 g\u00fcncellenemedi.",
      closedMessage: "Bu lobi kapand\u0131.",
      editSettings: "Ayarlar\u0131 d\u00fczenle",
      findingLobby: "Lobi aran\u0131yor.",
      host: "Kurucu",
      defaultPlayer: "Oyuncu",
      playerNotInLobby: "Oyuncu bu lobide de\u011fil.",
      join: "Lobiye Kat\u0131l",
      joinFailed: "Lobiye kat\u0131l\u0131namad\u0131.",
      joining: "Kat\u0131l\u0131yor",
      kicked: "\u00c7\u0131kar\u0131ld\u0131n",
      kickedMessage: "Bu lobiden \u00e7\u0131kar\u0131ld\u0131n.",
      kickPlayer: "{name} oyuncusunu \u00e7\u0131kar",
      lobby: "Lobi",
      lobbyNotFound: "Lobi bulunamad\u0131.",
      multiplayerDescription:
        "\u00d6zel lobiye kat\u0131l, kurucuyu bekle ve herkesin ayn\u0131 hedef \u00e7izgisine kar\u015f\u0131 su seviyesini takip et.",
      namePlaceholder: "Oyuncu ad\u0131",
      away: "Uzakta",
      online: "\u00c7evrim i\u00e7i",
      players: "Oyuncular",
      resultsDescription:
        "Ko\u015fu tamamland\u0131. S\u0131ralamay\u0131 incele, en iyi turunu yakala ve lobiye d\u00f6n.",
      returnLobby: "Lobiye D\u00f6n",
      returningLobby: "D\u00f6n\u00fcyor",
      startGame: "Oyunu Ba\u015flat",
      waiting: "Kurucu bekleniyor.",
      waitingLobbyReturn: "Herkesin lobiye d\u00f6nmesi bekleniyor.",
      waitingPlayers: "Oyuncular bekleniyor.",
      waitingShort: "Bekle",
      finishedShort: "Bitiren",
      you: "Sen",
    },
    game: {
      actionHold: "TUT",
      actionPour: "D\u00d6K",
      chaosQueue: "Kaos S\u0131ras\u0131",
      diff: "Fark",
      done: "Kilitle",
      exit: "\u00c7\u0131k",
      exitConfirm:
        "Ana men\u00fcye d\u00f6nmek istedi\u011fine emin misin? Bu ko\u015fu b\u0131rak\u0131lacak.",
      exitRun: "Ko\u015fudan \u00e7\u0131k",
      fake: "Sahte",
      goal: "Hedef",
      left: "Sol",
      nextRound: "Sonraki Tur",
      ready: "HAZIR",
      right: "Sa\u011f",
      scoreboard: "Skor Tablosu",
      set: "AYARLA",
      stay: "Kal",
      stayInGame: "Oyunda kal",
      splitMiss: "\u00c7\u0130FT HEDEF KA\u00c7TI",
      target: "Hedef",
      tenOrZero: "Ya Hep Ya Hi\u00e7",
      time: "S\u00fcre",
      go: "BA\u015eLA",
      band: "Bant",
      bandMiss: "BANT KA\u00c7TI",
      line: "\u00c7izgi",
      lowestWins: "En d\u00fc\u015f\u00fck kazan\u0131r",
      timing: "ZAMANLAMA",
      round: "Tur",
      rounds: "Tur",
      labels: {
        noScore: "SKOR YOK",
        perfect: "KUSURSUZ!",
        soClose: "\u00c7OK YAKIN!",
        tooHigh: "FAZLA Y\u00dcKSEK!",
        tooLow: "FAZLA D\u00dc\u015e\u00dcK!",
      },
      guidance: {
        classic:
          "Suyu doldurmak i\u00e7in bas\u0131l\u0131 tut. Y\u00fczey hedefe geldi\u011finde b\u0131rak.",
        endless: "Bas\u0131l\u0131 tut, b\u0131rak, sonucu oku ve ko\u015fuyu devam ettir.",
        band:
          "Her \u00e7izgi bir hak. Aktif banda yak\u0131n b\u0131rak, sonra s\u0131radakini yakala.",
        perfect:
          "\u00c7izgi yok. Dar b\u00f6lgeye denk getirirsen her \u015fey, ka\u00e7\u0131r\u0131rsan hi\u00e7bir \u015fey.",
        split:
          "Bas\u0131l\u0131 tutarken iki hazne aras\u0131nda ge\u00e7i\u015f yap, sonra tek hamlede b\u0131rak.",
      },
      resultMessages: {
        close: [
          "\u00c7ok yak\u0131n. \u0130\u015faret neredeyse teslim oluyordu.",
          "\u0130yi kontrol. Sadece bir dalga kadar uzakta.",
          "Keskin okuma. \u00c7izgi yakla\u015f\u0131m\u0131n\u0131 hissetti.",
        ],
        high: [
          "Biraz cesur. Su i\u015faretin f\u0131s\u0131lt\u0131s\u0131n\u0131 ge\u00e7ti.",
          "Fazla g\u00fc\u00e7l\u00fc. Sonraki tur daha yumu\u015fak inebilir.",
          "\u00c7izgi daha a\u015fa\u011f\u0131dayd\u0131. Elinde biraz fazla g\u00fcven vard\u0131.",
        ],
        low: [
          "Biraz \u00e7ekingen. Sonraki d\u00f6k\u00fc\u015f daha kararl\u0131 olabilir.",
          "Fazla sakin. Bir dahaki sefere suyun biraz daha y\u00fckselmesine izin ver.",
          "\u00c7izgi daha yukar\u0131da bekledi. Zamanlaman \u0131s\u0131n\u0131yor.",
        ],
        perfect: [
          "Harika. \u00c7izgi senin i\u00e7in k\u0131p\u0131rdamadan durdu.",
          "Temiz dokunu\u015f. Nerede duraca\u011f\u0131n\u0131 bilen bir hamleydi.",
          "Kusursuz okuma. Su seni dinledi.",
        ],
      },
    },
    results: {
      assessment: {
        excellent: "Su neredeyse itiraz etmedi. Elin en sakin noktay\u0131 buldu.",
        good: "Temiz ko\u015fu \u00e7ok yak\u0131n. Sadece bir daha sakin b\u0131rak\u0131\u015f istiyor.",
        learning:
          "\u00c7izgi bir s\u00f6ylenti gibi hareket etti. Yeterince yakalad\u0131n; d\u00f6n\u00fc\u015f\u00fcn daha keskin olacak.",
        retry:
          "Su s\u0131rr\u0131n\u0131 bu kez saklad\u0131. Sonraki d\u00f6k\u00fc\u015f daha iyi g\u00f6zlerle ba\u015flayacak.",
      },
      run: "KO\u015eU",
      title: "SONU\u00c7LAR",
    },
    difficulties: {
      easy: {
        description: "Daha nazik ak\u0131\u015f. Y\u00fczey hareketi daha sakin.",
        label: "Kolay",
      },
      hard: {
        description: "H\u0131zl\u0131 dolum. G\u00fc\u00e7l\u00fc dalgalar ve keskin zamanlama.",
        label: "Zor",
      },
      normal: {
        description: "Dengeli h\u0131z ve okunabilir dalga hareketi.",
        label: "Normal",
      },
    },
    colors: {
      amber: "Kehribar",
      aqua: "Akuamarin",
      blue: "Mavi",
      coral: "Mercan",
      graphite: "Grafit",
      lemon: "Limon",
      lime: "Lime",
      mint: "Nane",
      plum: "Erik",
      red: "K\u0131rm\u0131z\u0131",
      rose: "G\u00fcl",
      slate: "Arduvaz",
      violet: "Menek\u015fe",
    },
    modes: {
      blind: {
        briefing: "Hedef \u00e7izgisi yok. Y\u00fczdeyi oku ve dokunu\u015funa g\u00fcven.",
        description: "\u00c7izgi yok. Sadece hedef y\u00fczdesine g\u00fcven.",
        label: "K\u0131lavuzsuz",
      },
      flash: {
        briefing: "Hedef \u00e7izgisi bir an g\u00f6r\u00fcn\u00fcr, sonra kaybolur.",
        description: "\u00c7izgi k\u0131sa s\u00fcre yanar. Be\u015f saniyede yakala.",
        label: "Fla\u015f",
      },
      "band-run": {
        briefing:
          "\u0130ki ile be\u015f hedef band\u0131 gelir. Her b\u0131rak\u0131\u015fta s\u0131radaki bant skorlan\u0131r.",
        description: "\u0130ki ile be\u015f hedef band\u0131. Her biri i\u00e7in tek hak.",
        label: "Bant Ko\u015fusu",
      },
      "charge-pour": {
        briefing:
          "Bas\u0131l\u0131 tutarak bas\u0131n\u00e7 biriktir. B\u0131rak\u0131nca su \u00fcstten g\u00fc\u00e7l\u00fc d\u00f6k\u00fcl\u00fcr.",
        description: "Bas\u0131l\u0131 tutarak g\u00fc\u00e7 biriktir. B\u0131rak\u0131nca \u00fcstten d\u00f6k\u00fcl\u00fcr.",
        label: "Bas\u0131n\u00e7",
      },
      "burst-click": {
        briefing:
          "H\u0131zl\u0131 t\u0131klamalarla ak\u0131\u015f\u0131 kur. S\u00fcre bitene kadar seviyeyi dengede tut.",
        description: "H\u0131zl\u0131 t\u0131klayarak sabit bir ak\u0131\u015f yakala.",
        label: "Seri T\u0131k",
      },
      colorblind: {
        briefing: "Bir saniye sonra ekran karar\u0131r. Zamanlamay\u0131 akl\u0131nda tut.",
        description: "Tur ba\u015flad\u0131ktan sonra ekran karar\u0131r.",
        label: "Blind",
      },
      "chaos-queue": {
        briefing: "Her turdan \u00f6nce rastgele bir kural gelir.",
        description: "Her turdan \u00f6nce rastgele bir kural gelir.",
        label: "Kaos S\u0131ras\u0131",
      },
      classic: {
        briefing: "Tek bas\u0131\u015f, tek b\u0131rak\u0131\u015f, tek hedef \u00e7izgisi.",
        description: "Tek bas\u0131\u015f. B\u0131rakt\u0131\u011f\u0131n an seviye kilitlenir.",
        label: "Klasik",
      },
      endless: {
        briefing: "Klasik turlar devam eder, ama skor tablosu hi\u00e7 gelmez.",
        description:
          "Final skor tablosu olmadan klasik turlar. \u0130stedi\u011fin kadar devam et.",
        label: "Sonsuz",
      },
      "fake-target": {
        briefing: "\u0130ki \u00e7izgi g\u00f6r\u00fcn\u00fcr. Biri yem, biri ger\u00e7ek hedef.",
        description: "\u0130ki hedef \u00e7izgisi. Biri tuzak.",
        label: "Sahte Hedef",
      },
      invert: {
        briefing: "Kural klasik, ama suyu ters taraftan okursun.",
        description: "Klasik zamanlama, ters \u00e7evrilmi\u015f su y\u00fczeyi.",
        label: "Ters Ak\u0131\u015f",
      },
      leaky: {
        briefing:
          "B\u0131rakt\u0131ktan sonra su s\u0131zar. S\u00fcre bitene kadar \u00e7izgiyi koru.",
        description: "B\u0131rak\u0131nca s\u0131zd\u0131r\u0131r. K\u0131sa s\u00fcre, sonra kilit.",
        label: "S\u0131z\u0131nt\u0131",
      },
      "perfect-or-nothing": {
        briefing:
          "Dar isabet b\u00f6lgesi \u00e7izginin yerini al\u0131r. Denk getirirsen her \u015fey, ka\u00e7\u0131r\u0131rsan hi\u00e7bir \u015fey.",
        description:
          "Dar b\u00f6lgeye denk getirirsen her \u015fey, ka\u00e7\u0131r\u0131rsan hi\u00e7bir \u015fey.",
        label: "Ya Hep Ya Hi\u00e7",
      },
      "reverse-pour": {
        briefing: "Dolu ba\u015flars\u0131n. Hedefe inmek i\u00e7in bas\u0131l\u0131 tutarak bo\u015falt.",
        description: "Dolu ba\u015fla. Bas\u0131l\u0131 tutarak a\u015fa\u011f\u0131 indir.",
        label: "Bo\u015faltma",
      },
      "split-fill": {
        briefing:
          "\u0130ki hazne aktif. Bas\u0131l\u0131 tutarken aralar\u0131nda ge\u00e7i\u015f yap, sonra tek kez b\u0131rak.",
        description: "\u0130ki hazne. \u0130ki hedef. Tek b\u0131rak\u0131\u015f.",
        label: "\u00c7ift Dolum",
      },
      tilt: {
        briefing: "Hedef \u00e7izgisi e\u011filir. E\u011fime g\u00f6re do\u011fru anda b\u0131rak.",
        description: "Yer\u00e7ekimi e\u011filir. E\u011fik su \u00e7izgisini oku.",
        label: "E\u011fim",
      },
    },
    utility: {
      language: "Dil de\u011fi\u015ftir",
      sound: "Ses d\u00fc\u011fmesi",
      theme: "Tema de\u011fi\u015ftir",
    },
  },
};

export function normalizeLocale(locale) {
  return locale === "tr" ? "tr" : DEFAULT_LOCALE;
}

export function translate(locale, key, values = {}) {
  const dictionary = dictionaries[normalizeLocale(locale)] ?? dictionaries.en;
  const fallbackDictionary = dictionaries.en;
  const keys = key.split(".");
  const getValue = (source) =>
    keys.reduce((value, part) => value?.[part], source);
  let value = getValue(dictionary) ?? getValue(fallbackDictionary) ?? key;

  if (typeof value === "string") {
    Object.entries(values).forEach(([name, replacement]) => {
      value = value.replaceAll(`{${name}}`, String(replacement));
    });
  }

  return value;
}
