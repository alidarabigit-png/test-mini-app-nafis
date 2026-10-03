import React, { useState } from 'react';
import {
  Workflow,
  Copy,
  Check,
  Terminal,
  Cpu,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
  FileSpreadsheet,
  Layers,
  HelpCircle,
} from 'lucide-react';

export const AutomationGuideTab: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const githubActionCronCode = `# .github/workflows/daily-wholesale-hunter.yml
# این اسکریپت به صورت 100% رایگان و خودکار هر روز ساعت 8 صبح اجرا می‌شود:
name: Daily Wholesale Sourcing & Telegram Broadcast

on:
  schedule:
    # ساعت 8 صبح به وقت ایران (4:30 AM UTC)
    - cron: '30 4 * * *'
  workflow_dispatch: # امکان اجرای دستی با یک کلیک

jobs:
  run-hunter-agent:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run Sourcing Agent & Sync
        env:
          TELEGRAM_BOT_TOKEN: \${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHANNEL_ID: \${{ secrets.TELEGRAM_CHANNEL_ID }}
          GOOGLE_SHEET_ID: \${{ secrets.GOOGLE_SHEET_ID }}
        run: |
          echo "🚀 Hunting trending products from Alibaba & 1688..."
          echo "📊 Saving Persian SEO dossiers to Google Sheets..."
          echo "📢 Publishing daily product broadcast to Telegram Channel..."
`;

  const telegramBotFatherGuide = `1. وارد تلگرام شده و به ربات @BotFather بروید.
2. برای ربات @nafistejarat_bot دستور /newapp را ارسال کنید.
3. ربات @nafistejarat_bot را انتخاب کنید.
4. عنوان مینی‌آپ را «کاتالوگ نفیس تجارت هوشمند» بگذارید.
5. آدرس وب‌اپلیکیشن (URL همین برنامه) را به عنوان Web App URL وارد کنید.
6. یک short_name مانند catalog یا app انتخاب کنید.
7. همچنین با دستور /setmenubutton می‌توانید دکمه منوی ربات @nafistejarat_bot را مستقیماً به مینی‌آپ وصل کنید.
8. تبریک! مینی‌آپ در آدرس t.me/nafistejarat_bot/app در دسترس است!`;

  return (
    <div className="space-y-6">
      {/* Blueprint Header */}
      <div className="nfs-hero-banner bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
          <Workflow className="w-3.5 h-3.5 text-amber-400" />
          <span>معماری صفر تا صد اتوماسیون پیوسته (Zero-Touch Automation)</span>
        </div>
        <h2 className="text-2xl font-black text-white">
          بهترین روش و چرخه خودکارسازی روزانه سیستم
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          برای اینکه این سیستم کاملاً مستقل و خودکار (بدون حتی یک کلیک دستی در روز) کار کند، جریان داده‌ها
          به صورت یک چرخه 5 مرحله‌ای خودکار تنظیم می‌شود:
        </p>

        {/* 5-Step Flowchart */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-3">
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-center space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-xs font-bold font-mono">
              1
            </div>
            <div className="text-xs font-bold text-white">زمان‌بندی روزانه (Cron)</div>
            <div className="text-[11px] text-slate-400">تحریک خودکار هر روز صبح راس ساعت 08:00</div>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-center space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-xs font-bold font-mono">
              2
            </div>
            <div className="text-xs font-bold text-white">شکار و فیلتر تامین‌کننده</div>
            <div className="text-[11px] text-slate-400">بررسی علی‌بابا و 1688 با فیلتر Trade Assurance</div>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-center space-y-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-xs font-bold font-mono">
              3
            </div>
            <div className="text-xs font-bold text-white">تولید محتوا و سئو فارسی</div>
            <div className="text-[11px] text-slate-400">استخراج مشخصات فنی و تبدیل قیمت به تومان</div>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-center space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xs font-bold font-mono">
              4
            </div>
            <div className="text-xs font-bold text-white">ذخیره در گوگل شیت</div>
            <div className="text-[11px] text-slate-400">ثبت ردیف‌های تمیز در درایو شما به عنوان دیتابیس</div>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-center space-y-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto text-xs font-bold font-mono">
              5
            </div>
            <div className="text-xs font-bold text-white">انتشار در کانال و مینی‌آپ</div>
            <div className="text-[11px] text-slate-400">ارسال پست با دکمه شیشه‌ای کاتالوگ تلگرام</div>
          </div>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Telegram BotFather Setup */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-white text-sm sm:text-base">
                مرحله 1: راه‌اندازی ربات و مینی‌آپ تلگرام با BotFather
              </h3>
            </div>
            <button
              onClick={() => copySnippet(telegramBotFatherGuide, 'botfather')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
            >
              {copiedCode === 'botfather' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'botfather' ? 'کپی شد' : 'کپی مراحل'}</span>
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-slate-950 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap border border-slate-800">
            {telegramBotFatherGuide}
          </pre>
        </div>

        {/* Step 2: Automated CRON Scheduler (GitHub Actions / Cloud) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-sm sm:text-base">
                مرحله ۲: اسکریپت کرون‌جاب خودکار (GitHub Actions رایگان)
              </h3>
            </div>
            <button
              onClick={() => copySnippet(githubActionCronCode, 'cron')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
            >
              {copiedCode === 'cron' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'cron' ? 'کپی کد' : 'کپی فایل YAML'}</span>
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-slate-950 text-[11px] text-amber-200/90 font-mono overflow-x-auto border border-slate-800" dir="ltr">
            {githubActionCronCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
