"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GBP } from "@/lib/constants";

export function RevenueByServiceChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--line)" strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickFormatter={(v) => GBP.format(v)}
          stroke="var(--muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          stroke="var(--muted-foreground)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          formatter={(value) => GBP.format(Number(value))}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            fontSize: 12,
            color: "var(--popover-foreground)",
          }}
        />
        <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={18}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
