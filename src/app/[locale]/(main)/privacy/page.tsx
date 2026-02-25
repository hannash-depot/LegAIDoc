import { PRIVACY_VERSION } from "@/lib/legal/policy";

type Locale = "he" | "ar" | "en" | "ru";

interface Section {
  title: string;
  points: string[];
}

interface PrivacyContent {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: Section[];
}

const PRIVACY_CONTENT: Record<Locale, PrivacyContent> = {
  en: {
    title: "Privacy Policy",
    subtitle:
      "This policy explains what data we collect and how we use it to operate LegAIDoc.",
    lastUpdated: "Last updated",
    sections: [
      {
        title: "1. Data we collect",
        points: [
          "Account details such as name, email, and authentication metadata.",
          "Document data you enter while using templates and the wizard.",
          "Technical logs such as request timestamps, route activity, and security events.",
        ],
      },
      {
        title: "2. How we use data",
        points: [
          "To authenticate users and secure accounts.",
          "To generate, save, and export your legal documents.",
          "To detect abuse, prevent fraud, and improve platform reliability.",
        ],
      },
      {
        title: "3. Data retention",
        points: [
          "We retain account and document data while your account remains active.",
          "Security logs may be retained for a limited period for abuse prevention and audit purposes.",
        ],
      },
      {
        title: "4. Data sharing",
        points: [
          "We do not sell your personal data.",
          "We may share data with infrastructure providers strictly required to run the service (hosting, database, email delivery).",
        ],
      },
      {
        title: "5. Security",
        points: [
          "Passwords are stored as hashed values.",
          "Rate limiting and access controls are used to protect against abuse.",
        ],
      },
      {
        title: "6. Your rights",
        points: [
          "You can request access, correction, or deletion of your account data, subject to legal obligations.",
          "Contact us for privacy requests: support@legaidoc.com",
        ],
      },
    ],
  },
  he: {
    title: "מדיניות פרטיות",
    subtitle: "מדיניות זו מסבירה איזה מידע אנו אוספים וכיצד אנו משתמשים בו ב-LegAIDoc.",
    lastUpdated: "עודכן לאחרונה",
    sections: [
      {
        title: "1. מידע שאנו אוספים",
        points: [
          "פרטי חשבון כגון שם, דוא״ל ונתוני אימות.",
          "מידע שמוזן למסמכים בעת השימוש בתבניות ובאשף.",
          "לוגים טכניים כגון זמני בקשות, פעילות במסלולים ואירועי אבטחה.",
        ],
      },
      {
        title: "2. שימוש במידע",
        points: [
          "לצורך אימות משתמשים ואבטחת חשבונות.",
          "ליצירה, שמירה וייצוא של המסמכים שלך.",
          "לזיהוי שימוש לרעה, מניעת הונאה ושיפור אמינות המערכת.",
        ],
      },
      {
        title: "3. שמירת מידע",
        points: [
          "מידע חשבון ומסמכים נשמר כל עוד החשבון פעיל.",
          "לוגים אבטחתיים עשויים להישמר לתקופה מוגבלת לצורכי הגנה ובקרה.",
        ],
      },
      {
        title: "4. שיתוף מידע",
        points: [
          "איננו מוכרים מידע אישי.",
          "ייתכן שיתוף עם ספקי תשתית הנדרשים להפעלת השירות (אירוח, מסד נתונים, דוא״ל).",
        ],
      },
      {
        title: "5. אבטחה",
        points: [
          "סיסמאות נשמרות בצורה מוצפנת (Hash).",
          "מיושמים מנגנוני הגבלת קצב ובקרות גישה להגנה מפני ניצול לרעה.",
        ],
      },
      {
        title: "6. הזכויות שלך",
        points: [
          "ניתן לבקש גישה, תיקון או מחיקה של נתוני החשבון בכפוף לחובות הדין.",
          "לפניות פרטיות: support@legaidoc.com",
        ],
      },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    subtitle: "توضح هذه السياسة ما هي البيانات التي نجمعها وكيف نستخدمها في LegAIDoc.",
    lastUpdated: "آخر تحديث",
    sections: [
      {
        title: "1. البيانات التي نجمعها",
        points: [
          "بيانات الحساب مثل الاسم والبريد الإلكتروني وبيانات المصادقة.",
          "البيانات التي تدخلها في المستندات أثناء استخدام القوالب والمعالج.",
          "سجلات تقنية مثل أوقات الطلبات ونشاط المسارات وأحداث الأمان.",
        ],
      },
      {
        title: "2. كيفية استخدام البيانات",
        points: [
          "لمصادقة المستخدمين وحماية الحسابات.",
          "لإنشاء المستندات وحفظها وتصديرها.",
          "لاكتشاف إساءة الاستخدام ومنع الاحتيال وتحسين موثوقية الخدمة.",
        ],
      },
      {
        title: "3. الاحتفاظ بالبيانات",
        points: [
          "نحتفظ ببيانات الحساب والمستندات طالما أن الحساب نشط.",
          "قد يتم الاحتفاظ بسجلات الأمان لفترة محدودة لأغراض الحماية والتدقيق.",
        ],
      },
      {
        title: "4. مشاركة البيانات",
        points: [
          "لا نقوم ببيع البيانات الشخصية.",
          "قد نشارك البيانات مع مزودي البنية التحتية اللازمين لتشغيل الخدمة (الاستضافة، قاعدة البيانات، البريد الإلكتروني).",
        ],
      },
      {
        title: "5. الأمان",
        points: [
          "يتم حفظ كلمات المرور بصيغة مُشفّرة (Hash).",
          "يتم تطبيق تحديد معدل الطلبات وضوابط الوصول للحماية من إساءة الاستخدام.",
        ],
      },
      {
        title: "6. حقوقك",
        points: [
          "يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها وفق المتطلبات القانونية.",
          "لطلبات الخصوصية: support@legaidoc.com",
        ],
      },
    ],
  },
  ru: {
    title: "Политика конфиденциальности",
    subtitle:
      "Эта политика объясняет, какие данные мы собираем и как используем их в LegAIDoc.",
    lastUpdated: "Последнее обновление",
    sections: [
      {
        title: "1. Какие данные мы собираем",
        points: [
          "Данные аккаунта: имя, email и сведения об аутентификации.",
          "Данные документов, которые вы вводите при работе с шаблонами и мастером.",
          "Технические журналы: время запросов, активность маршрутов, события безопасности.",
        ],
      },
      {
        title: "2. Как мы используем данные",
        points: [
          "Для аутентификации пользователей и защиты аккаунтов.",
          "Для создания, хранения и экспорта ваших документов.",
          "Для выявления злоупотреблений, предотвращения мошенничества и повышения надежности сервиса.",
        ],
      },
      {
        title: "3. Срок хранения данных",
        points: [
          "Данные аккаунта и документов хранятся, пока ваш аккаунт активен.",
          "Журналы безопасности могут храниться ограниченный период для аудита и защиты.",
        ],
      },
      {
        title: "4. Передача данных",
        points: [
          "Мы не продаем персональные данные.",
          "Данные могут передаваться инфраструктурным провайдерам, необходимым для работы сервиса (хостинг, база данных, email).",
        ],
      },
      {
        title: "5. Безопасность",
        points: [
          "Пароли хранятся в виде хэшей.",
          "Для защиты от злоупотреблений используются ограничения частоты запросов и контроль доступа.",
        ],
      },
      {
        title: "6. Ваши права",
        points: [
          "Вы можете запросить доступ, исправление или удаление данных аккаунта с учетом юридических обязательств.",
          "Запросы по конфиденциальности: support@legaidoc.com",
        ],
      },
    ],
  },
};

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const selectedLocale = (locale in PRIVACY_CONTENT ? locale : "en") as Locale;
  const content = PRIVACY_CONTENT[selectedLocale];

  return (
    <main className="py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white border border-border rounded-2xl p-8 md:p-10">
        <h1 className="text-3xl font-bold text-text mb-2">{content.title}</h1>
        <p className="text-text-secondary mb-2">{content.subtitle}</p>
        <p className="text-sm text-text-muted mb-8">
          {content.lastUpdated}: {PRIVACY_VERSION}
        </p>

        <div className="space-y-8">
          {content.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-text mb-3">
                {section.title}
              </h2>
              <ul className="list-disc ps-5 space-y-2 text-text-secondary">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
