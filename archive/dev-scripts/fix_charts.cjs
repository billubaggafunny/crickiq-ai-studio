const fs = require('fs');

function fixStatistics() {
    let content = fs.readFileSync('components/Statistics.tsx', 'utf8');
    
    // Top Batting
    content = content.replace(
        /<div className="flex-1 w-full min-h-\[300px\]">\s*<ResponsiveContainer width="100%" height="100%">\s*<BarChart\s+data=\{topBattersData\}[\s\S]*?<\/ResponsiveContainer>\s*<\/div>/m,
        `
        <div className="flex-1 w-full min-h-[300px]" style={{ width: '100%', height: 300, minHeight: 300, minWidth: 0 }}>
            {(!topBattersData || topBattersData.length === 0) ? (
                <div className="flex items-center justify-center h-full w-full text-text-secondary">No data available</div>
            ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topBattersData}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                      />
                      <XAxis
                        dataKey="name"
                        stroke="var(--color-text-secondary)"
                      />
                      <YAxis stroke="var(--color-text-secondary)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-secondary)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "1rem",
                        }}
                      />
                      <Bar
                        dataKey="runs"
                        fill="var(--color-brand-lavender)"
                        name="Runs"
                      />
                    </BarChart>
                  </ResponsiveContainer>
            )}
        </div>
        `
    );

    // Top Bowling
    content = content.replace(
        /<div className="flex-1 w-full min-h-\[300px\]">\s*<ResponsiveContainer width="100%" height="100%">\s*<BarChart\s+data=\{topBowlersData\}[\s\S]*?<\/ResponsiveContainer>\s*<\/div>/m,
        `
        <div className="flex-1 w-full min-h-[300px]" style={{ width: '100%', height: 300, minHeight: 300, minWidth: 0 }}>
            {(!topBowlersData || topBowlersData.length === 0) ? (
                <div className="flex items-center justify-center h-full w-full text-text-secondary">No data available</div>
            ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topBowlersData}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                      />
                      <XAxis
                        dataKey="name"
                        stroke="var(--color-text-secondary)"
                      />
                      <YAxis
                        stroke="var(--color-text-secondary)"
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-secondary)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "1rem",
                        }}
                      />
                      <Bar
                        dataKey="wickets"
                        fill="var(--color-warning)"
                        name="Wickets"
                      />
                    </BarChart>
                  </ResponsiveContainer>
            )}
        </div>
        `
    );
    
    fs.writeFileSync('components/Statistics.tsx', content);
}

function fixQuickMatchStats() {
    let content = fs.readFileSync('components/QuickMatchStats.tsx', 'utf8');
    
    content = content.replace(
        /<ResponsiveContainer width="100%" height=\{300\}>\s*<BarChart data=\{topBattersData\}[\s\S]*?<\/ResponsiveContainer>/m,
        `
        <div style={{ width: '100%', height: 300, minHeight: 300, minWidth: 0 }}>
            {(!topBattersData || topBattersData.length === 0) ? (
                <div className="flex items-center justify-center h-full w-full text-text-secondary">No data available</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topBattersData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="name" stroke="var(--color-text-secondary)" />
                        <YAxis stroke="var(--color-text-secondary)" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-secondary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '1rem'
                            }}
                        />
                        <Bar dataKey="runs" fill="var(--color-brand-teal)" name="Runs" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
        `
    );

    content = content.replace(
        /<ResponsiveContainer width="100%" height=\{300\}>\s*<BarChart data=\{topBowlersData\}[\s\S]*?<\/ResponsiveContainer>/m,
        `
        <div style={{ width: '100%', height: 300, minHeight: 300, minWidth: 0 }}>
            {(!topBowlersData || topBowlersData.length === 0) ? (
                <div className="flex items-center justify-center h-full w-full text-text-secondary">No data available</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topBowlersData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="name" stroke="var(--color-text-secondary)" />
                        <YAxis stroke="var(--color-text-secondary)" allowDecimals={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-secondary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '1rem'
                            }}
                        />
                        <Bar dataKey="wickets" fill="var(--color-warning)" name="Wickets" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
        `
    );

    fs.writeFileSync('components/QuickMatchStats.tsx', content);
}

function fixPlayerStatsModal() {
    let content = fs.readFileSync('components/PlayerStatsModal.tsx', 'utf8');

    content = content.replace(
        /<ResponsiveContainer width="100%" height=\{200\}>\s*<BarChart data=\{performanceData\}[\s\S]*?<Bar dataKey="runs"[\s\S]*?<\/BarChart>\s*<\/ResponsiveContainer>/m,
        `
        <div style={{ width: '100%', height: 200, minHeight: 200, minWidth: 0 }}>
            {(!performanceData || performanceData.length === 0) ? (
                <div className="flex items-center justify-center h-full w-full text-text-secondary">No data available</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="match" stroke="var(--color-text-secondary)" fontSize={12} />
                        <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-secondary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '1rem'
                            }}
                        />
                        <Bar dataKey="runs" fill="var(--color-accent)" name="Runs" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
        `
    );

    content = content.replace(
        /<ResponsiveContainer width="100%" height=\{200\}>\s*<BarChart data=\{performanceData\}[\s\S]*?<Bar dataKey="wickets"[\s\S]*?<\/BarChart>\s*<\/ResponsiveContainer>/m,
        `
        <div style={{ width: '100%', height: 200, minHeight: 200, minWidth: 0 }}>
            {(!performanceData || performanceData.length === 0) ? (
                <div className="flex items-center justify-center h-full w-full text-text-secondary">No data available</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="match" stroke="var(--color-text-secondary)" fontSize={12} />
                        <YAxis stroke="var(--color-text-secondary)" fontSize={12} allowDecimals={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-secondary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '1rem'
                            }}
                        />
                        <Bar dataKey="wickets" fill="var(--color-warning)" name="Wickets" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
        `
    );

    fs.writeFileSync('components/PlayerStatsModal.tsx', content);
}

function fixWagonWheelModal() {
    let content = fs.readFileSync('components/WagonWheelModal.tsx', 'utf8');

    content = content.replace(
        /const BowlingChart: React\.FC<\{ data: \{ matchName: string; wickets: number; runs: number \}\[\] \}> = \(\{ data \}\) => \([\s\S]*?<ResponsiveContainer width="100%" height=\{250\}>[\s\S]*?<\/ResponsiveContainer>\s*\);/m,
        `const BowlingChart: React.FC<{ data: { matchName: string; wickets: number; runs: number }[] }> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div style={{ height: 250, width: '100%', minHeight: 250, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No data available</div>;
    }
    return (
        <div style={{ width: '100%', height: 250, minHeight: 250, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="matchName" stroke="rgba(255, 255, 255, 0.7)" fontSize={12} />
                    <YAxis yAxisId="left" orientation="left" stroke="#FBBF24" allowDecimals={false} label={{ value: 'Wickets', angle: -90, position: 'insideLeft', fill: '#FBBF24', dy: 40, dx: 10, style: {fontSize: '12px'} }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#60A5FA" label={{ value: 'Runs Conceded', angle: 90, position: 'insideRight', fill: '#60A5FA', dy: -50, dx: -5, style: {fontSize: '12px'} }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(30, 30, 30, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '0.5rem',
                            color: 'white'
                        }}
                        cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}}/>
                    <Bar yAxisId="left" dataKey="wickets" fill="#FBBF24" name="Wickets" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="runs" fill="#60A5FA" name="Runs Conceded" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};`
    );

    fs.writeFileSync('components/WagonWheelModal.tsx', content);
}

try {
    fixStatistics();
    console.log("Statistics fixed");
} catch(e) { console.error(e) }

try {
    fixQuickMatchStats();
    console.log("QuickMatchStats fixed");
} catch(e) { console.error(e) }

try {
    fixPlayerStatsModal();
    console.log("PlayerStatsModal fixed");
} catch(e) { console.error(e) }

try {
    fixWagonWheelModal();
    console.log("WagonWheelModal fixed");
} catch(e) { console.error(e) }

