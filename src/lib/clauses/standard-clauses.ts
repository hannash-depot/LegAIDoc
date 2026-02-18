/**
 * Reusable legal clause library
 * Common clauses that can be included in multiple contract templates
 */

import { LocalizedString } from "@/types/template";

export interface LegalClause {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  content: LocalizedString;
  category: "general" | "termination" | "liability" | "dispute" | "payment" | "confidentiality";
  tags: string[];
  applicableContractTypes?: string[]; // Which contract types this applies to
  variables?: string[]; // Template variables this clause uses
  optional: boolean;
}

export const STANDARD_CLAUSES: Record<string, LegalClause> = {
  force_majeure: {
    id: "force_majeure",
    name: {
      he: "כוח עליון",
      ar: "القوة القاهرة",
      en: "Force Majeure",
      ru: "Форс-мажор",
    },
    description: {
      he: "סעיף המגן על הצדדים במקרה של אירועים חריגים מחוץ לשליטתם",
      ar: "بند يحمي الأطراف في حالة وقوع أحداث استثنائية خارجة عن سيطرتهم",
      en: "Clause protecting parties in case of exceptional events beyond their control",
      ru: "Пункт, защищающий стороны в случае чрезвычайных событий вне их контроля",
    },
    content: {
      he: "במקרה של כוח עליון, לרבות אך לא רק מלחמה, אסון טבע, מגיפה, שביתה כללית או צו ממשלתי, אשר ימנע מאחד הצדדים לעמוד בהתחייבויותיו על פי הסכם זה, לא יחשב הדבר להפרת ההסכם, ובלבד שהצד המושפע הודיע על כך בכתב תוך 7 ימים מהתרחשות אירוע הכוח העליון.",
      ar: "في حالة القوة القاهرة، بما في ذلك على سبيل المثال لا الحصر الحرب أو الكوارث الطبيعية أو الأوبئة أو الإضرابات العامة أو الأوامر الحكومية، التي تمنع أحد الطرفين من الوفاء بالتزاماته بموجب هذا العقد، لا يعتبر ذلك خرقًا للعقد، شريطة أن يقوم الطرف المتأثر بالإخطار كتابيًا خلال 7 أيام من وقوع حدث القوة القاهرة.",
      en: "In the event of force majeure, including but not limited to war, natural disaster, epidemic, general strike, or governmental order, which prevents either party from fulfilling their obligations under this agreement, this shall not be considered a breach of contract, provided that the affected party notifies in writing within 7 days of the force majeure event.",
      ru: "В случае форс-мажора, включая, но не ограничиваясь войной, стихийным бедствием, эпидемией, всеобщей забастовкой или правительственным распоряжением, которые препятствуют любой из сторон выполнять свои обязательства по настоящему соглашению, это не считается нарушением договора при условии, что пострадавшая сторона уведомит об этом в письменной форме в течение 7 дней с момента наступления форс-мажорных обстоятельств.",
    },
    category: "general",
    tags: ["force majeure", "exceptional circumstances", "war", "disaster"],
    optional: true,
  },

  confidentiality: {
    id: "confidentiality",
    name: {
      he: "סודיות",
      ar: "السرية",
      en: "Confidentiality",
      ru: "Конфиденциальность",
    },
    description: {
      he: "התחייבות לשמירה על סודיות מידע",
      ar: "التزام بالحفاظ على سرية المعلومات",
      en: "Commitment to maintaining information confidentiality",
      ru: "Обязательство по сохранению конфиденциальности информации",
    },
    content: {
      he: "הצדדים מתחייבים לשמור בסודיות מוחלטת כל מידע סודי, מסחרי או טכני אשר יגיע לידיהם במהלך ביצוע הסכם זה, ולא לגלותו לצד שלישי כלשהו ללא הסכמה בכתב מראש של הצד השני. התחייבות זו תישאר בתוקף גם לאחר סיום ההסכם.",
      ar: "يتعهد الطرفان بالحفاظ على السرية التامة لجميع المعلومات السرية أو التجارية أو التقنية التي يحصلون عليها أثناء تنفيذ هذا العقد، وعدم الكشف عنها لأي طرف ثالث دون موافقة كتابية مسبقة من الطرف الآخر. يظل هذا الالتزام ساري المفعول حتى بعد انتهاء العقد.",
      en: "The parties undertake to maintain absolute confidentiality of all confidential, commercial, or technical information that comes into their possession during the execution of this agreement, and not to disclose it to any third party without prior written consent of the other party. This commitment shall remain in effect even after the termination of the agreement.",
      ru: "Стороны обязуются хранить в абсолютной конфиденциальности всю конфиденциальную, коммерческую или техническую информацию, которая попадает к ним в процессе исполнения настоящего соглашения, и не раскрывать ее какой-либо третьей стороне без предварительного письменного согласия другой стороны. Это обязательство остается в силе даже после прекращения действия соглашения.",
    },
    category: "confidentiality",
    tags: ["confidentiality", "nda", "trade secrets"],
    optional: true,
  },

  termination_notice: {
    id: "termination_notice",
    name: {
      he: "הודעה מוקדמת לסיום",
      ar: "إشعار مسبق بالإنهاء",
      en: "Termination Notice",
      ru: "Уведомление о расторжении",
    },
    description: {
      he: "תקופת הודעה מוקדמת נדרשת לסיום ההסכם",
      ar: "فترة الإشعار المسبق المطلوبة لإنهاء العقد",
      en: "Required advance notice period for terminating the agreement",
      ru: "Требуемый срок предварительного уведомления о расторжении соглашения",
    },
    content: {
      he: "כל צד רשאי לסיים הסכם זה בהודעה בכתב של {{notice_period}} ימים מראש. ההודעה תימסר באמצעות דואר רשום או דואר אלקטרוני. במקרה של הפרה יסודית, ניתן לסיים את ההסכם באופן מיידי.",
      ar: "يحق لأي طرف إنهاء هذا العقد بإشعار كتابي قبل {{notice_period}} يومًا. يتم تسليم الإشعار عن طريق البريد المسجل أو البريد الإلكتروني. في حالة الانتهاك الجوهري، يمكن إنهاء العقد فورًا.",
      en: "Either party may terminate this agreement with written notice of {{notice_period}} days in advance. Notice shall be delivered by registered mail or email. In case of material breach, the agreement may be terminated immediately.",
      ru: "Любая сторона может расторгнуть настоящее соглашение, направив письменное уведомление за {{notice_period}} дней. Уведомление должно быть направлено заказным письмом или по электронной почте. В случае существенного нарушения соглашение может быть расторгнуто немедленно.",
    },
    category: "termination",
    tags: ["termination", "notice period", "cancellation"],
    variables: ["notice_period"],
    optional: false,
  },

  liability_limitation: {
    id: "liability_limitation",
    name: {
      he: "הגבלת אחריות",
      ar: "تحديد المسؤولية",
      en: "Limitation of Liability",
      ru: "Ограничение ответственности",
    },
    description: {
      he: "הגבלת האחריות של הצדדים",
      ar: "تحديد مسؤولية الأطراف",
      en: "Limitation of parties' liability",
      ru: "Ограничение ответственности сторон",
    },
    content: {
      he: "אחריות כל צד כלפי הצד השני תהיה מוגבלת לנזקים ישירים בלבד, ולא תעלה על סכום של {{liability_cap}}. בשום מקרה לא יהיה צד אחראי לנזקים עקיפים, תוצאתיים או מיוחדים, לרבות אובדן רווחים או הפסד עסקי.",
      ar: "تقتصر مسؤولية كل طرف تجاه الطرف الآخر على الأضرار المباشرة فقط، ولا تتجاوز مبلغ {{liability_cap}}. في أي حال من الأحوال لن يكون أي طرف مسؤولاً عن الأضرار غير المباشرة أو التبعية أو الخاصة، بما في ذلك فقدان الأرباح أو الخسارة التجارية.",
      en: "Each party's liability to the other shall be limited to direct damages only, and shall not exceed {{liability_cap}}. Under no circumstances shall either party be liable for indirect, consequential, or special damages, including loss of profits or business loss.",
      ru: "Ответственность каждой стороны перед другой стороной ограничивается только прямыми убытками и не превышает {{liability_cap}}. Ни при каких обстоятельствах ни одна из сторон не несет ответственности за косвенные, последующие или особые убытки, включая упущенную выгоду или деловые потери.",
    },
    category: "liability",
    tags: ["liability", "damages", "limitation"],
    variables: ["liability_cap"],
    optional: true,
  },

  arbitration: {
    id: "arbitration",
    name: {
      he: "בוררות",
      ar: "التحكيم",
      en: "Arbitration",
      ru: "Арбитраж",
    },
    description: {
      he: "פתרון סכסוכים באמצעות בוררות",
      ar: "حل النزاعات من خلال التحكيم",
      en: "Dispute resolution through arbitration",
      ru: "Разрешение споров путем арбитража",
    },
    content: {
      he: "כל מחלוקת או תביעה הנובעת מהסכם זה או הקשורה אליו תופנה לבוררות מחייבת בפני בורר יחיד שיתמנה בהסכמת הצדדים, או במחלוקת - על ידי לשכת עורכי הדין בישראל. הבוררות תתקיים בעברית ובישראל. החלטת הבורר תהיה סופית ומחייבת ולא ניתן לערער עליה.",
      ar: "أي نزاع أو مطالبة تنشأ عن هذا العقد أو تتعلق به سيتم إحالتها إلى تحكيم ملزم أمام محكم واحد يتم تعيينه بموافقة الطرفين، أو في حالة الخلاف - من قبل نقابة المحامين في إسرائيل. سيتم التحكيم باللغة العبرية وفي إسرائيل. سيكون قرار المحكم نهائيًا وملزمًا ولا يمكن الطعن فيه.",
      en: "Any dispute or claim arising from or related to this agreement shall be referred to binding arbitration before a single arbitrator appointed by mutual agreement of the parties, or in case of disagreement - by the Israel Bar Association. The arbitration shall be conducted in Hebrew and in Israel. The arbitrator's decision shall be final and binding and cannot be appealed.",
      ru: "Любой спор или претензия, возникающие из настоящего соглашения или связанные с ним, передаются на обязательный арбитраж перед единоличным арбитром, назначаемым по взаимному согласию сторон, или в случае разногласий - Коллегией адвокатов Израиля. Арбитраж проводится на иврите и в Израиле. Решение арбитра является окончательным и обязательным и не подлежит обжалованию.",
    },
    category: "dispute",
    tags: ["arbitration", "dispute resolution", "mediation"],
    optional: true,
  },

  governing_law: {
    id: "governing_law",
    name: {
      he: "דין החל",
      ar: "القانون الواجب التطبيق",
      en: "Governing Law",
      ru: "Применимое право",
    },
    description: {
      he: "הדין החל על ההסכם",
      ar: "القانون الذي يحكم العقد",
      en: "Law governing the agreement",
      ru: "Право, регулирующее соглашение",
    },
    content: {
      he: "הסכם זה יפורש ויתפרש בהתאם לדיני מדינת ישראל. הסמכות הבלעדית לדון בכל עניין הנוגע להסכם זה תהיה לבתי המשפט המוסמכים ב{{jurisdiction}}.",
      ar: "سيتم تفسير وتأويل هذا العقد وفقًا لقوانين دولة إسرائيل. تكون الاختصاص الحصري للنظر في أي مسألة تتعلق بهذا العقد للمحاكم المختصة في {{jurisdiction}}.",
      en: "This agreement shall be interpreted and construed in accordance with the laws of the State of Israel. Exclusive jurisdiction for any matter related to this agreement shall be with the competent courts in {{jurisdiction}}.",
      ru: "Настоящее соглашение толкуется и трактуется в соответствии с законами Государства Израиль. Исключительная юрисдикция по любому вопросу, касающемуся настоящего соглашения, принадлежит компетентным судам в {{jurisdiction}}.",
    },
    category: "general",
    tags: ["governing law", "jurisdiction", "israeli law"],
    variables: ["jurisdiction"],
    optional: false,
  },

  payment_late_fee: {
    id: "payment_late_fee",
    name: {
      he: "איחור בתשלום",
      ar: "التأخر في الدفع",
      en: "Late Payment",
      ru: "Просрочка платежа",
    },
    description: {
      he: "סנקציות על איחור בתשלום",
      ar: "عقوبات على التأخر في الدفع",
      en: "Penalties for late payment",
      ru: "Штрафы за просрочку платежа",
    },
    content: {
      he: "במקרה של איחור בתשלום כלשהו על פי הסכם זה, ישלם הצד המפר ריבית פיגורים בשיעור של {{late_fee_rate}}% לחודש או השיעור המקסימלי המותר בחוק, הנמוך מבין השניים, וזאת מיום חלוף מועד התשלום ועד לתשלום בפועל.",
      ar: "في حالة التأخر في أي دفعة بموجب هذا العقد، سيدفع الطرف المخالف فائدة تأخير بمعدل {{late_fee_rate}}% شهريًا أو الحد الأقصى المسموح به بموجب القانون، أيهما أقل، وذلك من يوم انتهاء موعد الدفع حتى الدفع الفعلي.",
      en: "In case of delay in any payment under this agreement, the defaulting party shall pay late payment interest at a rate of {{late_fee_rate}}% per month or the maximum rate permitted by law, whichever is lower, from the date the payment was due until actual payment.",
      ru: "В случае просрочки любого платежа по настоящему соглашению сторона, допустившая нарушение, уплачивает пени в размере {{late_fee_rate}}% в месяц или максимальной ставки, разрешенной законом, в зависимости от того, что меньше, с даты наступления срока платежа до фактической оплаты.",
    },
    category: "payment",
    tags: ["payment", "late fee", "interest", "penalty"],
    variables: ["late_fee_rate"],
    optional: true,
  },

  severability: {
    id: "severability",
    name: {
      he: "ניתוק",
      ar: "قابلية الفصل",
      en: "Severability",
      ru: "Делимость",
    },
    description: {
      he: "תקפות שאר ההסכם במקרה של פסילת סעיף",
      ar: "صلاحية باقي العقد في حالة إبطال بند",
      en: "Validity of rest of agreement if a clause is invalidated",
      ru: "Действительность остальной части соглашения при признании пункта недействительным",
    },
    content: {
      he: "אם יקבע בית משפט מוסמך כי הוראה כלשהי מהוראות הסכם זה אינה חוקית, בטלה או בלתי אכיפה, לא יפגע הדבר בתוקפן של יתר ההוראות, אשר תמשכנה לעמוד בתוקפן המלא.",
      ar: "إذا قررت محكمة مختصة أن أي حكم من أحكام هذا العقد غير قانوني أو باطل أو غير قابل للتنفيذ، فلن يؤثر ذلك على صلاحية باقي الأحكام، والتي ستظل سارية المفعول بالكامل.",
      en: "If a competent court determines that any provision of this agreement is unlawful, void, or unenforceable, this shall not affect the validity of the remaining provisions, which shall continue in full force and effect.",
      ru: "Если компетентный суд установит, что какое-либо положение настоящего соглашения является незаконным, недействительным или не имеющим исковой силы, это не влияет на действительность остальных положений, которые продолжают действовать в полной мере.",
    },
    category: "general",
    tags: ["severability", "validity", "enforcement"],
    optional: true,
  },

  entire_agreement: {
    id: "entire_agreement",
    name: {
      he: "ההסכם המלא",
      ar: "الاتفاق الكامل",
      en: "Entire Agreement",
      ru: "Полное соглашение",
    },
    description: {
      he: "הצהרה שההסכם מהווה את כל ההבנות בין הצדדים",
      ar: "إعلان بأن العقد يشكل جميع التفاهمات بين الطرفين",
      en: "Declaration that the agreement constitutes all understandings between the parties",
      ru: "Заявление о том, что соглашение представляет собой все договоренности между сторонами",
    },
    content: {
      he: "הסכם זה מהווה את כל ההבנות וההסכמות בין הצדדים בנושאים המכוסים בו, ומבטל כל הסכם, מצג או התחייבות קודמים, בין בכתב ובין בעל פה. כל שינוי בהסכם זה יהיה תקף רק אם ייעשה בכתב ויחתם על ידי שני הצדדים.",
      ar: "يشكل هذا العقد جميع التفاهمات والاتفاقيات بين الطرفين في المسائل التي يغطيها، ويلغي أي اتفاق أو تمثيل أو التزام سابق، سواء كان مكتوبًا أو شفهيًا. أي تغيير في هذا العقد يكون صالحًا فقط إذا تم كتابيًا ووقعه الطرفان.",
      en: "This agreement constitutes all understandings and agreements between the parties on the matters covered herein, and supersedes any prior agreement, representation, or commitment, whether written or oral. Any amendment to this agreement shall be valid only if made in writing and signed by both parties.",
      ru: "Настоящее соглашение представляет собой все договоренности и соглашения между сторонами по вопросам, охватываемым им, и заменяет любое предыдущее соглашение, заявление или обязательство, письменное или устное. Любое изменение настоящего соглашения действительно только в случае, если оно сделано в письменной форме и подписано обеими сторонами.",
    },
    category: "general",
    tags: ["entire agreement", "integration", "amendments"],
    optional: false,
  },

  assignment: {
    id: "assignment",
    name: {
      he: "העברת זכויות",
      ar: "التنازل عن الحقوق",
      en: "Assignment",
      ru: "Передача прав",
    },
    description: {
      he: "הגבלות על העברת זכויות וחובות",
      ar: "قيود على نقل الحقوق والالتزامات",
      en: "Restrictions on transfer of rights and obligations",
      ru: "Ограничения на передачу прав и обязанностей",
    },
    content: {
      he: "אף אחד מהצדדים אינו רשאי להעביר, להסב או למשכן את זכויותיו או חובותיו על פי הסכם זה, כולן או מקצתן, ללא הסכמה בכתב מראש של הצד השני. כל העברה שתעשה בניגוד להוראה זו תהיה בטלה.",
      ar: "لا يحق لأي من الطرفين نقل أو إحالة أو رهن حقوقه أو التزاماته بموجب هذا العقد، كليًا أو جزئيًا، دون موافقة كتابية مسبقة من الطرف الآخر. أي نقل يتم خلافًا لهذا الحكم سيكون باطلاً.",
      en: "Neither party may transfer, assign, or pledge their rights or obligations under this agreement, in whole or in part, without prior written consent of the other party. Any transfer made contrary to this provision shall be void.",
      ru: "Ни одна из сторон не может передавать, уступать или закладывать свои права или обязанности по настоящему соглашению, полностью или частично, без предварительного письменного согласия другой стороны. Любая передача, осуществленная вопреки этому положению, является недействительной.",
    },
    category: "general",
    tags: ["assignment", "transfer", "delegation"],
    optional: true,
  },

  notices: {
    id: "notices",
    name: {
      he: "הודעות",
      ar: "الإشعارات",
      en: "Notices",
      ru: "Уведомления",
    },
    description: {
      he: "אופן מסירת הודעות בין הצדדים",
      ar: "كيفية تسليم الإشعارات بين الأطراف",
      en: "Method of delivering notices between parties",
      ru: "Способ доставки уведомлений между сторонами",
    },
    content: {
      he: "כל הודעה על פי הסכם זה תינתן בכתב ותישלח לכתובות הצדדים כמפורט בהסכם. הודעה תיחשב כנמסרה: (א) אם נמסרה ביד - במועד המסירה; (ב) אם נשלחה בדואר רשום - 5 ימי עסקים לאחר המשלוח; (ג) אם נשלחה בדואר אלקטרוני - 24 שעות לאחר השליחה, בתנאי שנתקבלה אישור קבלה.",
      ar: "سيتم إعطاء أي إشعار بموجب هذا العقد كتابيًا وإرساله إلى عناوين الطرفين كما هو مفصل في العقد. يعتبر الإشعار مسلمًا: (أ) إذا تم تسليمه باليد - في تاريخ التسليم؛ (ب) إذا تم إرساله بالبريد المسجل - بعد 5 أيام عمل من الإرسال؛ (ج) إذا تم إرساله بالبريد الإلكتروني - بعد 24 ساعة من الإرسال، شريطة استلام تأكيد الاستلام.",
      en: "Any notice under this agreement shall be given in writing and sent to the parties' addresses as detailed in the agreement. Notice shall be deemed delivered: (a) if delivered by hand - on the date of delivery; (b) if sent by registered mail - 5 business days after sending; (c) if sent by email - 24 hours after sending, provided a read receipt was received.",
      ru: "Любое уведомление по настоящему соглашению дается в письменной форме и отправляется на адреса сторон, указанные в соглашении. Уведомление считается доставленным: (а) если доставлено лично - в дату доставки; (б) если отправлено заказным письмом - через 5 рабочих дней после отправки; (в) если отправлено по электронной почте - через 24 часа после отправки при условии получения подтверждения о прочтении.",
    },
    category: "general",
    tags: ["notices", "communication", "delivery"],
    optional: false,
  },
};

/**
 * Get clauses by category
 */
export function getClausesByCategory(category: LegalClause["category"]): LegalClause[] {
  return Object.values(STANDARD_CLAUSES).filter((clause) => clause.category === category);
}

/**
 * Get clauses applicable to a contract type
 */
export function getClausesForContractType(contractType: string): LegalClause[] {
  return Object.values(STANDARD_CLAUSES).filter(
    (clause) =>
      !clause.applicableContractTypes ||
      clause.applicableContractTypes.includes(contractType)
  );
}

/**
 * Get clause by ID
 */
export function getClauseById(id: string): LegalClause | undefined {
  return STANDARD_CLAUSES[id];
}

/**
 * Replace variables in clause content
 */
export function fillClauseVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  });
  return result;
}
