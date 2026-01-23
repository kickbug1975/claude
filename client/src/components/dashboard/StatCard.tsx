import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    color?: string; // Tailwind color class specific (e.g. "blue-500")
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color = "blue-500" }: StatCardProps) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${color.split('-')[0]}-50`}>
                    <Icon className={`w-6 h-6 text-${color}`} />
                </div>
                {trend && (
                    <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'} flex items-center bg-gray-50 px-2 py-1 rounded-full`}>
                        {trendUp ? '+' : ''}{trend}
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}
