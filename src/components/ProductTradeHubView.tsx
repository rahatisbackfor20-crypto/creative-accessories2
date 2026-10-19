import React, { useState, useMemo } from 'react';
import { 
  ProductRequest, 
  PurchaseRecord,
  SaleRecord,
  ProductionRecord,
  User, 
  Language, 
  ProductRequestStatus 
} from '../types';
import { translations } from '../i18n';
import { comparePurchasePrice } from '../storage';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Check, 
  X, 
  Flame, 
  Boxes, 
  ArrowRight,
  ShieldCheck,
  Building,
  UserCheck,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Download,
  Copy,
  Printer,
  FileSpreadsheet,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Phone,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Edit3,
  Settings,
  Hash
} from 'lucide-react';
import { getStoredCategories, saveCustomCategory, deleteCustomCategory, DEFAULT_PRODUCT_CATEGORIES } from '../categoryService';

interface ProductTradeHubViewProps {
  requests: ProductRequest[];
  purchases: PurchaseRecord[];
  sales: SaleRecord[];
  productions?: ProductionRecord[];
  users: User[];
  currentUser: User;
  language: Language;
  darkMode: boolean;
  onAddRequest: (request: Omit<ProductRequest, 'id' | 'createdAt'>) => void;
  onUpdateStatus: (id: string, status: ProductRequestStatus, notes?: string) => void;
  onConfirmReceipt: (id: string, byUserId: string) => void;
  onDeleteRequest: (id: string) => void;
  onUpdateProductRequest?: (request: ProductRequest) => void;
  onAddPurchase: (purchase: Omit<PurchaseRecord, 'id' | 'createdAt'>) => void;
  onDeletePurchase: (id: string) => void;
  onUpdatePurchase?: (purchase: PurchaseRecord) => void;
  onAddSale: (sale: Omit<SaleRecord, 'id' | 'createdAt'>) => void;
  onDeleteSale: (id: string) => void;
  onUpdateSale?: (sale: SaleRecord) => void;
  initialSubTab?: 'database' | 'buy' | 'sell' | 'requests';
}

const PRODUCT_CATEGORIES = DEFAULT_PRODUCT_CATEGORIES;

const PRESET_SUPPLIERS = [
  'China Zipper & Accessories Ltd.',
  'Bengal Yarn & Tape Mills',
  'Coats Bangladesh Ltd.',
  'Dhaka Metal Works Ltd.',
  'Apex Zipper & Fastener Supplies',
  'Tongji Chemical & Lubricants Ltd.',
  'Continental Packaging Industries',
  'Local Hardware Market (Nawabpur)'
];

const PRESET_CUSTOMERS = [
  'Ananta Apparels Ltd. (Gazipur Unit)',
  'Standard Group Fashion Division',
  'DBL Ceramics & Garments',
  'Ha-Meem Group (That\'s It Sports Wear)',
  'Beximco Apparels Ltd.',
  'Square Fashions Ltd.',
  'Epyllion Group Apparel Unit',
  'Local Wholesale Trader'
];

export const ProductTradeHubView: React.FC<ProductTradeHubViewProps> = ({
  requests = [],
  purchases = [],
  sales = [],
  productions = [],
  users = [],
  currentUser,
  language,
  darkMode,
  onAddRequest,
  onUpdateStatus,
  onConfirmReceipt,
  onDeleteRequest,
  onAddPurchase,
  onDeletePurchase,
  onAddSale,
  onDeleteSale,
  onUpdateSale,
  initialSubTab = 'database'
}) => {
  const isBn = language === 'bn';
  const t = translations[language];

  const canManage = currentUser.accountType === 'hosting' || 
                    currentUser.accountType === 'owner' || 
                    currentUser.accountType === 'md' || 
                    currentUser.accountType === 'admin';

  // Sub-tabs: 'database' | 'buy' | 'sell' | 'requests'
  const [activeSubTab, setActiveSubTab] = useState<'database' | 'buy' | 'sell' | 'requests'>(initialSubTab);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Modals
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [orderingRequestId, setOrderingRequestId] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState('');

  // Stored Categories (supporting custom manual categories)
  const [categoriesList, setCategoriesList] = useState<string[]>(() => getStoredCategories());

  // ----------------------------------------------------
  // Form State: 1. Purchase (পণ্য কেনা)
  // ----------------------------------------------------
  const [buyName, setBuyName] = useState('');
  const [buyCategory, setBuyCategory] = useState(() => getStoredCategories()[0] || 'Hardware & Sliders');
  const [buySupplier, setBuySupplier] = useState(PRESET_SUPPLIERS[0]);
  const [buyQty, setBuyQty] = useState('');
  const [buyUnit, setBuyUnit] = useState('Piece');
  const [buyUnitPrice, setBuyUnitPrice] = useState('');
  const [buyInvoice, setBuyInvoice] = useState('');
  const [buyDesc, setBuyDesc] = useState('');

  // Auto total calculation for purchase
  const calculatedBuyTotal = useMemo(() => {
    const q = parseFloat(buyQty) || 0;
    const p = parseFloat(buyUnitPrice) || 0;
    return Number((q * p).toFixed(2));
  }, [buyQty, buyUnitPrice]);

  // Price comparison for purchase
  const priceComparison = useMemo(() => {
    if (!buyName || !buyUnitPrice) return null;
    return comparePurchasePrice(buyName, buyUnit, parseFloat(buyUnitPrice) || 0, purchases);
  }, [buyName, buyUnit, buyUnitPrice, purchases]);

  // ----------------------------------------------------
  // Form State: 2. Sale (পণ্য বিক্রি)
  // ----------------------------------------------------
  const [sellName, setSellName] = useState('');
  const [sellCategory, setSellCategory] = useState(() => getStoredCategories()[0] || 'Hardware & Sliders');
  const [sellCustomer, setSellCustomer] = useState(PRESET_CUSTOMERS[0]);
  const [sellPhone, setSellPhone] = useState('');
  const [sellAddress, setSellAddress] = useState('');
  const [sellQty, setSellQty] = useState('');
  const [sellUnit, setSellUnit] = useState('Piece');
  const [sellUnitPrice, setSellUnitPrice] = useState('');
  const [sellPaidAmount, setSellPaidAmount] = useState('');
  const [sellPaymentMethod, setSellPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Bank' | 'Cheque'>('Bank');
  const [sellDeliveryStatus, setSellDeliveryStatus] = useState<'Delivered' | 'Pending' | 'In Transit'>('Delivered');
  const [sellInvoice, setSellInvoice] = useState('');
  const [sellNotes, setSellNotes] = useState('');

  // Auto calculations for sale
  const calculatedSellTotal = useMemo(() => {
    const q = parseFloat(sellQty) || 0;
    const p = parseFloat(sellUnitPrice) || 0;
    return Number((q * p).toFixed(2));
  }, [sellQty, sellUnitPrice]);

  const calculatedSellDue = useMemo(() => {
    const total = calculatedSellTotal;
    const paid = parseFloat(sellPaidAmount) || 0;
    return Math.max(0, Number((total - paid).toFixed(2)));
  }, [calculatedSellTotal, sellPaidAmount]);

  // ----------------------------------------------------
  // Form State: 3. Request (পণ্য রিকোয়েস্ট)
  // ----------------------------------------------------
  const [reqProductName, setReqProductName] = useState('');
  const [reqCategory, setReqCategory] = useState(() => getStoredCategories()[0] || 'Hardware & Sliders');
  const [reqQty, setReqQty] = useState('');
  const [reqUnit, setReqUnit] = useState('Piece');
  const [reqRemainingQty, setReqRemainingQty] = useState('');
  const [reqPriority, setReqPriority] = useState<'Normal' | 'Urgent' | 'Critical'>('Normal');
  const [reqType, setReqType] = useState<'low_stock' | 'out_of_stock'>('low_stock');
  const [reqReason, setReqReason] = useState('');

  // ----------------------------------------------------
  // Product Database Master Catalog Aggregation
  // ----------------------------------------------------
  const productDatabase = useMemo(() => {
    interface CatalogItem {
      name: string;
      category: string;
      unit: string;
      totalPurchased: number;
      totalSold: number;
      totalProduced: number;
      currentStock: number;
      avgBuyPrice: number;
      latestSellPrice: number;
      totalStockValue: number;
      lastTransactionDate: string;
      status: 'in_stock' | 'low_stock' | 'out_of_stock';
      hasPendingRequest: boolean;
    }

    const map = new Map<string, CatalogItem>();

    // Helper to get or create
    const getItem = (name: string, category: string, unit: string) => {
      const key = name.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: name.trim(),
          category: category || 'General',
          unit: unit || 'Piece',
          totalPurchased: 0,
          totalSold: 0,
          totalProduced: 0,
          currentStock: 0,
          avgBuyPrice: 0,
          latestSellPrice: 0,
          totalStockValue: 0,
          lastTransactionDate: '',
          status: 'in_stock',
          hasPendingRequest: false
        });
      }
      return map.get(key)!;
    };

    // 1. Ingest Purchases
    purchases.forEach(p => {
      const item = getItem(p.productName, p.category, p.unit);
      item.totalPurchased += Number(p.quantity || 0);
      if (p.unitPrice > 0) {
        item.avgBuyPrice = p.unitPrice;
      }
      if (p.transactionDate > item.lastTransactionDate) {
        item.lastTransactionDate = p.transactionDate;
      }
    });

    // 2. Ingest Sales
    sales.forEach(s => {
      const item = getItem(s.productName, s.category, s.unit);
      item.totalSold += Number(s.quantity || 0);
      if (s.unitPrice > 0) {
        item.latestSellPrice = s.unitPrice;
      }
      if (s.saleDate > item.lastTransactionDate) {
        item.lastTransactionDate = s.saleDate;
      }
    });

    // 3. Ingest Productions
    productions.forEach(pr => {
      const item = getItem(pr.itemName, pr.section || 'Production', pr.unit || 'Piece');
      item.totalProduced += Number(pr.prodQty || 0);
      if (pr.unitPrice && pr.unitPrice > 0) {
        item.latestSellPrice = pr.unitPrice;
      }
      if (pr.date > item.lastTransactionDate) {
        item.lastTransactionDate = pr.date;
      }
    });

    // 4. Ingest Requests
    requests.forEach(r => {
      const item = getItem(r.productName, r.category, r.unit);
      if (r.status === 'Pending' || r.status === 'Ordered') {
        item.hasPendingRequest = true;
      }
    });

    // Compute Net Stock, Valuation, and Status
    const items = Array.from(map.values()).map(item => {
      // Net Stock = (Purchased + Produced) - Sold
      // If purely raw materials: Purchases - (Sold or consumed)
      const inward = item.totalPurchased + item.totalProduced;
      const outward = item.totalSold;
      const net = Math.max(0, inward - outward);
      
      const effectivePrice = item.avgBuyPrice > 0 ? item.avgBuyPrice : (item.latestSellPrice > 0 ? item.latestSellPrice : 10);
      const val = Number((net * effectivePrice).toFixed(2));

      let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      if (net === 0) status = 'out_of_stock';
      else if (net < 50 || (item.unit === 'Roll' && net < 5) || (item.unit === 'Box' && net < 3)) status = 'low_stock';

      return {
        ...item,
        currentStock: net,
        totalStockValue: val,
        status
      };
    });

    return items.sort((a, b) => b.totalStockValue - a.totalStockValue);
  }, [purchases, sales, productions, requests]);

  // ----------------------------------------------------
  // Summary Metrics
  // ----------------------------------------------------
  const totalPurchaseSpend = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (Number(p.totalPrice) || 0), 0);
  }, [purchases]);

  const totalSalesRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  }, [sales]);

  const totalSalesCollected = useMemo(() => {
    return sales.reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
  }, [sales]);

  const totalSalesDue = useMemo(() => {
    return sales.reduce((sum, s) => sum + (Number(s.dueAmount) || 0), 0);
  }, [sales]);

  const totalInventoryStockValue = useMemo(() => {
    return productDatabase.reduce((sum, item) => sum + item.totalStockValue, 0);
  }, [productDatabase]);

  const pendingRequestsCount = useMemo(() => {
    return requests.filter(r => r.status === 'Pending').length;
  }, [requests]);

  const urgentRequestsCount = useMemo(() => {
    return requests.filter(r => (r.priority === 'Urgent' || r.priority === 'Critical') && r.status !== 'Received by Employee' && (r.status as string) !== 'Received').length;
  }, [requests]);

  const lowStockCount = useMemo(() => {
    return productDatabase.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock').length;
  }, [productDatabase]);

  // ----------------------------------------------------
  // Handlers for Add Form Submissions
  // ----------------------------------------------------
  const handleAddPurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyName.trim()) return;

    const finalCategory = buyCategory.trim() || 'General Factory Store';
    const updatedCats = saveCustomCategory(finalCategory);
    setCategoriesList(updatedCats);

    const now = new Date();
    const inv = buyInvoice.trim() || `INV-PCH-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-${Math.floor(100+Math.random()*900)}`;

    onAddPurchase({
      type: 'company_purchase',
      productName: buyName.trim(),
      category: finalCategory,
      supplier: buySupplier.trim(),
      quantity: parseFloat(buyQty) || 1,
      unit: buyUnit,
      unitPrice: parseFloat(buyUnitPrice) || 0,
      totalPrice: calculatedBuyTotal,
      transactionDate: now.toISOString().split('T')[0] + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      invoiceNumber: inv,
      description: buyDesc.trim(),
      createdBy: currentUser.fullName,
      createdById: currentUser.id,
      status: 'Approved'
    });

    showToast(isBn ? '✅ পণ্য ক্রয়ের তথ্য সফলভাবে ডাটাবেসে যুক্ত হয়েছে!' : 'Purchase recorded successfully!');
    setIsPurchaseModalOpen(false);
    // Reset
    setBuyName('');
    setBuyQty('');
    setBuyUnitPrice('');
    setBuyInvoice('');
    setBuyDesc('');
  };

  const handleAddSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellName.trim()) return;

    const finalCategory = sellCategory.trim() || 'General Factory Store';
    const updatedCats = saveCustomCategory(finalCategory);
    setCategoriesList(updatedCats);

    const now = new Date();
    const inv = sellInvoice.trim() || `SL-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-${Math.floor(100+Math.random()*900)}`;
    const paid = parseFloat(sellPaidAmount) || 0;
    const due = calculatedSellDue;
    const pStatus = due <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Due');

    onAddSale({
      invoiceNumber: inv,
      productName: sellName.trim(),
      category: finalCategory,
      customerName: sellCustomer.trim(),
      customerPhone: sellPhone.trim(),
      customerAddress: sellAddress.trim(),
      quantity: parseFloat(sellQty) || 1,
      unit: sellUnit,
      unitPrice: parseFloat(sellUnitPrice) || 0,
      totalAmount: calculatedSellTotal,
      paidAmount: paid,
      dueAmount: due,
      saleDate: now.toISOString().split('T')[0],
      deliveryDate: now.toISOString().split('T')[0],
      deliveryStatus: sellDeliveryStatus,
      paymentStatus: pStatus,
      paymentMethod: sellPaymentMethod,
      notes: sellNotes.trim(),
      createdBy: currentUser.fullName,
      createdById: currentUser.id
    });

    showToast(isBn ? '🎉 পণ্য বিক্রির তথ্য ও ইনভয়েস সফলভাবে সেভ হয়েছে!' : 'Sale order recorded successfully!');
    setIsSaleModalOpen(false);
    // Reset
    setSellName('');
    setSellQty('');
    setSellUnitPrice('');
    setSellPaidAmount('');
    setSellInvoice('');
    setSellNotes('');
  };

  const handleAddRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqProductName.trim()) return;

    const finalCategory = reqCategory.trim() || 'General Factory Store';
    const updatedCats = saveCustomCategory(finalCategory);
    setCategoriesList(updatedCats);

    const now = new Date();
    const reqNum = `PR-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    onAddRequest({
      requestNumber: reqNum,
      productName: reqProductName.trim(),
      category: finalCategory,
      quantity: parseFloat(reqQty) || 1,
      unit: reqUnit,
      remainingQty: reqRemainingQty ? parseFloat(reqRemainingQty) : undefined,
      priority: reqPriority,
      requestType: reqType,
      requestDate: now.toISOString().split('T')[0] + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      userId: currentUser.id,
      employeeId: currentUser.employeeId || 'CAF-W',
      employeeName: currentUser.fullName,
      section: currentUser.section || 'Factory Floor',
      reason: reqReason.trim() || 'Required for production order fulfillment',
      status: 'Pending',
      updatedAt: now.toISOString()
    });

    showToast(isBn ? '⚡ পণ্য রিকোয়েস্ট অ্যাডমিন অনুমোদনের জন্য জমা দেওয়া হয়েছে!' : 'Product request submitted!');
    setIsRequestModalOpen(false);
    // Reset
    setReqProductName('');
    setReqQty('');
    setReqRemainingQty('');
    setReqReason('');
  };

  // ----------------------------------------------------
  // "ডাটাবেস কোথায় বের করতে হয়" -> DATABASE EXPORT FUNCTIONS
  // ----------------------------------------------------
  const handleExportDatabaseCSV = () => {
    const headers = [
      'Product Name',
      'Category',
      'Current In-Stock Qty',
      'Unit',
      'Total Purchased',
      'Total Sold',
      'Total Produced',
      'Average Unit Price (BDT)',
      'Total Stock Value (BDT)',
      'Stock Status',
      'Last Transaction Date'
    ];

    const rows = productDatabase.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      p.currentStock,
      `"${p.unit}"`,
      p.totalPurchased,
      p.totalSold,
      p.totalProduced,
      p.avgBuyPrice || p.latestSellPrice,
      p.totalStockValue,
      `"${p.status}"`,
      `"${p.lastTransactionDate || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Product_Database_Master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(isBn ? '📥 সম্পূর্ণ পণ্য ডাটাবেস CSV ফরম্যাটে সফলভাবে ডাউনলোড হয়েছে!' : 'Product Database exported as CSV!');
  };

  const handleExportDatabaseJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      exportDate: new Date().toISOString(),
      company: 'Creative Accessories Factory',
      totalCatalogItems: productDatabase.length,
      totalInventoryAssetValueBDT: totalInventoryStockValue,
      database: productDatabase,
      purchasesHistory: purchases,
      salesHistory: sales,
      requisitions: requests
    }, null, 2));

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Product_Database_Full_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(isBn ? '💾 সম্পূর্ণ পণ্য ডাটাবেস JSON ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে!' : 'Product Database JSON backup downloaded!');
  };

  const handleCopyDatabaseToClipboard = () => {
    const tsv = [
      ['Product Name', 'Category', 'Stock Qty', 'Unit', 'Avg Price (BDT)', 'Total Value (BDT)', 'Status'].join('\t'),
      ...productDatabase.map(p => 
        [p.name, p.category, p.currentStock, p.unit, p.avgBuyPrice || p.latestSellPrice, p.totalStockValue, p.status].join('\t')
      )
    ].join('\n');

    navigator.clipboard.writeText(tsv).then(() => {
      showToast(isBn ? '📋 সম্পূর্ণ ডাটাবেস টেবিল ক্লিপবোর্ডে কপি হয়েছে! (এক্সেল বা স্প্রেডশিটে পেস্ট করতে পারবেন)' : 'Database copied to clipboard!');
    }).catch(() => {
      showToast(isBn ? 'কপি করতে সমস্যা হয়েছে' : 'Failed to copy', 'info');
    });
  };

  // Filtered views
  const filteredDatabase = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return productDatabase.filter(p => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });
  }, [productDatabase, searchQuery, selectedCategory]);

  const filteredPurchases = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return purchases.filter(p => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (!q) return true;
      return p.productName.toLowerCase().includes(q) || 
             p.supplier.toLowerCase().includes(q) || 
             p.invoiceNumber.toLowerCase().includes(q);
    });
  }, [purchases, searchQuery, selectedCategory]);

  const filteredSales = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sales.filter(s => {
      if (selectedCategory !== 'All' && s.category !== selectedCategory) return false;
      if (!q) return true;
      return s.productName.toLowerCase().includes(q) || 
             s.customerName.toLowerCase().includes(q) || 
             s.invoiceNumber.toLowerCase().includes(q);
    });
  }, [sales, searchQuery, selectedCategory]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return requests.filter(r => {
      if (selectedCategory !== 'All' && r.category !== selectedCategory) return false;
      if (!q) return true;
      return r.productName.toLowerCase().includes(q) || 
             r.requestNumber.toLowerCase().includes(q) || 
             r.employeeName.toLowerCase().includes(q) ||
             r.section.toLowerCase().includes(q);
    });
  }, [requests, searchQuery, selectedCategory]);

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold shadow-lg animate-in slide-in-from-top duration-200 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-600 text-white shadow-emerald-600/20' 
            : 'bg-indigo-600 text-white shadow-indigo-600/20'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-white/20 cursor-pointer text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border shadow-xs relative overflow-hidden ${
        darkMode 
          ? 'bg-linear-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-900/40' 
          : 'bg-linear-to-r from-indigo-50/90 via-blue-50/40 to-white border-indigo-200/80'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md">
                <Boxes className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                  <span>{isBn ? 'পণ্য ক্রয়-বিক্রয়, ডাটাবেস ও রিকোয়েস্ট হাব' : 'Products & Trade Master Hub'}</span>
                  {pendingRequestsCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse shadow-xs">
                      ⚡ {pendingRequestsCount} {isBn ? 'রিকোয়েস্ট বাকি' : 'Pending'}
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isBn 
                    ? 'পণ্য কেনা, পণ্য বিক্রি, স্টক ডাটাবেস এক্সপোর্ট এবং কাঁচামাল রিকোয়েস্ট—সবকিছু এক প্ল্যাটফর্মে' 
                    : 'Manage procurement, sales orders, master inventory database extraction, and raw material requests'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsPurchaseModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isBn ? '+ পণ্য কেনা (Purchase)' : '+ Buy Product'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSaleModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isBn ? '+ পণ্য বিক্রি (Sale)' : '+ Sell Product'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRequestModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>{isBn ? '+ পণ্য রিকোয়েস্ট' : '+ Request'}</span>
            </button>
          </div>
        </div>

        {/* 4 Universal Top Sub-Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-slate-200/60 dark:border-slate-800/60 mt-6 scrollbar-none">
          {/* Sub-Tab 1: Product Database */}
          <button
            type="button"
            onClick={() => setActiveSubTab('database')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeSubTab === 'database'
                ? 'bg-indigo-600 text-white shadow-md'
                : darkMode 
                  ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white' 
                  : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{isBn ? '📦 পণ্য ডাটাবেস ও স্টক' : 'Product Database'}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              activeSubTab === 'database' ? 'bg-indigo-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {productDatabase.length}
            </span>
          </button>

          {/* Sub-Tab 2: Product Buying */}
          <button
            type="button"
            onClick={() => setActiveSubTab('buy')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeSubTab === 'buy'
                ? 'bg-indigo-600 text-white shadow-md'
                : darkMode 
                  ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white' 
                  : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isBn ? '🛒 পণ্য কেনা (ক্রয় রেকর্ড)' : 'Product Buying (Purchases)'}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              activeSubTab === 'buy' ? 'bg-indigo-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {purchases.length}
            </span>
          </button>

          {/* Sub-Tab 3: Product Selling */}
          <button
            type="button"
            onClick={() => setActiveSubTab('sell')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeSubTab === 'sell'
                ? 'bg-emerald-600 text-white shadow-md'
                : darkMode 
                  ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white' 
                  : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{isBn ? '🏷️ পণ্য বিক্রি (বিক্রয় ও কাস্টমার)' : 'Product Selling (Sales)'}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              activeSubTab === 'sell' ? 'bg-emerald-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {sales.length}
            </span>
          </button>

          {/* Sub-Tab 4: Product Requests */}
          <button
            type="button"
            onClick={() => setActiveSubTab('requests')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeSubTab === 'requests'
                ? 'bg-amber-600 text-white shadow-md'
                : darkMode 
                  ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white' 
                  : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-300" />
            <span>{isBn ? '⚡ পণ্য রিকোয়েস্ট' : 'Product Requests'}</span>
            {pendingRequestsCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {pendingRequestsCount}
              </span>
            ) : (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                activeSubTab === 'requests' ? 'bg-amber-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {requests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Global Filter & Search Strip */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs ${cardBg}`}>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBn ? 'পণ্য, সরবরাহকারী, বায়ার বা ইনভয়েস খুঁজুন...' : 'Search product, vendor, customer, invoice...'}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
            {isBn ? 'ক্যাটাগরি:' : 'Category:'}
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer"
          >
            <option value="All">{isBn ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-TAB 1: PRODUCT DATABASE & STOCK MASTER (ডাটাবেস কোথায় বের করতে হয়) */}
      {/* ========================================================================= */}
      {activeSubTab === 'database' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold">{isBn ? 'মোট পণ্য তালিকা' : 'Total Catalog'}</span>
                <Boxes className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black">{productDatabase.length}</div>
              <span className="text-[11px] text-slate-500">{isBn ? 'সক্রিয় আইটেম ডাটাবেসে' : 'Unique items cataloged'}</span>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold">{isBn ? 'মোট ইনভেন্টরি স্টক মূল্য' : 'Stock Asset Value'}</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ৳{totalInventoryStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[11px] text-slate-500">{isBn ? 'বর্তমান গুদাম মালামালের মোট মূল্য' : 'Total current warehouse value'}</span>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold">{isBn ? 'লো-স্টক সতর্কতা' : 'Low Stock Alerts'}</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                {lowStockCount}
              </div>
              <span className="text-[11px] text-slate-500">{isBn ? 'রিফিল প্রয়োজন এমন আইটেম' : 'Items need replenishment'}</span>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold">{isBn ? 'পেন্ডিং রিকোয়েস্ট' : 'Pending Requests'}</span>
                <Flame className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                {pendingRequestsCount}
              </div>
              <span className="text-[11px] text-slate-500">{isBn ? 'অ্যাডমিন অনুমোদনের অপেক্ষায়' : 'Requisitions awaiting approval'}</span>
            </div>
          </div>

          {/* PROMINENT "ডাটাবেস কোথায় বের করতে হয়" EXTRACTION & EXPORT BANNER */}
          <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border-indigo-200 dark:border-indigo-900/60 ${cardBg}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white uppercase tracking-wider">
                      {isBn ? 'ডাটাবেস সেন্ট্রাল' : 'Database Center'}
                    </span>
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                      {isBn ? 'পণ্য ডাটাবেস এক্সপোর্ট ও ব্যাকআপ (ডাটাবেস বের করার অপশন)' : 'Product Database Extraction & Master Export'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    {isBn 
                      ? 'এখানে আপনার সমস্ত কেনা পণ্য, বিক্রিত পণ্য, উৎপাদন ও কারখানার বর্তমান স্টকের লাইভ ডাটাবেস সংরক্ষিত রয়েছে। এক ক্লিকেই সম্পূর্ণ ডাটাবেস ডাউনলোড বা এক্সপোর্ট করুন।' 
                      : 'Live central master database aggregating all purchases, sales, production batches, and current warehouse inventory balances.'}
                  </p>
                </div>
              </div>

              {/* Database Extraction Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* 1. CSV Download */}
                <button
                  type="button"
                  onClick={handleExportDatabaseCSV}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition"
                  title={isBn ? 'সম্পূর্ণ পণ্য ডাটাবেস CSV ফরম্যাটে ডাউনলোড করুন' : 'Export Database as CSV'}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isBn ? 'CSV ডাউনলোড' : 'Download CSV'}</span>
                </button>

                {/* 2. JSON Backup Download */}
                <button
                  type="button"
                  onClick={handleExportDatabaseJSON}
                  className="px-3.5 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  title={isBn ? 'সম্পূর্ণ ডাটাবেসের JSON ব্যাকআপ ফাইল সেভ করুন' : 'Export Full JSON Backup'}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isBn ? 'JSON ব্যাকআপ' : 'JSON Backup'}</span>
                </button>

                {/* 3. Copy to Clipboard */}
                <button
                  type="button"
                  onClick={handleCopyDatabaseToClipboard}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  title={isBn ? 'ডাটাবেস টেবিল ক্লিপবোর্ডে কপি করুন' : 'Copy Table to Clipboard'}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isBn ? 'কপি করুন' : 'Copy Data'}</span>
                </button>

                {/* 4. Print Database */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer transition"
                  title={isBn ? 'ডাটাবেস রিপোর্ট প্রিন্ট করুন' : 'Print Database Report'}
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Master Product Inventory Table */}
          <div className={`border rounded-3xl overflow-hidden shadow-xs ${cardBg}`}>
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  {isBn ? 'পণ্য ডাটাবেস ও লাইভ স্টক তালিকা' : 'Product Master Database & Live Stock'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isBn ? `মোট ${filteredDatabase.length} টি আইটেম প্রদর্শিত হচ্ছে` : `Showing ${filteredDatabase.length} catalog items`}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 sm:px-4">#</th>
                    <th className="p-3.5 sm:px-4">{isBn ? 'পণ্যের নাম ও ক্যাটাগরি' : 'Product & Category'}</th>
                    <th className="p-3.5 sm:px-4 text-center">{isBn ? 'বর্তমান স্টক' : 'In-Stock'}</th>
                    <th className="p-3.5 sm:px-4 text-center">{isBn ? 'মোট কেনা' : 'Total Bought'}</th>
                    <th className="p-3.5 sm:px-4 text-center">{isBn ? 'মোট বিক্রি' : 'Total Sold'}</th>
                    <th className="p-3.5 sm:px-4 text-right">{isBn ? 'গড় মূল্য' : 'Avg Price'}</th>
                    <th className="p-3.5 sm:px-4 text-right">{isBn ? 'মোট স্টক মূল্য' : 'Stock Value'}</th>
                    <th className="p-3.5 sm:px-4 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th className="p-3.5 sm:px-4 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredDatabase.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        {isBn ? 'কোনো পণ্য ডাটাবেসে পাওয়া যায়নি।' : 'No products found matching query.'}
                      </td>
                    </tr>
                  ) : (
                    filteredDatabase.map((item, idx) => (
                      <tr key={item.name} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5 sm:px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3.5 sm:px-4">
                          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.hasPendingRequest && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                                Requisition
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{item.category}</span>
                        </td>
                        <td className="p-3.5 sm:px-4 text-center">
                          <span className="font-black text-sm text-indigo-600 dark:text-indigo-400">
                            {item.currentStock.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">{item.unit}</span>
                        </td>
                        <td className="p-3.5 sm:px-4 text-center font-mono text-slate-500">
                          {item.totalPurchased > 0 ? `${item.totalPurchased.toLocaleString()} ${item.unit}` : '—'}
                        </td>
                        <td className="p-3.5 sm:px-4 text-center font-mono text-slate-500">
                          {item.totalSold > 0 ? `${item.totalSold.toLocaleString()} ${item.unit}` : '—'}
                        </td>
                        <td className="p-3.5 sm:px-4 text-right font-mono font-bold">
                          ৳{(item.avgBuyPrice || item.latestSellPrice).toFixed(2)}
                        </td>
                        <td className="p-3.5 sm:px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                          ৳{item.totalStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="p-3.5 sm:px-4 text-center">
                          {item.status === 'in_stock' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              ✓ {isBn ? 'ইন স্টক' : 'In Stock'}
                            </span>
                          )}
                          {item.status === 'low_stock' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                              ⚠️ {isBn ? 'লো স্টক' : 'Low Stock'}
                            </span>
                          )}
                          {item.status === 'out_of_stock' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              ✕ {isBn ? 'স্টক শেষ' : 'Out of Stock'}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 sm:px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setBuyName(item.name);
                                setBuyCategory(item.category);
                                setBuyUnit(item.unit);
                                setIsPurchaseModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] cursor-pointer"
                              title={isBn ? 'এই পণ্যটি পুনরায় কিনুন' : 'Buy more'}
                            >
                              + {isBn ? 'কিনুন' : 'Buy'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSellName(item.name);
                                setSellCategory(item.category);
                                setSellUnit(item.unit);
                                setIsSaleModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] cursor-pointer"
                              title={isBn ? 'এই পণ্য বিক্রি করুন' : 'Sell this product'}
                            >
                              + {isBn ? 'বিক্রি' : 'Sell'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-TAB 2: PRODUCT BUYING / PURCHASES (কোন পণ্য কিনছে, কত টাকা)        */}
      {/* ========================================================================= */}
      {activeSubTab === 'buy' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Buying Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">{isBn ? 'মোট ক্রয় খরচ' : 'Total Purchase Spend'}</span>
              <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                ৳{totalPurchaseSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[11px] text-slate-500">{isBn ? 'কাঁচামাল ও পার্টস ক্রয়ে ব্যয়' : 'Total inventory procurement'}</span>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">{isBn ? 'মোট ক্রয় রেকর্ড' : 'Total Purchases'}</span>
              <div className="text-xl sm:text-2xl font-black">{purchases.length}</div>
              <span className="text-[11px] text-slate-500">{isBn ? 'সম্পন্ন ইনভয়েস' : 'Completed purchase orders'}</span>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">{isBn ? 'সক্রিয় ভেন্ডর / সরবরাহকারী' : 'Active Vendors'}</span>
              <div className="text-xl sm:text-2xl font-black">
                {new Set(purchases.map(p => p.supplier)).size}
              </div>
              <span className="text-[11px] text-slate-500">{isBn ? 'চায়না ও লোকাল পার্টনার' : 'Suppliers in record'}</span>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">{isBn ? 'নতুন ক্রয় এন্ট্রি' : 'Quick Action'}</span>
              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(true)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isBn ? '+ পণ্য কেনা যোগ করুন' : '+ Record Purchase'}</span>
              </button>
            </div>
          </div>

          {/* Purchases Table */}
          <div className={`border rounded-3xl overflow-hidden shadow-xs ${cardBg}`}>
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  {isBn ? 'পণ্য কেনা তালিকা (কোন পণ্য কিনছে, কত টাকা ও সরবরাহকারী)' : 'Product Purchase & Procurement Ledger'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isBn ? `মোট ${filteredPurchases.length} টি ক্রয়ের হিসেব সংরক্ষিত রয়েছে` : `Showing ${filteredPurchases.length} purchase records`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBn ? 'নতুন ক্রয়' : 'New Purchase'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 sm:px-4">{isBn ? 'ইনভয়েস ও তারিখ' : 'Invoice & Date'}</th>
                    <th className="p-3.5 sm:px-4">{isBn ? 'পণ্যের নাম ও ক্যাটাগরি' : 'Product & Category'}</th>
                    <th className="p-3.5 sm:px-4">{isBn ? 'সরবরাহকারী (Supplier)' : 'Supplier'}</th>
                    <th className="p-3.5 sm:px-4 text-center">{isBn ? 'পরিমাণ (Qty)' : 'Quantity'}</th>
                    <th className="p-3.5 sm:px-4 text-right">{isBn ? 'একক মূল্য (Unit Price)' : 'Unit Price'}</th>
                    <th className="p-3.5 sm:px-4 text-right">{isBn ? 'মোট টাকা' : 'Total (BDT)'}</th>
                    <th className="p-3.5 sm:px-4">{isBn ? 'এন্ট্রিদাতা' : 'Recorded By'}</th>
                    {canManage && <th className="p-3.5 sm:px-4 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        {isBn ? 'কোনো পণ্য ক্রয়ের হিসেব পাওয়া যায়নি।' : 'No purchase records found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5 sm:px-4">
                          <span className="font-mono font-bold text-slate-900 dark:text-white block">{p.invoiceNumber}</span>
                          <span className="text-[10px] text-slate-400">{p.transactionDate}</span>
                        </td>
                        <td className="p-3.5 sm:px-4">
                          <span className="font-extrabold text-slate-900 dark:text-white block">{p.productName}</span>
                          <span className="text-[10px] text-slate-400">{p.category}</span>
                        </td>
                        <td className="p-3.5 sm:px-4">
                          <span className="font-bold flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>{p.supplier}</span>
                          </span>
                        </td>
                        <td className="p-3.5 sm:px-4 text-center">
                          <span className="font-black text-sm">{p.quantity.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 ml-1">{p.unit}</span>
                        </td>
                        <td className="p-3.5 sm:px-4 text-right font-mono font-bold">
                          ৳{Number(p.unitPrice).toFixed(2)}
                        </td>
                        <td className="p-3.5 sm:px-4 text-right font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                          ৳{Number(p.totalPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 sm:px-4 text-slate-500 text-[11px]">
                          {p.createdBy}
                        </td>
                        {canManage && (
                          <td className="p-3.5 sm:px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(isBn ? 'এই পণ্য ক্রয়ের রেকর্ডটি ডিলিট করতে চান?' : 'Delete this purchase record?')) {
                                  onDeletePurchase(p.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="Delete purchase"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB 3: PRODUCT SELLING / SALES (পণ্য বিক্রি অপশন)                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'sell' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Sales Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">{isBn ? 'মোট বিক্রয় আয়' : 'Total Sales Revenue'}</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ৳{totalSalesRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[11px] text-slate-500">{isBn ? 'মোট ইনভয়েস মূল্য' : 'Total sales value billed'}</span>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">{isBn ? 'আদায়কৃত টাকা (Paid)' : 'Collected Cash'}</span>
              <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                ৳{totalSalesCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[11px] text-slate-500">{isBn ? 'নগদ / ব্যাংকে রিসিভড' : 'Payment received'}</span>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">{isBn ? 'মোট বকেয়া (Due Amount)' : 'Total Due / Receivables'}</span>
              <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                ৳{totalSalesDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[11px] text-slate-500">{isBn ? 'কাস্টমারের কাছে পাওনা' : 'Pending payment collection'}</span>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">{isBn ? 'নতুন বিক্রয় এন্ট্রি' : 'New Order'}</span>
              <button
                type="button"
                onClick={() => setIsSaleModalOpen(true)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isBn ? '+ পণ্য বিক্রি রেকর্ড' : '+ Record Sale'}</span>
              </button>
            </div>
          </div>

          {/* Sales Table */}
          <div className={`border rounded-3xl overflow-hidden shadow-xs ${cardBg}`}>
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  {isBn ? 'পণ্য বিক্রয় খাতা (কোন পণ্য বিক্রি, বায়ার, টাকা ও পেমেন্ট স্ট্যাটাস)' : 'Product Sales & Customer Orders Ledger'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isBn ? `মোট ${filteredSales.length} টি বিক্রয় রেকর্ড সংরক্ষিত রয়েছে` : `Showing ${filteredSales.length} sales orders`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaleModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBn ? 'নতুন বিক্রয়' : 'New Sale'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 sm:px-4">{isBn ? 'ইনভয়েস ও তারিখ' : 'Invoice & Date'}</th>
                    <th className="p-3.5 sm:px-4">{isBn ? 'পণ্যের নাম' : 'Product'}</th>
                    <th className="p-3.5 sm:px-4">{isBn ? 'বায়ার / কাস্টমার' : 'Customer'}</th>
                    <th className="p-3.5 sm:px-4 text-center">{isBn ? 'পরিমাণ' : 'Quantity'}</th>
                    <th className="p-3.5 sm:px-4 text-right">{isBn ? 'দর (Price)' : 'Unit Price'}</th>
                    <th className="p-3.5 sm:px-4 text-right">{isBn ? 'মোট বিল' : 'Total (BDT)'}</th>
                    <th className="p-3.5 sm:px-4 text-right">{isBn ? 'আদায় / বকেয়া' : 'Paid / Due'}</th>
                    <th className="p-3.5 sm:px-4 text-center">{isBn ? 'পেমেন্ট' : 'Payment'}</th>
                    <th className="p-3.5 sm:px-4 text-center">{isBn ? 'ডেলিভারি' : 'Delivery'}</th>
                    {canManage && <th className="p-3.5 sm:px-4 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        {isBn ? 'কোনো পণ্য বিক্রয়ের রেকর্ড পাওয়া যায়নি।' : 'No sales records found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5 sm:px-4">
                          <span className="font-mono font-bold text-slate-900 dark:text-white block">{s.invoiceNumber}</span>
                          <span className="text-[10px] text-slate-400">{s.saleDate}</span>
                        </td>
                        <td className="p-3.5 sm:px-4">
                          <span className="font-extrabold text-slate-900 dark:text-white block">{s.productName}</span>
                          <span className="text-[10px] text-slate-400">{s.category}</span>
                        </td>
                        <td className="p-3.5 sm:px-4">
                          <span className="font-bold block">{s.customerName}</span>
                          {s.customerPhone && <span className="text-[10px] text-slate-400 font-mono">{s.customerPhone}</span>}
                        </td>
                        <td className="p-3.5 sm:px-4 text-center">
                          <span className="font-black text-sm">{s.quantity.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 ml-1">{s.unit}</span>
                        </td>
                        <td className="p-3.5 sm:px-4 text-right font-mono font-bold">
                          ৳{Number(s.unitPrice).toFixed(2)}
                        </td>
                        <td className="p-3.5 sm:px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          ৳{Number(s.totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 sm:px-4 text-right font-mono text-[11px]">
                          <span className="text-emerald-600 dark:text-emerald-400 block font-bold">
                            Paid: ৳{(s.paidAmount || 0).toLocaleString()}
                          </span>
                          {(s.dueAmount || 0) > 0 ? (
                            <span className="text-rose-500 font-bold block">
                              Due: ৳{s.dueAmount?.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">No Due</span>
                          )}
                        </td>
                        <td className="p-3.5 sm:px-4 text-center">
                          {s.paymentStatus === 'Paid' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              ✓ Paid
                            </span>
                          )}
                          {s.paymentStatus === 'Partial' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                              ⚡ Partial
                            </span>
                          )}
                          {s.paymentStatus === 'Due' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              Due
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 sm:px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.deliveryStatus === 'Delivered' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {s.deliveryStatus}
                          </span>
                        </td>
                        {canManage && (
                          <td className="p-3.5 sm:px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(isBn ? 'এই বিক্রয় রেকর্ডটি ডিলিট করতে চান?' : 'Delete this sale record?')) {
                                  onDeleteSale(s.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="Delete sale"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB 4: PRODUCT REQUESTS (পণ্য রিকোয়েস্ট)                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'requests' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Requests Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">{isBn ? 'পেন্ডিং রিকোয়েস্ট' : 'Pending Approval'}</span>
              <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">{pendingRequestsCount}</div>
              <span className="text-[11px] text-slate-500">{isBn ? 'কর্মীদের পাঠানো চাহিদা' : 'Waiting for admin'}</span>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">{isBn ? 'জরুরি রিকোয়েস্ট' : 'Urgent Requests'}</span>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{urgentRequestsCount}</div>
              <span className="text-[11px] text-slate-500">{isBn ? 'প্রোডাকশন বন্ধ হওয়ার ঝুঁকি' : 'High priority'}</span>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">{isBn ? 'মোট রিকোয়েস্ট' : 'Total Requests'}</span>
              <div className="text-xl sm:text-2xl font-black">{requests.length}</div>
              <span className="text-[11px] text-slate-500">{isBn ? 'সর্বমোট চাহিদাপত্র' : 'All requisitions'}</span>
            </div>

            <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${cardBg}`}>
              <span className="text-xs font-bold text-slate-400 block mb-1">{isBn ? 'নতুন রিকোয়েস্ট' : 'New Request'}</span>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isBn ? '+ রিকোয়েস্ট পাঠান' : '+ New Request'}</span>
              </button>
            </div>
          </div>

          {/* Requests Table */}
          <div className={`border rounded-3xl overflow-hidden shadow-xs ${cardBg}`}>
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  {isBn ? 'পণ্য ও কাঁচামাল চাহিদাপত্র তালিকা (Product Requisition Queue)' : 'Product Requisitions Queue'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isBn ? `মোট ${filteredRequests.length} টি রিকোয়েস্ট প্রদর্শিত হচ্ছে` : `Showing ${filteredRequests.length} requests`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isBn ? 'নতুন রিকোয়েস্ট' : 'New Request'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 sm:px-4">{isBn ? 'রিকোয়েস্ট নং ও তারিখ' : 'Req No & Date'}</th>
                    <th className="p-3.5 sm:px-4">{isBn ? 'পণ্যের নাম ও ক্যাটাগরি' : 'Product & Category'}</th>
                    <th className="p-3.5 sm:px-4 text-center">{isBn ? 'চাহিদা পরিমাণ' : 'Quantity'}</th>
                    <th className="p-3.5 sm:px-4">{isBn ? 'আবেদনকারী ও সেকশন' : 'Requester & Section'}</th>
                    <th className="p-3.5 sm:px-4 text-center">{isBn ? 'প্রায়োরিটি' : 'Priority'}</th>
                    <th className="p-3.5 sm:px-4 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th className="p-3.5 sm:px-4 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        {isBn ? 'কোনো পণ্য রিকোয়েস্ট পাওয়া যায়নি।' : 'No requisitions found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3.5 sm:px-4">
                          <span className="font-mono font-bold text-slate-900 dark:text-white block">{r.requestNumber}</span>
                          <span className="text-[10px] text-slate-400">{r.requestDate}</span>
                        </td>
                        <td className="p-3.5 sm:px-4">
                          <span className="font-extrabold text-slate-900 dark:text-white block">{r.productName}</span>
                          <span className="text-[10px] text-slate-400">{r.category}</span>
                          {r.reason && <p className="text-[11px] text-slate-500 italic mt-0.5 max-w-xs">{r.reason}</p>}
                        </td>
                        <td className="p-3.5 sm:px-4 text-center">
                          <span className="font-black text-sm text-amber-600 dark:text-amber-400">{r.quantity}</span>
                          <span className="text-[10px] text-slate-400 ml-1">{r.unit}</span>
                          {r.remainingQty !== undefined && (
                            <span className="text-[10px] text-slate-400 block">Remaining: {r.remainingQty}</span>
                          )}
                        </td>
                        <td className="p-3.5 sm:px-4">
                          <span className="font-bold block">{r.employeeName}</span>
                          <span className="text-[10px] text-slate-400">{r.section}</span>
                        </td>
                        <td className="p-3.5 sm:px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.priority === 'Critical' 
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : r.priority === 'Urgent'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {r.priority}
                          </span>
                        </td>
                        <td className="p-3.5 sm:px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            r.status === 'Pending' 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                              : r.status === 'Approved'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : r.status === 'Ordered'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                  : r.status === 'Delivered'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3.5 sm:px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {canManage && r.status === 'Pending' && (
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(r.id, 'Approved', 'Approved by admin')}
                                className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer"
                                title="Approve Request"
                              >
                                {isBn ? 'অনুমোদন' : 'Approve'}
                              </button>
                            )}
                            {canManage && r.status === 'Approved' && (
                              <button
                                type="button"
                                onClick={() => {
                                  // Open quick purchase or mark ordered
                                  setBuyName(r.productName);
                                  setBuyCategory(r.category);
                                  setBuyQty(r.quantity.toString());
                                  setBuyUnit(r.unit);
                                  onUpdateStatus(r.id, 'Ordered');
                                  setIsPurchaseModalOpen(true);
                                }}
                                className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] cursor-pointer"
                                title="Mark Ordered & Buy"
                              >
                                {isBn ? 'অর্ডার দিন' : 'Order'}
                              </button>
                            )}
                            {canManage && r.status === 'Ordered' && (
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(r.id, 'Delivered', 'Delivered to factory floor')}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer"
                                title="Mark Delivered"
                              >
                                {isBn ? 'ডেলিভারি' : 'Deliver'}
                              </button>
                            )}
                            {r.status === 'Delivered' && (
                              <button
                                type="button"
                                onClick={() => onConfirmReceipt(r.id, currentUser.id)}
                                className="px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] cursor-pointer"
                                title="Confirm Receipt"
                              >
                                {isBn ? 'রিসিভ কনফার্ম' : 'Received'}
                              </button>
                            )}
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(isBn ? 'এই রিকোয়েস্টটি ডিলিট করতে চান?' : 'Delete request?')) {
                                    onDeleteRequest(r.id);
                                  }
                                }}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NEW PURCHASE (পণ্য কেনা এন্ট্রি)                                   */}
      {/* ========================================================================= */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto ${cardBg}`}>
            <button
              onClick={() => setIsPurchaseModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold">{isBn ? 'নতুন পণ্য কেনা রেকর্ড (Purchase Entry)' : 'New Product Purchase'}</h3>
                <p className="text-xs text-slate-500">{isBn ? 'কোন পণ্য কিনছেন, কত টাকা, পরিমাণ ও ভেন্ডর বিবরণ' : 'Record purchased goods, price, and supplier'}</p>
              </div>
            </div>

            <form onSubmit={handleAddPurchaseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                  {isBn ? 'পণ্যের নাম *' : 'Product Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={buyName}
                  onChange={(e) => setBuyName(e.target.value)}
                  placeholder={isBn ? 'যেমন: Zinc Alloy Slider #5, Polyester Tape, ইত্যাদি' : 'e.g. Zinc Slider #5'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-600 dark:text-slate-300">
                      {isBn ? 'ক্যাটাগরি (ম্যানুয়াল টাইপ বা নির্বাচন) *' : 'Category (Type or Pick) *'}
                    </label>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                      {isBn ? '✏️ ফ্রি টাইপ করুন' : '✏️ Free typing'}
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={buyCategory}
                    onChange={(e) => setBuyCategory(e.target.value)}
                    list="purchase-categories-datalist"
                    placeholder={isBn ? 'ক্যাটাগরির নাম লিখুন (যেমন: Sliders, Tape, Zipper)' : 'Type or select category...'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                  <datalist id="purchase-categories-datalist">
                    {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </datalist>
                  <div className="flex flex-wrap gap-1 mt-1.5 max-h-16 overflow-y-auto">
                    {categoriesList.slice(0, 8).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBuyCategory(c)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          buyCategory === c 
                            ? 'bg-indigo-600 text-white shadow-2xs' 
                            : 'bg-slate-200/70 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'সরবরাহকারী (Supplier)' : 'Supplier'}
                  </label>
                  <input
                    type="text"
                    required
                    value={buySupplier}
                    onChange={(e) => setBuySupplier(e.target.value)}
                    list="supplier-presets"
                    placeholder="Supplier / Mill Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                  <datalist id="supplier-presets">
                    {PRESET_SUPPLIERS.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'পরিমাণ (Qty) *' : 'Quantity *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={buyQty}
                    onChange={(e) => setBuyQty(e.target.value)}
                    placeholder="1000"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'একক (Unit)' : 'Unit'}
                  </label>
                  <select
                    value={buyUnit}
                    onChange={(e) => setBuyUnit(e.target.value)}
                    className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="Piece">Piece (পিস)</option>
                    <option value="Roll">Roll (রোল)</option>
                    <option value="Cone">Cone (কোন)</option>
                    <option value="Box">Box (বক্স)</option>
                    <option value="Kg">Kg (কেজি)</option>
                    <option value="Meter">Meter (মিটার)</option>
                    <option value="Set">Set (সেট)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'দর / রেট (টাকা) *' : 'Unit Price (BDT) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={buyUnitPrice}
                    onChange={(e) => setBuyUnitPrice(e.target.value)}
                    placeholder="3.50"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Price Comparison Helper Banner */}
              {priceComparison && priceComparison.hasPrevious && (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  priceComparison.trend === 'increased' 
                    ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300'
                    : priceComparison.trend === 'decreased'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                }`}>
                  <span className="font-bold flex items-center gap-1.5">
                    {priceComparison.trend === 'increased' && <ArrowUpRight className="w-4 h-4 text-rose-600" />}
                    {priceComparison.trend === 'decreased' && <ArrowDownRight className="w-4 h-4 text-emerald-600" />}
                    <span>{priceComparison.message}</span>
                  </span>
                  <span className="font-mono text-[11px] font-bold opacity-80">
                    Previous: ৳{priceComparison.previousPrice.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Auto Calculated Total */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 block">
                    {isBn ? 'মোট ক্রয়ের খরচ (Total Cost):' : 'Total Purchase Amount:'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {buyQty || 0} {buyUnit} × ৳{buyUnitPrice || 0}
                  </span>
                </div>
                <div className="text-xl font-mono font-black text-indigo-700 dark:text-indigo-300">
                  ৳{calculatedBuyTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'ইনভয়েস বা চালান নং (ঐচ্ছিক)' : 'Invoice Number (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={buyInvoice}
                    onChange={(e) => setBuyInvoice(e.target.value)}
                    placeholder="Auto generated if empty"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'বিবরণ বা নোট' : 'Notes'}
                  </label>
                  <input
                    type="text"
                    value={buyDesc}
                    onChange={(e) => setBuyDesc(e.target.value)}
                    placeholder="Details about quality, batch, etc."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  {isBn ? 'ক্রয় সংরক্ষণ করুন' : 'Save Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NEW SALE (পণ্য বিক্রি এন্ট্রি)                                     */}
      {/* ========================================================================= */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto ${cardBg}`}>
            <button
              onClick={() => setIsSaleModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold">{isBn ? 'নতুন পণ্য বিক্রয় রেকর্ড (Sales Order)' : 'New Product Sale Order'}</h3>
                <p className="text-xs text-slate-500">{isBn ? 'কোন বায়ারকে কত পিস বিক্রি করলেন, দর, মোট বিল ও পেমেন্ট' : 'Record sold zippers, customer, and billing'}</p>
              </div>
            </div>

            <form onSubmit={handleAddSaleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                  {isBn ? 'বিক্রিত পণ্যের নাম *' : 'Product Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={sellName}
                  onChange={(e) => setSellName(e.target.value)}
                  placeholder={isBn ? 'যেমন: #5 Brass Metal Zipper (Open End), ইত্যাদি' : 'e.g. #5 Brass Zipper'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'বায়ার / কাস্টমার নাম *' : 'Customer Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={sellCustomer}
                    onChange={(e) => setSellCustomer(e.target.value)}
                    list="customer-presets"
                    placeholder="Buyer or Garments Company"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                  <datalist id="customer-presets">
                    {PRESET_CUSTOMERS.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'কাস্টমার ফোন (ঐচ্ছিক)' : 'Customer Phone'}
                  </label>
                  <input
                    type="text"
                    value={sellPhone}
                    onChange={(e) => setSellPhone(e.target.value)}
                    placeholder="01711-xxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'পরিমাণ (Qty) *' : 'Quantity *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={sellQty}
                    onChange={(e) => setSellQty(e.target.value)}
                    placeholder="5000"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'একক (Unit)' : 'Unit'}
                  </label>
                  <select
                    value={sellUnit}
                    onChange={(e) => setSellUnit(e.target.value)}
                    className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="Piece">Piece (পিস)</option>
                    <option value="Roll">Roll (রোল)</option>
                    <option value="Cone">Cone (কোন)</option>
                    <option value="Box">Box (বক্স)</option>
                    <option value="Set">Set (সেট)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'বিক্রয় দর (টাকা) *' : 'Selling Price (BDT) *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={sellUnitPrice}
                    onChange={(e) => setSellUnitPrice(e.target.value)}
                    placeholder="28.50"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Total & Payment Math */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
                      {isBn ? 'মোট বিক্রয় বিল (Total Bill):' : 'Total Bill:'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {sellQty || 0} {sellUnit} × ৳{sellUnitPrice || 0}
                    </span>
                  </div>
                  <div className="text-xl font-mono font-black text-emerald-700 dark:text-emerald-300">
                    ৳{calculatedSellTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200 dark:border-emerald-900/60">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {isBn ? 'আদায়কৃত টাকা (Paid Amount)' : 'Paid Amount (BDT)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={sellPaidAmount}
                      onChange={(e) => setSellPaidAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {isBn ? 'বকেয়া বাকি (Due Amount)' : 'Due Balance'}
                    </span>
                    <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-black text-rose-600">
                      ৳{calculatedSellDue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                  </label>
                  <select
                    value={sellPaymentMethod}
                    onChange={(e) => setSellPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="Bank">Bank Transfer (ব্যাংক)</option>
                    <option value="Cash">Cash (নগদ)</option>
                    <option value="bKash">bKash (বিকাশ)</option>
                    <option value="Nagad">Nagad (নগদ অ্যাপ)</option>
                    <option value="Cheque">Cheque (চেক)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'ডেলিভারি স্ট্যাটাস' : 'Delivery Status'}
                  </label>
                  <select
                    value={sellDeliveryStatus}
                    onChange={(e) => setSellDeliveryStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="Delivered">Delivered (ডেলিভারি সম্পন্ন)</option>
                    <option value="In Transit">In Transit (পথে আছে)</option>
                    <option value="Pending">Pending (প্যাকিং চলছে)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSaleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  {isBn ? 'বিক্রয় সংরক্ষণ করুন' : 'Save Sale Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: NEW PRODUCT REQUEST (পণ্য রিকোয়েস্ট এন্ট্রি)                      */}
      {/* ========================================================================= */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto ${cardBg}`}>
            <button
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5 border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold">{isBn ? 'নতুন পণ্য রিকোয়েস্ট (Requisition Form)' : 'New Product Requisition'}</h3>
                <p className="text-xs text-slate-500">{isBn ? 'প্রোডাকশন ফ্লোর বা সেকশনের জন্য প্রয়োজনীয় কাঁচামালের রিকোয়েস্ট' : 'Request raw material or hardware replenishment'}</p>
              </div>
            </div>

            <form onSubmit={handleAddRequestSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                  {isBn ? 'প্রয়োজনীয় পণ্যের নাম *' : 'Requested Item Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={reqProductName}
                  onChange={(e) => setReqProductName(e.target.value)}
                  placeholder="e.g. Metal Stopper Upper Pins, Sewing Thread, Machine Oil..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-600 dark:text-slate-300">
                      {isBn ? 'ক্যাটাগরি (ম্যানুয়াল টাইপ বা নির্বাচন) *' : 'Category (Type or Pick) *'}
                    </label>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                      {isBn ? '✏️ ফ্রি টাইপ করুন' : '✏️ Free typing'}
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    list="req-categories-datalist"
                    placeholder={isBn ? 'ক্যাটাগরির নাম লিখুন (যেমন: Zipper, Fabric, Hardware)' : 'Type or select category...'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:ring-2 focus:ring-amber-500"
                  />
                  <datalist id="req-categories-datalist">
                    {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </datalist>
                  <div className="flex flex-wrap gap-1 mt-1.5 max-h-16 overflow-y-auto">
                    {categoriesList.slice(0, 8).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setReqCategory(c)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          reqCategory === c 
                            ? 'bg-amber-600 text-white shadow-2xs' 
                            : 'bg-slate-200/70 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'জরুরি মাত্রা (Priority)' : 'Priority Level'}
                  </label>
                  <select
                    value={reqPriority}
                    onChange={(e) => setReqPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="Normal">Normal (স্বাভাবিক)</option>
                    <option value="Urgent">Urgent (জরুরি)</option>
                    <option value="Critical">Critical (প্রোডাকশন বন্ধের ঝুঁকি)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'প্রয়োজনীয় পরিমাণ *' : 'Requested Quantity *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={reqQty}
                    onChange={(e) => setReqQty(e.target.value)}
                    placeholder="2000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {isBn ? 'একক (Unit)' : 'Unit'}
                  </label>
                  <select
                    value={reqUnit}
                    onChange={(e) => setReqUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="Piece">Piece (পিস)</option>
                    <option value="Roll">Roll (রোল)</option>
                    <option value="Cone">Cone (কোন)</option>
                    <option value="Box">Box (বক্স)</option>
                    <option value="Kg">Kg (কেজি)</option>
                    <option value="Meter">Meter (মিটার)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-600 dark:text-slate-300">
                  {isBn ? 'রিকোয়েস্টের কারণ ও বিস্তারিত' : 'Reason & Urgency Details'}
                </label>
                <textarea
                  rows={2}
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder={isBn ? 'কেন প্রয়োজন, কোন বায়ার অর্ডারের জন্য লাগবে...' : 'Explain why this requisition is required...'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  {isBn ? 'রিকোয়েস্ট সাবমিট করুন' : 'Submit Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
