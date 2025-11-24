import { GoogleGenAI } from "@google/genai";
import { LookAngle, SignalStatus, Coordinates } from '../types';
import { Language } from '../utils/translations';

export const getGeminiAdvice = async (
  shipPos: Coordinates,
  heading: number,
  satLng: number,
  lookAngle: LookAngle,
  status: SignalStatus,
  lang: Language
): Promise<string> => {
  try {
    // @ts-ignore
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return lang === 'zh' 
        ? "未找到 Gemini API 密钥。请配置环境变量。" 
        : "Gemini API Key not found. Please configure the environment.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    let prompt = "";

    if (lang === 'zh') {
      prompt = `
        你是一名海事卫星通信专家。
        
        当前船舶状态：
        - 位置：纬度 ${shipPos.lat.toFixed(2)}, 经度 ${shipPos.lng.toFixed(2)}
        - 船艏向：${heading} 度
        - 目标卫星：GEO 卫星，经度 ${satLng}
        
        计算角度：
        - 卫星真方位：${lookAngle.azimuth.toFixed(1)} 度
        - 卫星仰角：${lookAngle.elevation.toFixed(1)} 度
        - 相对方位（相对于船头）：${lookAngle.relativeAzimuth.toFixed(1)} 度
        
        信号状态：${status}
        
        请用2-3句话解释当前的连接情况。
        重要规则：当仰角低于 5 度时，为了防止对临近轨位的其他卫星产生旁瓣干扰，通信系统必须强制停止发射（Mute/Block）。
        
        建议指南：
        1. 如果仰角 < 5 度，必须明确指出是因为防止干扰其他卫星而不可用。
        2. 如果状态是被遮挡 (BLOCKED)，建议一个更好的航向来避开遮挡物。
        3. 保持专业、简洁的操作建议。
      `;
    } else {
      prompt = `
        You are a maritime satellite communications expert.
        
        Current Ship Status:
        - Position: ${shipPos.lat.toFixed(2)} lat, ${shipPos.lng.toFixed(2)} lng
        - Heading: ${heading} degrees
        - Target Satellite: GEO at ${satLng} longitude
        
        Calculated Angles:
        - True Azimuth to Sat: ${lookAngle.azimuth.toFixed(1)} deg
        - Elevation to Sat: ${lookAngle.elevation.toFixed(1)} deg
        - Relative Azimuth (to bow): ${lookAngle.relativeAzimuth.toFixed(1)} deg
        
        Signal Status: ${status}
        
        Explain the current connectivity situation in 2-3 sentences.
        Important Rule: When elevation is below 5 degrees, the transmission must be forcibly disabled to prevent off-axis interference with adjacent satellites.
        
        Guidelines:
        1. If elevation < 5 deg, explicitly state that transmission is disabled to prevent interference.
        2. If status is BLOCKED, suggest a better heading to clear the obstruction.
        3. Keep it operational and professional.
      `;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || (lang === 'zh' ? "无建议生成。" : "No advice generated.");
  } catch (error: any) {
    console.error("Gemini Error:", error);

    // Check for 429 Resource Exhausted / Quota Exceeded
    // The error object might be structured differently depending on the library version, 
    // so we check multiple properties and the string representation.
    const isQuotaError = 
      error?.status === 429 || 
      error?.code === 429 || 
      (error?.error && error.error.code === 429) ||
      error?.message?.includes('429') || 
      error?.message?.includes('Quota') || 
      error?.message?.includes('RESOURCE_EXHAUSTED');

    if (isQuotaError) {
      return lang === 'zh' 
        ? "⚠️ 配额已耗尽。请稍后再试或检查 API 计划。" 
        : "⚠️ Quota exceeded. Please try again later.";
    }

    return lang === 'zh' ? "暂时无法获取 AI 建议。" : "Unable to retrieve AI advice at this time.";
  }
};