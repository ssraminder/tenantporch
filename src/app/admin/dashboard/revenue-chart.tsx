"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/currency";

interface RevenueDataPoint {
  month: string;
  revenue: number;
  count: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; payload: RevenueDataPoint }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="bg-surface-container-lowest rounded-2xl px-5 py-4 shadow-ambient-lg">
      <p className="text-xs font-semibold text-on-surface-variant mb-1">
        {label}
      </p>
      <p className="text-lg font-extrabold font-headline text-primary">
        {formatCurrency(point.revenue)}
      </p>
      <p className="text-xs text-on-surface-variant mt-1">
        {point.count} payment{point.count !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function RevenueChart({ data }: RevenueChartProps) {
  const primaryColor = "#273f4f";
  const primaryContainerColor = "#3a5568";

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-ambient-sm">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-primary">
          monitoring
        </span>
        <h3 className="font-headline font-bold text-xl">Monthly Revenue</h3>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="material-symbols-outlined text-outline-variant text-5xl mb-4">
            insert_chart
          </span>
          <p className="text-sm text-on-surface-variant font-medium">
            No revenue data yet
          </p>
          <p className="text-xs text-outline mt-1">
            Confirmed payments will appear here
          </p>
        </div>
      ) : (
        <div className="w-full h-[300px] md:h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={primaryColor}
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor={primaryColor}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#c5c6cf"
                strokeOpacity={0.4}
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#45464e", fontFamily: "Inter" }}
                tickLine={false}
                axisLine={{ stroke: "#c5c6cf", strokeOpacity: 0.4 }}
                dy={8}
              />

              <YAxis
                tickFormatter={(value: number) =>
                  value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`
                }
                tick={{ fontSize: 11, fill: "#45464e", fontFamily: "Inter" }}
                tickLine={false}
                axisLine={false}
                width={56}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: primaryContainerColor,
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke={primaryColor}
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: primaryColor,
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
