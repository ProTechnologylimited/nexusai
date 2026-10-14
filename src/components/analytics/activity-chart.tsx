"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { day: string; agentRuns: number; workflowRuns: number; leads: number };

export function ActivityChart({ data }: { data: Point[] }) {
  return (
    <div className="h-72 w-full" role="img" aria-label="Daily agent runs, workflow runs, and new leads">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#E5E7EB" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748B" }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="agentRuns" name="Agent runs" fill="#6366F1" radius={[3, 3, 0, 0]} />
          <Bar dataKey="workflowRuns" name="Workflow runs" fill="#3B82F6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="leads" name="New leads" fill="#16A34A" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
