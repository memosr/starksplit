import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, amount, paid_by, created_by, members } = body;

    const { data, error } = await supabase
      .from("expenses")
      .insert([{ title, amount, paid_by, created_by, members }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, expense: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return NextResponse.json({ expense: data });
    }

    const email = searchParams.get("email");
    if (email) {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("created_by", email)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json({ expenses: data });
    }

    return NextResponse.json({ expenses: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
