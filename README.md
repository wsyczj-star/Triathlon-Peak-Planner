# Triathlon-Peak-Planner
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>铁三备赛与训练管理面板</title>
    <!-- 引入 Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- 引入 React 和 ReactDOM -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
    <!-- 引入 Babel 以解析 JSX -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="bg-slate-50 text-slate-800">
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect } = React;

        // --- 图标组件 (内联 SVG) ---
        const IconActivity = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
        const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
        const IconTrophy = () => <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>;

        function App() {
            // --- 状态管理 ---
            const [config, setConfig] = useState({
                clientId: '',
                clientSecret: '',
                raceName: '2026 威海铁三 (A级)',
                raceDate: '2026-09-20',
                plannedSwim: 180,
                plannedBike: 360,
                plannedRun: 240
            });
            const [showSettings, setShowSettings] = useState(false);
            const [authStatus, setAuthStatus] = useState('未连接'); // 未连接, 授权中, 已连接
            const [activities, setActivities] = useState({ swim: 0, bike: 0, run: 0 }); // 实际完成分钟数
            const [loading, setLoading] = useState(false);
            const [errorMsg, setErrorMsg] = useState('');

            // 初始化加载配置
            useEffect(() => {
                const savedConfig = localStorage.getItem('strava_planner_config');
                if (savedConfig) {
                    setConfig(JSON.parse(savedConfig));
                } else {
                    setShowSettings(true); // 首次打开显示设置
                }

                // 检查 URL 是否有 Strava 授权返回的 code
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                
                if (code) {
                    setAuthStatus('授权中');
                    exchangeToken(code);
                } else {
                    const token = localStorage.getItem('strava_access_token');
                    if (token) {
                        setAuthStatus('已连接');
                        fetchCurrentWeekData();
                    }
                }
            }, []);

            // 保存配置
            const saveConfig = () => {
                localStorage.setItem('strava_planner_config', JSON.stringify(config));
                setShowSettings(false);
                setErrorMsg('配置已保存！你可以点击“连接 Strava”进行同步。');
                setTimeout(() => setErrorMsg(''), 3000);
            };

            // 1. 发起授权
            const handleConnectStrava = () => {
                if (!config.clientId) {
                    alert("请先在设置中填写 Strava Client ID！");
                    setShowSettings(true);
                    return;
                }
                const redirectUri = window.location.origin + window.location.pathname;
                const authUrl = `https://www.strava.com/oauth/authorize?client_id=${config.clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=activity:read_all`;
                window.location.href = authUrl; // 跳转到 Strava 授权页
            };

            // 2. 用 Code 换取 Token
            const exchangeToken = async (code) => {
                const savedConfig = JSON.parse(localStorage.getItem('strava_planner_config'));
                if (!savedConfig || !savedConfig.clientSecret) {
                    setErrorMsg("缺少 Client Secret，无法完成授权。请在设置中补充。");
                    return;
                }

                try {
                    const res = await fetch('https://www.strava.com/oauth/token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            client_id: savedConfig.clientId,
                            client_secret: savedConfig.clientSecret,
                            code: code,
                            grant_type: 'authorization_code'
                        })
                    });
                    const data = await res.json();
                    if (data.access_token) {
                        localStorage.setItem('strava_access_token', data.access_token);
                        localStorage.setItem('strava_refresh_token', data.refresh_token);
                        // 清除 URL 中的 code
                        window.history.replaceState({}, document.title, window.location.pathname);
                        setAuthStatus('已连接');
                        fetchCurrentWeekData();
                    } else {
                        setErrorMsg("授权失败：" + JSON.stringify(data));
                    }
                } catch (err) {
                    setErrorMsg("网络请求失败：" + err.message);
                }
            };

            // 3. 拉取本周活动数据
            const fetchCurrentWeekData = async () => {
                setLoading(true);
                const token = localStorage.getItem('strava_access_token');
                
                // 计算本周一的零点时间戳
                const now = new Date();
                const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
                const monday = new Date(now);
                monday.setDate(now.getDate() - dayOfWeek + 1);
                monday.setHours(0, 0, 0, 0);
                const afterTimestamp = Math.floor(monday.getTime() / 1000);

                try {
                    const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${afterTimestamp}&per_page=100`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (res.status === 401) {
                        // Token 过期处理 (为保持单文件简单，这里提示重新授权)
                        localStorage.removeItem('strava_access_token');
                        setAuthStatus('未连接');
                        setErrorMsg('授权已过期，请重新连接 Strava。');
                        setLoading(false);
                        return;
                    }

                    const data = await res.json();
                    
                    let swimTime = 0, bikeTime = 0, runTime = 0;
                    data.forEach(activity => {
                        const minutes = Math.round(activity.moving_time / 60);
                        if (activity.type === 'Swim') swimTime += minutes;
                        if (activity.type === 'Ride' || activity.type === 'VirtualRide') bikeTime += minutes;
                        if (activity.type === 'Run' || activity.type === 'TrailRun') runTime += minutes;
                    });

                    setActivities({ swim: swimTime, bike: bikeTime, run: runTime });
                } catch (err) {
                    setErrorMsg("获取数据失败，请检查网络或配置。");
                }
                setLoading(false);
            };

            // --- 辅助计算 ---
            const daysLeft = Math.max(0, Math.ceil((new Date(config.raceDate) - new Date()) / (1000 * 60 * 60 * 24)));
            const getProgress = (planned, actual) => planned === 0 ? 0 : Math.min(100, Math.round((actual / planned) * 100));
            const getProgressColor = (percent) => {
                if (percent < 60) return 'bg-red-500';
                if (percent < 85) return 'bg-yellow-500';
                return 'bg-emerald-500';
            };

            return (
                <div className="min-h-screen p-4 md:p-8 font-sans max-w-5xl mx-auto space-y-6">
                    
                    {/* 头部 */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-200 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-lg text-white">
                                <IconActivity />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">铁三训练可视化看板</h1>
                                <p className="text-sm text-slate-500">数据通过本地浏览器直连 Strava</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowSettings(true)}
                                className="bg-slate-200 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-300 transition flex items-center gap-2 text-sm font-medium"
                            >
                                <IconSettings /> 设置
                            </button>
                            <button 
                                onClick={handleConnectStrava}
                                disabled={authStatus === '授权中'}
                                className={`${authStatus === '已连接' ? 'bg-[#FC4C02] hover:bg-[#E34402]' : 'bg-slate-900 hover:bg-slate-800'} text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm font-bold shadow-sm disabled:opacity-50`}
                            >
                                {loading ? '同步中...' : (authStatus === '已连接' ? '更新 Strava 数据' : '连接 Strava')}
                            </button>
                        </div>
                    </header>

                    {/* 错误提示 */}
                    {errorMsg && (
                        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative">
                            <span className="block sm:inline">{errorMsg}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 赛事卡片 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 text-slate-100">
                                <IconTrophy />
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">A级目标赛事</h2>
                                <h3 className="text-xl font-bold text-slate-800 truncate">{config.raceName}</h3>
                                <p className="text-sm text-slate-500 mt-1">{config.raceDate}</p>
                            </div>
                            <div className="mt-6 flex items-end gap-2 relative z-10">
                                <span className="text-5xl font-black text-slate-900 leading-none">{daysLeft}</span>
                                <span className="text-lg text-slate-500 font-medium mb-1">天</span>
                            </div>
                        </div>

                        {/* 本周执行状态 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:col-span-2">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-slate-800">本周单项微观达成率</h2>
                                <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-1 rounded border border-orange-200">
                                    {authStatus === '已连接' ? '数据已同步' : '等待同步'}
                                </span>
                            </div>
                            
                            <div className="space-y-5">
                                {/* 游泳 */}
                                <div>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-bold text-blue-700">🏊 游泳</span>
                                        <span className="text-slate-500">
                                            <span className="font-semibold text-slate-800">{activities.swim}</span> / {config.plannedSwim} 分钟
                                        </span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(getProgress(config.plannedSwim, activities.swim))}`}
                                             style={{ width: `${getProgress(config.plannedSwim, activities.swim)}%` }}></div>
                                    </div>
                                </div>

                                {/* 自行车 */}
                                <div>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-bold text-emerald-700">🚴 自行车</span>
                                        <span className="text-slate-500">
                                            <span className="font-semibold text-slate-800">{activities.bike}</span> / {config.plannedBike} 分钟
                                        </span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(getProgress(config.plannedBike, activities.bike))}`}
                                             style={{ width: `${getProgress(config.plannedBike, activities.bike)}%` }}></div>
                                    </div>
                                </div>

                                {/* 跑步 */}
                                <div>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-bold text-rose-700">🏃 跑步</span>
                                        <span className="text-slate-500">
                                            <span className="font-semibold text-slate-800">{activities.run}</span> / {config.plannedRun} 分钟
                                        </span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(getProgress(config.plannedRun, activities.run))}`}
                                             style={{ width: `${getProgress(config.plannedRun, activities.run)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 设置弹窗 */}
                    {showSettings && (
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <h3 className="font-bold text-lg">系统设置与密钥</h3>
                                </div>
                                <div className="p-6 overflow-y-auto space-y-5">
                                    <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100">
                                        所有配置仅保存在你当前浏览器的本地存储(Local Storage)中，绝对安全，不会上传到任何服务器。
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-sm text-slate-500 uppercase border-b pb-2">1. Strava API 配置</h4>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Client ID</label>
                                            <input type="text" value={config.clientId} onChange={e => setConfig({...config, clientId: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="例如：123456" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Client Secret</label>
                                            <input type="password" value={config.clientSecret} onChange={e => setConfig({...config, clientSecret: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="例如：a1b2c3d4..." />
                                        </div>
                                        
                                        <h4 className="font-bold text-sm text-slate-500 uppercase border-b pb-2 mt-6">2. 目标与周计划</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">赛事名称</label>
                                                <input type="text" value={config.raceName} onChange={e => setConfig({...config, raceName: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">赛事日期</label>
                                                <input type="date" value={config.raceDate} onChange={e => setConfig({...config, raceDate: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">每周计划游泳 (分钟)</label>
                                                <input type="number" value={config.plannedSwim} onChange={e => setConfig({...config, plannedSwim: Number(e.target.value)})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">每周计划自行车 (分钟)</label>
                                                <input type="number" value={config.plannedBike} onChange={e => setConfig({...config, plannedBike: Number(e.target.value)})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">每周计划跑步 (分钟)</label>
                                                <input type="number" value={config.plannedRun} onChange={e => setConfig({...config, plannedRun: Number(e.target.value)})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                                    <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">取消</button>
                                    <button onClick={saveConfig} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition">保存配置</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
