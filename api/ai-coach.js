// 【特权指令】允许 Vercel 函数最长运行 60 秒（免费版上限），防止 AI 思考时间过长被强行掐断
export const maxDuration = 60; 

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 从 Vercel 的环境变量中安全读取你的 Gemini API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: '后端未配置 GEMINI_API_KEY' });
    }

    try {
        const promptPayload = req.body;
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(promptPayload)
        });

        if (!response.ok) {
            throw new Error(`Google API 报错: ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error("后端捕获到的错误:", error);
        res.status(500).json({ error: error.message });
    }
}
