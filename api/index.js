import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { user_id, username, first_name, bot_username } = req.body;

      if (!user_id || !bot_username)
        return res.status(400).json({ error: "user_id and bot_username required" });

      const referralLink = `https://t.me/${bot_username}/earn?startapp=ref_${user_id}`;

      // التحقق من وجود المستخدم
      const { data: existing } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", user_id)
        .single();

      if (existing) {
        await supabase
          .from("players")
          .update({
            username: username || existing.username,
            first_name: first_name || existing.first_name
          })
          .eq("user_id", user_id);

        return res.status(200).json({
          message: "Referral link already exists",
          referralLink,
          user: existing
        });
      }

      const { data: inserted, error } = await supabase
        .from("players")
        .insert([
          {
            user_id,
            username,
            first_name,
            referral_link: referralLink,
            points: 0,
            referrals: 0
          }
        ])
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        message: "Referral link created successfully",
        referralLink,
        user: inserted
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }

  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}