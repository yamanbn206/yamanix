import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Health Endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Fleet Management Server" });
});

// AI Fleet Analysis Endpoint
app.post("/api/ai-analysis", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured on the server." 
      });
    }

    const { fleetData, lang = "ar" } = req.body;
    const isAr = lang === "ar";

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = isAr ? `أنت استشاري خبير في إدارة أسطول المركبات والصيانة وتقليل النفقات التشغيلية.
قم بتحليل بيانات أسطول شركة النقل التالية:
${JSON.stringify(fleetData, null, 2)}

يرجى تزويدنا بتقرير تحليلي مهني ومفصل باللغة العربية يحتوي على العناصر التالية:
1. 📊 **تحليل الأعطال وتكاليف الصيانة**: تحديد أكثر السيارات تكراراً للأعطال وأكثرها كلفة، وأداء الكراجات المتعامل معها.
2. 🛠️ **تحليل القطع الأكثر استبدالاً**: تقييم استهلاك قطع الغيار وهل يشير إلى أسلوب قيادة خاطئ أو ظروف تشغيل قاسية.
3. ⛽ **تحليل استهلاك الوقود**: السيارات الأعلى استهلاكاً ومعدل التكلفة لكل كيلومتر.
4. ⚠️ **إدارة المخاطر والتراخيص**: التنبيه على الرخص والتأمين وشبهات التأخير.
5. 💡 **توصيات عملية**: 4 إلى 5 خطوات فورية لخفض المصاريف بنسبة 15-20% وحماية الأصول.

اجعل أسلوبك إدارياً دقيقاً ومرتباً بعناوين جليّة ونقاط واضحة.` : `You are an expert fleet management and cost optimization consultant.
Analyze the following transport fleet data:
${JSON.stringify(fleetData, null, 2)}

Provide a detailed, professional fleet analysis report in English containing:
1. 📊 **Breakdown & Maintenance Cost Analysis**: Identify highest-cost and most frequently failing vehicles, along with workshop performance.
2. 🛠️ **Replacement Parts Analysis**: Evaluate parts consumption and flag potential harsh driving or severe operating conditions.
3. ⛽ **Fuel Consumption Analysis**: Highest-consuming vehicles and cost per kilometer.
4. ⚠️ **Risk & Compliance Management**: Registration, insurance expiries, and driver compliance risks.
5. 💡 **Actionable Cost-Reduction Recommendations**: 4 to 5 immediate steps to cut operational costs by 15-20% while preserving assets.

Keep the tone concise, executive, and structured with clear bold section headers and bullet points.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ analysis: response.text });
  } catch (err: any) {
    console.error("AI Analysis error:", err);
    res.status(500).json({ error: err.message || "An error occurred during AI analysis." });
  }
});

// AI 3-Month Vehicle Expenses Summary & Cost-Saving Report Endpoint
app.post("/api/ai-expense-summary", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured on the server." 
      });
    }

    const { vehicles = [], maintenance = [], fuel = [], lang = "en" } = req.body;

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Calculate cutoff date for last 3 months (90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoffStr = ninetyDaysAgo.toISOString().slice(0, 10);

    // Filter maintenance & fuel for the last 3 months
    const recentMaintenance = maintenance.filter((m: any) => m.date && m.date >= cutoffStr);
    const recentFuel = fuel.filter((f: any) => f.date && f.date >= cutoffStr);

    const totalMaintCost = recentMaintenance.reduce((sum: number, m: any) => sum + (Number(m.totalCost) || 0), 0);
    const periodicCost = recentMaintenance.filter((m: any) => m.type === 'periodic').reduce((sum: number, m: any) => sum + (Number(m.totalCost) || 0), 0);
    const breakdownCost = totalMaintCost - periodicCost;

    const totalFuelCost = recentFuel.reduce((sum: number, f: any) => sum + (Number(f.cost) || 0), 0);
    const totalFuelLiters = recentFuel.reduce((sum: number, f: any) => sum + (Number(f.liters) || 0), 0);

    // Cost by vehicle
    const vehicleCostMap: Record<string, { make: string; plate: string; maint: number; fuel: number; total: number }> = {};
    vehicles.forEach((v: any) => {
      vehicleCostMap[v.id] = { make: `${v.make} ${v.model}`, plate: v.plateNumber, maint: 0, fuel: 0, total: 0 };
    });

    recentMaintenance.forEach((m: any) => {
      if (vehicleCostMap[m.vehicleId]) {
        vehicleCostMap[m.vehicleId].maint += Number(m.totalCost) || 0;
        vehicleCostMap[m.vehicleId].total += Number(m.totalCost) || 0;
      }
    });

    recentFuel.forEach((f: any) => {
      if (vehicleCostMap[f.vehicleId]) {
        vehicleCostMap[f.vehicleId].fuel += Number(f.cost) || 0;
        vehicleCostMap[f.vehicleId].total += Number(f.cost) || 0;
      }
    });

    const sortedVehicles = Object.values(vehicleCostMap).sort((a, b) => b.total - a.total).slice(0, 5);

    // Extract parts replaced
    const partsList: string[] = [];
    recentMaintenance.forEach((m: any) => {
      if (m.parts && Array.isArray(m.parts)) {
        m.parts.forEach((p: any) => {
          if (p.partName) partsList.push(`${p.partName} (qty: ${p.quantity || 1})`);
        });
      }
    });

    const isAr = lang === 'ar';

    const prompt = isAr ? `
أنت استشاري مالي وإداري خبير في أسطول المركبات وخفض التكاليف التشغيلية.
قم بتحليل بيانات نفقات السيارات للـ 3 أشهر الماضية وتزويدنا بتقرير موجز ومبني على النقاط المحددة يركز على "فرص خفض التكاليف".

بيانات الـ 3 أشهر الماضية (منذ ${cutoffStr}):
- إجمالي نفقات الصيانة والإصلاح: ${totalMaintCost.toLocaleString()} ريال (${recentMaintenance.length} عملية)
  • صيانة دورية وقائية: ${periodicCost.toLocaleString()} ريال
  • إصلاح أعطال مفاجئة: ${breakdownCost.toLocaleString()} ريال
- إجمالي نفقات الوقود: ${totalFuelCost.toLocaleString()} ريال (${recentFuel.length} تعبئة، إجمالي ${totalFuelLiters.toLocaleString()} لتر)
- السيارات الأعلى كلفة في الـ 3 أشهر الماضية:
${sortedVehicles.map((v, i) => `  ${i + 1}. ${v.make} (اللوحة: ${v.plate}) - إجمالي: ${v.total.toLocaleString()} ريال (صيانة: ${v.maint.toLocaleString()}، وقود: ${v.fuel.toLocaleString()})`).join('\n')}
- قطع الغيار الأكثر استبدالاً: ${partsList.slice(0, 10).join(', ') || 'لا توجد قطع محددة'}

يرجى إعداد التقرير التلخيصي باللغة العربية متضمناً:
1. 📊 **ملخص الأداء المالي للـ 3 أشهر**: قراءة سريعة في التكاليف والنسبة بين الوقود والصيانة والأعطال الطارئة.
2. 💡 **فرص خفض التكاليف (فرص التوفير)**: قدم من 4 إلى 5 نقاط محددة وعملية جداً للتوفير (مثل: معالجة السيارات الأكثر تحملاً للأعطال، التفاوض على شراء قطع الغيار بالجملة، تحسين استهلاك الوقود، الالتزام بجدول الصيانة الوقائية لمنع الأعطال المكلفة).
3. 🎯 **التوفير المتوقع**: تقدير النسبة أو المبلغ المتوقع توفيره (مثلاً: 12-18% توفير شهري).

اجعل الأسلوب موجزاً، مهنياً، مفرداً بنقاط واضحة ومباشرة.
` : `
You are a Senior Fleet Financial Analyst and Cost Optimization Specialist.
Analyze the vehicle expense data for the LAST 3 MONTHS and produce a brief, bulleted report focusing on actionable "Cost-Saving Opportunities".

Data Summary for Last 3 Months (Since ${cutoffStr}):
- Total Maintenance & Repair Cost: ${totalMaintCost.toLocaleString()} SAR (${recentMaintenance.length} records)
  • Preventive / Periodic Maintenance: ${periodicCost.toLocaleString()} SAR
  • Unexpected Breakdown Repairs: ${breakdownCost.toLocaleString()} SAR
- Total Fuel Expenses: ${totalFuelCost.toLocaleString()} SAR (${recentFuel.length} refills, ${totalFuelLiters.toLocaleString()} Liters)
- Top Cost-Driving Vehicles in Last 3 Months:
${sortedVehicles.map((v, i) => `  ${i + 1}. ${v.make} (Plate: ${v.plate}) - Total: ${v.total.toLocaleString()} SAR (Maint: ${v.maint.toLocaleString()}, Fuel: ${v.fuel.toLocaleString()})`).join('\n')}
- Key Replacement Parts: ${partsList.slice(0, 10).join(', ') || 'None specified'}

Provide a structured, bulleted response in English including:
1. 📊 **Executive 3-Month Expense Overview**: A quick breakdown of total spend and high-cost areas.
2. 💡 **Cost-Saving Opportunities**: 4 to 5 crisp, actionable bullet points (e.g. addressing high-breakdown vehicles, negotiating bulk spare parts pricing, driver fuel optimization, strictly enforcing preventive maintenance to reduce emergency repairs).
3. 🎯 **Estimated Savings Potential**: Targeted cost reduction percentage or amount.

Keep it concise, highly professional, and easy to read with bold bullet points.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ 
      success: true, 
      summary: response.text,
      stats: {
        cutoffDate: cutoffStr,
        totalMaintCost,
        totalFuelCost,
        totalExpenses: totalMaintCost + totalFuelCost,
        recentMaintenanceCount: recentMaintenance.length,
        recentFuelCount: recentFuel.length,
        topVehicle: sortedVehicles[0] ? `${sortedVehicles[0].make} (${sortedVehicles[0].plate})` : 'N/A'
      }
    });
  } catch (err: any) {
    console.error("AI Expense Summary API error:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI expense summary report." });
  }
});

// AI OCR Document Scanning Endpoint
app.post("/api/ocr-scan", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "مفتاح GEMINI_API_KEY غير متوفر لمعالجة الصورة." 
      });
    }

    const { imageBase64, docType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "لم يتم تقديم صورة للمسح." });
    }

    // Strip header if base64 contains data:image/jpeg;base64,
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const ai = new GoogleGenAI({ apiKey });

    let systemPrompt = "";
    if (docType === "driver_license") {
      systemPrompt = `أنت نظام ذكي للتعرف الضوئي على المستندات (OCR) متخصص في قراءة رخص القيادة والهويات.
قم بقراءة وتحليل صورة رخصة القيادة المرفقة بدقة واستخرج البيانات التالية بصيغة JSON فقط:
- "name": اسم صاحب الرخصة / السائق
- "idNumber": رقم الهوية أو رقم الإقامة
- "licenseNumber": رقم رخصة القيادة
- "licenseCategory": فئة الرخصة (اختر واحدة فقط: "خصوصي" أو "نقل خفيف / عمومي" أو "نقل ثقيل / معدات" أو "دراجة نارية")
- "licenseExpiryDate": تاريخ الانتهاء بصيغة YYYY-MM-DD (حول التاريخ الميلادي أو الهجري المكتوب لـ YYYY-MM-DD)
- "phone": رقم الجوال إن وجد في المستند وإلا ضع نصاً فارغاً ""
- "department": قسم الحركة أو الإدارة التابع لها إن وجدت وإلا "قسم الحركة والتوزيع"

أرجع النتيجة بصيغة JSON خالية من الأخطاء بدون أي نصوص إضافية خارج الـ JSON.`;
    } else {
      systemPrompt = `أنت نظام ذكي للتعرف الضوئي على المستندات (OCR) متخصص في قراءة رخص سير المركبات (الاستمارة) ووثائق الملكية والتأمين.
قم بقراءة وتحليل صورة استمارة/رخصة المركبة المرفقة واستخرج البيانات التالية بصيغة JSON فقط:
- "make": الصانع/الماركة (مثل: تويوتا، هيونداي، نيسان، إيسوزو)
- "model": طراز/موديل المركبة (مثل: هايلكس، إلانترا، دينا)
- "year": سنة الصنع (رقم مثلاً 2023)
- "plateNumber": رقم الأحرف والأرقام للوحة (مثال: أ ب ج 1234)
- "vinNumber": رقم الهيكل/الشاسيه (VIN)
- "color": اللون (مثل: أبيض، أسود، فضي)
- "fuelType": نوع الوقود (اختر من: "91" أو "95" or "diesel")
- "licenseExpiryDate": تاريخ انتهاء الاستمارة بصيغة YYYY-MM-DD
- "insuranceCompany": اسم شركة التأمين إن وجدت
- "policyNumber": رقم وثيقة التأمين إن وجد

أرجع النتيجة بصيغة JSON خالية من الأخطاء بدون أي نصوص إضافية خارج الـ JSON.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64
          }
        },
        systemPrompt
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsedJson = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsedJson });
  } catch (err: any) {
    console.error("OCR API error:", err);
    res.status(500).json({ error: err.message || "فشل التعرف الضوئي على المستند." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
