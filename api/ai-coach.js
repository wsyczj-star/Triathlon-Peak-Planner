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
        // 接收前端传来的 payload
        const promptPayload = req.body;
        
        // 带着隐藏的 API Key 向 Google 发起真实的请求
        // 注意：使用更稳定、速度极快的 gemini-2.5-flash 模型
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
        
        // 将获取到的结果原封不动地返回给你的前端
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
