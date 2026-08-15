"use client";

import { useMemo, useState } from "react";
import type { DailyOrderPoint } from "@/lib/admin-stats";

const SERIES = {
  total: { key: "totalOrders" as const, label: "Total Pesanan", color: "#6366f1" },
  paid: { key: "paidOrders" as const, label: "Sudah Dibayar", color: "#0891b2" },
};

const RANGE_OPTIONS = [7, 14, 30] as const;

const CHART_WIDTH = 760;
const CHART_HEIGHT = 260;
const PADDING = { top: 16, right: 16, bottom: 28, left: 36 };

function formatShortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(
    new Date(y, m - 1, d),
  );
}

function niceMax(value: number): number {
  if (value <= 0) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.find((s) => normalized <= s) ?? 10;
  return step * magnitude;
}

export function OrdersChart({ data }: { data: DailyOrderPoint[] }) {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>(14);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const points = useMemo(() => data.slice(-range), [data, range]);

  const maxValue = useMemo(() => {
    const highest = points.reduce(
      (max, p) => Math.max(max, p.totalOrders, p.paidOrders),
      0,
    );
    return niceMax(highest);
  }, [points]);

  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const xFor = (index: number) =>
    points.length <= 1
      ? PADDING.left
      : PADDING.left + (index / (points.length - 1)) * plotWidth;
  const yFor = (value: number) =>
    PADDING.top + plotHeight - (value / maxValue) * plotHeight;

  const linePath = (getValue: (p: DailyOrderPoint) => number) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(getValue(p))}`).join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxValue * f));

  // ~6 evenly spaced x-axis labels regardless of range length, so 30-day
  // view doesn't collide 30 date labels into unreadable mush.
  const labelStep = Math.max(1, Math.ceil(points.length / 6));

  function handlePointerMove(event: React.PointerEvent<SVGRectElement>) {
    if (points.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const ratio = points.length <= 1 ? 0 : relativeX / plotWidth;
    const index = Math.round(ratio * (points.length - 1));
    setHoverIndex(Math.min(points.length - 1, Math.max(0, index)));
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const tooltipX = hoverIndex !== null ? xFor(hoverIndex) : 0;
  const tooltipOnRight = tooltipX > CHART_WIDTH / 2;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          {Object.values(SERIES).map((series) => (
            <span key={series.label} className="inline-flex items-center gap-1.5 text-xs text-muted">
              <span
                className="inline-block h-0.5 w-4 rounded-full"
                style={{ backgroundColor: series.color }}
                aria-hidden="true"
              />
              {series.label}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-surface-2 p-0.5">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  range === option
                    ? "bg-brand-indigo text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {option} Hari
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
          >
            {showTable ? "Lihat Grafik" : "Lihat Tabel"}
          </button>
        </div>
      </div>

      {showTable ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5 font-medium">Tanggal</th>
                <th className="px-4 py-2.5 font-medium tabular-nums">Total Pesanan</th>
                <th className="px-4 py-2.5 font-medium tabular-nums">Sudah Dibayar</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.date} className="border-b border-border/60 last:border-b-0">
                  <td className="px-4 py-2 text-foreground">{formatShortDate(p.date)}</td>
                  <td className="px-4 py-2 tabular-nums text-foreground">{p.totalOrders}</td>
                  <td className="px-4 py-2 tabular-nums text-foreground">{p.paidOrders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="w-full"
            role="img"
            aria-label="Grafik total pesanan dan pesanan sudah dibayar per hari"
          >
            {yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  x2={CHART_WIDTH - PADDING.right}
                  y1={yFor(tick)}
                  y2={yFor(tick)}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text
                  x={PADDING.left - 8}
                  y={yFor(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted"
                  fontSize={10}
                >
                  {tick}
                </text>
              </g>
            ))}

            {points.map((p, i) =>
              i % labelStep === 0 ? (
                <text
                  key={p.date}
                  x={xFor(i)}
                  y={CHART_HEIGHT - PADDING.bottom + 16}
                  textAnchor="middle"
                  className="fill-muted"
                  fontSize={10}
                >
                  {formatShortDate(p.date)}
                </text>
              ) : null,
            )}

            <path d={linePath((p) => p.totalOrders)} fill="none" stroke={SERIES.total.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <path d={linePath((p) => p.paidOrders)} fill="none" stroke={SERIES.paid.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

            {points.length > 0 && (
              <>
                <circle cx={xFor(points.length - 1)} cy={yFor(points[points.length - 1].totalOrders)} r={5} fill={SERIES.total.color} stroke="var(--surface)" strokeWidth={2} />
                <circle cx={xFor(points.length - 1)} cy={yFor(points[points.length - 1].paidOrders)} r={5} fill={SERIES.paid.color} stroke="var(--surface)" strokeWidth={2} />
              </>
            )}

            {hoverIndex !== null && hovered && (
              <>
                <line
                  x1={xFor(hoverIndex)}
                  x2={xFor(hoverIndex)}
                  y1={PADDING.top}
                  y2={CHART_HEIGHT - PADDING.bottom}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <circle cx={xFor(hoverIndex)} cy={yFor(hovered.totalOrders)} r={5} fill={SERIES.total.color} stroke="var(--surface)" strokeWidth={2} />
                <circle cx={xFor(hoverIndex)} cy={yFor(hovered.paidOrders)} r={5} fill={SERIES.paid.color} stroke="var(--surface)" strokeWidth={2} />
              </>
            )}

            <rect
              x={PADDING.left}
              y={PADDING.top}
              width={plotWidth}
              height={plotHeight}
              fill="transparent"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setHoverIndex(null)}
              style={{ cursor: "crosshair" }}
            />
          </svg>

          {hoverIndex !== null && hovered && (
            <div
              className="pointer-events-none absolute top-2 min-w-[140px] rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs shadow-lg"
              style={{
                left: tooltipOnRight ? undefined : `${(tooltipX / CHART_WIDTH) * 100}%`,
                right: tooltipOnRight ? `${100 - (tooltipX / CHART_WIDTH) * 100}%` : undefined,
                transform: tooltipOnRight ? "translateX(8px)" : "translateX(-8px)",
              }}
            >
              <p className="font-medium text-foreground">{formatShortDate(hovered.date)}</p>
              <div className="mt-1.5 space-y-1">
                <p className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: SERIES.total.color }} />
                    {SERIES.total.label}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">{hovered.totalOrders}</span>
                </p>
                <p className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: SERIES.paid.color }} />
                    {SERIES.paid.label}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">{hovered.paidOrders}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
