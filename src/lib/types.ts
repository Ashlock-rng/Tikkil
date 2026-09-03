export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  verified: boolean;
  created_at: string;
  followers_count: number;
  is_celebrity: boolean;
  is_adfree: boolean;
  is_admin: boolean;
  stripe_customer_id: string | null;
  preferred_language: string;
  phone: string | null;
  email: string | null;
  password_hash: string | null;
  gift_balance_pending: number;
  gift_balance_available: number;
  ad_revenue_balance: number;
  total_earned: number;
}

export interface Post {
  id: string;
  profile_id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  created_at: string;
  profile?: Profile;
}

export interface Video {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  views: number;
  likes: number;
  duration: string;
  category: string;
  created_at: string;
  profile?: Profile;
}

export interface Reel {
  id: string;
  profile_id: string;
  caption: string;
  video_url: string;
  likes: number;
  comments_count: number;
  shares: number;
  created_at: string;
  profile?: Profile;
}

export interface Status {
  id: string;
  profile_id: string;
  content_type: string;
  media_url: string;
  caption: string;
  views: number;
  created_at: string;
  expires_at: string;
  profile?: Profile;
}

export interface Comment {
  id: string;
  profile_id: string;
  post_id: string | null;
  video_id: string | null;
  reel_id: string | null;
  content: string;
  likes: number;
  created_at: string;
  profile?: Profile;
}

export interface AIChat {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface UserBadge {
  id: string;
  profile_id: string;
  badge_type: "celebrity" | "adfree";
  status: "pending" | "approved" | "rejected";
  stripe_payment_id: string | null;
  amount_paid: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  profile?: Profile;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected" | "reported";
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface LiveStream {
  id: string;
  host_id: string;
  title: string;
  description: string;
  stream_url: string;
  viewer_count: number;
  is_active: boolean;
  created_at: string;
  host?: Profile;
}

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  image_url: string;
  target_url: string;
  ad_type: "display" | "video" | "skippable";
  duration_seconds: number;
  is_active: boolean;
  created_at: string;
}

export interface AdminAction {
  id: string;
  admin_id: string | null;
  action: string;
  target_profile_id: string | null;
  target_badge_id: string | null;
  notes: string;
  created_at: string;
  admin?: Profile;
}

export interface AdminStats {
  totalBadges: number;
  totalUsers: number;
  pendingBadges: number;
  activeLiveStreams: number;
}

export interface LiveGift {
  id: string;
  stream_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  platform_share: number;
  receiver_share: number;
  status: "holding" | "released" | "paid_out";
  released_at: string | null;
  created_at: string;
  sender?: Profile;
}

export interface Payout {
  id: string;
  profile_id: string;
  payout_date: string;
  ad_revenue: number;
  gift_earnings: number;
  total_amount: number;
  status: "scheduled" | "processing" | "completed" | "failed";
  created_at: string;
}

export type TabKey = "home" | "watch" | "reels" | "status" | "ai" | "dm" | "live" | "admin" | "wallet";

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    home: "Home", watch: "Watch", reels: "Reels", status: "Status", ai: "AI",
    dm: "Messages", live: "Live", admin: "Admin",
    post: "Post", like: "Like", comment: "Comment", share: "Share",
    follow: "Follow", following: "Following",
    search: "Search", settings: "Settings", language: "Language",
    celebrity_badge: "Celebrity Badge", adfree_badge: "Ad-Free Badge",
    verify: "Verify", go_live: "Go Live", end_stream: "End Stream",
    viewers: "Viewers", send: "Send", accept: "Accept", reject: "Reject",
    report: "Report", pending: "Pending", approved: "Approved", rejected: "Rejected",
    approve: "Approve", total_users: "Total Users", total_badges: "Total Badges",
    pending_badges: "Pending Badges", active_streams: "Active Streams",
    add_friend: "Add Friend", message: "Message", type_message: "Type a message...",
    skip_ad: "Skip Ad", ad: "Advertisement", sponsored: "Sponsored",
    wallet: "Wallet", gift: "Gift", send_gift: "Send Gift", balance: "Balance",
    withdraw: "Withdraw", pending_balance: "Pending Balance", available_balance: "Available Balance",
    ad_revenue: "Ad Revenue", total_earned: "Total Earned", payout_history: "Payout History",
    next_payout: "Next Payout", gifts_received: "Gifts Received", sign_up: "Sign Up", log_in: "Log In",
    phone: "Phone", email: "Email", password: "Password", username: "Username", display_name: "Display Name",
    create_account: "Create Account", already_have_account: "Already have an account?",
    new_to_tikkil: "New to Tikkil?", log_in_btn: "Log In", sign_up_btn: "Sign Up",
  },
  es: {
    home: "Inicio", watch: "Ver", reels: "Reels", status: "Estado", ai: "IA",
    dm: "Mensajes", live: "En Vivo", admin: "Admin",
    post: "Publicar", like: "Me gusta", comment: "Comentar", share: "Compartir",
    follow: "Seguir", following: "Siguiendo",
    search: "Buscar", settings: "Ajustes", language: "Idioma",
    celebrity_badge: "Insignia Celebridad", adfree_badge: "Insignia Sin Anuncios",
    verify: "Verificar", go_live: "Transmitir", end_stream: "Terminar",
    viewers: "Espectadores", send: "Enviar", accept: "Aceptar", reject: "Rechazar",
    report: "Reportar", pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado",
    approve: "Aprobar", total_users: "Usuarios Totales", total_badges: "Insignias Totales",
    pending_badges: "Insignias Pendientes", active_streams: "Transmisiones Activas",
    add_friend: "Agregar Amigo", message: "Mensaje", type_message: "Escribe un mensaje...",
    skip_ad: "Saltar Anuncio", ad: "Anuncio", sponsored: "Patrocinado",
    wallet: "Cartera", gift: "Regalo", send_gift: "Enviar Regalo", balance: "Saldo",
    withdraw: "Retirar", pending_balance: "Saldo Pendiente", available_balance: "Saldo Disponible",
    ad_revenue: "Ingresos por Anuncios", total_earned: "Total Ganado", payout_history: "Historial de Pagos",
    next_payout: "Próximo Pago", gifts_received: "Regalos Recibidos", sign_up: "Registrarse", log_in: "Iniciar Sesión",
    phone: "Teléfono", email: "Correo", password: "Contraseña", username: "Usuario", display_name: "Nombre",
    create_account: "Crear Cuenta", already_have_account: "¿Ya tienes cuenta?",
    new_to_tikkil: "¿Nuevo en Tikkil?", log_in_btn: "Iniciar Sesión", sign_up_btn: "Registrarse",
  },
  fr: {
    home: "Accueil", watch: "Regarder", reels: "Reels", status: "Statut", ai: "IA",
    dm: "Messages", live: "Direct", admin: "Admin",
    post: "Publier", like: "J'aime", comment: "Commenter", share: "Partager",
    follow: "Suivre", following: "Suivi",
    search: "Rechercher", settings: "Paramètres", language: "Langue",
    celebrity_badge: "Badge Célébrité", adfree_badge: "Badge Sans Pub",
    verify: "Vérifier", go_live: "En Direct", end_stream: "Terminer",
    viewers: "Spectateurs", send: "Envoyer", accept: "Accepter", reject: "Rejeter",
    report: "Signaler", pending: "En attente", approved: "Approuvé", rejected: "Rejeté",
    approve: "Approuver", total_users: "Utilisateurs", total_badges: "Badges",
    pending_badges: "Badges en Attente", active_streams: "Streams Actifs",
    add_friend: "Ajouter Ami", message: "Message", type_message: "Tapez un message...",
    skip_ad: "Passer Pub", ad: "Publicité", sponsored: "Sponsorisé",
    wallet: "Portefeuille", gift: "Cadeau", send_gift: "Envoyer Cadeau", balance: "Solde",
    withdraw: "Retirer", pending_balance: "Solde en Attente", available_balance: "Solde Disponible",
    ad_revenue: "Revenus Publicitaires", total_earned: "Total Gagné", payout_history: "Historique des Paiements",
    next_payout: "Prochain Paiement", gifts_received: "Cadeaux Reçus", sign_up: "S'inscrire", log_in: "Connexion",
    phone: "Téléphone", email: "Email", password: "Mot de passe", username: "Nom d'utilisateur", display_name: "Nom",
    create_account: "Créer un Compte", already_have_account: "Vous avez déjà un compte?",
    new_to_tikkil: "Nouveau sur Tikkil?", log_in_btn: "Connexion", sign_up_btn: "S'inscrire",
  },
  de: {
    home: "Startseite", watch: "Ansehen", reels: "Reels", status: "Status", ai: "KI",
    dm: "Nachrichten", live: "Live", admin: "Admin",
    post: "Posten", like: "Gefällt mir", comment: "Kommentar", share: "Teilen",
    follow: "Folgen", following: "Folge ich",
    search: "Suche", settings: "Einstellungen", language: "Sprache",
    celebrity_badge: "Promi-Abzeichen", adfree_badge: "Werbefrei-Abzeichen",
    verify: "Verifizieren", go_live: "Live gehen", end_stream: "Beenden",
    viewers: "Zuschauer", send: "Senden", accept: "Annehmen", reject: "Ablehnen",
    report: "Melden", pending: "Ausstehend", approved: "Genehmigt", rejected: "Abgelehnt",
    approve: "Genehmigen", total_users: "Benutzer", total_badges: "Abzeichen",
    pending_badges: "Ausstehende Abzeichen", active_streams: "Aktive Streams",
    add_friend: "Freund Hinzufügen", message: "Nachricht", type_message: "Nachricht schreiben...",
    skip_ad: "Werbung Überspringen", ad: "Werbung", sponsored: "Gesponsert",
    wallet: "Geldbeutel", gift: "Geschenk", send_gift: "Geschenk Senden", balance: "Guthaben",
    withdraw: "Abheben", pending_balance: "Ausstehendes Guthaben", available_balance: "Verfügbares Guthaben",
    ad_revenue: "Werbeeinnahmen", total_earned: "Gesamtverdienst", payout_history: "Auszahlungshistorie",
    next_payout: "Nächste Auszahlung", gifts_received: "Erhaltene Geschenke", sign_up: "Registrieren", log_in: "Anmelden",
    phone: "Telefon", email: "E-Mail", password: "Passwort", username: "Benutzername", display_name: "Name",
    create_account: "Konto Erstellen", already_have_account: "Bereits registriert?",
    new_to_tikkil: "Neu bei Tikkil?", log_in_btn: "Anmelden", sign_up_btn: "Registrieren",
  },
  pt: {
    home: "Início", watch: "Assistir", reels: "Reels", status: "Status", ai: "IA",
    dm: "Mensagens", live: "Ao Vivo", admin: "Admin",
    post: "Postar", like: "Curtir", comment: "Comentar", share: "Compartilhar",
    follow: "Seguir", following: "Seguindo",
    search: "Buscar", settings: "Configurações", language: "Idioma",
    celebrity_badge: "Distintivo Celebridade", adfree_badge: "Distintivo Sem Anúncios",
    verify: "Verificar", go_live: "Ir ao Vivo", end_stream: "Encerrar",
    viewers: "Espectadores", send: "Enviar", accept: "Aceitar", reject: "Rejeitar",
    report: "Denunciar", pending: "Pendente", approved: "Aprovado", rejected: "Rejeitado",
    approve: "Aprovar", total_users: "Usuários", total_badges: "Distintivos",
    pending_badges: "Distintivos Pendentes", active_streams: "Streams Ativos",
    add_friend: "Adicionar Amigo", message: "Mensagem", type_message: "Digite uma mensagem...",
    skip_ad: "Pular Anúncio", ad: "Anúncio", sponsored: "Patrocinado",
    wallet: "Carteira", gift: "Presente", send_gift: "Enviar Presente", balance: "Saldo",
    withdraw: "Sacar", pending_balance: "Saldo Pendente", available_balance: "Saldo Disponível",
    ad_revenue: "Receita de Anúncios", total_earned: "Total Ganho", payout_history: "Histórico de Pagamentos",
    next_payout: "Próximo Pagamento", gifts_received: "Presentes Recebidos", sign_up: "Cadastrar", log_in: "Entrar",
    phone: "Telefone", email: "Email", password: "Senha", username: "Usuário", display_name: "Nome",
    create_account: "Criar Conta", already_have_account: "Já tem conta?",
    new_to_tikkil: "Novo no Tikkil?", log_in_btn: "Entrar", sign_up_btn: "Cadastrar",
  },
  ar: {
    home: "الرئيسية", watch: "مشاهدة", reels: "ريلز", status: "الحالة", ai: "الذكاء",
    dm: "الرسائل", live: "مباشر", admin: "الإدارة",
    post: "نشر", like: "إعجاب", comment: "تعليق", share: "مشاركة",
    follow: "متابعة", following: "يتابع",
    search: "بحث", settings: "الإعدادات", language: "اللغة",
    celebrity_badge: "شارة المشاهير", adfree_badge: "شارة بدون إعلانات",
    verify: "توثيق", go_live: "بث مباشر", end_stream: "إنهاء",
    viewers: "المشاهدون", send: "إرسال", accept: "قبول", reject: "رفض",
    report: "إبلاغ", pending: "قيد الانتظار", approved: "موافق", rejected: "مرفوض",
    approve: "موافقة", total_users: "المستخدمون", total_badges: "الشارات",
    pending_badges: "شارات معلقة", active_streams: "بثوث نشطة",
    add_friend: "إضافة صديق", message: "رسالة", type_message: "اكتب رسالة...",
    skip_ad: "تخطي الإعلان", ad: "إعلان", sponsored: "ممول",
    wallet: "المحفظة", gift: "هدية", send_gift: "إرسال هدية", balance: "الرصيد",
    withdraw: "سحب", pending_balance: "رصيد معلق", available_balance: "رصيد متاح",
    ad_revenue: "إيرادات الإعلانات", total_earned: "إجمالي الأرباح", payout_history: "سجل المدفوعات",
    next_payout: "الدفع القادم", gifts_received: "الهدايا المستلمة", sign_up: "تسجيل", log_in: "دخول",
    phone: "هاتف", email: "بريد", password: "كلمة المرور", username: "اسم المستخدم", display_name: "الاسم",
    create_account: "إنشاء حساب", already_have_account: "لديك حساب بالفعل؟",
    new_to_tikkil: "جديد في Tikkil?", log_in_btn: "دخول", sign_up_btn: "تسجيل",
  },
  hi: {
    home: "होम", watch: "देखें", reels: "रील्स", status: "स्टेटस", ai: "एआई",
    dm: "संदेश", live: "लाइव", admin: "एडमिन",
    post: "पोस्ट", like: "पसंद", comment: "टिप्पणी", share: "शेयर",
    follow: "फॉलो", following: "फॉलोिंग",
    search: "खोज", settings: "सेटिंग्स", language: "भाषा",
    celebrity_badge: "सेलिब्रिटी बैज", adfree_badge: "विज्ञापन-मुक्त बैज",
    verify: "सत्यापित", go_live: "लाइव जाएं", end_stream: "समाप्त",
    viewers: "दर्शक", send: "भेजें", accept: "स्वीकार", reject: "अस्वीकार",
    report: "रिपोर्ट", pending: "लंबित", approved: "स्वीकृत", rejected: "अस्वीकृत",
    approve: "स्वीकार", total_users: "कुल उपयोगकर्ता", total_badges: "कुल बैज",
    pending_badges: "लंबित बैज", active_streams: "सक्रिय स्ट्रीम",
    add_friend: "दोस्त जोड़ें", message: "संदेश", type_message: "संदेश लिखें...",
    skip_ad: "विज्ञापन छोड़ें", ad: "विज्ञापन", sponsored: "प्रायोजित",
    wallet: "वॉलेट", gift: "उपहार", send_gift: "उपहार भेजें", balance: "शेष",
    withdraw: "निकासी", pending_balance: "लंबित शेष", available_balance: "उपलब्ध शेष",
    ad_revenue: "विज्ञापन आय", total_earned: "कुल कमाई", payout_history: "भुगतान इतिहास",
    next_payout: "अगला भुगतान", gifts_received: "प्राप्त उपहार", sign_up: "साइन अप", log_in: "लॉग इन",
    phone: "फोन", email: "ईमेल", password: "पासवर्ड", username: "यूजरनेम", display_name: "नाम",
    create_account: "खाता बनाएं", already_have_account: "पहले से खाता है?",
    new_to_tikkil: "Tikkil पर नए?", log_in_btn: "लॉग इन", sign_up_btn: "साइन अप",
  },
  zh: {
    home: "首页", watch: "观看", reels: "短视频", status: "状态", ai: "AI",
    dm: "消息", live: "直播", admin: "管理",
    post: "发布", like: "赞", comment: "评论", share: "分享",
    follow: "关注", following: "已关注",
    search: "搜索", settings: "设置", language: "语言",
    celebrity_badge: "名人徽章", adfree_badge: "免广告徽章",
    verify: "认证", go_live: "开始直播", end_stream: "结束直播",
    viewers: "观众", send: "发送", accept: "接受", reject: "拒绝",
    report: "举报", pending: "待处理", approved: "已批准", rejected: "已拒绝",
    approve: "批准", total_users: "总用户", total_badges: "总徽章",
    pending_badges: "待处理徽章", active_streams: "活跃直播",
    add_friend: "添加好友", message: "消息", type_message: "输入消息...",
    skip_ad: "跳过广告", ad: "广告", sponsored: "赞助",
    wallet: "钱包", gift: "礼物", send_gift: "发送礼物", balance: "余额",
    withdraw: "提现", pending_balance: "待处理余额", available_balance: "可用余额",
    ad_revenue: "广告收入", total_earned: "总收入", payout_history: "付款历史",
    next_payout: "下次付款", gifts_received: "收到的礼物", sign_up: "注册", log_in: "登录",
    phone: "手机", email: "邮箱", password: "密码", username: "用户名", display_name: "显示名称",
    create_account: "创建账户", already_have_account: "已有账户?",
    new_to_tikkil: "Tikkil 新用户?", log_in_btn: "登录", sign_up_btn: "注册",
  },
  ja: {
    home: "ホーム", watch: "視聴", reels: "リール", status: "ステータス", ai: "AI",
    dm: "メッセージ", live: "ライブ", admin: "管理",
    post: "投稿", like: "いいね", comment: "コメント", share: "共有",
    follow: "フォロー", following: "フォロー中",
    search: "検索", settings: "設定", language: "言語",
    celebrity_badge: "セレブバッジ", adfree_badge: "広告なしバッジ",
    verify: "認証", go_live: "ライブ開始", end_stream: "終了",
    viewers: "視聴者", send: "送信", accept: "承認", reject: "拒否",
    report: "報告", pending: "保留中", approved: "承認済", rejected: "拒否済",
    approve: "承認", total_users: "総ユーザー数", total_badges: "総バッジ数",
    pending_badges: "保留中バッジ", active_streams: "アクティブ配信",
    add_friend: "友達追加", message: "メッセージ", type_message: "メッセージを入力...",
    skip_ad: "広告をスキップ", ad: "広告", sponsored: "スポンサー",
    wallet: "ウォレット", gift: "ギフト", send_gift: "ギフトを送信", balance: "残高",
    withdraw: "出金", pending_balance: "保留残高", available_balance: "利用可能残高",
    ad_revenue: "広告収入", total_earned: "総収益", payout_history: "支払い履歴",
    next_payout: "次回支払い", gifts_received: "受け取ったギフト", sign_up: "登録", log_in: "ログイン",
    phone: "電話", email: "メール", password: "パスワード", username: "ユーザー名", display_name: "名前",
    create_account: "アカウント作成", already_have_account: "既にアカウントをお持ちですか?",
    new_to_tikkil: "Tikkil初めてですか?", log_in_btn: "ログイン", sign_up_btn: "登録",
  },
  ko: {
    home: "홈", watch: "시청", reels: "릴스", status: "상태", ai: "AI",
    dm: "메시지", live: "라이브", admin: "관리",
    post: "게시", like: "좋아요", comment: "댓글", share: "공유",
    follow: "팔로우", following: "팔로잉",
    search: "검색", settings: "설정", language: "언어",
    celebrity_badge: "셀럽 배지", adfree_badge: "광고 없음 배지",
    verify: "인증", go_live: "라이브 시작", end_stream: "종료",
    viewers: "시청자", send: "전송", accept: "수락", reject: "거절",
    report: "신고", pending: "대기 중", approved: "승인됨", rejected: "거절됨",
    approve: "승인", total_users: "총 사용자", total_badges: "총 배지",
    pending_badges: "대기 중 배지", active_streams: "활성 스트림",
    add_friend: "친구 추가", message: "메시지", type_message: "메시지 입력...",
    skip_ad: "광고 건너뛰기", ad: "광고", sponsored: "스폰서",
    wallet: "지갑", gift: "선물", send_gift: "선물 보내기", balance: "잔액",
    withdraw: "출금", pending_balance: "대기 중 잔액", available_balance: "사용 가능 잔액",
    ad_revenue: "광고 수익", total_earned: "총 수익", payout_history: "지급 내역",
    next_payout: "다음 지급", gifts_received: "받은 선물", sign_up: "가입", log_in: "로그인",
    phone: "전화", email: "이메일", password: "비밀번호", username: "사용자명", display_name: "이름",
    create_account: "계정 만들기", already_have_account: "이미 계정이 있으신가요?",
    new_to_tikkil: "Tikkil이 처음이신가요?", log_in_btn: "로그인", sign_up_btn: "가입",
  },
};
