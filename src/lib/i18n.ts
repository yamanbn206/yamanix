export type Language = 'en' | 'ar';

export const translations = {
  en: {
    // Top Bar & App Nav
    appName: "Fleet & Driver Management System",
    appSubTitle: "Smart Fleet Operations & Document Vault",
    languageToggle: "العربية",
    dashboard: "Dashboard & Analytics",
    checkout: "Checkout & Return",
    vehicles: "Vehicles & Fleet",
    drivers: "Drivers & Staff",
    maintenance: "Maintenance & Garages",
    fuel: "Fuel & Expenses",
    expiries: "Alerts & Expiries",
    ai_advisor: "AI Fleet Advisor",
    reports: "Print & Reports",
    settings: "Company Settings & Vault",

    fleetVehicles: "Fleet & Vehicles",
    driversLicenses: "Drivers & Licenses",
    handoverSignature: "Checkout & Return (Signature)",
    maintenanceGarages: "Maintenance & Garages",
    fuelExpenses: "Fuel & Expenses",
    expiriesAlerts: "Expiries & Alerts",
    printReports: "Print Reports",
    aiAdvisor: "AI Advisor",
    companySettings: "Company Settings & Logo",

    // Header badges
    activeAlerts: "Active Alerts",
    resetData: "Reset App Data",
    confirmReset: "Are you sure you want to reset all data to default samples?",
    dataResetDone: "Application state reset successfully!",

    // Company Settings & Document Vault
    companySettingsTitle: "Company Branding & Official Settings",
    companySettingsSub: "Manage company identity, print headers, contact details, and document scanner vault.",
    generalSettingsTab: "Company Identity & CSV Export",
    docVaultTab: "Contracts & Insurance Scanner Vault",
    
    // Document Scanner Strings
    docVaultTitle: "Contracts & Insurance Vault",
    docVaultSub: "Scan and store original contracts, insurance policies, and licenses using camera or photo upload, linking them to specific vehicles or drivers.",
    scanNewDoc: "Scan / Upload New Document",
    docTitleLabel: "Document / Contract Title *",
    docTitlePlaceholder: "e.g. Hilux 2024 Commercial Lease Contract",
    docTypeLabel: "Document Category *",
    contract: "Contract / Lease Agreement",
    insurance: "Insurance Policy",
    license: "Driver License / Registration",
    commercial_reg: "Commercial Registration / Tax",
    other: "Other Official Record",
    linkToLabel: "Link Document To *",
    companyGeneral: "General Company Document",
    linkVehicle: "Specific Vehicle",
    linkDriver: "Specific Driver",
    selectVehicle: "Select Vehicle from fleet...",
    selectDriver: "Select Driver from team...",
    expiryDateLabel: "Expiry Date (Optional)",
    notesLabel: "Notes / Details",
    notesPlaceholder: "e.g. Scanned copy of lease agreement signed with Bank...",
    cameraTab: "Capture with Camera",
    uploadTab: "Upload Image File",
    snapPhoto: "Snap Document Photo",
    retakePhoto: "Retake Photo",
    uploadImageBtn: "Choose Image File",
    saveDocBtn: "Save & Archive Document",
    saveSuccess: "Document scanned and archived successfully!",

    // Filter & Cards
    filterAllDocs: "All Vault Documents",
    filterVehicleDocs: "Vehicle Contracts & Insurance",
    filterDriverDocs: "Driver Contracts & Licenses",
    filterCompanyDocs: "Company Legal Documents",
    noDocsFound: "No scanned documents found in this view.",
    linkedTo: "Linked To",
    uploadDate: "Scanned On",
    expiresOn: "Expires On",
    viewDoc: "View Document",
    downloadDoc: "Download Image",
    deleteDoc: "Delete",
    confirmDeleteDoc: "Are you sure you want to remove this scanned document?",

    // Print notice
    printNotice: "Note: Official print receipts and fleet reports are strictly rendered in English according to system standards.",

    // Dashboard
    totalVehicles: "Total Fleet Vehicles",
    availableVehicles: "Available",
    checkedOutVehicles: "Checked Out",
    inMaintenance: "In Maintenance",
    activeDrivers: "Active Drivers",
    totalFuelExpense: "Total Fuel Spend",
    totalMaintenanceExpense: "Total Maintenance Cost",
    recentActivity: "Recent Checkout Activity",
    fleetStatusDistribution: "Fleet Status Breakdown",

    // Common Buttons
    save: "Save Changes",
    cancel: "Cancel",
    search: "Search...",
    filter: "Filter",
    status: "Status",
    actions: "Actions",
    add: "Add New"
  },
  ar: {
    // Top Bar & App Nav
    appName: "نظام إدارة أسطول السيارات والسائقين",
    appSubTitle: "إدارة العمليات وأرشيف العقود والمستندات الرقمي",
    languageToggle: "English",
    dashboard: "لوحة التحكم والتحليلات",
    checkout: "استلام وتسليم السيارات",
    vehicles: "أسطول السيارات",
    drivers: "السائقين والموظفين",
    maintenance: "الصيانة والورش",
    fuel: "البنزين والمصروفات",
    expiries: "التنبيهات والمواعيد",
    ai_advisor: "المستشار الذكي",
    reports: "طباعة التقارير والإيصالات",
    settings: "إعدادات الشركة والمستندات",

    fleetVehicles: "الأسطول والسيارات",
    driversLicenses: "السائقون والرخص",
    handoverSignature: "الاستلام والتسليم (التوقيع)",
    maintenanceGarages: "الصيانة والقطع والكراجات",
    fuelExpenses: "البترول والمصاريف",
    expiriesAlerts: "تنبيهات الانتهاء",
    printReports: "تقارير الطباعة",
    aiAdvisor: "المساعد الذكي (AI)",
    companySettings: "تخصيص الشركة واللوجو",

    // Header badges
    activeAlerts: "تنبيهات نشطة",
    resetData: "استعادة البيانات الافتراضية",
    confirmReset: "هل أنت متأكد من إعادة ضبط كافة البيانات إلى العينات الافتراضية؟",
    dataResetDone: "تمت إعادة ضبط كافة بيانات التطبيق بنجاح!",

    // Company Settings & Document Vault
    companySettingsTitle: "إعدادات الشركة وخزينة المستندات",
    companySettingsSub: "تخصيص هوية الشركة، الترويسة المطبوعة، ومعلومات التواصل وخزينة مسح العقود.",
    generalSettingsTab: "هوية الشركة والنسخ الاحتياطي",
    docVaultTab: "مسح وتخزين العقود والتأمين (الكاميرا)",
    
    // Document Scanner Strings
    docVaultTitle: "خزينة العقود وثائق التأمين الممسوحة",
    docVaultSub: "مسح وتخزين صور العقود الأصلية ووثائق التأمين باستخدام الكاميرا أو المرفقات وربطها بالسيارات والسائقين.",
    scanNewDoc: "مسح / إرفاق مستند جديد",
    docTitleLabel: "عنوان أو اسم المستند / العقد *",
    docTitlePlaceholder: "مثال: عقد تمويل وإيجار هايلكس 2024",
    docTypeLabel: "نوع أو تصنيف المستند *",
    contract: "عقد تمويل / إيجار / عمل",
    insurance: "وثيقة تأمين شامل / ضد الغير",
    license: "رخصة سير / استمارة / رخصة قيادة",
    commercial_reg: "سجل تجاري / رقم ضريبي",
    other: "مستند ورقي آخر",
    linkToLabel: "ربط المستند بـ *",
    companyGeneral: "مستند شركة عام",
    linkVehicle: "سيارة محددة بالأسطول",
    linkDriver: "سائق محدد بالأسطول",
    selectVehicle: "اختر السيارة من الأسطول...",
    selectDriver: "اختر السائق من الفريق...",
    expiryDateLabel: "تاريخ انتهاء المستند (اختياري)",
    notesLabel: "ملاحظات وتفاصيل إضافية",
    notesPlaceholder: "مثال: نسخة ممسوخة ضوئياً وموثقة من البنك...",
    cameraTab: "التقاط بواسطة الكاميرا",
    uploadTab: "رفع ملف صورة",
    snapPhoto: "التقاط صورة المستند الآن",
    retakePhoto: "إعادة التقاط الصورة",
    uploadImageBtn: "اختيار صورة المستند",
    saveDocBtn: "حفظ وأرشفة المستند الممسوح",
    saveSuccess: "تمت أرشفة المستند بنجاح!",

    // Filter & Cards
    filterAllDocs: "جميع المستندات والأرشيف",
    filterVehicleDocs: "عقود وتأمين السيارات",
    filterDriverDocs: "عقود ورخص السائقين",
    filterCompanyDocs: "المستندات الرسمية للشركة",
    noDocsFound: "لا توجد مستندات ممسوخة في هذا التصنيف.",
    linkedTo: "مرتبط بـ",
    uploadDate: "تاريخ المسح",
    expiresOn: "ينتهي في",
    viewDoc: "معاينة المستند",
    downloadDoc: "تحميل الصورة",
    deleteDoc: "حذف",
    confirmDeleteDoc: "هل أنت متأكد من حذف هذا المستند الممسوح من الخزينة؟",

    // Print notice
    printNotice: "ملاحظة: مخرجات الطباعة الرسمية والتقارير المطبوعة دائماً باللغة الإنجليزية طبقاً لمعايير النظام.",

    // Dashboard
    totalVehicles: "إجمالي سيارات الأسطول",
    availableVehicles: "متاحة للخدمة",
    checkedOutVehicles: "مستلمة حالياً",
    inMaintenance: "في الورشة/الصيانة",
    activeDrivers: "السائقين النشطين",
    totalFuelExpense: "إجمالي مصروف البنزين",
    totalMaintenanceExpense: "إجمالي تكاليف الصيانة",
    recentActivity: "آخر حركات الاستلام والتسليم",
    fleetStatusDistribution: "توزيع حالة السيارات",

    // Common Buttons
    save: "حفظ التغييرات",
    cancel: "إلغاء",
    search: "بحث...",
    filter: "تصفية",
    status: "الحالة",
    actions: "الإجراءات",
    add: "إضافة جديد"
  }
};

export function t(key: keyof typeof translations['en'], lang: Language): string {
  return translations[lang]?.[key] || translations['en'][key] || key;
}
