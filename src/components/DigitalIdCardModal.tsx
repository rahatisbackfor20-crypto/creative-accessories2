import React, { useEffect, useState } from 'react';
import { User, CompanyProfile, Language } from '../types';
import { formatJoiningDate, getInitials } from '../storage';
import { translations } from '../i18n';
import { CompanyLogo } from './CompanyLogo';
import { Printer, MessageCircle, X, QrCode, Copy, Check, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface DigitalIdCardModalProps {
  user: User | null;
  companyProfile: CompanyProfile;
  language: Language;
  onClose: () => void;
}

export const DigitalIdCardModal: React.FC<DigitalIdCardModalProps> = ({
  user,
  companyProfile,
  language,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, onClose]);

  if (!user) return null;
  const t = translations[language];
  const isBn = language === 'bn';

  const designation = user.accountType === 'md' ? 'Managing Director' : (user.designation || 'Factory Worker');
  const sectionText = user.section ? `${user.section} Section` : 'Factory Operations';

  const cleanWaNumber = (user.whatsapp || '').replace(/[^0-9]/g, '');
  const waShareUrl = user.whatsapp ? `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
    `Official Digital ID Card Verified - ${companyProfile.name}\nName: ${user.fullName}\nID: ${user.employeeId}\nDesignation: ${designation}\nJoining Date: ${formatJoiningDate(user.joiningDate)} (${user.joiningDate})\nSection: ${sectionText}`
  )}` : null;

  const handleCopyId = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(user.employeeId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrintOrSave = () => {
    // 1. Attempt browser print
    try {
      window.print();
    } catch (e) {
      console.warn('Native window.print in iframe:', e);
    }

    // 2. Generate and download standalone printable HTML card file that always works in any browser
    const qrSvg = document.getElementById('id-card-modal-qr-svg');
    const qrSvgString = qrSvg ? new XMLSerializer().serializeToString(qrSvg) : '';

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${user.fullName} (${user.employeeId}) - Digital ID Card</title>
  <style>
    @page { size: auto; margin: 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f1f5f9; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; margin: 0; padding: 20px; }
    .card { width: 330px; background: white; border-radius: 24px; border: 2px solid #4f46e5; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); overflow: hidden; padding: 24px; position: relative; }
    .stripe { height: 8px; background: linear-gradient(90deg, #4f46e5, #2563eb, #059669); margin: -24px -24px 16px -24px; }
    .header { text-align: center; margin-bottom: 14px; }
    .company { font-size: 13px; font-weight: 900; color: #1e1b4b; text-transform: uppercase; margin: 0; }
    .reg { font-size: 10px; color: #64748b; margin-top: 2px; }
    .avatar { width: 80px; height: 80px; border-radius: 18px; background: #e0e7ff; color: #4338ca; font-size: 28px; font-weight: 900; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; border: 2px solid #c7d2fe; overflow: hidden; }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .name { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; text-align: center; }
    .desig { font-size: 12px; font-weight: 700; color: #4f46e5; text-transform: uppercase; text-align: center; margin: 2px 0; }
    .section { font-size: 11px; color: #64748b; text-align: center; margin: 0 0 14px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 12px; font-size: 11px; margin-bottom: 14px; }
    .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #e2e8f0; }
    .row:last-child { border-bottom: none; }
    .lbl { color: #64748b; }
    .val { font-weight: 700; font-family: monospace; }
    .qr-box { background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 16px; padding: 12px; text-align: center; }
    .qr-title { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #4338ca; margin-bottom: 6px; }
    .qr-svg-wrap { background: white; padding: 8px; border-radius: 10px; display: inline-block; }
    .qr-id { font-size: 10px; font-family: monospace; font-weight: 800; color: #1e1b4b; margin-top: 6px; }
    .controls { margin-top: 20px; display: flex; gap: 10px; }
    .btn { padding: 10px 24px; border-radius: 12px; font-weight: 800; font-size: 13px; border: none; cursor: pointer; background: #4f46e5; color: white; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); }
    @media print { .controls { display: none !important; } body { background: white !important; padding: 0 !important; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="stripe"></div>
    <div class="header">
      <h3 class="company">${companyProfile.name}</h3>
      <div class="reg">Official Verified ID · Reg: ${companyProfile.factoryRegNo}</div>
    </div>
    <div class="avatar">
      ${user.photoUrl ? `<img src="${user.photoUrl}">` : getInitials(user.fullName)}
    </div>
    <div class="name">${user.fullName}</div>
    <div class="desig">${designation}</div>
    <div class="section">${sectionText} · ${user.department || 'Production'}</div>
    <div class="info-box">
      <div class="row"><span class="lbl">Employee ID:</span><span class="val" style="color:#4f46e5">${user.employeeId}</span></div>
      <div class="row"><span class="lbl">Joining Date:</span><span class="val" style="color:#059669">${formatJoiningDate(user.joiningDate)} (${user.joiningDate})</span></div>
      ${user.whatsapp ? `<div class="row"><span class="lbl">WhatsApp:</span><span class="val">${user.whatsapp}</span></div>` : ''}
      <div class="row"><span class="lbl">Facility Address:</span><span class="val">${companyProfile.address.split(',')[0]}</span></div>
    </div>
    <div class="qr-box">
      <div class="qr-title">Instant Attendance Scan QR</div>
      <div class="qr-svg-wrap">${qrSvgString}</div>
      <div class="qr-id">ID: ${user.employeeId} · ACTIVE</div>
    </div>
  </div>
  <div class="controls">
    <button class="btn" onclick="window.print()">🖨️ প্রিন্ট করুন / Save as PDF</button>
  </div>
  <script>
    setTimeout(function() {
      try { window.print(); } catch(e){}
    }, 400);
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = `ID_CARD_${user.employeeId}_${user.fullName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

    setDownloadMsg(isBn ? '✓ আইডি কার্ড প্রিন্ট ফাইল ডাউনলোড সম্পন্ন হয়েছে!' : 'ID Card print file downloaded!');
    setTimeout(() => setDownloadMsg(''), 4000);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden border-2 border-indigo-600 animate-in fade-in zoom-in-95 duration-200 cursor-default my-4"
      >
        
        {/* Top colored accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-600" />

        {/* Download notification banner */}
        {downloadMsg && (
          <div className="mb-2 p-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-between gap-2 animate-fade-in no-print">
            <span>{downloadMsg}</span>
            <button type="button" onClick={() => setDownloadMsg('')} className="text-white hover:text-emerald-200 text-xs">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-3 pt-1">
          <div className="flex items-center gap-2.5">
            <CompanyLogo logoUrl={companyProfile.logoUrl} size="sm" variant="mark-only" />
            <div>
              <h4 className="font-extrabold text-xs tracking-tight text-indigo-950 uppercase leading-snug">
                {companyProfile.name}
              </h4>
              <p className="text-[10px] text-slate-500 font-medium">
                {t.officialIdCard} · {t.factoryRegNo}: {companyProfile.factoryRegNo}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition cursor-pointer no-print"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ID Photo & Info */}
        <div className="flex flex-col items-center text-center space-y-2.5 my-2">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-sm bg-indigo-50 flex items-center justify-center">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-indigo-600 tracking-tight">
                {getInitials(user.fullName)}
              </span>
            )}
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              {user.fullName}
            </h3>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mt-0.5">
              {designation}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {sectionText} · {user.department || 'Production'}
            </p>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-slate-50 rounded-2xl p-3 space-y-1.5 border border-slate-200 text-xs">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-500">{t.empId}:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-indigo-600">{user.employeeId}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="no-print p-0.5 rounded text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                title={isBn ? 'আইডি কপি করুন' : 'Copy ID'}
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center py-0.5 border-t border-slate-200/60">
            <span className="text-slate-500">{t.joiningDate}:</span>
            <span className="font-mono font-bold text-emerald-700">
              {formatJoiningDate(user.joiningDate)} <span className="text-[10px] text-slate-400">({user.joiningDate})</span>
            </span>
          </div>
          {user.whatsapp && (
            <div className="flex justify-between items-center py-0.5 border-t border-slate-200/60">
              <span className="text-slate-500">{t.whatsappNumber}:</span>
              <span className="font-mono font-semibold text-slate-700">{user.whatsapp}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-0.5 border-t border-slate-200/60 text-[10px] text-slate-500">
            <span>{companyProfile.address.split(',')[0]}</span>
            <span className="font-mono font-medium">Valid Official</span>
          </div>
        </div>

        {/* Dynamic QR Code for Fast Attendance Scanning */}
        <div className="my-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-700 mb-2">
            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isBn ? 'তাৎক্ষণিক হাজিরা স্ক্যান কিউআর কোড' : 'Instant Attendance Scan QR'}</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border-2 border-indigo-200 shadow-xs flex items-center justify-center">
            <QRCodeSVG 
              id="id-card-modal-qr-svg"
              value={user.employeeId}
              size={96}
              level="M"
              includeMargin={false}
              fgColor="#1e1b4b"
              bgColor="#ffffff"
            />
          </div>

          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-black text-slate-700 tracking-wider">
              ID: {user.employeeId}
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              {isBn ? 'সক্রিয়' : 'Active'}
            </span>
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5">
            {isBn ? 'ক্যামেরা স্ক্যানার দিয়ে স্ক্যান করে দ্রুত হাজিরা নিশ্চিত করুন' : 'Scan via attendance terminal for rapid clock-in/out'}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2 no-print">
          <button
            type="button"
            onClick={handlePrintOrSave}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            title={isBn ? 'আইডি কার্ড প্রিন্ট বা সেভ করুন' : 'Print or Save ID Card'}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.printOrSave}</span>
          </button>
          {waShareUrl && (
            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
