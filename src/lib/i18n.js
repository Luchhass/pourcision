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
      musicOff: "Turn music off",
      musicOn: "Turn music on",
      musicToggle: "Toggle music",
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
      creatingLobbyHint: "Syncing the room and carrying the setup into the lobby.",
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
        "{difficultyDescription}",
      singleplayerModeDescription:
        "{modeDescription}",
      singleplayerSelectionDescription:
        "{modeDescription} {difficultyDescription} Together they shape fill speed, waves, and release control.",
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
      chaosQueue: "Rule Shuffle",
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
      skipBriefing: "Skip briefing",
      stay: "Stay",
      stayInGame: "Stay in game",
      splitMiss: "SPLIT MISS",
      target: "Target",
      tenOrZero: "Strike Zone",
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
        setupText:
          "Easy slows the pour and softens the surface, giving you room to read the motion before you release.",
      },
      hard: {
        description: "Fast fill. Heavy waves and sharper timing.",
        label: "Hard",
        setupText:
          "Hard fills fast and throws heavier movement into the surface. Every hesitation shows up, so the release has to be sharp.",
      },
      normal: {
        description: "Balanced speed with clear wave motion.",
        label: "Normal",
        setupText:
          "Normal keeps the water responsive without turning twitchy. The wave stays readable, but late releases still matter.",
      },
    },
    colors: {
      amber: "Amber",
      aqua: "Aqua",
      apricot: "Apricot",
      blue: "Blue",
      bubblegum: "Bubblegum",
      butter: "Butter",
      candyLuxe: "Candy Luxe",
      coral: "Coral",
      dreamPop: "Dream Pop",
      graphite: "Graphite",
      lagoon: "Lagoon",
      lemon: "Lemon",
      lilac: "Lilac",
      lime: "Misket",
      mermaid: "Mermaid",
      mint: "Mint",
      orchid: "Orchid",
      peach: "Peach",
      peachGlow: "Peach Glow",
      pinkViolet: "Pink Violet",
      plum: "Plum",
      red: "Red",
      random: "Random",
      rgb: "RGB",
      rose: "Rose",
      sage: "Sage",
      seafoam: "Seafoam",
      slate: "Slate",
      violet: "Violet",
      "candy-luxe": "Candy Luxe",
      "dream-pop": "Dream Pop",
      "peach-glow": "Peach Glow",
      "pink-violet": "Pink Violet",
    },
    redeem: {
      close: "Close redeem modal",
      description: "Enter a code to unlock session rewards.",
      error: "Code not found.",
      inputLabel: "Code",
      kicker: "Unlock",
      placeholder: "Enter code",
      submit: "Redeem",
      success: "Premium colors unlocked for this session.",
      title: "Redeem Code",
    },
    modes: {
      blind: {
        briefing: "No target line appears. You still get one hold and one release, so read the goal percentage and stop by feel.",
        description: "No target line. Trust the goal percentage.",
        label: "No Line",
        setupText:
          "In No Line, the guide disappears before you pour. Read the target percentage, picture the level, and release when the water feels close.",
      },
      flash: {
        briefing: "The target line flashes once, then disappears. You have a short five-second window and one release to lock the level.",
        description: "The line flashes briefly. Five seconds to chase it.",
        label: "Flash",
        setupText:
          "Flash gives you one quick look at the target line before it vanishes. Memorize the mark, then use the short timer to land the release.",
      },
      "band-run": {
        briefing: "Two to five target bands appear in order. Each band gets one release, and every release scores the next band.",
        description: "Two to five target bands. One touch for each.",
        label: "Band Chase",
        setupText:
          "Band Chase turns each round into a short sequence. Every band asks for its own release, so keep your rhythm steady from one mark to the next.",
      },
      "charge-pour": {
        briefing: "Hold to charge pressure instead of filling right away. Your single release pours the stored water from above.",
        description: "Hold to charge. Release a stronger pour from above.",
        label: "Charged Pour",
        setupText:
          "Charged Pour makes the hold build pressure instead of filling immediately. Release once, and the stored water drops from above with more force.",
      },
      colorblind: {
        briefing: "The screen fades to black after one second. Keep holding by memory, then release once when the level feels right.",
        description: "The screen fades out after the round begins.",
        label: "Blackout",
        setupText:
          "Blackout lets you see the target for a moment, then takes the screen away. Keep the timing in your head and release from memory.",
      },
      "auto-rise": {
        briefing: "The water starts rising on its own. Touch once when it reaches the mark.",
        description: "Water rises from center. Touch once to stop it.",
        label: "Auto Rise",
        setupText:
          "Auto Rise starts the water without holding. Watch the climb and tap once when the surface reaches the target.",
      },
      "chaos-queue": {
        briefing: "Before each round, Rule Shuffle picks a random rule and shows its instructions. Read the briefing for tap count, timers, and special targets.",
        description: "A random rule appears before every round.",
        label: "Rule Shuffle",
        setupText:
          "Rule Shuffle changes the rule before every round and shows a short briefing first. Read the setup, then adjust your timing on the fly.",
      },
      classic: {
        briefing: "One clean hold, one release, one target line.",
        description: "One hold. Release locks the level.",
        label: "Classic",
        setupText:
          "Classic keeps the run clean: one hold, one release, and a visible target line. It is the purest test of reading the water.",
      },
      endless: {
        briefing: "Classic rounds keep coming, but the scoreboard never arrives.",
        description: "Classic rounds without a final scoreboard. Keep playing forever.",
        label: "Endless",
        setupText:
          "Endless keeps classic rounds coming without a final results screen. Use it when you want to stay inside the timing loop.",
      },
      "fake-target": {
        briefing: "Two lines appear, but only one is the real mark. You get one release, so ignore the bait and trust the true target.",
        description: "Two target lines. One is a trap.",
        label: "Trap Line",
        setupText:
          "Trap Line shows two marks, but only one is real. Ignore the bait, commit to the true line, and spend your single release carefully.",
      },
      invert: {
        briefing: "The rule is classic: one hold and one release. The water starts from the other side, so read the level upside down.",
        description: "Classic timing with the water flipped upside down.",
        label: "Upside Down",
        setupText:
          "Upside Down flips how the water reads while keeping the classic one-release rule. You still chase the mark, just from the opposite side.",
      },
      leaky: {
        briefing: "After your release, the water leaks for a short countdown before it locks. Stop a little high and let the leak settle.",
        description: "Release leaks. Short clock, then lock.",
        label: "Leaky",
        setupText:
          "Leaky keeps moving after you let go. Stop a little above the target and let the leak settle into the line before the lock.",
      },
      "perfect-or-nothing": {
        briefing:
          "A narrow strike zone replaces the target line. You get one release: land inside for full points, miss it for zero.",
        description: "Hit the narrow zone for everything, miss it for nothing.",
        label: "Strike Zone",
        setupText:
          "Strike Zone replaces the usual line with a tight scoring window. Land inside for full value; miss the zone and the round gives nothing back.",
      },
      "reverse-pour": {
        briefing: "You start full instead of empty. Hold to drain down, then release once when the surface reaches the mark.",
        description: "Start full. Hold to drain down.",
        label: "Drain",
        setupText:
          "Drain starts full and asks you to empty toward the target. Hold to lower the surface, then release when it drops into place.",
      },
      "split-fill": {
        briefing: "Two tanks are active with two targets. Keep holding, move between tanks to fill both, then release once to score.",
        description: "Two tanks. Two targets. One release.",
        label: "Dual Tank",
        setupText:
          "Dual Tank gives you two tanks and two targets in the same round. Move between them while holding, then release once when both levels feel right.",
      },
      tilt: {
        briefing: "The target line leans across the tank. You still get one release, but you must read the slanted waterline.",
        description: "Gravity leans. Read the slanted water line.",
        label: "Tilt",
        setupText:
          "Tilt angles the target across the tank. Read the slanted line instead of a flat surface and release when the water matches it.",
      },
    },
    utility: {
      language: "Language switch",
      music: "Music switch",
      redeem: "Redeem code",
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
      musicOff: "M\u00fczi\u011fi kapat",
      musicOn: "M\u00fczi\u011fi a\u00e7",
      musicToggle: "M\u00fczi\u011fi de\u011fi\u015ftir",
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
      creatingLobbyHint: "Oda haz\u0131rlan\u0131yor ve ayarlar lobiye ta\u015f\u0131n\u0131yor.",
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
        "{difficultyDescription}",
      singleplayerModeDescription:
        "{modeDescription}",
      singleplayerSelectionDescription:
        "{modeDescription} {difficultyDescription} Birlikte dolma h\u0131z\u0131n\u0131, dalgay\u0131 ve b\u0131rak\u0131\u015f kontrol\u00fcn\u00fc \u015fekillendirir.",
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
      chaosQueue: "Rastgele Kural",
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
      skipBriefing: "Ge\u00e7",
      stay: "Kal",
      stayInGame: "Oyunda kal",
      splitMiss: "\u00c7\u0130FT HEDEF KA\u00c7TI",
      target: "Hedef",
      tenOrZero: "Tam \u0130sabet",
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
        setupText:
          "Kolay ak\u0131\u015f\u0131 yava\u015flat\u0131r ve y\u00fczeyi sakinle\u015ftirir; b\u0131rakmadan \u00f6nce hareketi okumak i\u00e7in sana daha fazla alan verir.",
      },
      hard: {
        description: "H\u0131zl\u0131 dolum. G\u00fc\u00e7l\u00fc dalgalar ve keskin zamanlama.",
        label: "Zor",
        setupText:
          "Zor mod suyu h\u0131zl\u0131 doldurur ve y\u00fczeyi daha sert oynat\u0131r. K\u00fc\u00e7\u00fck teredd\u00fctler bile g\u00f6r\u00fcn\u00fcr, bu y\u00fczden b\u0131rak\u0131\u015f net olmal\u0131.",
      },
      normal: {
        description: "Dengeli h\u0131z ve okunabilir dalga hareketi.",
        label: "Normal",
        setupText:
          "Normal h\u0131z tepki ister ama acele ettirmez. Dalga okunabilir kal\u0131r, yine de ge\u00e7 b\u0131rak\u0131\u015flar fark yarat\u0131r.",
      },
    },
    colors: {
      amber: "Kehribar",
      aqua: "Akuamarin",
      apricot: "Kay\u0131s\u0131",
      blue: "Mavi",
      bubblegum: "Bubblegum",
      butter: "Butter",
      candyLuxe: "Candy Luxe",
      coral: "Mercan",
      dreamPop: "Dream Pop",
      graphite: "Grafit",
      lagoon: "Lagoon",
      lemon: "Limon",
      lilac: "Leylak",
      lime: "Lime",
      mermaid: "Mermaid",
      mint: "Nane",
      orchid: "Orkide",
      peach: "\u015eeftali",
      peachGlow: "Peach Glow",
      pinkViolet: "Pembe Mor",
      plum: "Erik",
      red: "K\u0131rm\u0131z\u0131",
      random: "Rastgele",
      rgb: "RGB",
      rose: "G\u00fcl",
      sage: "Ada\u00e7ay\u0131",
      seafoam: "Seafoam",
      slate: "Arduvaz",
      violet: "Menek\u015fe",
      "candy-luxe": "Candy Luxe",
      "dream-pop": "Dream Pop",
      "peach-glow": "Peach Glow",
      "pink-violet": "Pembe Mor",
    },
    redeem: {
      close: "Kod penceresini kapat",
      description: "Oturum odullerini acmak icin kod gir.",
      error: "Kod bulunamadi.",
      inputLabel: "Kod",
      kicker: "Kilit ac",
      placeholder: "Kod gir",
      submit: "Kullan",
      success: "Premium renkler bu oturum icin acildi.",
      title: "Kod Kullan",
    },
    modes: {
      blind: {
        briefing: "Hedef \u00e7izgisi yok. Yine tek bas\u0131\u015f ve tek b\u0131rak\u0131\u015f hakk\u0131n var; hedef y\u00fczdesini oku ve hissinle durdur.",
        description: "\u00c7izgi yok. Sadece hedef y\u00fczdesine g\u00fcven.",
        label: "\u00c7izgisiz",
        setupText:
          "\u00c7izgisiz modda rehber \u00e7izgi ortadan kalkar. Hedef y\u00fczdesini oku, seviyeyi kafanda canland\u0131r ve su do\u011fru noktaya yakla\u015ft\u0131\u011f\u0131nda b\u0131rak.",
      },
      flash: {
        briefing: "Hedef \u00e7izgisi bir kez yanar, sonra kaybolur. K\u0131sa be\u015f saniyelik s\u00fcrede tek b\u0131rak\u0131\u015fla seviyeyi kilitle.",
        description: "\u00c7izgi k\u0131sa s\u00fcre yanar. Be\u015f saniyede yakala.",
        label: "Fla\u015f",
        setupText:
          "Fla\u015f hedef \u00e7izgisini sadece k\u0131sa bir an g\u00f6sterir. \u0130\u015fareti akl\u0131nda tut, s\u00fcre bitmeden tek b\u0131rak\u0131\u015fla seviyeyi kilitle.",
      },
      "band-run": {
        briefing:
          "\u0130ki ile be\u015f hedef band\u0131 s\u0131rayla gelir. Her bant i\u00e7in tek b\u0131rak\u0131\u015f hakk\u0131n var ve her b\u0131rak\u0131\u015f s\u0131radaki band\u0131 skorlar.",
        description: "\u0130ki ile be\u015f hedef band\u0131. Her biri i\u00e7in tek hak.",
        label: "Bant Takibi",
        setupText:
          "Bant Takibi her turu k\u00fc\u00e7\u00fck bir seri gibi oynat\u0131r. Her bant ayr\u0131 bir b\u0131rak\u0131\u015f ister; ritmini bozmadan s\u0131radaki i\u015farete ge\u00e7.",
      },
      "charge-pour": {
        briefing:
          "Bas\u0131l\u0131 tutunca su hemen dolmaz, bas\u0131n\u00e7 birikir. Tek b\u0131rak\u0131\u015f\u0131nda biriken su \u00fcstten g\u00fc\u00e7l\u00fc d\u00f6k\u00fcl\u00fcr.",
        description: "Bas\u0131l\u0131 tutarak g\u00fc\u00e7 biriktir. B\u0131rak\u0131nca \u00fcstten d\u00f6k\u00fcl\u00fcr.",
        label: "G\u00fc\u00e7 Biriktir",
        setupText:
          "G\u00fc\u00e7 Biriktir modunda bas\u0131l\u0131 tutmak suyu hemen doldurmaz, bas\u0131n\u00e7 toplar. B\u0131rakt\u0131\u011f\u0131nda biriken su \u00fcstten daha g\u00fc\u00e7l\u00fc d\u00fc\u015fer.",
      },
      colorblind: {
        briefing: "Bir saniye sonra ekran karar\u0131r. Bas\u0131l\u0131 tutmaya haf\u0131zandan devam et, seviye do\u011fru hissetti\u011finde tek kez b\u0131rak.",
        description: "Tur ba\u015flad\u0131ktan sonra ekran karar\u0131r.",
        label: "Karartma",
        setupText:
          "Karartma hedefi k\u0131sa s\u00fcre g\u00f6sterir, sonra ekran\u0131 senden al\u0131r. Zamanlamay\u0131 akl\u0131nda tut ve do\u011fru an\u0131 hissedince b\u0131rak.",
      },
      "auto-rise": {
        briefing: "Su kendili\u011finden y\u00fckselir. Hedefe geldi\u011finde bir kez dokun.",
        description: "Su ortadan y\u00fckselir. Durdurmak i\u00e7in bir kez dokun.",
        label: "Otomatik Y\u00fckseli\u015f",
        setupText:
          "Otomatik Y\u00fckseli\u015f suyu sen basmadan ba\u015flat\u0131r. Y\u00fckseli\u015fi izle ve y\u00fczey hedefe geldi\u011finde tek dokunu\u015fla durdur.",
      },
      "chaos-queue": {
        briefing: "Rastgele Kural her turdan \u00f6nce yeni bir kural se\u00e7er ve a\u00e7\u0131klamas\u0131n\u0131 g\u00f6sterir. T\u0131klama hakk\u0131n\u0131, s\u00fcreyi ve \u00f6zel hedefleri buradan oku.",
        description: "Her turdan \u00f6nce rastgele bir kural gelir.",
        label: "Rastgele Kural",
        setupText:
          "Rastgele Kural her turdan \u00f6nce yeni bir d\u00fczen se\u00e7er ve k\u0131sa a\u00e7\u0131klamas\u0131n\u0131 g\u00f6sterir. Okuyup anlayarak ba\u015fla; her turda zamanlaman\u0131 yeniden ayarla.",
      },
      classic: {
        briefing: "Tek bas\u0131\u015f, tek b\u0131rak\u0131\u015f, tek hedef \u00e7izgisi.",
        description: "Tek bas\u0131\u015f. B\u0131rakt\u0131\u011f\u0131n an seviye kilitlenir.",
        label: "Klasik",
        setupText:
          "Klasik mod i\u015fi sade tutar: tek bas\u0131\u015f, tek b\u0131rak\u0131\u015f ve net bir hedef \u00e7izgisi. Suyu okumay\u0131 en temiz haliyle dener.",
      },
      endless: {
        briefing: "Klasik turlar devam eder, ama skor tablosu hi\u00e7 gelmez.",
        description:
          "Final skor tablosu olmadan klasik turlar. \u0130stedi\u011fin kadar devam et.",
        label: "Sonsuz",
        setupText:
          "Sonsuz mod final ekran\u0131na gitmeden klasik turlar\u0131 devam ettirir. Zamanlama ak\u0131\u015f\u0131n\u0131 bozmadan oyunda kalmak istedi\u011finde iyi hissettirir.",
      },
      "fake-target": {
        briefing: "\u0130ki \u00e7izgi g\u00f6r\u00fcn\u00fcr ama sadece biri ger\u00e7ek hedeftir. Tek b\u0131rak\u0131\u015f hakk\u0131n var; yemi ay\u0131r ve ger\u00e7ek \u00e7izgiye oyna.",
        description: "\u0130ki hedef \u00e7izgisi. Biri tuzak.",
        label: "Tuzak \u00c7izgi",
        setupText:
          "Tuzak \u00c7izgi iki i\u015faret g\u00f6sterir ama sadece biri ger\u00e7ek hedeftir. Yeme kap\u0131lma, do\u011fru \u00e7izgiye karar ver ve tek b\u0131rak\u0131\u015f\u0131n\u0131 ona sakla.",
      },
      invert: {
        briefing: "Kural klasik: tek bas\u0131\u015f ve tek b\u0131rak\u0131\u015f. Su ters taraftan ba\u015flar, bu y\u00fczden seviyeyi ba\u015f a\u015fa\u011f\u0131 oku.",
        description: "Klasik zamanlama, ters \u00e7evrilmi\u015f su y\u00fczeyi.",
        label: "Ters Y\u00fcz",
        setupText:
          "Ters Y\u00fcz klasik kural\u0131 korur ama suyu ters taraftan okutur. Ayn\u0131 hedefi kovalars\u0131n, sadece g\u00f6z\u00fcn al\u0131\u015ft\u0131\u011f\u0131n\u0131n tersinden d\u00fc\u015f\u00fcn\u00fcrs\u00fcn.",
      },
      leaky: {
        briefing:
          "B\u0131rakt\u0131ktan sonra su k\u0131sa bir geri say\u0131m boyunca s\u0131zar ve sonra kilitlenir. Biraz yukar\u0131da durdur, s\u0131z\u0131nt\u0131n\u0131n oturmas\u0131na izin ver.",
        description: "B\u0131rak\u0131nca s\u0131zd\u0131r\u0131r. K\u0131sa s\u00fcre, sonra kilit.",
        label: "S\u0131z\u0131nt\u0131",
        setupText:
          "S\u0131z\u0131nt\u0131 modunda su b\u0131rakt\u0131ktan sonra da k\u0131sa s\u00fcre hareket eder. Biraz yukar\u0131da durdur ve s\u0131z\u0131nt\u0131n\u0131n \u00e7izgiye oturmas\u0131na izin ver.",
      },
      "perfect-or-nothing": {
        briefing:
          "Dar isabet b\u00f6lgesi hedef \u00e7izgisinin yerini al\u0131r. Tek b\u0131rak\u0131\u015f hakk\u0131n var; i\u00e7ine denk getirirsen tam puan, ka\u00e7\u0131r\u0131rsan s\u0131f\u0131r.",
        description:
          "Dar b\u00f6lgeye denk getirirsen her \u015fey, ka\u00e7\u0131r\u0131rsan hi\u00e7bir \u015fey.",
        label: "Tam \u0130sabet",
        setupText:
          "Tam \u0130sabet normal \u00e7izginin yerine dar bir skor alan\u0131 koyar. \u0130\u00e7ine denk getirirsen tam puan al\u0131rs\u0131n; ka\u00e7\u0131r\u0131rsan tur bo\u015f d\u00f6ner.",
      },
      "reverse-pour": {
        briefing: "Bo\u015f yerine dolu ba\u015flars\u0131n. Hedefe inmek i\u00e7in bas\u0131l\u0131 tutarak bo\u015falt, y\u00fczey hedefe geldi\u011finde tek kez b\u0131rak.",
        description: "Dolu ba\u015fla. Bas\u0131l\u0131 tutarak a\u015fa\u011f\u0131 indir.",
        label: "Tahliye",
        setupText:
          "Tahliye modu bo\u015f yerine dolu ba\u015flat\u0131r. Y\u00fczeyi hedefe indirmek i\u00e7in bas\u0131l\u0131 tut, \u00e7izgiye geldi\u011finde b\u0131rak.",
      },
      "split-fill": {
        briefing:
          "\u0130ki hazne ve iki hedef aktif. Bas\u0131l\u0131 tutarken hazneler aras\u0131nda ge\u00e7i\u015f yaparak ikisini de doldur, sonra tek kez b\u0131rak.",
        description: "\u0130ki hazne. \u0130ki hedef. Tek b\u0131rak\u0131\u015f.",
        label: "\u00c7ift Hazne",
        setupText:
          "\u00c7ift Hazne ayn\u0131 turda iki tank ve iki hedef verir. Bas\u0131l\u0131 tutarken ikisi aras\u0131nda ge\u00e7, iki seviye de do\u011fru hissetti\u011finde b\u0131rak.",
      },
      tilt: {
        briefing: "Hedef \u00e7izgisi hazne boyunca e\u011filir. Yine tek b\u0131rak\u0131\u015f hakk\u0131n var, ama su y\u00fczeyini e\u011fik \u00e7izgiye g\u00f6re okumal\u0131s\u0131n.",
        description: "Yer\u00e7ekimi e\u011filir. E\u011fik su \u00e7izgisini oku.",
        label: "E\u011fim",
        setupText:
          "E\u011fim hedefi d\u00fcz de\u011fil, haznenin i\u00e7ine e\u011fik yerle\u015ftirir. D\u00fcz y\u00fczey yerine e\u011fik \u00e7izgiyi oku ve su ona yakla\u015ft\u0131\u011f\u0131nda b\u0131rak.",
      },
    },
    utility: {
      language: "Dil de\u011fi\u015ftir",
      music: "M\u00fczik d\u00fc\u011fmesi",
      redeem: "Kod kullan",
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
