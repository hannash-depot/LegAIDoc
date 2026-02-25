import { TERMS_VERSION } from "@/lib/legal/policy";

type Locale = "he" | "ar" | "en" | "ru";

interface Section {
  title: string;
  points: string[];
}

interface TermsContent {
  title: string;
  subtitle: string;
  lastUpdated: string;
  disclaimer: string;
  sections: Section[];
}

const TERMS_CONTENT: Record<Locale, TermsContent> = {
  en: {
    title: "Terms of Service",
    subtitle:
      "These terms govern your use of LegAIDoc and the document generation service.",
    lastUpdated: "Last updated",
    disclaimer:
      "LegAIDoc provides document templates and automation tools. It is not a law firm and does not provide legal advice.",
    sections: [
      {
        title: "1. Eligibility and accounts",
        points: [
          "You must provide accurate registration details and keep your login credentials secure.",
          "You are responsible for all activity performed through your account.",
        ],
      },
      {
        title: "2. Acceptable use",
        points: [
          "Do not use the service for unlawful, fraudulent, or abusive activities.",
          "Do not attempt to overload, disrupt, or reverse engineer the platform.",
        ],
      },
      {
        title: "3. Legal disclaimer",
        points: [
          "Generated documents are provided as templates and may not fit every case.",
          "You should consult a qualified lawyer before signing or relying on legal documents.",
        ],
      },
      {
        title: "4. Availability and changes",
        points: [
          "We may update, suspend, or change product features to improve security and reliability.",
          "Material changes to legal terms may require re-acceptance.",
        ],
      },
      {
        title: "5. Liability",
        points: [
          "To the maximum extent permitted by law, the service is provided 'as is'.",
          "LegAIDoc is not liable for indirect or consequential damages arising from use of generated documents.",
        ],
      },
      {
        title: "6. Contact",
        points: ["For legal or account questions, contact: support@legaidoc.com"],
      },
    ],
  },
  he: {
    title: "תנאי שימוש",
    subtitle:
      "תנאים אלה מסדירים את השימוש שלך ב-LegAIDoc ובשירות יצירת המסמכים.",
    lastUpdated: "עודכן לאחרונה",
    disclaimer:
      "LegAIDoc מספקת תבניות וכלי אוטומציה למסמכים. השירות אינו משרד עורכי דין ואינו מעניק ייעוץ משפטי.",
    sections: [
      {
        title: "1. זכאות וחשבון משתמש",
        points: [
          "עליך לספק פרטי הרשמה מדויקים ולשמור על סודיות פרטי ההתחברות.",
          "את/ה אחראי/ת לכל פעילות שמבוצעת דרך החשבון שלך.",
        ],
      },
      {
        title: "2. שימוש מותר",
        points: [
          "אין להשתמש בשירות לפעילות בלתי חוקית, הונאה או ניצול לרעה.",
          "אין לנסות לשבש את המערכת, להעמיס עליה או לבצע הנדסה לאחור.",
        ],
      },
      {
        title: "3. הסתייגות משפטית",
        points: [
          "המסמכים שנוצרים הם תבניות כלליות וייתכן שאינם מתאימים לכל מקרה.",
          "מומלץ להתייעץ עם עורך דין מוסמך לפני חתימה או הסתמכות על המסמכים.",
        ],
      },
      {
        title: "4. זמינות ושינויים",
        points: [
          "ייתכן שנעדכן או נשנה תכונות לצורך שיפור אבטחה ואמינות.",
          "שינויים מהותיים בתנאים עשויים לדרוש אישור מחדש מצד המשתמשים.",
        ],
      },
      {
        title: "5. אחריות",
        points: [
          "בכפוף לדין החל, השירות מסופק כפי שהוא.",
          "LegAIDoc לא תישא באחריות לנזקים עקיפים או תוצאתיים הנובעים מהשימוש במסמכים.",
        ],
      },
      {
        title: "6. יצירת קשר",
        points: ["לשאלות משפטיות או שאלות חשבון: support@legaidoc.com"],
      },
    ],
  },
  ar: {
    title: "شروط الاستخدام",
    subtitle: "تنظم هذه الشروط استخدامك لـ LegAIDoc وخدمة إنشاء المستندات.",
    lastUpdated: "آخر تحديث",
    disclaimer:
      "يوفر LegAIDoc قوالب وأدوات أتمتة للمستندات، وليس مكتب محاماة ولا يقدم استشارة قانونية.",
    sections: [
      {
        title: "1. الأهلية والحساب",
        points: [
          "يجب تقديم معلومات تسجيل دقيقة والحفاظ على سرية بيانات الدخول.",
          "أنت مسؤول/ة عن جميع الأنشطة التي تتم عبر حسابك.",
        ],
      },
      {
        title: "2. الاستخدام المقبول",
        points: [
          "يُمنع استخدام الخدمة في أنشطة غير قانونية أو احتيالية أو مسيئة.",
          "يُمنع محاولة تعطيل المنصة أو تحميلها بشكل مفرط أو إجراء هندسة عكسية.",
        ],
      },
      {
        title: "3. إخلاء المسؤولية القانونية",
        points: [
          "المستندات الناتجة هي قوالب وقد لا تناسب جميع الحالات.",
          "يُنصح باستشارة محامٍ مؤهل قبل التوقيع أو الاعتماد على أي مستند قانوني.",
        ],
      },
      {
        title: "4. التوفر والتغييرات",
        points: [
          "قد نقوم بتحديث أو تعليق بعض الميزات لتحسين الأمان والموثوقية.",
          "قد تتطلب التغييرات الجوهرية في الشروط موافقة جديدة من المستخدم.",
        ],
      },
      {
        title: "5. المسؤولية",
        points: [
          "تُقدم الخدمة \"كما هي\" ضمن الحدود التي يسمح بها القانون.",
          "لا يتحمل LegAIDoc المسؤولية عن الأضرار غير المباشرة أو التبعية الناتجة عن استخدام المستندات.",
        ],
      },
      {
        title: "6. التواصل",
        points: ["للاستفسارات القانونية أو المتعلقة بالحساب: support@legaidoc.com"],
      },
    ],
  },
  ru: {
    title: "Условия использования",
    subtitle:
      "Настоящие условия регулируют использование LegAIDoc и сервиса генерации документов.",
    lastUpdated: "Последнее обновление",
    disclaimer:
      "LegAIDoc предоставляет шаблоны и инструменты автоматизации документов. Сервис не является юридической фирмой и не дает юридических консультаций.",
    sections: [
      {
        title: "1. Регистрация и аккаунт",
        points: [
          "Вы обязаны указывать достоверные данные при регистрации и хранить пароль в безопасности.",
          "Вы несете ответственность за действия, совершенные через ваш аккаунт.",
        ],
      },
      {
        title: "2. Допустимое использование",
        points: [
          "Запрещено использовать сервис для незаконных, мошеннических или злоупотребляющих действий.",
          "Запрещено пытаться нарушать работу платформы, перегружать ее или выполнять реверс-инжиниринг.",
        ],
      },
      {
        title: "3. Юридическое предупреждение",
        points: [
          "Сгенерированные документы являются шаблонами и могут не подходить для всех ситуаций.",
          "Перед подписанием или использованием документа рекомендуется консультация с юристом.",
        ],
      },
      {
        title: "4. Доступность и изменения",
        points: [
          "Мы можем обновлять, изменять или временно ограничивать функции для повышения безопасности и надежности.",
          "Существенные изменения условий могут потребовать повторного согласия.",
        ],
      },
      {
        title: "5. Ответственность",
        points: [
          "В максимально допустимой законом степени сервис предоставляется «как есть».",
          "LegAIDoc не несет ответственности за косвенные или последующие убытки от использования документов.",
        ],
      },
      {
        title: "6. Контакты",
        points: ["По вопросам аккаунта и правовых условий: support@legaidoc.com"],
      },
    ],
  },
};

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const selectedLocale = (locale in TERMS_CONTENT ? locale : "en") as Locale;
  const content = TERMS_CONTENT[selectedLocale];

  return (
    <main className="py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white border border-border rounded-2xl p-8 md:p-10">
        <h1 className="text-3xl font-bold text-text mb-2">{content.title}</h1>
        <p className="text-text-secondary mb-2">{content.subtitle}</p>
        <p className="text-sm text-text-muted mb-8">
          {content.lastUpdated}: {TERMS_VERSION}
        </p>

        <div className="mb-8 p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm">
          {content.disclaimer}
        </div>

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
