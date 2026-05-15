import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section") ?? "";

  let csv = "";
  let filename = section;

  try {
    switch (section) {
      case "tasks": {
        const rows = await prisma.task.findMany({ orderBy: { createdAt: "desc" } });
        csv = toCSV(rows.map((r) => ({
          id: r.id, title: r.title, category: r.category, priority: r.priority,
          completed: r.completed, dueDate: r.dueDate?.toISOString() ?? "",
          notes: r.notes ?? "", createdAt: r.createdAt.toISOString(),
        })));
        break;
      }
      case "events": {
        const rows = await prisma.event.findMany({ orderBy: { startTime: "asc" } });
        csv = toCSV(rows.map((r) => ({
          id: r.id, title: r.title, category: r.category,
          startTime: r.startTime.toISOString(), endTime: r.endTime.toISOString(),
          location: r.location ?? "", allDay: r.allDay,
        })));
        break;
      }
      case "workouts": {
        const rows = await prisma.workoutEntry.findMany({ orderBy: { loggedAt: "desc" } });
        csv = toCSV(rows.map((r) => ({
          id: r.id, activity: r.activity, minutes: r.minutes,
          notes: r.notes ?? "", loggedAt: r.loggedAt.toISOString(),
        })));
        break;
      }
      case "supplements": {
        const rows = await prisma.supplementEntry.findMany({ orderBy: { loggedAt: "desc" } });
        csv = toCSV(rows.map((r) => ({
          id: r.id, name: r.name, amount: r.amount, unit: r.unit,
          notes: r.notes ?? "", loggedAt: r.loggedAt.toISOString(),
        })));
        break;
      }
      case "expenses": {
        const rows = await prisma.recurringExpense.findMany({ orderBy: { nextDueDate: "asc" } });
        csv = toCSV(rows.map((r) => ({
          id: r.id, name: r.name, amount: r.amount ?? "variable",
          frequency: r.frequency, category: r.category, isAutoPay: r.isAutoPay,
          nextDueDate: r.nextDueDate.toISOString(), notes: r.notes ?? "",
        })));
        break;
      }
      case "accounts": {
        const rows = await prisma.financialAccount.findMany({ orderBy: { createdAt: "asc" } });
        csv = toCSV(rows.map((r) => ({
          id: r.id, name: r.name, type: r.type, institution: r.institution ?? "",
          balance: r.balance, currency: r.currency, isActive: r.isActive,
          notes: r.notes ?? "",
        })));
        break;
      }
      case "budget": {
        const rows = await prisma.budgetEntry.findMany({
          include: { category: { select: { name: true } } },
          orderBy: { date: "desc" },
        });
        csv = toCSV(rows.map((r) => ({
          id: r.id, category: r.category.name, amount: r.amount,
          description: r.description ?? "", date: r.date.toISOString(),
        })));
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown section" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}-export.csv"`,
    },
  });
}
