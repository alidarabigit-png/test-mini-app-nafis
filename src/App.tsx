import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { SourcingAgentTab } from './components/SourcingAgentTab';
import { ProductsCatalogTab } from './components/ProductsCatalogTab';
import { TelegramMiniAppPreview } from './components/TelegramMiniAppPreview';
import { TelegramPostGeneratorTab } from './components/TelegramPostGeneratorTab';
import { GoogleSheetsTab } from './components/GoogleSheetsTab';
import { AutomationGuideTab } from './components/AutomationGuideTab';
import { AdminPanelTab } from './components/AdminPanelTab';
import { CustomerPortalTab } from './components/CustomerPortalTab';
import { ManualProductIngestModal } from './components/ManualProductIngestModal';
import { WebStoreSyncModal } from './components/WebStoreSyncModal';
import {
  ProductItem,
  SourcingSettings,
  GoogleSheetsConfig,
  TelegramConfig,
  CurrencyRates,
  CustomerUser,
  CustomerInquiry,
  WebStoreConfig,
  MiniAppNotification,
} from './types';
import { INITIAL_PRODUCTS } from './data/sampleProducts';
import { INITIAL_CUSTOMERS, INITIAL_INQUIRIES } from './data/sampleCustomers';
import { DEFAULT_RATES, fetchLiveExchangeRates, saveCustomRatesToServer } from './services/currencyService';
import { initAuth, googleSignIn, logout } from './services/firebaseAuth';
import {
  createWholesaleSpreadsheet,
  appendProductsToSheet,
  readProductsFromSheet,
  cleanDuplicatesInSheet,
  extractSpreadsheetId,
} from './services/googleSheets';
import { CurrencyRatesModal } from './components/CurrencyRatesModal';
import { SheetCleanerModal } from './components/SheetCleanerModal';
import { generateSmartSeo } from './utils/seoGenerator';

export default function App() {
  // Smart View Mode Detection:
  // - If inside Telegram WebApp, on pages.dev/cloudflare, or mobile screen -> default to full-screen 'miniapp'
  // - If '?view=admin' is present -> 'admin'
  const [viewMode, setViewMode] = useState<'miniapp' | 'admin'>(() => {
    if (typeof window === 'undefined') return 'admin';
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'admin') return 'admin';
    if (params.get('view') === 'miniapp') return 'miniapp';

    const isTg = Boolean(
      (window as any).Telegram?.WebApp?.initData ||
      window.location.hash.includes('tgWebAppData') ||
      window.location.hostname.includes('pages.dev') ||
      window.location.hostname.includes('vercel.app') ||
      window.innerWidth < 768
    );
    return isTg ? 'miniapp' : 'admin';
  });

  const [activeTab, setActiveTab] = useState<string>('agent');
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Theme Management (Light / Dark)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('nfs_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    }
    localStorage.setItem('nfs_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Multi-Currency Rates (USD, AED, CNY)
  const [currencyRates, setCurrencyRates] = useState<CurrencyRates>(DEFAULT_RATES);
  const [isRefreshingRates, setIsRefreshingRates] = useState<boolean>(false);

  // Inventory & Selection (Persisted in LocalStorage)
  const [products, setProductsState] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem('nfs_products_catalog');
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let hasUpgraded = false;
          parsed = parsed.map((p: any) => {
            const isXF1 = p.originalTitle?.includes('XF1') || p.faTitle?.includes('XF1') || p.id?.includes('XF1') || p.sourceUrl?.includes('XF1');
            const hasGenericImage = !p.mainImage?.includes('alicdn.com') || p.mainImage?.includes('unsplash');

            // 1. Repair XF1 images if generic
            if (isXF1 && hasGenericImage) {
              hasUpgraded = true;
              return {
                ...p,
                mainImage: 'https://sc04.alicdn.com/kf/Heb8ce61c862442588719263ab2276ab93.jpg',
                images: [
                  'https://sc04.alicdn.com/kf/Heb8ce61c862442588719263ab2276ab93.jpg',
                  'https://s.alicdn.com/@sc04/kf/H425d49fc85c4439b9922211b3558960ay.jpg',
                ],
              };
            }

            // 2. Repair mismatched product (e.g. Action Camera with XF1 description)
            const isCamera = p.originalTitle?.includes('Camera') || p.originalTitle?.includes('Action');
            const hasWrongXf1Desc = p.faFullDesc?.includes('XF1') || p.faTitle?.includes('XF1');
            if (isCamera && hasWrongXf1Desc) {
              hasUpgraded = true;
              const seo = generateSmartSeo(p.originalTitle, p.technicalSpecs, p.sourceUrl);
              return {
                ...p,
                faTitle: seo.titleFa,
                faShortDesc: seo.shortDesc,
                faFullDesc: seo.fullDesc,
                faFeatures: seo.features,
                category: seo.category,
                tags: seo.tags,
              };
            }

            return p;
          });
          if (hasUpgraded) {
            try {
              localStorage.setItem('nfs_products_catalog', JSON.stringify(parsed));
            } catch (e) {}
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load products from storage', e);
    }
    return INITIAL_PRODUCTS;
  });

  const setProducts = (
    value: ProductItem[] | ((prev: ProductItem[]) => ProductItem[])
  ) => {
    setProductsState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      try {
        localStorage.setItem('nfs_products_catalog', JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save products to storage', e);
      }
      return next;
    });
  };

  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(() => {
    try {
      const saved = localStorage.getItem('nfs_products_catalog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      }
    } catch (e) {}
    return INITIAL_PRODUCTS[0];
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isManualIngestOpen, setIsManualIngestOpen] = useState(false);
  const [pendingExtensionProducts, setPendingExtensionProducts] = useState<any[]>([]);

  useEffect(() => {
    const checkExt = async () => {
      try {
        const res = await fetch('/api/extension/pending');
        if (res.ok) {
          const data = await res.json();
          if (data.products) {
            setPendingExtensionProducts(data.products);
          }
        }
      } catch (e) {}
    };
    checkExt();
    const interval = setInterval(checkExt, 8000);
    return () => clearInterval(interval);
  }, []);

  // CRM: Customers & Inquiries
  const [customers, setCustomers] = useState<CustomerUser[]>(INITIAL_CUSTOMERS);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerUser>(INITIAL_CUSTOMERS[0]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>(INITIAL_INQUIRIES);

  // Sourcing & Agent Settings
  const [settings, setSettings] = useState<SourcingSettings>({
    category: 'همه دسته‌ها (الگوریتم ترند کلی)',
    keyword: '',
    platforms: ['Alibaba', '1688', 'Made-in-China', 'Global Sources'],
    minSupplierYears: 5,
    requireTradeAssurance: true,
    requireVerifiedSupplier: true,
    minRating: 4.8,
    minMoq: 10,
    maxMoq: 50,
    usdToTomanRate: DEFAULT_RATES.usd,
    aedToTomanRate: DEFAULT_RATES.aed,
    cnyToTomanRate: DEFAULT_RATES.cny,
    targetMarginPercent: 50,
    autoSyncToSheets: true,
    autoGenerateTelegramPost: true,
  });

  // Google Sheets integration state (Persisted in LocalStorage)
  const [sheetsConfig, setSheetsConfigState] = useState<GoogleSheetsConfig>(() => {
    try {
      const saved = localStorage.getItem('nfs_sheets_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load sheets config from storage', e);
    }
    return {
      spreadsheetId: null,
      spreadsheetUrl: null,
      sheetTitle: 'کالاهای ترند عمده‌فروشی تلگرام',
      lastSyncedAt: null,
      totalSyncedCount: 0,
    };
  });

  const setSheetsConfig = (
    value: GoogleSheetsConfig | ((prev: GoogleSheetsConfig) => GoogleSheetsConfig)
  ) => {
    setSheetsConfigState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      try {
        localStorage.setItem('nfs_sheets_config', JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save sheets config to storage', e);
      }
      return next;
    });
  };

  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  // Telegram Config (Persisted in LocalStorage)
  const [telegramConfig, setTelegramConfigState] = useState<TelegramConfig>(() => {
    try {
      const saved = localStorage.getItem('nfs_telegram_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedUrl = parsed.miniAppUrl;
        const cleanUrl = (!savedUrl || savedUrl.includes('ais-dev-') || savedUrl.includes('run.app'))
          ? 'https://nafis-store.pages.dev'
          : savedUrl;
        return {
          botToken: parsed.botToken || '',
          channelId: parsed.channelId || '@NafisSmartTrade',
          miniAppUrl: cleanUrl,
          adminUsername: parsed.adminUsername || 'nafistejarat_bot',
        };
      }
    } catch (e) {
      console.error('Failed to parse telegram config:', e);
    }
    return {
      botToken: '',
      channelId: '@NafisSmartTrade',
      miniAppUrl: 'https://nafis-store.pages.dev',
      adminUsername: 'nafistejarat_bot',
    };
  });

  const setTelegramConfig = (
    value: TelegramConfig | ((prev: TelegramConfig) => TelegramConfig)
  ) => {
    setTelegramConfigState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      try {
        localStorage.setItem('nfs_telegram_config', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save telegram config:', e);
      }
      return next;
    });
  };

  // WebStore Sync Config (NafisStore WooCommerce)
  const [webStoreConfig, setWebStoreConfig] = useState<WebStoreConfig>({
    storeUrl: 'https://nafisstore.com',
    subdomainUrl: 'https://nfs.nafisstore.com',
    consumerKey: 'ck_nfs_748291047291048201',
    consumerSecret: 'cs_nfs_secret_92819481920',
    autoSyncOnScan: false,
    status: 'connected',
    lastSyncedAt: '18:30:00',
    totalProductsPublished: 4,
  });
  const [isWebStoreModalOpen, setIsWebStoreModalOpen] = useState(false);
  const [webStoreSyncProduct, setWebStoreSyncProduct] = useState<ProductItem | null>(null);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isSheetCleanerOpen, setIsSheetCleanerOpen] = useState(false);

  // Telegram Mini App Notifications
  const [miniAppNotifications, setMiniAppNotifications] = useState<MiniAppNotification[]>([
    {
      id: 'notif-1',
      inquiryId: 'INQ-1002',
      title: 'پیش‌فاکتور جدید صادر شد',
      message: 'مدیریت بازرگانی: پیش‌فاکتور تیراژ ۲۰۰ عدد با تخفیف ویژه صادر گردید.',
      timestamp: '18:40',
      read: false,
      type: 'quote_ready',
      productTitle: 'پاوربانک خورشیدی وایرلس ۲۰۰۰۰mAh ضدآب',
      productImage: 'https://images.unsplash.com/photo-1609592424360-63165b4c10bb?w=500&auto=format&fit=crop&q=80',
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleWebsitePublishSuccess = (productId: string, liveUrl: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, isSyncedToWebsite: true, websiteProductUrl: liveUrl } : p
      )
    );
    showToast(`محصول با موفقیت در سایت nafisstore.com منتشر شد!`);
  };

  // Refresh live currency rates from TGJU / AlanChand / Server
  const handleRefreshRates = async (showToastNotification: boolean = true) => {
    setIsRefreshingRates(true);
    try {
      const freshRates = await fetchLiveExchangeRates('TGJU / AlanChand');
      setCurrencyRates(freshRates);
      setSettings((s) => ({
        ...s,
        usdToTomanRate: freshRates.usd,
        aedToTomanRate: freshRates.aed,
        cnyToTomanRate: freshRates.cny,
      }));
      if (showToastNotification) {
        showToast(
          `نرخ ارز بروزرسانی شد: دلار ${freshRates.usd.toLocaleString('fa-IR')} | درهم ${freshRates.aed.toLocaleString('fa-IR')} | یوان ${freshRates.cny.toLocaleString('fa-IR')} تومان`
        );
      }
    } catch (err) {
      console.error('Rate update error:', err);
      if (showToastNotification) {
        showToast('خطا در دریافت نرخ‌های جدید.');
      }
    } finally {
      setIsRefreshingRates(false);
    }
  };

  const handleSaveCustomRates = (customUsd: number, customAed: number, customCny: number) => {
    const updatedRates: CurrencyRates = {
      usd: customUsd,
      aed: customAed,
      cny: customCny,
      lastUpdated: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      source: 'تنظیم دستی همکار',
      isAutoUpdate: false,
      updateIntervalMinutes: 1,
    };
    setCurrencyRates(updatedRates);
    setSettings((s) => ({
      ...s,
      usdToTomanRate: customUsd,
      aedToTomanRate: customAed,
      cnyToTomanRate: customCny,
    }));
    saveCustomRatesToServer(customUsd, customAed, customCny);
    showToast(`نرخ دلار به ${customUsd.toLocaleString('fa-IR')} تومان تغییر یافت و قیمت تمام کالاها مجدداً محاسبه شد.`);
  };

  // Auto-refresh rates every 25 seconds
  useEffect(() => {
    handleRefreshRates(false);
    const interval = setInterval(() => {
      handleRefreshRates(false);
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Update Toman calculated prices when USD rate changes
  useEffect(() => {
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        tieredPricing: p.tieredPricing.map((tier) => ({
          ...tier,
          calculatedPriceToman: Math.round(tier.priceUsd * currencyRates.usd * (1 + settings.targetMarginPercent / 100)),
        })),
      }))
    );
  }, [currencyRates.usd, settings.targetMarginPercent]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        showToast(`خوش آمدید! اتصال به حساب ${res.user.displayName || res.user.email} برقرار شد.`);
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      showToast('خطا در ورود به حساب گوگل. لطفاً مجدداً امتحان کنید.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      showToast('با موفقیت از حساب گوگل خارج شدید.');
    } catch (err) {
      console.error(err);
    }
  };

  // Create a brand new Google Spreadsheet in user's Drive
  const handleCreateNewSheet = async () => {
    if (!user) {
      handleLogin();
      return;
    }

    setIsCreatingSheet(true);
    try {
      const res = await createWholesaleSpreadsheet();
      setSheetsConfig({
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl,
        sheetTitle: res.title,
        lastSyncedAt: new Date().toLocaleTimeString('en-US'),
        totalSyncedCount: 0,
      });

      // Automatically append all existing products
      await appendProductsToSheet(res.spreadsheetId, products);
      setProducts((prev) => prev.map((p) => ({ ...p, isSyncedToSheets: true })));

      showToast('✅ فایل گوگل شیت با سربرگ‌های استاندارد در درایو شما ایجاد و محصولات ذخیره شدند!');
    } catch (err: any) {
      console.error('Create sheet error:', err);
      showToast(err.message || 'خطا در ایجاد شیت در گوگل درایو.');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Sync a single product to sheets
  const handleSyncProductToSheets = async (product: ProductItem) => {
    if (!user) {
      showToast('لطفاً ابتدا با حساب گوگل خود وارد شوید.');
      setActiveTab('sheets');
      return;
    }

    setIsSyncingSheets(true);
    try {
      let targetId = sheetsConfig.spreadsheetId;
      if (!targetId) {
        const newSheet = await createWholesaleSpreadsheet();
        targetId = newSheet.spreadsheetId;
        setSheetsConfig({
          spreadsheetId: newSheet.spreadsheetId,
          spreadsheetUrl: newSheet.spreadsheetUrl,
          sheetTitle: newSheet.title,
          lastSyncedAt: new Date().toLocaleTimeString('en-US'),
          totalSyncedCount: 1,
        });
      }

      const res = await appendProductsToSheet(targetId, [product]);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isSyncedToSheets: true } : p))
      );
      if (res.updatedRows > 0) {
        showToast(`محصول «${product.faTitle.substring(0, 30)}...» با موفقیت در گوگل شیت ذخیره شد.`);
      } else {
        showToast(`ℹ️ این محصول قبلاً در گوگل شیت ثبت شده بود (از درج تکراری جلوگیری شد).`);
      }
    } catch (err: any) {
      console.error('Sync product error:', err);
      showToast(err.message || 'خطا در همگام‌سازی محصول با شیت.');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Sync all products to sheets with duplicate protection
  const handleSyncAllToSheets = async () => {
    if (!user) {
      showToast('لطفاً ابتدا با حساب گوگل خود وارد شوید.');
      setActiveTab('sheets');
      return;
    }

    setIsSyncingSheets(true);
    try {
      let targetId = sheetsConfig.spreadsheetId;
      if (!targetId) {
        const newSheet = await createWholesaleSpreadsheet();
        targetId = newSheet.spreadsheetId;
        setSheetsConfig({
          spreadsheetId: newSheet.spreadsheetId,
          spreadsheetUrl: newSheet.spreadsheetUrl,
          sheetTitle: newSheet.title,
          lastSyncedAt: new Date().toLocaleTimeString('en-US'),
          totalSyncedCount: products.length,
        });
      }

      const res = await appendProductsToSheet(targetId, products);
      setProducts((prev) => prev.map((p) => ({ ...p, isSyncedToSheets: true })));
      if (res.updatedRows > 0) {
        showToast(`✅ تعداد ${res.updatedRows} محصول جدید در شیت ثبت شد (${res.skippedDuplicates} تکراری رد شد).`);
      } else {
        showToast(`ℹ️ تمام ${res.skippedDuplicates} محصول قبلاً در گوگل شیت ثبت شده بودند و از درج تکراری جلوگیری شد.`);
      }
    } catch (err: any) {
      console.error('Sync all error:', err);
      showToast(err.message || 'خطا در ذخیره در شیت.');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Open Google Sheet duplicate rows cleaner modal
  const handleCleanSheetDuplicates = () => {
    if (!user || !sheetsConfig.spreadsheetId) {
      showToast('لطفاً ابتدا حساب گوگل را متصل کنید.');
      return;
    }
    setIsSheetCleanerOpen(true);
  };

  // Import products from Google Sheet back into Catalog & Mini App
  const handleImportFromSheet = async (showNotification = true) => {
    if (!sheetsConfig.spreadsheetId) {
      if (showNotification) showToast('لطفاً ابتدا یک فایل شیت را متصل نمایید.');
      return;
    }

    setIsSyncingSheets(true);
    try {
      const items = await readProductsFromSheet(sheetsConfig.spreadsheetId, currencyRates.usd);
      if (items.length === 0) {
        if (showNotification) showToast('هیچ داده‌ای در فایل گوگل شیت یافت نشد.');
        return;
      }
      setProducts(items);
      setSelectedProduct(items[0] || null);
      if (showNotification) {
        showToast(`✅ تعداد ${items.length} کالا با موفقیت از گوگل شیت بارگذاری شد و در کاتالوگ و مینی‌آپ قرار گرفت!`);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      if (showNotification) {
        showToast(err.message || 'خطا در خواندن اطلاعات از گوگل شیت.');
      }
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Auto-sync products from Google Sheets on app load when user & sheet are connected
  useEffect(() => {
    if (user && sheetsConfig.spreadsheetId) {
      readProductsFromSheet(sheetsConfig.spreadsheetId, currencyRates.usd)
        .then((items) => {
          if (items.length > 0) {
            setProducts(items);
            setSelectedProduct(items[0] || null);
          }
        })
        .catch((e) => console.warn('Auto-sync from sheet error', e));
    }
  }, [user, sheetsConfig.spreadsheetId]);

  const handleUpdateProductImages = (
    productId: string,
    newImages: string[],
    newMainImage: string
  ) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, images: newImages, mainImage: newMainImage }
          : p
      )
    );
    showToast('گالری تصاویر محصول با موفقیت به‌روزرسانی شد.');
  };

  const handleNewProductsFound = (newItems: ProductItem[]) => {
    setProducts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id.trim()));
      const uniqueNew = newItems.filter((n) => !existingIds.has(n.id.trim()));
      return [...uniqueNew, ...prev];
    });
    if (newItems.length > 0) {
      setSelectedProduct(newItems[0]);
    }
    setActiveTab('catalog');
    showToast(`⚡ ${newItems.length} محصول ترند و پرسود جدید با موفقیت به کاتالوگ شما اضافه شدند!`);

    if (settings.autoSyncToSheets && user && sheetsConfig.spreadsheetId) {
      appendProductsToSheet(sheetsConfig.spreadsheetId, newItems)
        .then((res) => {
          setProducts((current) =>
            current.map((item) =>
              newItems.some((n) => n.id === item.id) ? { ...item, isSyncedToSheets: true } : item
            )
          );
          if (res.updatedRows > 0) {
            showToast(`محصولات جدید (${res.updatedRows} عدد) به طور خودکار به گوگل شیت اضافه شدند.`);
          } else {
            showToast(`این محصولات قبلاً در گوگل شیت ثبت شده بودند (از ثبت تکراری جلوگیری شد).`);
          }
        })
        .catch((e) => console.error('Auto sync error:', e));
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (selectedProduct?.id === id) {
      setSelectedProduct(products.find((p) => p.id !== id) || null);
    }
    showToast('محصول از کاتالوگ حذف گردید.');
  };

  const handleUpdateProductPricing = (updatedProduct: ProductItem) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    if (selectedProduct?.id === updatedProduct.id) {
      setSelectedProduct(updatedProduct);
    }
    showToast(`قیمت‌های هوشمند بر اساس حاشیه سود برای «${updatedProduct.faTitle.substring(0, 30)}...» با موفقیت اعمال شدند.`);
  };

  // CRM: Customer approval handlers
  const handleApproveCustomer = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'approved', approvedAt: new Date().toISOString().split('T')[0] } : c))
    );
    if (currentCustomer.id === id) {
      setCurrentCustomer((c) => ({ ...c, status: 'approved' }));
    }
    showToast('همکار با موفقیت تایید شد. دسترسی به قیمت‌های عمده فعال شد.');
  };

  const handleRejectCustomer = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'rejected' } : c))
    );
    if (currentCustomer.id === id) {
      setCurrentCustomer((c) => ({ ...c, status: 'rejected' }));
    }
    showToast('دسترسی همکار به حالت تعلیق درآمد.');
  };

  const handleRegisterCustomer = (
    data: Omit<CustomerUser, 'id' | 'requestedAt' | 'totalOrdersCount' | 'tier' | 'status'>
  ) => {
    const newCust: CustomerUser = {
      ...data,
      id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
      status: 'pending',
      requestedAt: new Date().toISOString().split('T')[0],
      tier: 'همکار برنزی',
      totalOrdersCount: 0,
    };
    setCustomers((prev) => [newCust, ...prev]);
    setCurrentCustomer(newCust);
    showToast('درخواست ثبت‌نام شما ارسال شد و در انتظار تایید مدیریت است.');
  };

  // CRM: Inquiry submissions & chat
  const handleSubmitInquiry = (productId: string, quantity: number) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    let matchedTier = targetProduct.tieredPricing[0];
    for (const t of targetProduct.tieredPricing) {
      if (quantity >= t.minQuantity) matchedTier = t;
    }
    const unitToman = matchedTier?.calculatedPriceToman || Math.round(targetProduct.costPerUnitUsd * currencyRates.usd * 1.4);

    const newInquiry: CustomerInquiry = {
      id: `INQ-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      customerTelegram: currentCustomer.telegramUsername,
      customerPhone: currentCustomer.phone,
      productId: targetProduct.id,
      productTitle: targetProduct.faTitle,
      productImage: targetProduct.mainImage,
      requestedQuantity: quantity,
      unitPriceToman: unitToman,
      totalPriceToman: unitToman * quantity,
      unitPriceUsd: matchedTier?.priceUsd || targetProduct.costPerUnitUsd,
      status: 'pending_review',
      createdAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      updatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'customer',
          senderName: currentCustomer.name,
          text: `درخواست استعلام قیمت و صدور پیش‌فاکتور برای تیراژ ${quantity} عدد کالا ثبت شد.`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        },
      ],
    };

    setInquiries((prev) => [newInquiry, ...prev]);
    showToast(`استعلام تیراژ ${quantity} عدد با موفقیت ثبت شد و به پنل ادمین ارسال گردید.`);
  };

  const handleReplyToInquiry = (
    inquiryId: string,
    replyText: string,
    newStatus?: CustomerInquiry['status'],
    newUnitPriceToman?: number
  ) => {
    setInquiries((prev) =>
      prev.map((inq) => {
        if (inq.id !== inquiryId) return inq;
        const updatedUnit = newUnitPriceToman !== undefined ? newUnitPriceToman : inq.unitPriceToman;
        return {
          ...inq,
          status: newStatus || inq.status,
          unitPriceToman: updatedUnit,
          totalPriceToman: updatedUnit * inq.requestedQuantity,
          updatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
          messages: [
            ...inq.messages,
            {
              id: `msg-${Date.now()}`,
              sender: 'admin',
              senderName: 'مدیریت بازرگانی',
              text: replyText,
              timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
            },
          ],
        };
      })
    );

    const targetInq = inquiries.find((i) => i.id === inquiryId);
    const newNotif: MiniAppNotification = {
      id: `notif-${Date.now()}`,
      inquiryId,
      title: newStatus === 'quoted' ? 'پیش‌فاکتور جدید صادر شد' : 'پاسخ جدید ادمین دریافت شد',
      message: replyText.substring(0, 100),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: newStatus === 'quoted' ? 'quote_ready' : 'inquiry_response',
      productTitle: targetInq?.productTitle,
      productImage: targetInq?.productImage,
    };
    setMiniAppNotifications((prev) => [newNotif, ...prev]);

    // Native Browser Web Push Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(newNotif.title, {
          body: `${targetInq?.productTitle || 'استعلام شما'}: ${replyText}`,
          icon: targetInq?.productImage || '/favicon.ico',
        });
      } catch (e) {
        console.warn('Browser notification error:', e);
      }
    }

    showToast('پاسخ و پیش‌فاکتور با موفقیت ارسال شد و اعلان آنی در مینی‌آپ ظاهر گردید.');
  };

  const handleCustomerSendMessage = (inquiryId: string, text: string) => {
    setInquiries((prev) =>
      prev.map((inq) => {
        if (inq.id !== inquiryId) return inq;
        return {
          ...inq,
          updatedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
          messages: [
            ...inq.messages,
            {
              id: `msg-${Date.now()}`,
              sender: 'customer',
              senderName: currentCustomer.name,
              text,
              timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
            },
          ],
        };
      })
    );
    showToast('پیام شما برای مدیریت بازرگانی ارسال گردید.');
  };

  const handleApproveProforma = (inquiryId: string) => {
    setInquiries((prev) =>
      prev.map((i) => (i.id === inquiryId ? { ...i, status: 'approved_by_client' } : i))
    );
    showToast('پیش‌فاکتور تایید شد و سفارش به مرحله تامین منتقل گردید.');
  };

  // If in standalone Telegram MiniApp mode (on pages.dev / Telegram / Mobile)
  if (viewMode === 'miniapp') {
    return (
      <TelegramMiniAppPreview
        products={products}
        selectedProduct={selectedProduct}
        onSelectProduct={setSelectedProduct}
        currencyRates={currencyRates}
        currentCustomer={currentCustomer}
        onSubmitInquiry={handleSubmitInquiry}
        notifications={miniAppNotifications}
        onMarkNotificationRead={(id) =>
          setMiniAppNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          )
        }
        inquiries={inquiries}
        onApproveQuote={handleApproveProforma}
        onCustomerSendMessage={handleCustomerSendMessage}
        isStandalone={true}
        onSwitchToAdmin={() => setViewMode('admin')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        currencyRates={currencyRates}
        onRefreshRates={() => handleRefreshRates(true)}
        isRefreshingRates={isRefreshingRates}
        productsCount={products.length}
        syncedSheetsCount={products.filter((p) => p.isSyncedToSheets).length}
        pendingInquiriesCount={inquiries.filter((i) => i.status === 'pending_review').length}
        pendingCustomersCount={customers.filter((c) => c.status === 'pending').length}
        onOpenManualIngest={() => setIsManualIngestOpen(true)}
        currentCustomer={currentCustomer}
        onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSwitchToMiniApp={() => setViewMode('miniapp')}
      />

      {/* Extension Products Notification Banner */}
      {pendingExtensionProducts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/20 via-indigo-600/25 to-amber-500/20 border-b border-amber-500/40 px-4 py-2 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <strong>⚡ {pendingExtensionProducts.length} محصول از افزونه کروم کالا‌یاب دریافت شد:</strong>
            <span className="text-slate-300 font-mono truncate max-w-md">{pendingExtensionProducts[0]?.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsManualIngestOpen(true)}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-xs transition cursor-pointer shadow"
            >
              مشاهده و ثبت در کاتالوگ
            </button>
            <button
              onClick={async () => {
                const id = pendingExtensionProducts[0]?.id;
                if (id) {
                  await fetch(`/api/extension/pending/${id}`, { method: 'DELETE' });
                  setPendingExtensionProducts(prev => prev.slice(1));
                }
              }}
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
              title="رد کردن"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'agent' && (
          <SourcingAgentTab
            settings={settings}
            setSettings={setSettings}
            onNewProductsFound={handleNewProductsFound}
            usdRate={currencyRates.usd}
          />
        )}

        {activeTab === 'catalog' && (
          <ProductsCatalogTab
            products={products}
            onSyncProductToSheets={handleSyncProductToSheets}
            onSyncAllToSheets={handleSyncAllToSheets}
            onSelectForTelegramPost={(p) => {
              setSelectedProduct(p);
              setActiveTab('telegram');
            }}
            onSelectForMiniApp={(p) => {
              setSelectedProduct(p);
              setActiveTab('miniapp');
            }}
            onDeleteProduct={handleDeleteProduct}
            onOpenWebStoreSync={(p) => {
              setWebStoreSyncProduct(p);
              setIsWebStoreModalOpen(true);
            }}
            isSyncing={isSyncingSheets}
            usdRate={currencyRates.usd}
            currencyRates={currencyRates}
            selectedProduct={selectedProduct}
            onSelectProduct={setSelectedProduct}
            onUpdateProductPricing={handleUpdateProductPricing}
            onImportFromSheets={() => handleImportFromSheet(true)}
            sheetsConfig={sheetsConfig}
            onCleanDuplicates={handleCleanSheetDuplicates}
            onUpdateProductImages={handleUpdateProductImages}
          />
        )}

        {activeTab === 'miniapp' && (
          <TelegramMiniAppPreview
            products={products}
            selectedProduct={selectedProduct}
            onSelectProduct={setSelectedProduct}
            currencyRates={currencyRates}
            currentCustomer={currentCustomer}
            onSubmitInquiry={handleSubmitInquiry}
            notifications={miniAppNotifications}
            onMarkNotificationRead={(id) =>
              setMiniAppNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
              )
            }
            inquiries={inquiries}
            onApproveQuote={handleApproveProforma}
            onCustomerSendMessage={handleCustomerSendMessage}
          />
        )}

        {activeTab === 'telegram' && (
          <TelegramPostGeneratorTab
            products={products}
            selectedProduct={selectedProduct}
            onSelectProduct={setSelectedProduct}
            telegramConfig={telegramConfig}
            setTelegramConfig={setTelegramConfig}
            usdRate={currencyRates.usd}
            onImportFromSheets={() => handleImportFromSheet(true)}
            isSyncingSheets={isSyncingSheets}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanelTab
            customers={customers}
            onApproveCustomer={handleApproveCustomer}
            onRejectCustomer={handleRejectCustomer}
            inquiries={inquiries}
            onReplyToInquiry={handleReplyToInquiry}
          />
        )}

        {activeTab === 'portal' && (
          <CustomerPortalTab
            currentCustomer={currentCustomer}
            onSwitchCustomer={setCurrentCustomer}
            allCustomers={customers}
            inquiries={inquiries}
            onCustomerSendMessage={handleCustomerSendMessage}
            onApproveProforma={handleApproveProforma}
            onRegisterCustomer={handleRegisterCustomer}
          />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsTab
            user={user}
            onLogin={handleLogin}
            sheetsConfig={sheetsConfig}
            onCreateNewSheet={handleCreateNewSheet}
            onSyncAll={handleSyncAllToSheets}
            isCreating={isCreatingSheet}
            isSyncing={isSyncingSheets}
            products={products}
            setSpreadsheetIdManual={(input) => {
              const cleanId = extractSpreadsheetId(input);
              if (!cleanId) return;
              setSheetsConfig((prev) => ({
                ...prev,
                spreadsheetId: cleanId,
                spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}`,
              }));
              showToast('فایل گوگل شیت با موفقیت متصل شد.');
              setTimeout(() => {
                handleImportFromSheet(false);
              }, 500);
            }}
            onImportFromSheet={handleImportFromSheet}
            onNavigateToTelegramPost={() => setActiveTab('telegram')}
            onCleanDuplicates={handleCleanSheetDuplicates}
          />
        )}

        {activeTab === 'automation' && <AutomationGuideTab />}
      </main>

      {/* Manual Product Ingest Modal */}
      <ManualProductIngestModal
        isOpen={isManualIngestOpen}
        onClose={() => setIsManualIngestOpen(false)}
        onAddProduct={(newProd) => {
          handleNewProductsFound([newProd]);
          showToast(`کالای «${newProd.faTitle.substring(0, 30)}...» با موفقیت افزوده و سئو شد.`);
        }}
        currencyRates={currencyRates}
        targetMarginPercent={settings.targetMarginPercent}
      />

      {/* WebStore Sync Modal (NafisStore WooCommerce) */}
      <WebStoreSyncModal
        isOpen={isWebStoreModalOpen}
        onClose={() => setIsWebStoreModalOpen(false)}
        product={webStoreSyncProduct}
        currencyRates={currencyRates}
        webStoreConfig={webStoreConfig}
        onUpdateConfig={setWebStoreConfig}
        onPublishSuccess={handleWebsitePublishSuccess}
      />

      {/* Currency Rates Live Refresh & Custom Editor Modal */}
      <CurrencyRatesModal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        currencyRates={currencyRates}
        onRefreshRates={() => handleRefreshRates(true)}
        isRefreshing={isRefreshingRates}
        onSaveCustomRates={handleSaveCustomRates}
      />

      {/* Google Sheets Duplicate Rows Cleaner Modal */}
      <SheetCleanerModal
        isOpen={isSheetCleanerOpen}
        onClose={() => setIsSheetCleanerOpen(false)}
        spreadsheetId={sheetsConfig.spreadsheetId}
        spreadsheetUrl={sheetsConfig.spreadsheetUrl}
        onSelectSpreadsheet={(newId) => {
          setSheetsConfig((prev) => ({
            ...prev,
            spreadsheetId: newId,
            spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${newId}`,
          }));
          showToast('فایل گوگل شیت فعال با موفقیت تغییر یافت.');
        }}
        onCleaningSuccess={async () => {
          await handleImportFromSheet(false);
          showToast('فایل گوگل شیت با موفقیت از ردیف‌های تکراری پاکسازی شد.');
        }}
      />

      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-[#E63946]/50 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#E63946]"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
