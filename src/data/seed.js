import { addDays, localISO } from '../lib/utils';

// ⚠️ كل المحتوى هنا تجريبي. الأدمن يقدر يعدّل أو يحذف أي حاجة من لوحة التحكم.
export function makeSeed() {
  const cats = [
    { id: 'c1', image: './images/cat-1.svg', name: 'روايات عربية', description: 'حكايات من قلب العالم العربي: تاريخ ومجتمع وإنسان.', color: 'navy' },
    { id: 'c2', image: './images/cat-2.svg', name: 'تطوير الذات', description: 'كتب عن العادات والتفكير والنمو الشخصي.', color: 'olive' },
    { id: 'c3', image: './images/cat-3.svg', name: 'علوم وتكنولوجيا', description: 'من الكون الواسع إلى عالم الحاسوب والابتكار.', color: 'gold' },
    { id: 'c4', image: './images/cat-4.svg', name: 'تاريخ وحضارات', description: 'نفهم الماضي عشان نقرأ الحاضر صح.', color: 'flame' },
    { id: 'c5', image: './images/cat-5.svg', name: 'فلسفة وفكر', description: 'أسئلة كبيرة ونقاشات تفتح العقل.', color: 'navy' },
    { id: 'c6', image: './images/cat-6.svg', name: 'أدب عالمي', description: 'أعمال مترجمة من ثقافات مختلفة.', color: 'olive' },
  ];

  const members = [
    { id: 'm1', name: 'أحمد سمير', role: 'مؤسس' },
    { id: 'm2', name: 'مريم خالد', role: 'مؤسس' },
    { id: 'm3', name: 'نور محمود', role: 'منظّم' },
    { id: 'm4', name: 'عمر حسن', role: 'عضو' },
    { id: 'm5', name: 'سلمى إبراهيم', role: 'عضو' },
    { id: 'm6', name: 'كريم طارق', role: 'عضو' },
    { id: 'm7', name: 'هدى أشرف', role: 'عضو' },
    { id: 'm8', name: 'مصطفى جمال', role: 'عضو' },
  ];

  const books = [
    { id: 'b1', title: 'ثلاثية غرناطة', author: 'رضوى عاشور', categoryId: 'c1', pickedBy: 'm2', status: 'reading', coverUrl: './images/cover-1.svg', description: 'رواية عن عائلة أندلسية عبر أجيال بعد سقوط غرناطة.' },
    { id: 'b2', title: 'عمارة يعقوبيان', author: 'علاء الأسواني', categoryId: 'c1', pickedBy: 'm4', status: 'reading', coverUrl: './images/cover-2.svg', description: 'صورة لمجتمع القاهرة من خلال سكان عمارة واحدة.' },
    { id: 'b3', title: 'العادات الذرية', author: 'جيمس كلير', categoryId: 'c2', pickedBy: 'm3', status: 'done', coverUrl: './images/cover-3.svg', description: 'كيف تصنع التغييرات الصغيرة فرقًا كبيرًا بمرور الوقت.' },
    { id: 'b4', title: 'فن اللامبالاة', author: 'مارك مانسون', categoryId: 'c2', pickedBy: 'm6', status: 'done', coverUrl: './images/cover-4.svg', description: 'نظرة مختلفة على ترتيب أولوياتنا واهتماماتنا.' },
    { id: 'b5', title: 'تاريخ موجز للزمن', author: 'ستيفن هوكينغ', categoryId: 'c3', pickedBy: 'm1', status: 'done', coverUrl: './images/cover-5.svg', description: 'رحلة مبسطة في فهم نشأة الكون وطبيعة الزمن.' },
    { id: 'b6', title: 'ستيف جوبز', author: 'والتر إيزاكسون', categoryId: 'c3', pickedBy: 'm8', status: 'done', coverUrl: './images/cover-6.svg', description: 'سيرة رجل غيّر شكل التكنولوجيا في حياتنا.' },
    { id: 'b7', title: 'سابينز: تاريخ موجز للبشرية', author: 'يوفال نوح هراري', categoryId: 'c4', pickedBy: 'm5', status: 'done', coverUrl: './images/cover-7.svg', description: 'قراءة سريعة في تاريخ الإنسان من العصور الأولى حتى اليوم.' },
    { id: 'b8', title: 'عالم صوفي', author: 'جوستاين غاردر', categoryId: 'c5', pickedBy: 'm7', status: 'done', coverUrl: './images/cover-8.svg', description: 'رواية تعرّفك على تاريخ الفلسفة بأسلوب حكائي.' },
    { id: 'b9', title: 'مئة عام من العزلة', author: 'غابرييل غارسيا ماركيز', categoryId: 'c6', pickedBy: 'm1', status: 'done', coverUrl: './images/cover-9.svg', description: 'ملحمة عائلة بوينديا في قرية ماكوندو.' },
    { id: 'b10', title: 'الأمير الصغير', author: 'أنطوان دو سانت إكزوبيري', categoryId: 'c6', pickedBy: 'm3', status: 'done', coverUrl: './images/cover-10.svg', description: 'حكاية قصيرة تحمل معاني كبيرة عن الصداقة والحياة.' },
  ];

  const events = [
    { id: 'e1', image: './images/event-1.svg', title: 'نقاش جولة الروايات العربية', date: addDays(6), time: '18:00', mode: 'حضوري', location: 'قاعة المكتبة، الكلية', link: '', categoryId: 'c1', description: 'كل عضو يعرض الرواية اللي اختارها ويحكي فكرتها الأساسية، وبعدها نقاش مفتوح.', notes: '' },
    { id: 'e2', image: './images/event-2.svg', title: 'لقاء أونلاين: كيف نقرأ باستمرار؟', date: addDays(20), time: '20:00', mode: 'أونلاين', location: '', link: 'https://meet.google.com/', categoryId: 'c1', description: 'جلسة نتبادل فيها طرق تنظيم وقت القراءة وبناء عادة ثابتة.', notes: '' },
    { id: 'e3', image: './images/event-3.svg', title: 'نقاش جولة تطوير الذات', date: addDays(-8), time: '18:00', mode: 'حضوري', location: 'قاعة المكتبة، الكلية', link: '', categoryId: 'c2', description: 'ناقشنا العادات الصغيرة وأثرها.', notes: 'خرجنا بتحدي: عادة واحدة صغيرة لمدة أسبوعين.' },
    { id: 'e4', image: './images/event-2.svg', title: 'نقاش جولة العلوم والتكنولوجيا', date: addDays(-22), time: '18:00', mode: 'أونلاين', location: '', link: '', categoryId: 'c3', description: 'تبادلنا أفكارًا عن الزمن والابتكار.', notes: 'اتفقنا نخصص جولة قادمة لكتب الذكاء الاصطناعي.' },
  ];

  const now = new Date().toISOString();
  const quotes = [
    { id: 'q1', authorName: 'مريم خالد', memberId: 'm2', type: 'review', bookTitle: 'ثلاثية غرناطة', text: 'مراجعة تجريبية: الرواية خلتني أشوف التاريخ كحياة ناس عادية مش مجرد أحداث في كتاب. أكتر جزء أثر فيّ هو علاقة الأجيال ببعضها.', page: '', status: 'approved', createdAt: now, pointsAwarded: 10 },
    { id: 'q2', authorName: 'أحمد سمير', memberId: 'm1', type: 'quote', bookTitle: 'كتاب تجريبي', text: 'اقتباس تجريبي: القراءة المنتظمة تبني عقلًا يرى أبعد من السطور.', page: '٤٢', status: 'approved', createdAt: now, pointsAwarded: 5 },
    { id: 'q3', authorName: 'نور محمود', memberId: 'm3', type: 'review', bookTitle: 'العادات الذرية', text: 'مراجعة تجريبية: الفكرة الأهم عندي إن المهم النظام اللي بنمشي عليه مش الهدف بس. بدأت أطبقها في مذاكرتي.', page: '', status: 'approved', createdAt: now, pointsAwarded: 10 },
    { id: 'q4', authorName: 'عمر حسن', memberId: 'm4', type: 'quote', bookTitle: 'كتاب تجريبي', text: 'اقتباس تجريبي بانتظار موافقة الأدمن.', page: '', status: 'pending', createdAt: now, pointsAwarded: 0 },
  ];

  const pointsLog = [
    { id: 'p1', memberId: 'm1', amount: 45, reason: 'نقاط تجريبية', date: localISO() },
    { id: 'p2', memberId: 'm2', amount: 62, reason: 'نقاط تجريبية', date: localISO() },
    { id: 'p3', memberId: 'm3', amount: 38, reason: 'نقاط تجريبية', date: localISO() },
    { id: 'p4', memberId: 'm4', amount: 21, reason: 'نقاط تجريبية', date: localISO() },
    { id: 'p5', memberId: 'm5', amount: 14, reason: 'نقاط تجريبية', date: localISO() },
    { id: 'p6', memberId: 'm6', amount: 9, reason: 'نقاط تجريبية', date: localISO() },
    { id: 'p7', memberId: 'm7', amount: 5, reason: 'نقاط تجريبية', date: localISO() },
  ];

  return {
    settings: {
      clubName: 'بين السطور',
      tagline: 'نقرأ معًا، ونقول ما بين السطور',
      about: 'نادي قراءة أسسه مجموعة من طلاب كلية الحاسبات والمعلومات، هدفنا نساعد الناس على القراءة ونعطيهم مساحة يعبّروا فيها عن أفكارهم.',
      goal: 'كل أسبوعين نلتقي في نقاش مفتوح حول ما قرأناه. نحدد فئة للجولة، وكل عضو يختار الكتاب اللي يعجبه من الفئة بحرية، ثم نتبادل الأفكار والآراء.',
      currentCategoryId: 'c1',
      links: {
        facebook: 'https://www.facebook.com/',
        telegram: 'https://t.me/',
        whatsapp: 'https://chat.whatsapp.com/',
      },
      pointsPerQuote: 5,
      pointsPerReview: 10,
      pointsRules: 'اقتباس معتمد = ٥ نقاط، ومراجعة معتمدة = ١٠ نقاط\nنقاط إضافية لمن ينشر بانتظام كل أسبوع\nالأدمن يراجع كل مشاركة قبل نشرها ويحدد نقاطها',
      adminPasswordHash: null,
    },
    categories: cats, members, books, events, quotes, pointsLog, requests: [], userProfiles: [],
  };
}
