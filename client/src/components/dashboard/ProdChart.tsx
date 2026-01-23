import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProdChartProps {
    data: any[];
}

export default function ProdChart({ data }: ProdChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Pas de données disponibles pour cette période
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis />
                <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                />
                <Legend />
                <Bar dataKey="travail" name="Heures Production" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="deplacement" name="Heures Déplacement" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
