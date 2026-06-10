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
        "Five quick rounds turn timing into a clean score.",
      multiplayerDescription: "Prepare a shared match format for future lobbies.",
      multiplayerTitle: "Multiplayer",
      singleplayerDescription: "Play a solo precision run across five target rounds.",
      singleplayerTitle: "Singleplayer",
    },
    setup: {
      creatingLobby: "Creating Lobby",
      createLobby: "Create Lobby",
      difficulty: "Difficulty",
      joinLobbyAction: "Join Lobby",
      lobbyList: "Open lobbies",
      lobbyName: "Lobby name",
      lobbyNameRequired: "Lobby name is required",
      lobbyPassword: "Lobby password",
      lobbyPasswordRequired: "Password is required",
      mode: "Mode",
      multiplayerDescription:
        "Create a private lobby, keep the same five-round rhythm, and watch every opponent's water line chase yours in real time.",
      multiplayerStart: "Start Multiplayer",
      multiplayerTitle: "Multiplayer",
      noLobbies: "No open lobbies.",
      playerName: "Player name",
      playerNameRequired: "Player name is required",
      privateLobby: "Private",
      publicLobby: "Public",
      searchLobby: "Search lobbies",
      singleplayerSelectionDescription:
        "{mode} sets the rule: {modeDescription} {difficulty} sets the pressure: {difficultyDescription} Together they shape fill speed, waves, and release precision.",
      singleplayerDescription:
        "Choose the rule mode, pick the water color, and start a five-round precision run built around your timing.",
      singleplayerStart: "Start Singleplayer",
      singleplayerTitle: "Singleplayer",
      setup: "SETUP",
      visibility: "Visibility",
      waterColor: "Water color",
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
      you: "You",
    },
    game: {
      actionHold: "HOLD",
      actionPour: "POUR",
      chaosQueue: "Chaos Queue",
      diff: "Diff",
      done: "Done",
      fake: "Fake",
      goal: "Goal",
      left: "Left",
      nextRound: "Next Round",
      ready: "READY",
      right: "Right",
      scoreboard: "Scoreboard",
      set: "SET",
      splitMiss: "SPLIT MISS",
      target: "Target",
      tenOrZero: "Ten or Zero",
      time: "Time",
      go: "GO",
      line: "Line",
      lowestWins: "Lowest wins",
      precision: "PRECISION",
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
        perfect:
          "The line is gone. Hit the strike zone for ten, miss it for zero.",
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
      lime: "Lime",
      mint: "Mint",
      plum: "Plum",
      red: "Red",
      rose: "Rose",
      slate: "Slate",
      violet: "Violet",
    },
    modes: {
      blind: {
        briefing: "No guide line this round. Read the surface and lock it by feel.",
        description: "No guide line. Adjust freely, then lock.",
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
      leaky: {
        briefing: "The water leaks after release. Keep pressure until the clock ends.",
        description: "Release leaks. Short clock, then lock.",
        label: "Leaky",
      },
      "perfect-or-nothing": {
        briefing:
          "A narrow strike zone replaces the line. Hit it for ten, miss it for zero.",
        description: "Hit the narrow zone for ten, miss it for zero.",
        label: "Ten or Zero",
      },
      "reverse-pour": {
        briefing: "You start full. Hold to drain down into the mark.",
        description: "Start full. Hold to drain down.",
        label: "Reverse Pour",
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
      createdBy: "hazırlayan",
    },
    common: {
      backHome: "Ana sayfaya dön",
      continue: "Devam",
      loading: "Yükleniyor",
      mainMenu: "Ana menü",
      playAgain: "Yeniden oyna",
    },
    toggles: {
      soundOff: "Sesi kapat",
      soundOn: "Sesi aç",
      soundToggle: "Sesi değiştir",
      themeDark: "Koyu moda geç",
      themeLight: "Açık moda geç",
      themeToggle: "Temayı değiştir",
    },
    home: {
      howToPlay: "Nasıl oynanır",
      introOne:
        "Her turda hedef çizgisi belirir. Suyu yükselt, işarete yaklaşınca bırak.",
      introTwo:
        "Beş hızlı tur, zamanlamanı net bir skora dönüştürür.",
      multiplayerDescription: "Arkadaşlarınla aynı hedef çizgisinde yarışacağın ortak bir oyun kur.",
      multiplayerTitle: "Çok oyunculu",
      singleplayerDescription: "Beş hedef turunda tek başına hassasiyet koşusu oyna.",
      singleplayerTitle: "Tek oyunculu",
    },
    setup: {
      creatingLobby: "Lobi kuruluyor",
      createLobby: "Lobi kur",
      difficulty: "Zorluk",
      joinLobbyAction: "Lobiye katıl",
      lobbyList: "Açık lobiler",
      lobbyName: "Lobi adı",
      lobbyNameRequired: "Lobi adı gerekli",
      lobbyPassword: "Lobi şifresi",
      lobbyPasswordRequired: "Şifre gerekli",
      mode: "Mod",
      multiplayerDescription:
        "Özel bir lobi kur, beş turluk ritmi koru ve rakiplerinin su çizgisini anlık olarak izle.",
      multiplayerStart: "Çok oyunculu başlat",
      multiplayerTitle: "Çok oyunculu",
      noLobbies: "Açık lobi yok.",
      playerName: "Oyuncu adı",
      playerNameRequired: "Oyuncu adı gerekli",
      privateLobby: "Özel",
      publicLobby: "Herkese açık",
      searchLobby: "Lobi ara",
      singleplayerSelectionDescription:
        "{mode} kuralı belirler: {modeDescription} {difficulty} baskıyı ayarlar: {difficultyDescription} Birlikte dolma hızını, dalgayı ve bırakış hassasiyetini şekillendirir.",
      singleplayerDescription:
        "Kural modunu seç, su rengini belirle ve zamanlamaya dayalı beş turluk koşuya başla.",
      singleplayerStart: "Tek oyunculu başlat",
      singleplayerTitle: "Tek oyunculu",
      setup: "AYARLAR",
      visibility: "Görünürlük",
      waterColor: "Su rengi",
    },
    room: {
      code: "Oda Kodu",
      closeSettings: "Ayarları kapat",
      copyInvite: "Daveti kopyala",
      createFailed: "Çok oyunculu lobi kurulamadı.",
      couldNotCopy: "Davet bağlantısı kopyalanamadı.",
      couldNotKick: "Oyuncu çıkarılamadı.",
      couldNotReachServer: "Çok oyunculu sunucuya ulaşılamadı.",
      couldNotReturnToLobby: "Lobiye dönülemedi.",
      couldNotStart: "Oyun başlatılamadı.",
      couldNotUpdateSettings: "Lobi ayarları güncellenemedi.",
      closedMessage: "Bu lobi kapandı.",
      editSettings: "Ayarları düzenle",
      findingLobby: "Lobi aranıyor.",
      host: "Kurucu",
      join: "Lobiye katıl",
      joinFailed: "Lobiye katılınamadı.",
      joining: "Katılınıyor",
      kicked: "Çıkarıldın",
      kickedMessage: "Bu lobiden çıkarıldın.",
      kickPlayer: "{name} oyuncusunu çıkar",
      lobby: "Lobi",
      lobbyNotFound: "Lobi bulunamadı.",
      multiplayerDescription:
        "Özel lobiye katıl, kurucuyu bekle ve herkesin aynı hedef çizgisine karşı su seviyesini takip et.",
      namePlaceholder: "Oyuncu adı",
      away: "Uzakta",
      online: "Çevrimiçi",
      players: "Oyuncular",
      resultsDescription:
        "Koşu tamamlandı. Tabloyu incele, en iyi turunu yakala ve lobinin bir tur daha hak edip etmediğine karar ver.",
      returnLobby: "Lobiye dön",
      returningLobby: "Dönülüyor",
      startGame: "Oyunu başlat",
      waiting: "Kurucu bekleniyor.",
      waitingLobbyReturn: "Herkesin lobiye dönmesi bekleniyor.",
      waitingPlayers: "Oyuncular bekleniyor.",
      waitingShort: "Bekle",
      you: "Sen",
    },
    game: {
      actionHold: "TUT",
      actionPour: "DÖK",
      chaosQueue: "Kaos sırası",
      diff: "Fark",
      done: "Kilitle",
      fake: "Sahte",
      goal: "Hedef",
      left: "Sol",
      nextRound: "Sonraki tur",
      ready: "HAZIR",
      right: "Sağ",
      scoreboard: "Skor tablosu",
      set: "AYARLA",
      splitMiss: "ÇİFT HEDEF KAÇTI",
      target: "Hedef",
      tenOrZero: "On ya da sıfır",
      time: "Süre",
      go: "BAŞLA",
      line: "Çizgi",
      lowestWins: "En düşük kazanır",
      precision: "HASSASİYET",
      round: "Tur",
      rounds: "Tur",
      labels: {
        noScore: "SKOR YOK",
        perfect: "KUSURSUZ!",
        soClose: "ÇOK YAKIN!",
        tooHigh: "FAZLA YÜKSEK!",
        tooLow: "FAZLA DÜŞÜK!",
      },
      guidance: {
        classic: "Suyu doldurmak için basılı tut. Yüzey hedefe geldiğinde bırak.",
        endless: "Basılı tut, bırak, sonucu oku ve koşuyu devam ettir.",
        perfect: "Çizgi yok. Dar bölgeye denk getirirsen on, kaçırırsan sıfır.",
        split: "Basılı tutarken iki hazne arasında geçiş yap, sonra tek hamlede bırak.",
      },
      resultMessages: {
        close: [
          "Çok yakın. İşaret neredeyse teslim oluyordu.",
          "İyi kontrol. Sadece bir dalga kadar uzakta.",
          "Keskin okuma. Çizgi yaklaşımını hissetti.",
        ],
        high: [
          "Biraz cesur. Su işaretin fısıltısını geçti.",
          "Fazla güçlü. Sonraki tur daha yumuşak inebilir.",
          "Çizgi daha aşağıdaydı. Elinde biraz fazla güven vardı.",
        ],
        low: [
          "Biraz çekingen. Sonraki döküş daha kararlı olabilir.",
          "Fazla sakin. Bir dahaki sefere suyun biraz daha yükselmesine izin ver.",
          "Çizgi daha yukarıda bekledi. Zamanlaman ısınıyor.",
        ],
        perfect: [
          "Harika. Çizgi senin için kıpırdamadan durdu.",
          "Temiz dokunuş. Nerede duracağını bilen bir hamleydi.",
          "Kusursuz okuma. Su seni dinledi.",
        ],
      },
    },
    results: {
      assessment: {
        excellent: "Su neredeyse itiraz etmedi. Elin en sakin noktayı buldu.",
        good: "Temiz koşu çok yakın. Sadece bir daha sakin bırakış istiyor.",
        learning:
          "Çizgi bir söylenti gibi hareket etti. Yeterince yakaladın; dönüşün daha keskin olacak.",
        retry:
          "Su sırrını bu kez sakladı. Sonraki döküş daha iyi gözlerle başlayacak.",
      },
      run: "KOŞU",
      title: "SONUÇLAR",
    },
    difficulties: {
      easy: {
        description: "Daha nazik akış. Yüzey hareketi daha sakin.",
        label: "Kolay",
      },
      hard: {
        description: "Hızlı dolum. Güçlü dalgalar ve keskin zamanlama.",
        label: "Zor",
      },
      normal: {
        description: "Dengeli hız, okunabilir dalga hareketi.",
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
      red: "Kırmızı",
      rose: "Gül",
      slate: "Arduvaz",
      violet: "Menekşe",
    },
    modes: {
      blind: {
        briefing: "Bu turda kılavuz çizgi yok. Yüzeyi oku ve hissinle kilitle.",
        description: "Kılavuz çizgi yok. Serbestçe ayarla, sonra kilitle.",
        label: "Kör hedef",
      },
      "chaos-queue": {
        briefing: "Her turdan önce rastgele bir kural gelir.",
        description: "Her turdan önce rastgele bir kural gelir.",
        label: "Kaos sırası",
      },
      classic: {
        briefing: "Tek basış, tek bırakış, tek hedef çizgisi.",
        description: "Tek basış. Bıraktığın an seviye kilitlenir.",
        label: "Klasik",
      },
      endless: {
        briefing: "Klasik turlar devam eder, ama skor tablosu hiç gelmez.",
        description: "Final skor tablosu olmadan klasik turlar. İstediğin kadar devam et.",
        label: "Sonsuz",
      },
      "fake-target": {
        briefing: "İki çizgi görünür. Biri yem, biri gerçek hedef.",
        description: "İki hedef çizgisi. Biri tuzak.",
        label: "Sahte hedef",
      },
      leaky: {
        briefing: "Bıraktıktan sonra su sızar. Süre bitene kadar çizgiyi koru.",
        description: "Bırakınca sızdırır. Kısa süre, sonra kilit.",
        label: "Sızıntı",
      },
      "perfect-or-nothing": {
        briefing:
          "Çizginin yerini dar bir isabet bölgesi alır. Denk getirirsen on, kaçırırsan sıfır.",
        description: "Dar bölgeye denk getirirsen on, kaçırırsan sıfır.",
        label: "On ya da sıfır",
      },
      "reverse-pour": {
        briefing: "Dolu başlarsın. Hedefe inmek için basılı tutarak boşalt.",
        description: "Dolu başla. Basılı tutarak aşağı indir.",
        label: "Ters döküş",
      },
      "split-fill": {
        briefing: "İki hazne aktif. Basılı tutarken aralarında geçiş yap, sonra tek kez bırak.",
        description: "İki hazne. İki hedef. Tek bırakış.",
        label: "Çift dolum",
      },
      tilt: {
        briefing: "Hedef çizgisi eğilir. Eğime göre doğru anda bırak.",
        description: "Yerçekimi eğilir. Eğik su çizgisini oku.",
        label: "Eğim",
      },
    },
    utility: {
      language: "Dil değiştir",
      sound: "Ses düğmesi",
      theme: "Tema değiştir",
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
