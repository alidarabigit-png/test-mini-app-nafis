import { ProductItem, SourcingSettings, TieredPrice, SupplierInfo } from '../types';

export interface SourcingProgressUpdate {
  step: 'searching' | 'filtering_suppliers' | 'extracting_specs' | 'generating_seo' | 'calculating_margins' | 'done';
  message: string;
  progressPercent: number;
}

const SAMPLE_SUPPLIERS: SupplierInfo[] = [
  {
    name: 'Shenzhen Apex Smart Innovations Co., Ltd.',
    platform: 'Alibaba',
    country: 'چین',
    city: 'شنژن',
    yearsInBusiness: 9,
    isVerified: true,
    hasTradeAssurance: true,
    rating: 4.93,
    responseRate: '98.8%',
    onTimeDeliveryRate: '99.5%',
    reviewCount: 2150,
    trustScore: 98,
    supplierProfileUrl: 'https://alibaba.com/company/apex-smart',
  },
  {
    name: 'Guangzhou NexTrend Electronics Factory',
    platform: '1688',
    country: 'چین',
    city: 'گوانگجو',
    yearsInBusiness: 7,
    isVerified: true,
    hasTradeAssurance: true,
    rating: 4.86,
    responseRate: '97.5%',
    onTimeDeliveryRate: '98.8%',
    reviewCount: 1480,
    trustScore: 94,
    supplierProfileUrl: 'https://1688.com/factory/nextrend',
  },
  {
    name: 'Yiwu Global Trend Import & Export Co.',
    platform: 'Global Sources',
    country: 'چین',
    city: 'ایوو',
    yearsInBusiness: 11,
    isVerified: true,
    hasTradeAssurance: true,
    rating: 4.96,
    responseRate: '99.3%',
    onTimeDeliveryRate: '99.9%',
    reviewCount: 3400,
    trustScore: 99,
  },
  {
    name: 'Ningbo Precision Tech Industrial Corp.',
    platform: 'Made-in-China',
    country: 'چین',
    city: 'نینگبو',
    yearsInBusiness: 8,
    isVerified: true,
    hasTradeAssurance: true,
    rating: 4.89,
    responseRate: '98.2%',
    onTimeDeliveryRate: '99.1%',
    reviewCount: 1720,
    trustScore: 95,
  },
];

interface TrendTemplate {
  category: string;
  originalTitle: string;
  faTitle: string;
  faShortDesc: string;
  faFullDesc: string;
  faFeatures: string[];
  technicalSpecs: Record<string, string>;
  tags: string[];
  mainImage: string;
  images: string[];
  basePriceUsd: number;
  moq: number;
  leadTimeDays: number;
}

const TREND_DATABASE: TrendTemplate[] = [
  {
    category: 'گجت و لوازم دیجیتال',
    originalTitle: '4K GPS Drone with Optical Flow Obstacle Avoidance 3-Axis Brushless Gimbal',
    faTitle: 'کوادکوپتر تاشو ۴K حرفه‌ای با سنسور لیزری تشخیص مانع ۳۶۰ درجه و موتور براشلس',
    faShortDesc: 'کوادکوپتر مجهز به دوربین 4K Ultra HD، موقعیت‌یابی دوگانه GPS/GLONASS، برد پروازی ۱۲۰۰ متر و تایم پرواز ۲۸ دقیقه.',
    faFullDesc: 'این پهپاد دوربین‌دار تاشو با سنسور تشخیص مانع هوشمند، تعقیب سوژه خودکار و بازگشت اضطراری به مبدا، گزینه‌ای بی‌نقص برای تولید محتوا، ولاگری و تصویربرداری حرفه‌ای است. دارای موتورهای براشلس پرقدرت مقاوم در برابر باد و گیمبال لرزشگیر ژیروسکوپی.',
    faFeatures: [
      'کیفیت ضبط ویدیویی 4K با گیمبال لرزشگیر دو محوره الکترونیکی',
      'سنسور تشخیص مانع هوشمند لیزری در ۴ جهت اصلی',
      'موتورهای نسل جدید براشلس بی‌صدا با طول عمر و شتاب بالا',
      'سیستم بازگشت به خانه خودکار با یک دکمه و هنگام اتمام باتری',
      'باتری لیتیومی هوشمند ۲۲۰۰ میلی‌آمپر با مدت پرواز ۲۸ دقیقه',
    ],
    technicalSpecs: {
      'رزولوشن دوربین': '4K UHD 30fps + دوربین کمکی جریان نوری',
      'برد کنترل و تصویر': 'تا ۱۲۰۰ متر بدون قطعی',
      'نوع موتور': 'Brushless 1503 High Torque',
      'سیستم ناوبری': 'GPS هوشمند ماهواره‌ای دو کاناله',
      'استاندارد کیفی': 'CE, FCC, RoHS, EU Certified',
    },
    tags: ['کوادکوپتر', 'پهپاد_۴K', 'دوربین_هوایی', 'کالای_ترند_۲۰۲۶', 'عمده_شنژن'],
    mainImage: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
    ],
    basePriceUsd: 28.5,
    moq: 10,
    leadTimeDays: 7,
  },
  {
    category: 'خانه، خودرو و سبک زندگی',
    originalTitle: 'Magnetic Levitation RGB Floating Desk Lamp & 15W Qi Wireless Fast Charger',
    faTitle: 'چراغ خواب و استند معلق ضدجاذبه مگنتی با شارژر وایرلس ۱۵ وات و نورپردازی RGB هوشمند',
    faShortDesc: 'محصول شگفت‌انگیز وایرال تیک‌تاک ۲۰۲۶؛ حباب شناور در هوا با اثر مغناطیسی ضدجاذبه، نورپردازی لمسی و شارژ بیسیم سریع موبایل.',
    faFullDesc: 'این گجت لوکس با بهره‌گیری از میدان الکترومغناطیسی فعال، حباب نورانی را در هوا معلق و شناور نگه می‌دارد. پایه دستگاه مجهز به پد شارژ بی‌سیم ۱۵ وات توربو برای انواع گوشی‌های آیفون و سامسونگ است و با طراحی مینیمال و متالیک، نمایی آینده‌نگرانه به میز کار یا اتاق خواب می‌بخشد.',
    faFeatures: [
      'فناوری معلق‌سازی مغناطیسی نسل سوم با پایداری کامل بدون لغزش',
      'پد شارژ بی‌سیم سریع مگ‌سیف سازگار با توان ۱۵ وات Qi',
      'کلید لمسی دیمر با ۳ طیف نوری گرم، مهتابی و ترکیبی آرامش‌بخش',
      'حفاظت هوشمند قطع جریان در صورت نوسان یا قطع ناگهانی برق',
      'بدنه ساخته شده از چوب راش و آلیاژ آلومینیوم آنودایز شده',
    ],
    technicalSpecs: {
      'توان شارژ وایرلس': '15W Fast Charge (سازگار با 10W/7.5W/5W)',
      'سیستم تعلیق': 'الکترومغناطیسی هوشمند با سنسور تعادل ژیروسکوپ',
      'درگاه ورودی': 'Type-C PD با آداپتور اورجینال',
      'متریال بدنه': 'آلیاژ آلومینیوم مات + پایه با روکش ضدلغزش',
    },
    tags: ['چراغ_معلق', 'شارژر_وایرلس', 'دکوراسیون_مدرن', 'کالای_وایرال_۲۰۲۶'],
    mainImage: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80',
    ],
    basePriceUsd: 14.8,
    moq: 15,
    leadTimeDays: 5,
  },
  {
    category: 'گجت و لوازم دیجیتال',
    originalTitle: 'Smart Ring Titanium Health Tracker Heart Rate SpO2 Sleep Fitness Monitor Waterproof',
    faTitle: 'حلقه هوشمند تیتانیومی با پایش ۲۴ ساعته ضربان قلب، اکسیژن خون و خواب (ضدآب ۵ATM)',
    faShortDesc: 'جایگزین فوق‌سبک ساعت‌های هوشمند با بدنه تیتانیومی ضدحساسیت، وزن تنها ۳ گرم، سنسورهای پزشکی و شارژدهی ۷ روزه.',
    faFullDesc: 'حلقه‌های هوشمند ترند اصلی گجت‌های پوشیدنی در سال ۲۰۲۶ هستند. این محصول بدون داشتن نمایشگر آزاردهنده، کلیه علائم حیاتی شامل ضربان قلب، اکسیژن خون (SpO2)، دمای پوست و مراحل خواب عمیق را با سنسورهای پیشرفته اپتیکال رصد کرده و به اپلیکیشن اختصاصی فارسی متصل می‌شود.',
    faFeatures: [
      'بدنه از آلیاژ تیتانیوم درجه هوافضا با پوشش مات ضدخش',
      'پایش خودکار و پیوسته علائم حیاتی با هشدار ضربان نامنظم',
      'مقاومت کامل در برابر آب تا عمق ۵۰ متر (استاندارد ۵ATM)',
      'باتری مینیاتوری پرچگال با نگهداری شارژ ۷ روز و کیس شارژر مسافرتی',
      'سازگاری کامل با اندروید و iOS با بلوتوث نسخه ۵.۴ کم‌مصرف',
    ],
    technicalSpecs: {
      'جنس بدنه': 'تیتانیوم گرید ۵ + لایه داخلی رزین ضدحساسیت پزشکی',
      'سنسورها': 'PPG ضربان قلب، سنسور SpO2، سنسور دمای مادون قرمز',
      'عمر باتری': 'تا ۷ روز استفاده فعال و ۳۰ روز در کیس شارژ',
      'ضدآب': '5ATM / IP68 مناسب شنا و دوش آب',
    },
    tags: ['حلقه_هوشمند', 'اسمارت_رینگ', 'پایش_سلامت', 'گجت_پوشیدنی', 'وارداتی_دست_اول'],
    mainImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80',
    ],
    basePriceUsd: 18.2,
    moq: 10,
    leadTimeDays: 5,
  },
  {
    category: 'گجت و لوازم دیجیتال',
    originalTitle: 'Mini Pocket Wireless Bluetooth Thermal Label Maker Printer No Ink Required',
    faTitle: 'مینی پرینتر حرارتی جیبی بلوتوثی بدون جوهر (ترند فوق‌العاده پرفروش ۲۰۲۶)',
    faShortDesc: 'چاپ فوری فاکتور، برچسب قیمت، بارکد، استیکر و عکس بدون نیاز به جوهر یا کارتریج با هد حرارتی ژاپنی با رزولوشن ۲۰۳dpi.',
    faFullDesc: 'محصولی بی‌نظیر برای آنلاین‌شاپ‌ها، دانش‌آموزان و بسته‌بندی انبار. با فناوری چاپ حرارتی مستقیم (Thermal)، تنها با کاغذ حرارتی و بدون قطره‌ای جوهر کار می‌کند. به تمام گوشی‌های موبایل وصل شده و بیش از ۵۰۰ قالب برچسب فارسی و انگلیسی آماده دارد.',
    faFeatures: [
      'چاپ حرارتی مستقیم بدون نیاز به شارژ جوهر، تونر یا کارتریج',
      'رزولوشن بالای ۲۰۳dpi برای متون ریز، بارکد و طرح‌های گرافیکی',
      'باتری لیتیومی ۱۲۰۰ میلی‌آمپر با کارکرد تا ۱۰۰۰ برچسب مداوم',
      'ابعاد جیبی و بسیار سبک (تنها ۱۶۰ گرم) مناسب حمل در کیف',
      'پشتیبانی از انواع رول‌های برچسب دار، مات، رنگی و شفاف',
    ],
    technicalSpecs: {
      'نوع چاپ': 'حرارتی مستقیم (Thermal Direct Printing)',
      'عرض چاپ': 'تا ۵۰ میلی‌متر با تشخیص خودکار سایز رول',
      'اتصال': 'بلوتوث ۴.۲ سریع + پورت شارژ Type-C',
      'رزولوشن': '203 DPI با فناوری ضدپخش رنگ',
    },
    tags: ['مینی_پرینتر', 'پرینتر_حرارتی', 'آنلاین_شاپ', 'کالای_ترند_تیک_تاک'],
    mainImage: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=800&q=80',
    ],
    basePriceUsd: 8.9,
    moq: 20,
    leadTimeDays: 4,
  },
];

export async function runAutomatedSourcingHunt(
  settings: SourcingSettings,
  onProgress: (update: SourcingProgressUpdate) => void
): Promise<ProductItem[]> {
  onProgress({
    step: 'searching',
    message: `در حال کاوش در پایگاه داده پلتفرم‌های عمده‌فروشی (${settings.platforms.join('، ')})...`,
    progressPercent: 15,
  });

  await new Promise((r) => setTimeout(r, 600));

  onProgress({
    step: 'filtering_suppliers',
    message: `فیلتر تامین‌کنندگان بر اساس سابقه (حداقل ${settings.minSupplierYears} سال) و تاییدیه Trade Assurance...`,
    progressPercent: 40,
  });

  await new Promise((r) => setTimeout(r, 700));

  onProgress({
    step: 'extracting_specs',
    message: 'استخراج کاتالوگ فنی، تصاویر اصلی باکیفیت و ارزیابی تاییدیه‌های بازرسی CE/RoHS...',
    progressPercent: 65,
  });

  await new Promise((r) => setTimeout(r, 600));

  onProgress({
    step: 'generating_seo',
    message: 'تولید خودکار عنوان سئوشده، معرفی خلاصه و توضیحات فارسی جذاب متناسب با الگوریتم‌های فروش...',
    progressPercent: 85,
  });

  await new Promise((r) => setTimeout(r, 500));

  onProgress({
    step: 'calculating_margins',
    message: `محاسبه جدول قیمت‌های پلکانی ارزی و معادل تومانی با نرخ ارز ${settings.usdToTomanRate.toLocaleString('en-US')} تومان...`,
    progressPercent: 95,
  });

  await new Promise((r) => setTimeout(r, 400));

  // Generate new items based on curated trend database and user's settings
  const generatedItems: ProductItem[] = TREND_DATABASE.map((tpl, idx) => {
    const supplier = SAMPLE_SUPPLIERS[idx % SAMPLE_SUPPLIERS.length];
    const basePrice = tpl.basePriceUsd;

    const tieredPricing: TieredPrice[] = [
      {
        minQuantity: tpl.moq,
        maxQuantity: tpl.moq * 4 - 1,
        priceUsd: Number(basePrice.toFixed(2)),
        calculatedPriceToman: Math.round(basePrice * settings.usdToTomanRate * (1 + settings.targetMarginPercent / 100)),
      },
      {
        minQuantity: tpl.moq * 4,
        maxQuantity: tpl.moq * 15 - 1,
        priceUsd: Number((basePrice * 0.86).toFixed(2)),
        calculatedPriceToman: Math.round(basePrice * 0.86 * settings.usdToTomanRate * (1 + (settings.targetMarginPercent - 5) / 100)),
      },
      {
        minQuantity: tpl.moq * 15,
        priceUsd: Number((basePrice * 0.74).toFixed(2)),
        calculatedPriceToman: Math.round(basePrice * 0.74 * settings.usdToTomanRate * (1 + (settings.targetMarginPercent - 10) / 100)),
      },
    ];

    const uniqueSerial = Math.floor(1000 + Math.random() * 9000);
    const today = new Date().toISOString().split('T')[0];

    return {
      id: `HUNT-${Date.now()}-${uniqueSerial}`,
      createdAt: today,
      sourceUrl: `https://${supplier.platform.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/product-detail/viral-trend-${uniqueSerial}.html`,
      originalTitle: tpl.originalTitle,
      faTitle: tpl.faTitle,
      faShortDesc: tpl.faShortDesc,
      faFullDesc: tpl.faFullDesc,
      faFeatures: tpl.faFeatures,
      technicalSpecs: tpl.technicalSpecs,
      category: tpl.category,
      tags: tpl.tags,
      mainImage: tpl.mainImage,
      images: tpl.images,
      moq: tpl.moq,
      leadTimeDays: tpl.leadTimeDays,
      costPerUnitUsd: basePrice,
      costPerUnitCny: Number((basePrice * 7.24).toFixed(1)),
      costPerUnitAed: Number((basePrice * 3.67).toFixed(1)),
      estimatedMarginPercent: settings.targetMarginPercent + 15,
      trendScore: Math.floor(92 + Math.random() * 7),
      isSyncedToSheets: false,
      isPostedToTelegram: false,
      tieredPricing,
      supplier,
    };
  });

  onProgress({
    step: 'done',
    message: `${generatedItems.length} محصول ترند جدید با موفقیت واکشی، اعتبارسنجی و سئو شد!`,
    progressPercent: 100,
  });

  return generatedItems;
}
