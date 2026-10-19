import React, { useState } from 'react';
import { 
  User, 
  Language, 
  ProductionRecord, 
  PurchaseRecord, 
  ProductRequest, 
  ExpenseRecord, 
  LeaveRecord, 
  SaleRecord, 
  ProductRequestStatus, 
  ExpenseStatus, 
  LeaveStatus, 
  TabType 
} from '../types';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Save, 
  ExternalLink, 
  Tag, 
  Plus, 
  Package, 
  FileCheck, 
  Truck, 
  DollarSign, 
  Calendar,
  Layers,
  ArrowRight,
  Hash,
  User as UserIcon,
  Trash2,
  AlertCircle
} from 'lucide-react';

export interface DashboardRecordItem {
  id: string; // e.g. 'prd-xxx', 'pur-xxx', 'req-xxx', 'sale-xxx', 'exp-xxx', 'lv-xxx', 'usr-xxx'
  rawId: string;
  category: 'production' | 'product' | 'request' | 'sale' | 'expense' | 'employee' | 'leave';
  categoryBadge: string;
  categoryColor: string;
  title: string;
  codeOrSubtitle: string;
  section: string;
  spec: string;
  date: string;
  status: string;
  statusColor: string;
  tab: TabType;
  // Raw backing entity references
  productionRef?: ProductionRecord;
  purchaseRef?: PurchaseRecord;
  requestRef?: ProductRequest;
  saleRef?: SaleRecord;
  expenseRef?: ExpenseRecord;
  leaveRef?: LeaveRecord;
  userRef?: User;
}

interface DashboardLiveActionModalProps {
  record: DashboardRecordItem;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  darkMode: boolean;
  currentUser: User;
  categories: string[];
  onSaveCategory: (cat: string) => void;
  onUpdateProduction?: (record: ProductionRecord) => Promise<void> | void;
  onDeleteProduction?: (id: string) => Promise<void> | void;
  onUpdatePurchase?: (record: PurchaseRecord) => Promise<void> | void;
  onDeletePurchase?: (id: string) => Promise<void> | void;
  onUpdateProductRequest?: (request: ProductRequest) => Promise<void> | void;
  onUpdateProductRequestStatus?: (id: string, status: ProductRequestStatus, notes?: string) => Promise<void> | void;
  onDeleteProductRequest?: (id: string) => Promise<void> | void;
  onUpdateExpense?: (record: ExpenseRecord) => Promise<void> | void;
  onUpdateExpenseStatus?: (id: string, status: ExpenseStatus) => Promise<void> | void;
  onDeleteExpense?: (id: string) => Promise<void> | void;
  onUpdateLeave?: (record: LeaveRecord) => Promise<void> | void;
  onUpdateLeaveStatus?: (id: string, status: LeaveStatus, reason?: string) => Promise<void> | void;
  onDeleteLeave?: (id: string) => Promise<void> | void;
  onUpdateSale?: (sale: SaleRecord) => Promise<void> | void;
  onDeleteSale?: (id: string) => Promise<void> | void;
  onUpdateUser?: (user: User) => Promise<void> | void;
  onNavigateToTab?: (tab: TabType) => void;
  onSuccessToast?: (msg: string) => void;
}

export const DashboardLiveActionModal: React.FC<DashboardLiveActionModalProps> = ({
  record,
  isOpen,
  onClose,
  language,
  darkMode,
  currentUser,
  categories,
  onSaveCategory,
  onUpdateProduction,
  onDeleteProduction,
  onUpdatePurchase,
  onDeletePurchase,
  onUpdateProductRequest,
  onUpdateProductRequestStatus,
  onDeleteProductRequest,
  onUpdateExpense,
  onUpdateExpenseStatus,
  onDeleteExpense,
  onUpdateLeave,
  onUpdateLeaveStatus,
  onDeleteLeave,
  onUpdateSale,
  onDeleteSale,
  onUpdateUser,
  onNavigateToTab,
  onSuccessToast
}) => {
  const isBn = language === 'bn';

  // ----------------------------------------------------
  // Fully Manual Editable State (User Request: "সবকিছু যেন ম্যানুয়ালি চেঞ্জ করা যায় যেমন নাম আইটেম তারপর হল প্রোডাক্ট নেম প্রোডাক্ট ক্যাটাগরি আইডি এভরিথিং")
  // ----------------------------------------------------
  // 1. Identification (ID / Invoice / Code)
  const initialId = record.productionRef?.id || 
                    record.purchaseRef?.invoiceNumber || 
                    record.saleRef?.invoiceNumber || 
                    record.requestRef?.requestNumber || 
                    record.expenseRef?.id || 
                    record.leaveRef?.id || 
                    record.userRef?.employeeId || 
                    record.rawId;
  const [manualId, setManualId] = useState(initialId);

  // 2. Title / Product / Item / Purpose Name
  const initialTitle = record.productionRef?.itemName || 
                       record.purchaseRef?.productName || 
                       record.saleRef?.productName || 
                       record.requestRef?.productName || 
                       record.expenseRef?.purpose || 
                       record.leaveRef?.leaveType || 
                       record.userRef?.fullName || 
                       record.title;
  const [manualTitle, setManualTitle] = useState(initialTitle);

  // 3. Person Name (Worker / Buyer / Customer / Supplier / Requester / Employee)
  const initialPersonName = record.productionRef?.buyer || 
                            record.purchaseRef?.supplier || 
                            record.saleRef?.customerName || 
                            record.requestRef?.employeeName || 
                            record.expenseRef?.employeeName || 
                            record.leaveRef?.employeeName || 
                            record.userRef?.fullName || 
                            '';
  const [manualPersonName, setManualPersonName] = useState(initialPersonName);

  // 4. Product Category / Item Category
  const initialCategory = record.productionRef?.productType || 
                          record.purchaseRef?.category || 
                          record.saleRef?.category || 
                          record.requestRef?.category || 
                          record.expenseRef?.category || 
                          record.section || 
                          (categories[0] || 'Hardware & Sliders');
  const [manualCategory, setManualCategory] = useState(initialCategory);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);

  // 5. Section / Department
  const initialSection = record.productionRef?.section || 
                         record.requestRef?.section || 
                         record.expenseRef?.section || 
                         record.leaveRef?.section || 
                         record.userRef?.section || 
                         record.section;
  const [manualSection, setManualSection] = useState(initialSection);

  // 6. Date
  const initialDate = record.productionRef?.date || 
                      record.purchaseRef?.transactionDate?.split(' ')[0] || 
                      record.saleRef?.saleDate || 
                      record.requestRef?.requestDate?.split(' ')[0] || 
                      record.expenseRef?.transactionDate?.split(' ')[0] || 
                      record.leaveRef?.requestDate || 
                      record.date;
  const [manualDate, setManualDate] = useState(initialDate);

  // 7. Quantity & Unit
  const initialQty = record.productionRef ? String(record.productionRef.prodQty) : 
                     record.purchaseRef ? String(record.purchaseRef.quantity) : 
                     record.saleRef ? String(record.saleRef.quantity) : 
                     record.requestRef ? String(record.requestRef.quantity) : 
                     record.leaveRef ? String(record.leaveRef.daysCount) : '1';
  const [manualQty, setManualQty] = useState(initialQty);

  const initialOrderQty = record.productionRef ? String(record.productionRef.orderQty) : '';
  const [manualOrderQty, setManualOrderQty] = useState(initialOrderQty);

  const initialUnit = record.productionRef?.unit || 
                      record.purchaseRef?.unit || 
                      record.saleRef?.unit || 
                      record.requestRef?.unit || 'Pcs';
  const [manualUnit, setManualUnit] = useState(initialUnit);

  // 8. Unit Price & Total Amount
  const initialUnitPrice = record.purchaseRef ? String(record.purchaseRef.unitPrice) : 
                           record.saleRef ? String(record.saleRef.unitPrice) : 
                           record.expenseRef ? String(record.expenseRef.amount) : '';
  const [manualUnitPrice, setManualUnitPrice] = useState(initialUnitPrice);

  // 9. Specification / Size
  const initialSize = record.productionRef?.size || 
                      record.productionRef?.length || 
                      record.spec || '';
  const [manualSize, setManualSize] = useState(initialSize);

  // 10. Status
  const [manualStatus, setManualStatus] = useState(record.status);

  // 11. Notes / Description
  const initialNotes = record.productionRef?.notes || 
                       record.purchaseRef?.description || 
                       record.saleRef?.notes || 
                       record.requestRef?.notes || 
                       record.expenseRef?.description || 
                       record.leaveRef?.reason || '';
  const [manualNotes, setManualNotes] = useState(initialNotes);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen) return null;

  // Add custom category helper
  const handleAddCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;
    onSaveCategory(trimmed);
    setManualCategory(trimmed);
    setCustomCategoryInput('');
    setShowCustomCatInput(false);
  };

  // Main manual save handler covering all modules
  const handleSaveAll = async () => {
    setIsSubmitting(true);
    try {
      // 1. Production
      if (record.category === 'production' && record.productionRef && onUpdateProduction) {
        const updated: ProductionRecord = {
          ...record.productionRef,
          itemName: manualTitle.trim() || record.productionRef.itemName,
          buyer: manualPersonName.trim() || record.productionRef.buyer,
          productType: manualCategory.trim() || record.productionRef.productType,
          section: manualSection.trim() || record.productionRef.section,
          date: manualDate.trim() || record.productionRef.date,
          size: manualSize.trim() || record.productionRef.size,
          unit: manualUnit.trim() || record.productionRef.unit,
          prodQty: parseFloat(manualQty) || record.productionRef.prodQty,
          orderQty: parseFloat(manualOrderQty) || record.productionRef.orderQty,
          status: (manualStatus as 'Completed' | 'Running' | 'Delayed') || record.productionRef.status,
          notes: manualNotes.trim() || record.productionRef.notes,
          editCount: (record.productionRef.editCount || 0) + 1,
          lastEditedBy: currentUser.fullName
        };
        await onUpdateProduction(updated);
        onSuccessToast?.(isBn ? '✓ প্রোডাকশন রেকর্ড সফলভাবে ম্যানুয়ালি আপডেট হয়েছে!' : '✓ Production record manually updated successfully!');
      }

      // 2. Material Purchase (পণ্য কেনা)
      else if (record.category === 'product' && record.purchaseRef && onUpdatePurchase) {
        const q = parseFloat(manualQty) || record.purchaseRef.quantity;
        const p = parseFloat(manualUnitPrice) || record.purchaseRef.unitPrice;
        const updated: PurchaseRecord = {
          ...record.purchaseRef,
          invoiceNumber: manualId.trim() || record.purchaseRef.invoiceNumber,
          productName: manualTitle.trim() || record.purchaseRef.productName,
          supplier: manualPersonName.trim() || record.purchaseRef.supplier,
          category: manualCategory.trim() || record.purchaseRef.category,
          quantity: q,
          unit: manualUnit.trim() || record.purchaseRef.unit,
          unitPrice: p,
          totalPrice: Number((q * p).toFixed(2)),
          transactionDate: manualDate.trim() || record.purchaseRef.transactionDate,
          status: (manualStatus as 'Pending' | 'Approved') || record.purchaseRef.status,
          description: manualNotes.trim() || record.purchaseRef.description,
          editedBy: currentUser.fullName
        };
        await onUpdatePurchase(updated);
        onSuccessToast?.(isBn ? '✓ পণ্য ক্রয়ের রেকর্ড ম্যানুয়ালি আপডেট হয়েছে!' : '✓ Purchase record manually updated successfully!');
      }

      // 3. Product Sale (পণ্য বিক্রি)
      else if (record.category === 'sale' && record.saleRef && onUpdateSale) {
        const q = parseFloat(manualQty) || record.saleRef.quantity;
        const p = parseFloat(manualUnitPrice) || record.saleRef.unitPrice;
        const total = Number((q * p).toFixed(2));
        const updated: SaleRecord = {
          ...record.saleRef,
          invoiceNumber: manualId.trim() || record.saleRef.invoiceNumber,
          productName: manualTitle.trim() || record.saleRef.productName,
          customerName: manualPersonName.trim() || record.saleRef.customerName,
          category: manualCategory.trim() || record.saleRef.category,
          quantity: q,
          unit: manualUnit.trim() || record.saleRef.unit,
          unitPrice: p,
          totalAmount: total,
          saleDate: manualDate.trim() || record.saleRef.saleDate,
          notes: manualNotes.trim() || record.saleRef.notes
        };
        await onUpdateSale(updated);
        onSuccessToast?.(isBn ? '✓ পণ্য বিক্রির তথ্য ম্যানুয়ালি আপডেট হয়েছে!' : '✓ Sale record manually updated successfully!');
      }

      // 4. Product Request (রিকুইজিশন)
      else if (record.category === 'request' && record.requestRef) {
        if (onUpdateProductRequest) {
          const updated: ProductRequest = {
            ...record.requestRef,
            requestNumber: manualId.trim() || record.requestRef.requestNumber,
            productName: manualTitle.trim() || record.requestRef.productName,
            employeeName: manualPersonName.trim() || record.requestRef.employeeName,
            category: manualCategory.trim() || record.requestRef.category,
            section: manualSection.trim() || record.requestRef.section,
            quantity: parseFloat(manualQty) || record.requestRef.quantity,
            unit: manualUnit.trim() || record.requestRef.unit,
            status: (manualStatus as ProductRequestStatus) || record.requestRef.status,
            notes: manualNotes.trim() || record.requestRef.notes,
            adminNotes: manualNotes.trim() || record.requestRef.adminNotes
          };
          await onUpdateProductRequest(updated);
        } else if (onUpdateProductRequestStatus) {
          await onUpdateProductRequestStatus(record.requestRef.id, manualStatus as ProductRequestStatus, manualNotes.trim());
        }
        onSuccessToast?.(isBn ? '✓ রিকুইজিশন তথ্য সফলভাবে সেভ হয়েছে!' : '✓ Requisition manually updated successfully!');
      }

      // 5. Expense / Bill
      else if (record.category === 'expense' && record.expenseRef) {
        if (onUpdateExpense) {
          const updated: ExpenseRecord = {
            ...record.expenseRef,
            purpose: manualTitle.trim() || record.expenseRef.purpose,
            employeeName: manualPersonName.trim() || record.expenseRef.employeeName,
            category: manualCategory.trim() || record.expenseRef.category,
            section: manualSection.trim() || record.expenseRef.section,
            amount: parseFloat(manualUnitPrice) || record.expenseRef.amount,
            status: (manualStatus as ExpenseStatus) || record.expenseRef.status,
            description: manualNotes.trim() || record.expenseRef.description
          };
          await onUpdateExpense(updated);
        } else if (onUpdateExpenseStatus) {
          await onUpdateExpenseStatus(record.expenseRef.id, manualStatus as ExpenseStatus);
        }
        onSuccessToast?.(isBn ? '✓ বিল ও খরচের রেকর্ড আপডেট হয়েছে!' : '✓ Expense record manually updated!');
      }

      // 6. Leave Record
      else if (record.category === 'leave' && record.leaveRef) {
        if (onUpdateLeave) {
          const updated: LeaveRecord = {
            ...record.leaveRef,
            leaveType: manualTitle.trim() || record.leaveRef.leaveType,
            employeeName: manualPersonName.trim() || record.leaveRef.employeeName,
            section: manualSection.trim() || record.leaveRef.section,
            daysCount: parseFloat(manualQty) || record.leaveRef.daysCount,
            status: (manualStatus as LeaveStatus) || record.leaveRef.status,
            reason: manualNotes.trim() || record.leaveRef.reason
          };
          await onUpdateLeave(updated);
        } else if (onUpdateLeaveStatus) {
          await onUpdateLeaveStatus(record.leaveRef.id, manualStatus as LeaveStatus, manualNotes.trim());
        }
        onSuccessToast?.(isBn ? '✓ ছুটির রেকর্ড ম্যানুয়ালি আপডেট হয়েছে!' : '✓ Leave record manually updated!');
      }

      // 7. Employee
      else if (record.category === 'employee' && record.userRef && onUpdateUser) {
        const updated: User = {
          ...record.userRef,
          employeeId: manualId.trim() || record.userRef.employeeId,
          fullName: manualTitle.trim() || record.userRef.fullName,
          designation: manualPersonName.trim() || record.userRef.designation,
          section: manualSection.trim() || record.userRef.section
        };
        await onUpdateUser(updated);
        onSuccessToast?.(isBn ? '✓ কর্মীর তথ্য ম্যানুয়ালি আপডেট হয়েছে!' : '✓ Worker info manually updated!');
      }

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      if (record.category === 'production' && record.productionRef && onDeleteProduction) {
        await onDeleteProduction(record.productionRef.id);
      } else if (record.category === 'product' && record.purchaseRef && onDeletePurchase) {
        await onDeletePurchase(record.purchaseRef.id);
      } else if (record.category === 'sale' && record.saleRef && onDeleteSale) {
        await onDeleteSale(record.saleRef.id);
      } else if (record.category === 'request' && record.requestRef && onDeleteProductRequest) {
        await onDeleteProductRequest(record.requestRef.id);
      } else if (record.category === 'expense' && record.expenseRef && onDeleteExpense) {
        await onDeleteExpense(record.expenseRef.id);
      } else if (record.category === 'leave' && record.leaveRef && onDeleteLeave) {
        await onDeleteLeave(record.leaveRef.id);
      }
      onSuccessToast?.(isBn ? '✓ রেকর্ড মুছে ফেলা হয়েছে!' : '✓ Record deleted!');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardBg = darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';
  const inputBg = darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden transition-all flex flex-col max-h-[92vh] ${cardBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${record.categoryColor}`}>
              {record.categoryBadge}
            </span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-indigo-500" />
                <span>{isBn ? 'ম্যানুয়াল ডাটা এডিটর (সবকিছু পরিবর্তনযোগ্য)' : 'Manual Data Editor (All Fields Editable)'}</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isBn ? 'নাম, আইটেম, ক্যাটাগরি, আইডি, সংখ্যা ও স্ট্যাটাস যেকোনো কিছু ম্যানুয়ালি পরিবর্তন করুন' : 'Manually edit ID, item name, product category, buyer/worker, quantities and status'}
              </p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Complete Form with All Fields Manually Changeable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">

          {/* Quick Notice Banner */}
          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold">
              <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500">⚡</span>
              <span>{isBn ? 'এই ড্যাশবোর্ড থেকেই সব তথ্য সরাসরি এডিট ও সেভ করা যাবে।' : 'Edit and save all parameters directly from this dashboard.'}</span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold shrink-0 ${record.statusColor}`}>
              {manualStatus}
            </span>
          </div>

          {/* Row 1: ID / Invoice & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-indigo-500" />
                <span>{isBn ? 'আইডি / ইনভয়েস / রেফারেন্স নাম্বার:' : 'ID / Invoice / Ref Number:'}</span>
              </label>
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="e.g. INV-2026-001 or prd-101"
                className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${inputBg}`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>{isBn ? 'তারিখ (Date):' : 'Date:'}</span>
              </label>
              <input
                type="text"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                placeholder="YYYY-MM-DD"
                className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${inputBg}`}
              />
            </div>
          </div>

          {/* Row 2: Product Name / Item Name / Title */}
          <div>
            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isBn ? 'প্রোডাক্ট / আইটেমের নাম (Product / Item Name):' : 'Product / Item Name:'}</span>
            </label>
            <input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="e.g. Metal Zipper #5, Cotton Tape, Slider..."
              className={`w-full px-3 py-2 rounded-xl border font-bold text-sm ${inputBg}`}
            />
          </div>

          {/* Row 3: Product Category / Item Category (User: "প্রোডাক্ট ক্যাটাগরি আইডি এভরিথিং যেন ম্যানুয়ালি চেঞ্জ করা যায়") */}
          <div className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{isBn ? 'প্রোডাক্ট ও আইটেম ক্যাটাগরি (Product Category):' : 'Product / Item Category:'}</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCustomCatInput(!showCustomCatInput)}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showCustomCatInput ? (isBn ? 'ক্যান্সেল' : 'Cancel') : (isBn ? '+ নতুন ক্যাটাগরি তৈরি করুন' : '+ New Category')}</span>
              </button>
            </div>

            {/* Custom Category Input Form */}
            {showCustomCatInput && (
              <div className="flex gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-indigo-300 dark:border-indigo-700 animate-in fade-in">
                <input
                  type="text"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  placeholder={isBn ? 'নতুন ক্যাটাগরির নাম লিখুন (যেমন: ড্রস্ট্রিং, প্লাস্টিক জিপার)...' : 'Type new category name...'}
                  className={`flex-1 px-3 py-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:border-indigo-600 ${inputBg}`}
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  disabled={!customCategoryInput.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isBn ? 'সংরক্ষণ' : 'Save'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border font-bold text-xs focus:outline-none focus:border-indigo-600 ${inputBg}`}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="text"
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  placeholder={isBn ? 'অথবা সরাসরি যেকোনো কাস্টম ক্যাটাগরি লিখুন...' : 'Or type any custom category directly...'}
                  className={`w-full px-3 py-2 rounded-xl border font-bold text-xs focus:outline-none focus:border-indigo-600 ${inputBg}`}
                  title={isBn ? 'আপনি যেকোনো ক্যাটাগরি এখানে ম্যানুয়ালি টাইপ করতে পারেন' : 'You can type any category name manually'}
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isBn 
                ? '💡 যেকোনো প্রোডাক্ট ক্যাটাগরি ড্রপডাউন থেকে বাছাই করতে পারেন অথবা ডানে সরাসরি নিজের মতো লিখে দিতে পারেন।' 
                : '💡 Pick from preset categories or type any custom category on the right.'}
            </p>
          </div>

          {/* Row 4: Person Name (Buyer / Worker / Supplier / Customer) & Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  {record.category === 'production' 
                    ? (isBn ? 'বায়ার / অর্ডারকারী (Buyer / Customer):' : 'Buyer / Customer:')
                    : record.category === 'product'
                    ? (isBn ? 'সরবরাহকারী / সাপ্লায়ার (Supplier):' : 'Supplier:')
                    : record.category === 'sale'
                    ? (isBn ? 'ক্রেতা / কাস্টমার (Customer Name):' : 'Customer Name:')
                    : (isBn ? 'কর্মী / কর্মকর্তার নাম (Person Name):' : 'Worker / Person Name:')}
                </span>
              </label>
              <input
                type="text"
                value={manualPersonName}
                onChange={(e) => setManualPersonName(e.target.value)}
                placeholder="e.g. H&M, Apex, Rahim..."
                className={`w-full px-3 py-2 rounded-xl border font-bold ${inputBg}`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>{isBn ? 'সেকশন / বিভাগ (Section):' : 'Section / Department:'}</span>
              </label>
              <input
                type="text"
                value={manualSection}
                onChange={(e) => setManualSection(e.target.value)}
                placeholder="e.g. Sewing, Cutting, Finishing, Store..."
                className={`w-full px-3 py-2 rounded-xl border font-bold ${inputBg}`}
              />
            </div>
          </div>

          {/* Row 5: Quantities, Unit, Size, Prices */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                {record.category === 'production' 
                  ? (isBn ? 'উৎপাদিত সংখ্যা:' : 'Produced Qty:')
                  : (isBn ? 'পরিমাণ (Qty):' : 'Quantity:')}
              </label>
              <input
                type="number"
                value={manualQty}
                onChange={(e) => setManualQty(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border font-bold font-mono ${inputBg}`}
              />
            </div>

            {record.category === 'production' ? (
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {isBn ? 'অর্ডার কোয়ান্টিটি:' : 'Order Qty:'}
                </label>
                <input
                  type="number"
                  value={manualOrderQty}
                  onChange={(e) => setManualOrderQty(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border font-bold font-mono ${inputBg}`}
                />
              </div>
            ) : (
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {isBn ? 'দর / একক মূল্য (৳):' : 'Unit Price (৳):'}
                </label>
                <input
                  type="number"
                  value={manualUnitPrice}
                  onChange={(e) => setManualUnitPrice(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border font-bold font-mono ${inputBg}`}
                />
              </div>
            )}

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                {isBn ? 'একক (Unit):' : 'Unit:'}
              </label>
              <input
                type="text"
                value={manualUnit}
                onChange={(e) => setManualUnit(e.target.value)}
                placeholder="Pcs, Roll, Yards..."
                className={`w-full px-3 py-2 rounded-xl border font-bold ${inputBg}`}
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                {isBn ? 'সাইজ / দৈর্ঘ্য (Size):' : 'Size / Spec:'}
              </label>
              <input
                type="text"
                value={manualSize}
                onChange={(e) => setManualSize(e.target.value)}
                placeholder="e.g. S, M, L, XL, 32"
                className={`w-full px-3 py-2 rounded-xl border font-bold ${inputBg}`}
              />
            </div>
          </div>

          {/* Row 6: Status Selector with Quick Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                {isBn ? 'অবস্থা / স্ট্যাটাস (Status):' : 'Status:'}
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {isBn ? 'নিচে ক্লিক করুন অথবা সরাসরি লিখুন' : 'Click preset or type custom'}
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={manualStatus}
                onChange={(e) => setManualStatus(e.target.value)}
                placeholder="e.g. Completed, Running, Approved, Delivered..."
                className={`w-full px-3 py-2 rounded-xl border font-bold text-xs ${inputBg}`}
              />

              {/* Quick Status Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Completed', 'Running', 'Delayed', 'Approved', 
                  'Pending', 'Ordered', 'Delivered', 'Received by Employee', 'Paid', 'Partial'
                ].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setManualStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      manualStatus === st
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 7: Notes / Comments / Details */}
          <div>
            <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
              {isBn ? 'মন্তব্য ও অতিরিক্ত নোট (Notes / Description):' : 'Notes / Description:'}
            </label>
            <textarea
              rows={2}
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder={isBn ? 'প্রয়োজনীয় কোনো নোট বা মন্তব্য লিখুন...' : 'Add any notes, specifications or reason...'}
              className={`w-full px-3 py-2 rounded-xl border font-medium text-xs ${inputBg}`}
            />
          </div>

          {/* Confirmation Box for Deletion */}
          {confirmDelete && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{isBn ? 'আপনি কি নিশ্চিতভাবে এই রেকর্ডটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this record?'}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs"
                >
                  {isBn ? 'না' : 'No'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  {isBn ? 'হ্যাঁ, মুছুন' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            {/* Delete Record Button */}
            {!confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer transition"
                title={isBn ? 'রেকর্ডটি ডিলিট করুন' : 'Delete this record'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isBn ? 'মুছে ফেলুন' : 'Delete'}</span>
              </button>
            )}

            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToTab(record.tab);
                }}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition"
                title={isBn ? 'নির্দিষ্ট মডিউল ট্যাবে যান' : 'Go to dedicated module'}
              >
                <span>{isBn ? 'মডিউল পেজ' : 'Module Page'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isBn ? 'ড্যাশবোর্ডেই ম্যানুয়ালি সেভ করুন' : 'Save Changes on Dashboard'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
