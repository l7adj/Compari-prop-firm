import { Search, BarChart3, ShieldCheck, Table2, ArrowLeft, ExternalLink, Filter, Calculator, AlertTriangle } from 'lucide-react';

const companies = [
  { name: 'FTMO', type: 'CFD Prop Firm', price: '$155', account: '$10K', risk: '5% / 10%', platforms: 'MT4, MT5, cTrader', status: 'ready' },
  { name: 'FundedNext', type: 'CFD Prop Firm', price: '$59', account: '$6K', risk: '3% / 6%', platforms: 'MT4, MT5', status: 'partial' },
  { name: 'Topstep', type: 'Futures Prop Firm', price: '$49/mo', account: '$50K', risk: 'Trailing', platforms: 'Tradovate, NinjaTrader', status: 'ready' },
  { name: 'Exness', type: 'Broker', price: '$10', account: 'Standard', risk: 'N/A', platforms: 'MT4, MT5', status: 'ready' },
  { name: 'Binance', type: 'Crypto Exchange', price: '0.10%', account: 'Spot/Futures', risk: 'KYC', platforms: 'Web, App, API', status: 'partial' }
];

const comparisonRows = [
  ['أقل تكلفة', '$59', '$155', 'اعتمد على البرنامج والحجم'],
  ['أكبر حساب', '$300K', '$200K', 'تحقق من قواعد التوسع'],
  ['التراجع اليومي', '3%', '5%', 'الأقل ليس دائمًا الأفضل'],
  ['التراجع الكلي', '6%', '10%', 'نوع الحساب مهم'],
  ['أول سحب', 'حسب البرنامج', 'بعد التحقق', 'راجع المصدر الرسمي'],
  ['المنصات', 'MT4 / MT5', 'MT4 / MT5 / cTrader', 'حسب أسلوب التداول']
];

function Badge({ status }) {
  return <span className={`badge ${status === 'ready' ? 'badgeReady' : 'badgePartial'}`}>{status === 'ready' ? 'بيانات موثقة' : 'بيانات جزئية'}</span>;
}

function Header() {
  return (
    <header className="topbar">
      <div className="shell navwrap">
        <div className="brand">محطة التمويل</div>
        <nav className="navlinks">
          <a href="#home">الرئيسية</a>
          <a href="#firms">شركات التمويل</a>
          <a href="#brokers">البروكرات</a>
          <a href="#crypto">الكريبتو</a>
          <a href="#compare">المقارنات</a>
          <a href="#tools">الأدوات</a>
        </nav>
        <button className="primaryBtn">ابدأ المقارنة</button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="home" className="hero shell">
      <div className="heroText">
        <p className="eyebrow">محرك مقارنة مالي عربي</p>
        <h1>قارن شركات التمويل والبروكرات قبل فتح الحساب</h1>
        <p className="lead">واجهة بيانات منظمة تعرض الخطط، القواعد، الدرو داون، السحب، الرسوم، المنصات، والمخاطر بدون حشو أو وعود ربح.</p>
        <div className="searchbar">
          <Search size={20} />
          <input placeholder="ابحث عن FTMO، Exness، Binance..." />
          <button>بحث</button>
        </div>
        <div className="heroActions">
          <a className="primaryLink" href="#firms">تصفح الشركات <ArrowLeft size={18} /></a>
          <a className="secondaryLink" href="#compare">افتح المقارنة</a>
        </div>
      </div>
      <div className="heroPanel">
        <div className="panelHeader">
          <span>لوحة قرار سريع</span>
          <Badge status="ready" />
        </div>
        <div className="metricRows">
          <div><span>الشركات</span><strong>106</strong></div>
          <div><span>Ready</span><strong>51</strong></div>
          <div><span>Partial</span><strong>55</strong></div>
          <div><span>أنواع البيانات</span><strong>5</strong></div>
        </div>
        <div className="notice"><AlertTriangle size={18} /> تحقق دائمًا من الموقع الرسمي قبل شراء أي تحدي أو فتح حساب.</div>
      </div>
    </section>
  );
}

function CategoryStrip() {
  const items = ['CFD Prop Firms', 'Futures Prop Firms', 'Crypto Prop Firms', 'Brokers', 'Crypto Exchanges'];
  return <section className="shell strip">{items.map((x) => <button key={x}>{x}</button>)}</section>;
}

function Directory() {
  return (
    <section id="firms" className="shell sectionGrid">
      <aside className="filters">
        <div className="sectionTitle"><Filter size={20} /><h2>فلترة البيانات</h2></div>
        <label>نوع الشركة<select><option>الكل</option><option>CFD Prop Firm</option><option>Broker</option></select></label>
        <label>حالة البيانات<select><option>Ready + Partial</option><option>Ready فقط</option><option>Partial فقط</option></select></label>
        <label>المنصات<select><option>كل المنصات</option><option>MT4 / MT5</option><option>TradingView</option></select></label>
        <button className="wideBtn">تطبيق الفلاتر</button>
      </aside>
      <div className="directory">
        <div className="sectionHead"><div><p className="eyebrow">قائمة مختصرة</p><h2>شركات ومنصات للمراجعة</h2></div><a href="#compare">قارن الآن</a></div>
        <div className="dataTableWrap">
          <table className="dataTable">
            <thead><tr><th>الاسم</th><th>النوع</th><th>أقل تكلفة/إيداع</th><th>الحساب</th><th>المخاطر</th><th>المنصات</th><th>الحالة</th></tr></thead>
            <tbody>{companies.map((c) => <tr key={c.name}><td><strong>{c.name}</strong></td><td>{c.type}</td><td>{c.price}</td><td>{c.account}</td><td>{c.risk}</td><td>{c.platforms}</td><td><Badge status={c.status} /></td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ReviewTemplatePreview() {
  return (
    <section id="brokers" className="shell reviewPreview">
      <div className="reviewHero">
        <div><p className="eyebrow">قالب مراجعة ديناميكي</p><h2>FundedNext Review Template</h2><p>يعرض كل برنامج مستقلًا ثم جدول الخطط داخله. لا يعرض الحقول الفارغة ولا يكرر المعلومات.</p></div>
        <div className="reviewMeta"><Badge status="partial" /><a href="#" className="primaryLink">الموقع الرسمي <ExternalLink size={16} /></a></div>
      </div>
      <div className="quickMatrix">
        <div><span>أقل سعر</span><strong>$59</strong></div><div><span>أكبر حساب</span><strong>$300K</strong></div><div><span>Profit Split</span><strong>حتى 90%</strong></div><div><span>المنصات</span><strong>MT4 / MT5</strong></div>
      </div>
      <div className="programBox">
        <div className="programTitle"><Table2 size={20} /><h3>Stellar 1-Step</h3></div>
        <div className="dataTableWrap"><table className="dataTable"><thead><tr><th>حجم الحساب</th><th>السعر</th><th>هدف الربح</th><th>Daily DD</th><th>Max DD</th><th>Profit Split</th><th>أول سحب</th></tr></thead><tbody><tr><td>$6K</td><td>$59</td><td>10%</td><td>3%</td><td>6%</td><td>80% - 90%</td><td>حسب القواعد</td></tr><tr><td>$25K</td><td>$199</td><td>10%</td><td>3%</td><td>6%</td><td>80% - 90%</td><td>حسب القواعد</td></tr><tr><td>$100K</td><td>$549</td><td>10%</td><td>3%</td><td>6%</td><td>80% - 90%</td><td>حسب القواعد</td></tr></tbody></table></div>
      </div>
    </section>
  );
}

function Comparison() {
  return (
    <section id="compare" className="shell comparison">
      <div className="sectionHead"><div><p className="eyebrow">مقارنة احترافية</p><h2>FundedNext مقابل FTMO</h2></div><span>لا يوجد فائز مطلق</span></div>
      <div className="dataTableWrap"><table className="dataTable compareTable"><thead><tr><th>المعيار</th><th>FundedNext</th><th>FTMO</th><th>ملاحظة مهنية</th></tr></thead><tbody>{comparisonRows.map((r) => <tr key={r[0]}>{r.map((v) => <td key={v}>{v}</td>)}</tr>)}</tbody></table></div>
      <div className="decisionPanel"><BarChart3 size={22} /><div><h3>قرار المتداول المحترف</h3><p>إذا كان هدفك أقل تكلفة بدايةً فالأقرب هو FundedNext، أما إذا كنت تريد شفافية أقدم وتجربة أوسع للمنصات فراجع FTMO. القرار النهائي يعتمد على نوع الدرو داون وقواعد السحب.</p></div></div>
    </section>
  );
}

function Tools() {
  return <section id="tools" className="shell tools"><div><p className="eyebrow">الأدوات</p><h2>أدوات قرار لا تعتمد على الحظ</h2></div><div className="toolRow"><div><Calculator size={20}/><span>حاسبة المخاطرة</span></div><div><BarChart3 size={20}/><span>حاسبة الدرو داون</span></div><div><ShieldCheck size={20}/><span>اختيار الشركة المناسبة</span></div></div></section>;
}

export default function App() {
  return <><Header /><main><Hero /><CategoryStrip /><Directory /><ReviewTemplatePreview /><Comparison /><Tools /></main><footer className="footer"><div className="shell"><strong>محطة التمويل</strong><span>التداول ينطوي على مخاطر عالية. المعلومات تعليمية وليست توصية مالية.</span></div></footer></>;
}
