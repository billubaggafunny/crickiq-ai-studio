import React from 'react';

interface BarData {
    name: string;
    value: number;
    color: string;
    logo?: string;
}

interface ComparisonBarChartProps {
    data: [BarData, BarData];
    unit?: string;
}

const ComparisonBarChart: React.FC<ComparisonBarChartProps> = ({ data, unit = '%' }) => {
    const [item1, item2] = data;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                {item1.logo && <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-button text-white text-body" style={{ backgroundColor: item1.logo }}>{item1.name.substring(0, 2).toUpperCase()}</div>}
                <div className="w-full">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-text-primary">{item1.name}</span>
                        <span className="font-bold text-lg" style={{ color: item1.color }}>{item1.value.toFixed(0)}{unit}</span>
                    </div>
                    <div className="w-full bg-primary rounded-2xl h-4 overflow-hidden">
                        <div className="h-4 rounded-2xl transition-all duration-500" style={{ width: `${item1.value}%`, backgroundColor: item1.color }} />
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {item2.logo && <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-button text-white text-body" style={{ backgroundColor: item2.logo }}>{item2.name.substring(0, 2).toUpperCase()}</div>}
                <div className="w-full">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-text-primary">{item2.name}</span>
                        <span className="font-bold text-lg" style={{ color: item2.color }}>{item2.value.toFixed(0)}{unit}</span>
                    </div>
                    <div className="w-full bg-primary rounded-2xl h-4 overflow-hidden">
                        <div className="h-4 rounded-2xl transition-all duration-500" style={{ width: `${item2.value}%`, backgroundColor: item2.color }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonBarChart;
