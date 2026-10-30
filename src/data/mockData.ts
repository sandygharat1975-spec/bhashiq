import { LanguageInfo, Badge, SimulatedCaller, TravelCategory, QuizQuestion } from '../types';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', speechCode: 'hi-IN' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', speechCode: 'en-US' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', speechCode: 'mr-IN' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', speechCode: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', speechCode: 'ja-JP' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', speechCode: 'de-DE' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', speechCode: 'zh-CN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', speechCode: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', speechCode: 'te-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', speechCode: 'gu-IN' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', speechCode: 'ru-RU' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', speechCode: 'ar-SA' },
];

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_words',
    title: 'First Words',
    description: 'Complete your first live speech translation',
    icon: '🌱',
    unlocked: true,
    unlockedAt: 'Today',
    xpReward: 50,
  },
  {
    id: 'words_100',
    title: '100 Words Learned',
    description: 'Add or practice 100 vocabulary words',
    icon: '📚',
    unlocked: true,
    unlockedAt: 'Yesterday',
    xpReward: 150,
  },
  {
    id: 'speaking_star',
    title: 'Speaking Star',
    description: 'Achieve >85% accuracy in 5 pronunciation tests',
    icon: '🎤',
    unlocked: true,
    unlockedAt: '3 days ago',
    xpReward: 200,
  },
  {
    id: 'polyglot',
    title: 'Polyglot Explorer',
    description: 'Translate across at least 4 different languages',
    icon: '🌍',
    unlocked: false,
    xpReward: 250,
  },
  {
    id: 'streak_7',
    title: '7-Day Streak',
    description: 'Maintain a learning streak for 7 consecutive days',
    icon: '🔥',
    unlocked: true,
    unlockedAt: '5 days ago',
    xpReward: 300,
  },
  {
    id: 'vocab_master',
    title: 'Vocabulary Master',
    description: 'Master 50 words in your personal vocabulary bank',
    icon: '💎',
    unlocked: false,
    xpReward: 400,
  },
  {
    id: 'call_pioneer',
    title: 'Live Call Pioneer',
    description: 'Complete a 3-minute bilingual live voice call',
    icon: '📞',
    unlocked: false,
    xpReward: 200,
  },
  {
    id: 'visionary_eye',
    title: 'AR Visionary',
    description: 'Scan and translate text on 3 camera posters or menus',
    icon: '📸',
    unlocked: false,
    xpReward: 180,
  },
];

export const SIMULATED_CALLERS: SimulatedCaller[] = [
  {
    id: 'rahul',
    name: 'Rahul Sharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    language: 'hi',
    languageName: 'Hindi',
    role: 'College Student (Mumbai)',
    greetingText: 'नमस्ते! मैं राहुल हूँ। क्या आप मुझे बता सकते हैं कि कॉलेज का मुख्य गेट कहाँ है?',
    sampleResponses: [
      { promptTrigger: /railway|station|ट्रेन|स्टेशन/i, responseOriginal: 'रेलवे स्टेशन यहाँ से लगभग 2 किलोमीटर दूर है। आप ऑटो ले सकते हैं।' },
      { promptTrigger: /how are you|कहाँ|हाल|कैसे/i, responseOriginal: 'मैं बिल्कुल ठीक हूँ, धन्यवाद! आपकी पढ़ाई कैसी चल रही है?' },
      { promptTrigger: /exam|project|कॉलेज/i, responseOriginal: 'हाँ, हमारा फाइनल ईयर प्रोजेक्ट सबमिशन अगले हफ्ते है, उसी की तैयारी चल रही है।' },
      { promptTrigger: /food|eat|कैंटीन|खाना/i, responseOriginal: 'कॉलेज कैंटीन में आज मिसळ पाव और समोसा बहुत स्वादिष्ट बना है!' },
      { promptTrigger: /bye|अलविदा|goodbye/i, responseOriginal: 'ठीक है दोस्त, फिर मिलते हैं! अपना ख्याल रखना।' },
    ],
  },
  {
    id: 'ananya',
    name: 'Ananya Patil',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    language: 'mr',
    languageName: 'Marathi',
    role: 'Software Engineer (Pune)',
    greetingText: 'नमस्कार! मी अनन्य बोलत आहे. आजच्या सेमिनारसाठी तुम्ही तयार आहात का?',
    sampleResponses: [
      { promptTrigger: /हो|yes|ready|तयार/i, responseOriginal: 'छान! आपण मिळून उत्तम सादरीकरण करूया. ऑल द बेस्ट!' },
      { promptTrigger: /station|रस्ता|कुठे/i, responseOriginal: 'पुणे स्टेशन इथून खूप जवळ आहे, तुम्ही मेट्रोने फक्त १० मिनिटांत पोहोचू शकता.' },
      { promptTrigger: /food|जेवण|हॉटेल/i, responseOriginal: 'इथे जवळच एक उत्तम महाराष्ट्रीयन थाळी हॉटेल आहे, तिथे जाऊया!' },
      { promptTrigger: /bye|निरोप/i, responseOriginal: 'हो नक्कीच, नंतर भेटूया. काळजी घ्या!' },
    ],
  },
  {
    id: 'sofia',
    name: 'Sofia Gomez',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    language: 'es',
    languageName: 'Spanish',
    role: 'Exchange Student (Madrid)',
    greetingText: '¡Hola! ¿Cómo estás? Me alegro mucho de poder hablar contigo hoy.',
    sampleResponses: [
      { promptTrigger: /good|fine|bien|well/i, responseOriginal: '¡Qué bien! El clima aquí en España hoy está muy soleado y agradable.' },
      { promptTrigger: /project|study|universidad/i, responseOriginal: 'Estoy trabajando en mi tesis sobre inteligencia artificial aplicada a la comunicación.' },
      { promptTrigger: /food|tapas|paella/i, responseOriginal: '¡Te encantaría la paella valenciana y las tapas tradicionales!' },
      { promptTrigger: /bye|adiós|chao/i, responseOriginal: '¡Hasta luego! Que tengas un maravilloso día.' },
    ],
  },
  {
    id: 'kenji',
    name: 'Kenji Sato',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    language: 'ja',
    languageName: 'Japanese',
    role: 'Robotics Researcher (Tokyo)',
    greetingText: 'こんにちは！お話しできて嬉しいです。日本の最新技術について何か聞きたいですか？',
    sampleResponses: [
      { promptTrigger: /robot|ai|tech|技術/i, responseOriginal: '私たちは今、多言語リアルタイム翻訳と対話AIロボットを開発しています。' },
      { promptTrigger: /tokyo|japan|weather|日本/i, responseOriginal: '東京の春は桜がとても綺麗です。ぜひ一度日本へ遊びに来てください！' },
      { promptTrigger: /bye|さようなら/i, responseOriginal: 'ありがとうございました！またお会いしましょう。' },
    ],
  },
];

// Homonyms for Context-Aware Translation (Page 5 of PDF)
export const HOMONYM_DATABASE: Record<string, {
  word: string;
  contexts: {
    meaning: string;
    description: string;
    translations: Record<string, string>;
    exampleEn: string;
  }[];
}> = {
  bank: {
    word: 'bank',
    contexts: [
      {
        meaning: 'Financial Institution',
        description: 'Organization where people deposit and borrow money',
        translations: { hi: 'बैंक (वित्तीय संस्था)', mr: 'बँक (आर्थिक संस्था)', es: 'Banco (financiero)', fr: 'Banque (financière)', ja: '銀行' },
        exampleEn: 'I need to withdraw cash from the bank.',
      },
      {
        meaning: 'River Bank',
        description: 'The land alongside or sloping down to a river or lake',
        translations: { hi: 'नदी का किनारा', mr: 'नदीचा काठ', es: 'Orilla del río', fr: 'Rive du fleuve', ja: '川岸' },
        exampleEn: 'We sat on the grassy bank watching the flowing river.',
      },
      {
        meaning: 'Blood / Memory Bank',
        description: 'A repository or store of reserved items',
        translations: { hi: 'कोष / संग्रह बैंक', mr: 'साठा / रक्तपेढी', es: 'Banco de reserva / sangre', fr: 'Banque de données / sang', ja: 'バンク・保存庫' },
        exampleEn: 'The local hospital requested donations for the blood bank.',
      }
    ]
  },
  spring: {
    word: 'spring',
    contexts: [
      {
        meaning: 'Season',
        description: 'The season between winter and summer',
        translations: { hi: 'वसंत ऋतु', mr: 'वसंत ऋतू', es: 'Primavera', fr: 'Printemps', ja: '春' },
        exampleEn: 'Flowers bloom beautifully during spring.',
      },
      {
        meaning: 'Coil / Mechanical Spring',
        description: 'An elastic metal coil that stores energy',
        translations: { hi: 'कमानी / स्प्रिंग (लोहे का)', mr: 'स्प्रिंग / लवचिक कॉइल', es: 'Muelle / Resorte', fr: 'Ressort', ja: 'ばね' },
        exampleEn: 'The mattress has supportive steel springs inside.',
      },
      {
        meaning: 'Water Spring',
        description: 'A natural flow of water emerging from underground',
        translations: { hi: 'पानी का चश्मा / झरना', mr: 'पाण्याचा झरा', es: 'Manantial de agua', fr: 'Source d\'eau', ja: '湧き水 / 温泉' },
        exampleEn: 'They drank crystal clear mineral water straight from the mountain spring.',
      }
    ]
  },
  bat: {
    word: 'bat',
    contexts: [
      {
        meaning: 'Animal (Flying Mammal)',
        description: 'A nocturnal flying mammal',
        translations: { hi: 'चमगादड़', mr: 'वटवाघूळ', es: 'Murciélago', fr: 'Chauve-souris', ja: 'コウモリ' },
        exampleEn: 'A bat flew past the cave entrance at dusk.',
      },
      {
        meaning: 'Sports Equipment',
        description: 'A wooden stick used to hit a cricket or baseball',
        translations: { hi: 'बल्ला (क्रिकेट)', mr: 'बॅट (खेळाची)', es: 'Bate de béisbol / cricket', fr: 'Batte de sport', ja: 'バット' },
        exampleEn: 'Sachin Tendulkar signed his favorite cricket bat.',
      }
    ]
  },
  crane: {
    word: 'crane',
    contexts: [
      {
        meaning: 'Construction Machine',
        description: 'Heavy lifting machine for tall buildings',
        translations: { hi: 'क्रेन (वज़न उठाने वाली मशीन)', mr: 'क्रेन (उचल यंत्र)', es: 'Grúa de construcción', fr: 'Grue de chantier', ja: 'クレーン重機' },
        exampleEn: 'The construction crane lifted heavy steel girders.',
      },
      {
        meaning: 'Bird Species',
        description: 'A tall, long-legged and long-necked bird',
        translations: { hi: 'सारस पक्षी', mr: 'करकोचा पक्षी', es: 'Grulla (ave)', fr: 'Grue (oiseau)', ja: 'ツル（鶴）' },
        exampleEn: 'A flock of white cranes rested peacefully by the lake.',
      }
    ]
  }
};

// Idioms for AI Context Translator (Page 5 of PDF)
export const IDIOMS_DATABASE: {
  phrase: string;
  literalMeaning: string;
  actualMeaning: string;
  contextualTranslations: Record<string, string>;
  literalTranslations: Record<string, string>;
}[] = [
  {
    phrase: "What's up?",
    literalMeaning: "What is physically above us in altitude?",
    actualMeaning: "How are you? / What are you doing currently?",
    contextualTranslations: {
      hi: "क्या चल रहा है? / आप कैसे हैं?",
      mr: "काय चाललंय? / कसे आहात?",
      es: "¿Qué tal? / ¿Qué pasa?",
      fr: "Quoi de neuf ? / Comment ça va ?",
      ja: "調子はどう？ / 何かあった？",
      de: "Was geht ab? / Wie geht's?"
    },
    literalTranslations: {
      hi: "ऊपर क्या है?",
      mr: "वर काय आहे?",
      es: "¿Qué está arriba?",
      fr: "Qu'est-ce qui est en haut ?",
      ja: "上には何がありますか？",
      de: "Was ist oben?"
    }
  },
  {
    phrase: "Piece of cake",
    literalMeaning: "A slice of sweet baked dessert",
    actualMeaning: "Something very easy and straightforward to do",
    contextualTranslations: {
      hi: "बच्चों का खेल / बहुत आसान काम",
      mr: "अगदी सोपे काम / हातचा मळ",
      es: "Pan comido / Muy fácil",
      fr: "C'est du gâteau / Très facile",
      ja: "朝飯前 / とても簡単",
      de: "Ein Kinderspiel"
    },
    literalTranslations: {
      hi: "केक का टुकड़ा",
      mr: "केकचा तुकडा",
      es: "Un pedazo de pastel",
      fr: "Un morceau de gâteau",
      ja: "ケーキの一切れ",
      de: "Ein Stück Kuchen"
    }
  },
  {
    phrase: "Break a leg",
    literalMeaning: "Fracture one of your leg bones",
    actualMeaning: "Good luck! (traditional theatrical blessing)",
    contextualTranslations: {
      hi: "शुभकामनाएं! / तुम्हारा प्रदर्शन शानदार रहे!",
      mr: "खूप खूप शुभेच्छा! / यश मिळो!",
      es: "¡Mucha mierda! / ¡Buena suerte!",
      fr: "Bonne chance ! / Merde !",
      ja: "頑張って！ / 成功を祈る！",
      de: "Hals- und Beinbruch! / Viel Glück!"
    },
    literalTranslations: {
      hi: "टांग तोड़ लो",
      mr: "पाय मोडून घे",
      es: "Rómpete una pierna",
      fr: "Casse-toi une jambe",
      ja: "足を折れ",
      de: "Brich dir ein Bein"
    }
  },
  {
    phrase: "Hit the road",
    literalMeaning: "Physically strike the asphalt roadway",
    actualMeaning: "Depart or begin a journey",
    contextualTranslations: {
      hi: "रवाना होना / यात्रा शुरू करना",
      mr: "निघणे / प्रवासाला सुरुवात करणे",
      es: "Ponerse en marcha / Salir de viaje",
      fr: "Prendre la route / Partir",
      ja: "出発する / 旅に出る",
      de: "Sich auf den Weg machen"
    },
    literalTranslations: {
      hi: "सड़क पर मारना",
      mr: "रस्त्यावर मारणे",
      es: "Golpear el camino",
      fr: "Frapper la route",
      ja: "道路を叩く",
      de: "Die Straße schlagen"
    }
  },
  {
    phrase: "Under the weather",
    literalMeaning: "Physically located beneath atmospheric weather",
    actualMeaning: "Feeling slightly unwell, sick, or tired",
    contextualTranslations: {
      hi: "तबीयत थोड़ी नासाज़ होना / बीमार महसूस करना",
      mr: "प्रकृती ठीक नसणे / अस्वस्थ वाटणे",
      es: "Sentirse indispuesto o enfermo",
      fr: "Ne pas être dans son assiette",
      ja: "体調がすぐれない / 少し風邪気味",
      de: "Sich unwohl fühlen"
    },
    literalTranslations: {
      hi: "मौसम के नीचे होना",
      mr: "हवामानाच्या खाली असणे",
      es: "Debajo del clima",
      fr: "Sous la météo",
      ja: "天気の下にある",
      de: "Unter dem Wetter"
    }
  }
];

// Travel Packs Data (Page 11 of PDF)
export const TRAVEL_PACKS: Record<string, TravelCategory[]> = {
  'hi-to-ja': [
    {
      id: 'taxi',
      name: 'Taxi & Rides',
      icon: '🚕',
      phrases: [
        { en: 'Please take me to Tokyo Station.', target: '東京駅までお願いします。', phonetic: 'Tōkyō-eki made onegai shimasu.' },
        { en: 'How much will this ride cost?', target: 'ここまでいくらかかりますか？', phonetic: 'Koko made ikura kakarimasu ka?' },
        { en: 'Please stop here.', target: 'ここで止めてください。', phonetic: 'Koko de tomete kudasai.' },
      ]
    },
    {
      id: 'food',
      name: 'Food & Dining',
      icon: '🍜',
      phrases: [
        { en: 'Is this vegetarian?', target: 'これはベジタリアン用ですか？', phonetic: 'Kore wa bejitarian-yō desu ka?' },
        { en: 'The bill, please.', target: 'お会計をお願いします。', phonetic: 'O-kaikei o onegai shimasu.' },
        { en: 'Water, please.', target: 'お水をお願いします。', phonetic: 'O-mizu o onegai shimasu.' },
        { en: 'It is delicious!', target: 'とても美味しいです！', phonetic: 'Totemo oishii desu!' }
      ]
    },
    {
      id: 'hotel',
      name: 'Hotel & Stay',
      icon: '🏨',
      phrases: [
        { en: 'I have a room reservation.', target: '予約があります。', phonetic: 'Yoyaku ga arimasu.' },
        { en: 'What is the Wi-Fi password?', target: 'Wi-Fiのパスワードは何ですか？', phonetic: 'Waifai no pasuwādo wa nan desu ka?' },
        { en: 'Can I leave my luggage here?', target: '荷物を預かってもらえますか？', phonetic: 'Nimotsu o azukatte moraemasu ka?' }
      ]
    },
    {
      id: 'emergency',
      name: 'Emergency',
      icon: '🚨',
      phrases: [
        { en: 'Where is the nearest hospital?', target: '一番近い病院はどこですか？', phonetic: 'Ichiban chikai byōin wa doko desu ka?' },
        { en: 'Please help me!', target: '助けてください！', phonetic: 'Tasukete kudasai!' },
        { en: 'Call the police, please.', target: '警察を呼んでください。', phonetic: 'Keisatsu o yonde kudasai.' }
      ]
    }
  ],
  'hi-to-es': [
    {
      id: 'taxi',
      name: 'Taxi & Transport',
      icon: '🚕',
      phrases: [
        { en: 'Take me to the airport, please.', target: 'Lléveme al aeropuerto, por favor.', phonetic: 'Yeh-veh-meh ahl ah-eh-roh-pwehr-toh por fah-vor' },
        { en: 'How much is the fare?', target: '¿Cuánto cuesta el viaje?', phonetic: 'Kwan-toh kwehs-tah ehl vyah-heh' }
      ]
    },
    {
      id: 'food',
      name: 'Food & Cafe',
      icon: '🥘',
      phrases: [
        { en: 'A table for two, please.', target: 'Una mesa para dos, por favor.', phonetic: 'Oo-nah meh-sah pah-rah dohs por fah-vor' },
        { en: 'The check, please.', target: 'La cuenta, por favor.', phonetic: 'Lah kwehn-tah por fah-vor' },
        { en: 'Do you have vegetarian food?', target: '¿Tiene comida vegetariana?', phonetic: 'Tyeh-neh koh-mee-dah veh-heh-tah-ryah-nah' }
      ]
    },
    {
      id: 'emergency',
      name: 'Emergency',
      icon: '🚨',
      phrases: [
        { en: 'Where is the hospital?', target: '¿Dónde está el hospital?', phonetic: 'Dohn-deh ehs-tah ehl ohs-pee-tahl' },
        { en: 'I need urgent help!', target: '¡Necesito ayuda urgente!', phonetic: 'Neh-seh-see-toh ah-yoo-dah oor-hehn-teh' }
      ]
    }
  ]
};

// Emergency SOS Phrases (Page 11 & 12 of PDF)
export const EMERGENCY_PHRASES = [
  {
    id: 'help',
    en: 'I need help immediately!',
    translations: {
      hi: 'मुझे तुरंत मदद चाहिए!',
      mr: 'मला तातडीने मदतीची गरज आहे!',
      es: '¡Necesito ayuda inmediata!',
      fr: 'J\'ai besoin d\'aide immédiatement !',
      ja: 'すぐに助けが必要です！',
      de: 'Ich brauche sofort Hilfe!'
    },
    severity: 'critical'
  },
  {
    id: 'ambulance',
    en: 'Please call an ambulance!',
    translations: {
      hi: 'कृपया एम्बुलेंस बुलाइए!',
      mr: 'कृपया रुग्णवाहिका बोलवा!',
      es: '¡Por favor llame a una ambulancia!',
      fr: 'Appelez une ambulance, s\'il vous plaît !',
      ja: '救急車を呼んでください！',
      de: 'Bitte rufen Sie einen Krankenwagen!'
    },
    severity: 'critical'
  },
  {
    id: 'lost',
    en: 'I am lost and need directions.',
    translations: {
      hi: 'मैं रास्ता भटक गया हूँ, मुझे सही रास्ता बताइए।',
      mr: 'मी रस्ता चुकलो आहे, मला मार्ग दाखवा.',
      es: 'Estoy perdido y necesito indicaciones.',
      fr: 'Je suis perdu et j\'ai besoin d\'aide pour trouver mon chemin.',
      ja: '道に迷いました。道を教えてください。',
      de: 'Ich habe mich verirrt und brauche Hilfe.'
    },
    severity: 'high'
  },
  {
    id: 'doctor',
    en: 'I need a doctor right away.',
    translations: {
      hi: 'मुझे तुरंत एक डॉक्टर की ज़रूरत है।',
      mr: 'मला ताबडतोब डॉक्टरांची गरज आहे.',
      es: 'Necesito un médico de inmediato.',
      fr: 'J\'ai besoin d\'un médecin tout de suite.',
      ja: '今すぐ医者が必要です。',
      de: 'Ich brauche sofort einen Arzt.'
    },
    severity: 'critical'
  },
  {
    id: 'police',
    en: 'Please call the police!',
    translations: {
      hi: 'कृपया पुलिस को बुलाएं!',
      mr: 'कृपया पोलिसांना बोलवा!',
      es: '¡Por favor llame a la policía!',
      fr: 'Appelez la police, s\'il vous plaît !',
      ja: '警察を呼んでください！',
      de: 'Bitte rufen Sie die Polizei!'
    },
    severity: 'critical'
  }
];

// Sample Poster/Menu OCR demo items (Pages 3 & 4 of PDF)
export const DEMO_VISION_ITEMS = [
  {
    id: 'mumbai_sign',
    title: 'Railway Signboard (Mumbai Central)',
    badge: 'Signboard',
    imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&auto=format&fit=crop&q=80',
    originalText: 'मुंबई सेंट्रल\nMumbai Central\nप्लॅटफॉर्म क्र. १',
    detectedLanguage: 'mr',
    boxes: [
      { text: 'मुंबई सेंट्रल', translatedText: 'Mumbai Central', bbox: { x0: 20, y0: 25, x1: 75, y1: 45 }, confidence: 98 },
      { text: 'प्लॅटफॉर्म क्र. १', translatedText: 'Platform No. 1', bbox: { x0: 25, y0: 55, x1: 70, y1: 72 }, confidence: 96 }
    ]
  },
  {
    id: 'restaurant_menu',
    title: 'Restaurant Menu (Maharashtrian / Indian)',
    badge: 'Menu',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    originalText: 'मिसळ पाव ₹120\nवडा पाव ₹30\nकांदा पोहे ₹50\nमसाला चहा ₹20',
    detectedLanguage: 'mr',
    boxes: [
      { text: 'मिसळ पाव ₹120', translatedText: 'Misal Pav ₹120', bbox: { x0: 15, y0: 15, x1: 85, y1: 30 }, confidence: 97 },
      { text: 'वडा पाव ₹30', translatedText: 'Vada Pav ₹30', bbox: { x0: 15, y0: 35, x1: 85, y1: 50 }, confidence: 95 },
      { text: 'कांदा पोहे ₹50', translatedText: 'Kanda Poha ₹50', bbox: { x0: 15, y0: 55, x1: 85, y1: 70 }, confidence: 94 },
      { text: 'मसाला चहा ₹20', translatedText: 'Masala Tea ₹20', bbox: { x0: 15, y0: 75, x1: 85, y1: 90 }, confidence: 96 }
    ]
  },
  {
    id: 'spanish_cafe',
    title: 'Spanish Cafe Notice Board',
    badge: 'Poster',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
    originalText: 'Café del Sol\nDesayuno especial: Café con leche y tostada con tomate €4.50\nAbierto todos los días de 8:00 a 20:00',
    detectedLanguage: 'es',
    boxes: [
      { text: 'Café del Sol', translatedText: 'Sun Cafe', bbox: { x0: 25, y0: 18, x1: 75, y1: 32 }, confidence: 99 },
      { text: 'Desayuno especial', translatedText: 'Special Breakfast: Coffee with milk and tomato toast €4.50', bbox: { x0: 10, y0: 40, x1: 90, y1: 60 }, confidence: 94 },
      { text: 'Abierto todos los días', translatedText: 'Open every day from 8:00 to 20:00', bbox: { x0: 15, y0: 70, x1: 85, y1: 85 }, confidence: 95 }
    ]
  }
];

// Mini-Games Data (Pages 8 & 9 of PDF)
export const MINI_GAMES_DATA = {
  wordMatchPairs: [
    { id: '1', en: 'Apple', target: 'Manzana', lang: 'es' },
    { id: '2', en: 'Water', target: 'Agua', lang: 'es' },
    { id: '3', en: 'Sun', target: 'Sol', lang: 'es' },
    { id: '4', en: 'Friend', target: 'Amigo', lang: 'es' },
    { id: '5', en: 'Book', target: 'Libro', lang: 'es' },
    { id: '6', en: 'House', target: 'Casa', lang: 'es' },
  ],
  listeningQuestions: [
    {
      id: 'l1',
      audioText: '¿Dónde está el baño?',
      lang: 'es',
      prompt: 'Listen to the audio clip and select the correct English meaning:',
      options: [
        'Where is the train station?',
        'Where is the restroom / bathroom?',
        'How much is the ticket?',
        'What time does the store close?'
      ],
      correctIndex: 1,
      explanation: '"¿Dónde está el baño?" translates to "Where is the bathroom?" in Spanish.'
    },
    {
      id: 'l2',
      audioText: 'रेलवे स्टेशन कहाँ है?',
      lang: 'hi',
      prompt: 'Listen to the Hindi clip and select the correct English meaning:',
      options: [
        'Where is the railway station?',
        'When will the train arrive?',
        'I want to buy a ticket.',
        'Which platform is this?'
      ],
      correctIndex: 0,
      explanation: '"रेलवे स्टेशन कहाँ है?" means "Where is the railway station?".'
    },
    {
      id: 'l3',
      audioText: 'Arigatō gozaimasu',
      lang: 'ja',
      prompt: 'Listen to the Japanese phrase and choose the correct English meaning:',
      options: [
        'Excuse me',
        'Goodbye',
        'Thank you very much',
        'Good morning'
      ],
      correctIndex: 2,
      explanation: '"Arigatō gozaimasu" is the polite Japanese expression for "Thank you very much".'
    }
  ],
  translationQuestions: [
    {
      id: 't1',
      prompt: 'Translate to Spanish: "Good morning"',
      options: ['Buenas noches', 'Buenos días', 'Gracias', 'Adiós'],
      correctIndex: 1,
      explanation: '"Buenos días" means Good Morning in Spanish.'
    },
    {
      id: 't2',
      prompt: 'Translate to Hindi: "I need to go to college tomorrow."',
      options: [
        'मुझे कल कॉलेज जाना है।',
        'मैं आज कॉलेज जा रहा हूँ।',
        'कॉलेज कहाँ स्थित है?',
        'कल कॉलेज की छुट्टी है।'
      ],
      correctIndex: 0,
      explanation: '"मुझे कल कॉलेज जाना है।" accurately represents "I have/need to go to college tomorrow."'
    },
    {
      id: 't3',
      prompt: 'Translate to Marathi: "How are you?"',
      options: [
        'तुम्ही कसे आहात?',
        'माझं नाव राहुल आहे.',
        'मला पाणी हवे आहे.',
        'पुन्हा भेटूया.'
      ],
      correctIndex: 0,
      explanation: '"तुम्ही कसे आहात?" is the respectful Marathi greeting for "How are you?".'
    }
  ],
  speakingChallenges: [
    {
      id: 's1',
      prompt: 'Say "Good morning, how are you?" in Spanish',
      targetPhrase: 'Buenos días, ¿cómo estás?',
      targetLang: 'es',
      phonetic: 'Bweh-nohs dee-ahs, koh-moh ehs-tahs?',
      hints: 'Use polite friendly tone.'
    },
    {
      id: 's2',
      prompt: 'Say "I want to go to the hospital" in Hindi',
      targetPhrase: 'मुझे अस्पताल जाना है',
      targetLang: 'hi',
      phonetic: 'Mujhe aspatāl jānā hai',
      hints: 'Common phrase for medical assistance.'
    },
    {
      id: 's3',
      prompt: 'Say "Hello, nice to meet you" in French',
      targetPhrase: 'Bonjour, enchanté de vous rencontrer',
      targetLang: 'fr',
      phonetic: 'Bon-zhoor, ahn-shahn-tay deh voo rahn-kohn-tray',
      hints: 'Standard polite French greeting.'
    }
  ]
};

// 1v1 Multiplayer Challenge Pool (Page 9 of PDF)
export const MULTIPLAYER_QUIZ_POOL: QuizQuestion[] = [
  {
    id: 'm1',
    prompt: 'What does "Gracias" mean in Spanish?',
    options: ['Please', 'Thank you', 'Excuse me', 'Hello'],
    correctIndex: 1,
    explanation: 'Gracias = Thank you'
  },
  {
    id: 'm2',
    prompt: 'Which word means "Water" in Hindi?',
    options: ['दूध (Doodh)', 'पानी (Paani)', 'चाय (Chai)', 'रोटी (Roti)'],
    correctIndex: 1,
    explanation: 'पानी = Water'
  },
  {
    id: 'm3',
    prompt: 'How do you say "Goodbye" in Japanese?',
    options: ['Konnichiwa', 'Sayonara', 'Oyasumi', 'Hai'],
    correctIndex: 1,
    explanation: 'Sayonara = Goodbye'
  },
  {
    id: 'm4',
    prompt: 'Translate "Good evening" to French:',
    options: ['Bonjour', 'Bonsoir', 'Bonne nuit', 'Merci'],
    correctIndex: 1,
    explanation: 'Bonsoir = Good evening'
  },
  {
    id: 'm5',
    prompt: 'What is "School" in Marathi?',
    options: ['शाळा (Shala)', 'घर (Ghar)', 'दुकान (Dukan)', 'रस्ता (Rasta)'],
    correctIndex: 0,
    explanation: 'शाळा = School'
  },
  {
    id: 'm6',
    prompt: 'What is the past tense of "Go" in English?',
    options: ['Gone', 'Went', 'Goes', 'Going'],
    correctIndex: 1,
    explanation: 'Went is the simple past tense of Go'
  }
];

// Adaptive Weak Areas Data (Pages 10 & 11 of PDF)
export const ADAPTIVE_CHALLENGES = {
  pastTense: {
    title: '5-Minute Past Tense Challenge',
    area: 'Past Tense Conjugations',
    accuracy: '42%',
    questions: [
      {
        prompt: 'Convert to past tense: "I go to the university"',
        options: ['I went to the university', 'I will go to the university', 'I am going to the university', 'I gone to university'],
        correctIndex: 0,
        explanation: 'Past tense of go is went.'
      },
      {
        prompt: 'In Hindi: "मैं कॉलेज गया था" means:',
        options: ['I will go to college', 'I had gone to college', 'I am at college', 'I like college'],
        correctIndex: 1,
        explanation: 'गया था indicates past perfect.'
      },
      {
        prompt: 'Spanish past tense of "comer" (to eat) for "yo":',
        options: ['Como', 'Comí', 'Comeré', 'Comiendo'],
        correctIndex: 1,
        explanation: 'Yo comí = I ate.'
      }
    ]
  },
  genderAgreement: {
    title: 'Gender Agreement Booster',
    area: 'Grammatical Gender',
    accuracy: '55%',
    questions: [
      {
        prompt: 'In Hindi: "लड़की किताब पढ़ _____ है।" (रही / रहा)',
        options: ['रही', 'रहा', 'रहे', 'हुआ'],
        correctIndex: 0,
        explanation: 'Feminine subject लड़की takes रही.'
      },
      {
        prompt: 'In Spanish: "_____ casa blanca" (El / La)',
        options: ['El', 'La', 'Los', 'Unos'],
        correctIndex: 1,
        explanation: 'Casa is feminine, so it uses article "La".'
      }
    ]
  }
};
