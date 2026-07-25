import React, { useState, useRef, useEffect } from 'react';
import { CompanyDocument, Vehicle, Driver } from '../types';
import { Language, t } from '../lib/i18n';
import { 
  Camera, 
  Upload, 
  X, 
  Plus, 
  FileText, 
  ShieldCheck, 
  Car, 
  User, 
  Building2, 
  Calendar, 
  Search, 
  Eye, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileCheck, 
  Maximize2,
  RefreshCw,
  FlipHorizontal,
  Sparkles
} from 'lucide-react';

interface CompanyDocumentVaultProps {
  documents: CompanyDocument[];
  vehicles: Vehicle[];
  drivers: Driver[];
  lang: Language;
  onSaveDocuments: (documents: CompanyDocument[]) => void;
}

export const CompanyDocumentVault: React.FC<CompanyDocumentVaultProps> = ({
  documents,
  vehicles,
  drivers,
  lang,
  onSaveDocuments
}) => {
  const isAr = lang === 'ar';

  // Modal / Form state
  const [showScanModal, setShowScanModal] = useState(false);
  const [docFilter, setDocFilter] = useState<'all' | 'vehicle' | 'driver' | 'company'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<CompanyDocument | null>(null);

  // Form inputs
  const [title, setTitle] = useState('');
  const [type, setType] = useState<CompanyDocument['type']>('contract');
  const [linkedEntityType, setLinkedEntityType] = useState<'vehicle' | 'driver' | 'company'>('company');
  const [linkedEntityId, setLinkedEntityId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Camera state
  const [captureMethod, setCaptureMethod] = useState<'camera' | 'upload'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [successMessage, setSuccessMessage] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera initialization
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera streaming failed:", err);
      setCameraError(
        isAr 
          ? "لم نتمكن من فتح الكاميرا. يمكنك استخدام خيار رفع صورة المستند بدلاً من ذلك."
          : "Camera unavailable. You can use the file upload option to attach document images."
      );
      setCaptureMethod('upload');
    }
  };

  useEffect(() => {
    if (showScanModal && captureMethod === 'camera' && !capturedImage) {
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [showScanModal, captureMethod, facingMode, capturedImage]);

  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setCapturedImage(dataUrl);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !capturedImage) return;

    const newDoc: CompanyDocument = {
      id: `doc-${Date.now()}`,
      title,
      type,
      linkedEntityType,
      linkedEntityId: linkedEntityType !== 'company' ? linkedEntityId : undefined,
      uploadDate: new Date().toISOString().slice(0, 10),
      expiryDate: expiryDate || undefined,
      documentImageBase64: capturedImage,
      notes: notes || undefined
    };

    const updated = [newDoc, ...documents];
    onSaveDocuments(updated);

    // Reset Form
    setTitle('');
    setType('contract');
    setLinkedEntityType('company');
    setLinkedEntityId('');
    setExpiryDate('');
    setNotes('');
    setCapturedImage(null);
    setShowScanModal(false);

    setSuccessMessage(true);
    setTimeout(() => setSuccessMessage(false), 3000);
  };

  const handleDeleteDocument = (id: string) => {
    if (window.confirm(t('confirmDeleteDoc', lang))) {
      const updated = documents.filter(d => d.id !== id);
      onSaveDocuments(updated);
    }
  };

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const matchesCategory = docFilter === 'all' || doc.linkedEntityType === docFilter;
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getEntityName = (doc: CompanyDocument) => {
    if (doc.linkedEntityType === 'vehicle' && doc.linkedEntityId) {
      const v = vehicles.find(veh => veh.id === doc.linkedEntityId);
      return v ? `${v.make} ${v.model} (${v.plateNumber})` : (isAr ? 'سيارة' : 'Vehicle');
    }
    if (doc.linkedEntityType === 'driver' && doc.linkedEntityId) {
      const d = drivers.find(drv => drv.id === doc.linkedEntityId);
      return d ? d.name : (isAr ? 'سائق' : 'Driver');
    }
    return isAr ? 'شركة (عام)' : 'General Company';
  };

  const getExpiryBadge = (expDate?: string) => {
    if (!expDate) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(expDate);
    target.setHours(0,0,0,0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {isAr ? `منتهي (${Math.abs(diffDays)} يوم)` : `Expired (${Math.abs(diffDays)}d ago)`}
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {isAr ? `ينتهي خلال ${diffDays} يوم` : `Expires in ${diffDays}d`}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        {isAr ? `ساري (${expDate})` : `Valid (${expDate})`}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            {t('docVaultTitle', lang)}
          </h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            {t('docVaultSub', lang)}
          </p>
        </div>

        <button
          onClick={() => {
            setCapturedImage(null);
            setShowScanModal(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2 shrink-0"
        >
          <Camera className="w-4 h-4" />
          {t('scanNewDoc', lang)}
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-bold">{t('saveSuccess', lang)}</p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setDocFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              docFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {t('filterAllDocs', lang)} ({documents.length})
          </button>
          <button
            onClick={() => setDocFilter('vehicle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              docFilter === 'vehicle'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            {t('filterVehicleDocs', lang)}
          </button>
          <button
            onClick={() => setDocFilter('driver')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              docFilter === 'driver'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            {t('filterDriverDocs', lang)}
          </button>
          <button
            onClick={() => setDocFilter('company')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              docFilter === 'company'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            {t('filterCompanyDocs', lang)}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className={`w-4 h-4 text-slate-400 absolute top-2.5 ${isAr ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('search', lang)}
            className={`w-full py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg ${
              isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">{t('noDocsFound', lang)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map(doc => {
            const entityName = getEntityName(doc);
            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Container */}
                  <div className="relative h-44 bg-slate-950 overflow-hidden group cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                    <img
                      src={doc.documentImageBase64}
                      alt={doc.title}
                      className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                    
                    <div className={`absolute top-3 ${isAr ? 'right-3' : 'left-3'} flex items-center gap-1.5`}>
                      <span className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold border border-slate-700 uppercase">
                        {t(doc.type as any, lang) || doc.type}
                      </span>
                    </div>

                    <div className={`absolute bottom-3 ${isAr ? 'right-3 left-3' : 'left-3 right-3'} flex items-center justify-between`}>
                      <span className="text-[11px] text-slate-300 font-mono flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded">
                        <Calendar className="w-3 h-3 text-blue-400" />
                        {doc.uploadDate}
                      </span>
                      {getExpiryBadge(doc.expiryDate)}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-2.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                      {doc.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      {doc.linkedEntityType === 'vehicle' && <Car className="w-4 h-4 text-blue-500 shrink-0" />}
                      {doc.linkedEntityType === 'driver' && <User className="w-4 h-4 text-emerald-500 shrink-0" />}
                      {doc.linkedEntityType === 'company' && <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />}
                      <span className="font-semibold truncate">{t('linkedTo', lang)}: {entityName}</span>
                    </div>

                    {doc.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                        "{doc.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t('viewDoc', lang)}
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={doc.documentImageBase64}
                      download={`${doc.title.replace(/\s+/g, '_')}.png`}
                      className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                      title={t('downloadDoc', lang)}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 transition"
                      title={t('deleteDoc', lang)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCAN / UPLOAD DOCUMENT MODAL */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-500" />
                {t('scanNewDoc', lang)}
              </h3>
              <button
                onClick={() => setShowScanModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('docTitleLabel', lang)}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={t('docTitlePlaceholder', lang)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('docTypeLabel', lang)}
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-xs"
                  >
                    <option value="contract">{t('contract', lang)}</option>
                    <option value="insurance">{t('insurance', lang)}</option>
                    <option value="license">{t('license', lang)}</option>
                    <option value="commercial_reg">{t('commercial_reg', lang)}</option>
                    <option value="other">{t('other', lang)}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('expiryDateLabel', lang)}
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('linkToLabel', lang)}
                  </label>
                  <select
                    value={linkedEntityType}
                    onChange={e => {
                      const val = e.target.value as any;
                      setLinkedEntityType(val);
                      setLinkedEntityId('');
                    }}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-xs"
                  >
                    <option value="company">{t('companyGeneral', lang)}</option>
                    <option value="vehicle">{t('linkVehicle', lang)}</option>
                    <option value="driver">{t('linkDriver', lang)}</option>
                  </select>
                </div>

                {linkedEntityType === 'vehicle' && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'اختر السيارة' : 'Select Vehicle'}
                    </label>
                    <select
                      required
                      value={linkedEntityId}
                      onChange={e => setLinkedEntityId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-xs"
                    >
                      <option value="">{t('selectVehicle', lang)}</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.make} {v.model} ({v.plateNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {linkedEntityType === 'driver' && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'اختر السائق' : 'Select Driver'}
                    </label>
                    <select
                      required
                      value={linkedEntityId}
                      onChange={e => setLinkedEntityId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-xs"
                    >
                      <option value="">{t('selectDriver', lang)}</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.idNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* CAMERA CAPTURE / FILE UPLOADER */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {isAr ? 'صورة المستند / العقد (من الكاميرا أو الجهاز):' : 'Document Image (Camera or Upload):'}
                  </span>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1">
                    <button
                      type="button"
                      onClick={() => setCaptureMethod('camera')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                        captureMethod === 'camera' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {t('cameraTab', lang)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCaptureMethod('upload')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                        captureMethod === 'upload' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {t('uploadTab', lang)}
                    </button>
                  </div>
                </div>

                {capturedImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 text-center p-2">
                    <img src={capturedImage} alt="Captured preview" className="max-h-60 mx-auto object-contain rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setCapturedImage(null)}
                      className="mt-2 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {t('retakePhoto', lang)}
                    </button>
                  </div>
                ) : captureMethod === 'camera' ? (
                  <div className="space-y-2">
                    {cameraError ? (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl text-center space-y-2">
                        <AlertTriangle className="w-6 h-6 mx-auto text-amber-500" />
                        <p>{cameraError}</p>
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-60 flex items-center justify-center border border-slate-700">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute inset-4 border-2 border-dashed border-blue-400/60 rounded-lg pointer-events-none flex items-center justify-center">
                          <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur">
                            {isAr ? 'ضع المستند داخل الإطار' : 'Fit Document inside Frame'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                          className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black text-white rounded-lg backdrop-blur"
                        >
                          <FlipHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {!cameraError && (
                      <button
                        type="button"
                        onClick={handleSnapPhoto}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        {t('snapPhoto', lang)}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="text-slate-500 dark:text-slate-400">
                      {isAr ? 'انقر لاختيار صورة العقد أو المستند من الجهاز' : 'Click to select document image from your device'}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="doc-file-input"
                    />
                    <label
                      htmlFor="doc-file-input"
                      className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition"
                    >
                      {t('uploadImageBtn', lang)}
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('notesLabel', lang)}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t('notesPlaceholder', lang)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScanModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  {t('cancel', lang)}
                </button>
                <button
                  type="submit"
                  disabled={!capturedImage || !title}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  {t('saveDocBtn', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-sm text-blue-400">{previewDoc.title}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {t('uploadDate', lang)}: {previewDoc.uploadDate} • {getEntityName(previewDoc)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.documentImageBase64}
                  download={`${previewDoc.title.replace(/\s+/g, '_')}.png`}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  {t('downloadDoc', lang)}
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-auto flex-1 flex items-center justify-center bg-slate-950/80">
              <img
                src={previewDoc.documentImageBase64}
                alt={previewDoc.title}
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-2xl border border-slate-800"
              />
            </div>

            {previewDoc.notes && (
              <div className="p-4 bg-slate-900 border-t border-slate-800 text-slate-300 text-xs">
                <span className="font-bold text-blue-400">{t('notesLabel', lang)}:</span> {previewDoc.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
